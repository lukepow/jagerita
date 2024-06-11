import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ID for client application that was linked to Ads API
const clientId = process.env.CLIENT_ID;
// Secret for the same client application
const clientSecret = process.env.CLIENT_SECRET;
// Refresh token obtained by sending POST request to https://api.amazon.com/auth/o2/token. This never expires
const refreshToken = process.env.REFRESH_TOKEN;
// profile IDS for North American ads accounts
const profileIds = {"US": process.env.US_PROFILE_ID, "CA": process.env.CA_PROFILE_ID, "MX": process.env.MX_PROFILE_ID};
// URL for getting access token
const tokenUrl = "https://api.amazon.com/auth/o2/token/";
const reportUrl = "https://advertising-api.amazon.com/reporting/reports";
const apiUrl = "https://advertising-api.amazon.com/v2/";

// get and format yesterday's date to YYYY/MM/DD
const date = new Date();
date.setDate(date.getDate()-1)
const year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
month = month < 10 ? '0' + month : month;
day = day < 10 ? '0' + day : day;
const yesterday = `${year}-${month}-${day}`;

// retrieves access token using refresh token, client id, and client secret
export async function getAccessToken() {
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

// request SP Advertised Products report to be generated.
export async function requestReport(url, profileId, accessToken, date) {
  try{
    const requestBody = {
      name: "SP Advertised Product Report  6/9",
      startDate: date,
      endDate: date,
      configuration: {
        "adProduct":"SPONSORED_PRODUCTS",
        "groupBy":["advertiser"],
        "columns":["portfolioId", "campaignBudgetCurrencyCode",
                  "campaignName", "adGroupName", "advertisedSku", "advertisedAsin",
                  "impressions", "clicks", "clickThroughRate", "costPerClick", "spend",
                  "sales7d", "roasClicks7d", "purchases7d", "unitsSoldClicks7d",
                  "unitsSoldSameSku7d", "unitsSoldOtherSku7d",
                  "attributedSalesSameSku7d", "salesOtherSku7d"],
        "reportTypeId":"spAdvertisedProduct",
        "timeUnit":"SUMMARY",
        "format":"GZIP_JSON",
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

async function checkStatus(url, profileId, accessToken) {
  try{
    const response = await axios.get(url, {
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

async function generateReport(profileId) {
  try {
    const accessToken = await getAccessToken();
    const reportResponse = await requestReport(reportUrl, profileIds.US, accessToken, yesterday);
    const reportId = reportResponse.reportId;
  
    let reportStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 10000));
      reportStatus = await checkStatus(`${reportUrl}/${reportId}`, profileId, accessToken);
      console.log(`Report status: ${reportStatus.status}`);
    } while (reportStatus.status === "PENDING");

    if (reportStatus.status !== 'COMPLETED') {
      throw new Error(`Report generation failed with status: ${reportStatus.status}`);
    }
  } catch(err) {
      console.error('Error:', err);
  }
}

generateReport(profileIds.US);