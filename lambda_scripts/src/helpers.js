import axios from "axios";
import dotenv from "dotenv";
import zlib from "zlib";
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
const apiUrl = "https://advertising-api.amazon.com/reporting/reports";

// get and format yesterday's date to YYYY/MM/DD
export function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate()-1)
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  const yesterday = `${year}-${month}-${day}`;
  return yesterday;
} 

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
export async function requestReport(url, profileId, accessToken, date, reportInfo) {
  try{
    const requestBody = {
      name: "SP Advertised Product Report  6/9",
      startDate: date,
      endDate: date,
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

export async function getReportUrl(accessToken, profileId, reportId) {
  const url = `${apiUrl}/${reportId}`;

  const headers = {
    "Amazon-Advertising-API-ClientId": clientId,
    Authorization: `bearer ${accessToken}`,
    "Amazon-Advertising-API-Scope": profileId,
    "Content-Type": "application/vnd.createasyncreportrequest.v3+json"
  };

  let reportUrl;

  while (!reportUrl) {
    const response = await axios.get(url, { headers: headers });
    console.log("status code: ", response.status);
    reportUrl = response.data.url;
    console.log("report URL: ", reportUrl);

    if (!reportUrl) {
      console.log("Waiting for report URL...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  return reportUrl;
}

export async function getReportData(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    const bytesResponse = zlib.gunzipSync(Buffer.from(response.data));
    const jsonStr = bytesResponse.toString("utf-8");
    const reportData = JSON.parse(jsonStr);
    return(reportData);

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
  }
}
