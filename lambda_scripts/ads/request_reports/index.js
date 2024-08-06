// library for sending HTTP requests
import axios from "axios";
// library for interacting with S3 resources
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/*
the process.env variables below are environment variables (they keep the values of sensitive variables encrypted).
You can find or edit them by going to the configuration tab in the lambda function and clicking environment variables on
the right.
*/
// ID for client application that was linked to Ads API
const clientId = process.env.CLIENT_ID;
// Secret for the same client application
const clientSecret = process.env.CLIENT_SECRET;
// Refresh token obtained by sending POST request to https://api.amazon.com/auth/o2/token. This never expires
const refreshToken = process.env.REFRESH_TOKEN;
// profile IDS for North American ads accounts
const profileId = process.env.US_PROFILE_ID;

const tokenUrl = "https://api.amazon.com/auth/o2/token/";
const apiUrl = "https://advertising-api.amazon.com/reporting/reports";
const REGION = "us-west-2";

// Date constructor used to get yesterday's date in string value YYYY/MM/DD format in reportDate variable
const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);
const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = yesterday.toLocaleString('en-CA', dateOptions);

/*
reportsInfo contains all the info needed to send request to the API for each of the 3 ads reports.
It is a nested object. Info for sponsored product report is passed to the API via `reportsInfo.SP` 
in the handler function for example.
Structuring the data this way allows us to request each report using the same function (requestReport function)
*/
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
      // necessary request body parameters below
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }), {
      headers: {
        // header spec that the API requires
        "content_type": "application/x-www-form-urlencoded" 
      }
    });

    // access token is returned from HTTP response
    return response.data.access_token;

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
  }
}

// request Ads report to be generated based on report info passed in
async function requestReport(url, profileId, accessToken, date, reportInfo) {
  try{
    const requestBody = {
      // all of the data specified in reportsInfo variable used here
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

    // request body passed in to API request along with necessary HTTP headers
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

// Function to return report ID which will be saved in S3
async function getReportIdData(reportInfo) {
  try {
    const accessToken = await getAccessToken();
    const response = await requestReport(apiUrl, profileId, accessToken, reportDate, reportInfo);
    return response;
  } catch (error) {
    console.error(error);
  }
}

// Main handler function for AWS Lambda. Gets report IDs for 3 ads reports and saves them in S3
export const handler = async (event) => {
  const spData = await getReportIdData(reportsInfo.SP);
  const sdData = await getReportIdData(reportsInfo.SD);
  const sbData = await getReportIdData(reportsInfo.SB);
  
  // client object to handle S3 requests
  const s3Client = new S3Client({ region: REGION });
  // Specify which S3 bucket and key to pass data to
  const bucketName = "amazon-ads-report-ids";
  const key = "report-ids.json";
  // construct object that contains report ID data in format like this {SPONSORED_PRODUCTS: reportIDValue}
  const reportIdObj = {
    [spData.configuration.adProduct]: spData.reportId,
    [sdData.configuration.adProduct]: sdData.reportId,
    [sbData.configuration.adProduct]: sbData.reportId,
  };
  
  // convert reportIdObj into a string version of the object so it can be passed in the following request
  const jsonData = JSON.stringify(reportIdObj, null, 2);

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: jsonData,
    ContentType: "application/json"
  };

  try {
    // send report IDs to S3 via the S3 Client
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
