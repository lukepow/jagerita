import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ID for client application that was linked to Ads API
const clientId = process.env.CLIENT_ID;
// Secret for the same client application
const clientSecret = process.env.CLIENT_SECRET;
// Refresh token obtained by sending POST request to https://api.amazon.com/auth/o2/token. This never expires
const refreshToken = process.env.REFRESH_TOKEN;
// profile IDS for North American ads accounts
const profileId = process.env.US_PROFILE_ID;
// URL for getting access token
const tokenUrl = "https://api.amazon.com/auth/o2/token/";
const apiUrl = "https://advertising-api.amazon.com/reporting/reports";
const REGION = "us-west-2";

const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);
const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = yesterday.toLocaleString('en-CA', dateOptions);

const reportsInfo = {
  SP: {
    adProduct: "SPONSORED_PRODUCTS",
    reportTypeId: "spAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: [
      'date', 'portfolioId', 'campaignBudgetCurrencyCode', 'campaignName', 'adGroupName', 'advertisedSku',
      'advertisedAsin', 'impressions', 'clicks', 'clickThroughRate', 'costPerClick', 'spend', 'sales7d', 
      'roasClicks7d', 'purchases7d', 'unitsSoldClicks7d', 'unitsSoldSameSku7d', 'unitsSoldOtherSku7d', 
      'attributedSalesSameSku7d', 'salesOtherSku7d'
    ],
    startDate: reportDate,
    endDate: reportDate
  },
  SD: {
    adProduct: "SPONSORED_DISPLAY",
    reportTypeId: "sdAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: [
      'date', 'campaignBudgetCurrencyCode', "campaignName", 'adGroupName', 'promotedSku', 'promotedAsin',
      'impressions', "impressionsViews", 'clicks', "detailPageViews", 'cost', "purchases", "unitsSold", 'sales', 
      "newToBrandPurchases", "newToBrandSales", "newToBrandUnitsSold", "purchasesClicks", "unitsSoldClicks", 
      "salesClicks", "newToBrandPurchasesClicks", "newToBrandSalesClicks", "newToBrandUnitsSoldClicks"
    ],
    startDate: reportDate,
    endDate: reportDate
  },
  SB: {
    adProduct: "SPONSORED_BRANDS",
    reportTypeId: "sbSearchTerm",
    groupBy: ["searchTerm"],
    columns: [
      'date', 'campaignBudgetCurrencyCode', 'campaignName', 'adGroupName', "keywordText", 'matchType', 'searchTerm',
      'costType', 'impressions','viewableImpressions', 'clicks', "cost", 'sales',
      'purchases', 'unitsSold','salesClicks', 'purchasesClicks'
    ],
    startDate: reportDate,
    endDate: reportDate
  }
};

// retrieves access token using refresh token, client id, and client secret
async function getAccessToken() {
  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }), {
      headers: {
        "content_type": "application/x-www-form-urlencoded" 
      }
    });

    return response.data.access_token;

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
  }
}

// request Ads report to be generated based on report info passed in
async function requestReport(url, profileId, accessToken, date, reportInfo) {
  try{
    const requestBody = {
      name: `${reportInfo.adProduct} report ${date}`,
      startDate: reportInfo.startDate,
      endDate: reportInfo.endDate,
      configuration: {
        "adProduct": reportInfo.adProduct,
        "groupBy": reportInfo.groupBy,
        "columns": reportInfo.columns,
        "reportTypeId": reportInfo.reportTypeId,
        "timeUnit": "DAILY",
        "format": "GZIP_JSON",
      }
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        "Amazon-Advertising-API-ClientId": clientId,
        Authorization: `bearer ${accessToken}`,
        "Amazon-Advertising-API-Scope": profileId,
        "Content-Type": "application/vnd.createasyncreportrequest.v3+json"
      }
    });
    return response.data;

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
  }
}

// Return Report ID
async function getReportIdData(reportInfo) {
  try {
    const accessToken = await getAccessToken();
    const response = await requestReport(apiUrl, profileId, accessToken, reportDate, reportInfo);
    return response;
  } catch (error) {
    console.error(error);
  }
}

// Main handler function for AWS Lambda
export const handler = async (event) => {
  const spData = await getReportIdData(reportsInfo.SP);
  const sdData = await getReportIdData(reportsInfo.SD);
  const sbData = await getReportIdData(reportsInfo.SB);
  const s3Client = new S3Client({ region: REGION });
  const bucketName = "amazon-ads-report-ids";
  const key = "report-ids.json";
  const reportIdObj = {
    [spData.configuration.adProduct]: spData.reportId,
    [sdData.configuration.adProduct]: sdData.reportId,
    [sbData.configuration.adProduct]: sbData.reportId,
  };
  const jsonData = JSON.stringify(reportIdObj, null, 2);

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: jsonData,
    ContentType: "application/json"
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Report IDs saved successfully', data })
    };
  } catch (error) {
      return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error saving report IDs', error })
      };
  }
};
