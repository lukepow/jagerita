import { SellingPartner } from 'amazon-sp-api';
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import { json2csv } from 'json-2-csv';
import { flatten } from 'flat';

dotenv.config();

const refreshToken = process.env.REFRESH_TOKEN;
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
const marketplaceIds = process.env.MARKETPLACE_IDS
const folderId = process.env.FOLDER_ID;

const date = new Date();
date.setDate(beginning.getDate()-3);

const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = date.toLocaleString('en-CA', dateOptions);
const reportDateUsaFormat = date.toLocaleString('en-us', dateOptions).replaceAll('/', '-');

const columnRenaming = {
  'parentAsin': '(Parent) ASIN', 'childAsin': '(Child) ASIN', 'trafficByAsin.mobileAppSessions': 'Sessions - Mobile App', 
  'trafficByAsin.mobileAppSessionsB2B': 'Sessions - Mobile APP - B2B', 'trafficByAsin.browserSessions': 'Sessions - Browser',
  'trafficByAsin.browserSessionsB2B': 'Sessions - Browser - B2B', 'trafficByAsin.sessions': 'Sessions - Total',
  'trafficByAsin.sessionsB2B': 'Sessions - Total - B2B',
  'trafficByAsin.mobileAppSessionPercentage': 'Session Percentage - Mobile App',
  'trafficByAsin.mobileAppSessionPercentageB2B': 'Session Percentage - Mobile APP - B2B',
  'trafficByAsin.browserSessionPercentage': 'Session Percentage - Browser',
  'trafficByAsin.browserSessionPercentageB2B': 'Session Percentage - Browser - B2B',
  'trafficByAsin.sessionPercentage': 'Session Percentage - Total',
  'trafficByAsin.sessionPercentageB2B': 'Session Percentage - Total - B2B',
  'trafficByAsin.mobileAppPageViews':'Page Views - Mobile App', 'trafficByAsin.mobileAppPageViewsB2B':
  'Page Views - Mobile APP - B2B', 'trafficByAsin.browserPageViews': 'Page Views - Browser',
  'trafficByAsin.browserPageViewsB2B': 'Page Views - Browser - B2B', 'trafficByAsin.pageViews': 'Page Views - Total',
  'trafficByAsin.pageViewsB2B': 'Page Views - Total - B2B', 'trafficByAsin.mobileAppPageViewsPercentage':
  'Page Views Percentage - Mobile App', 'trafficByAsin.mobileAppPageViewsPercentageB2B':
  'Page Views Percentage - Mobile App - B2B', 'trafficByAsin.browserPageViewsPercentage':
  'Page Views Percentage - Browser', 'trafficByAsin.browserPageViewsPercentageB2B': 'Page Views Percentage - Browser - B2B',
  'trafficByAsin.pageViewsPercentage': 'Page Views Percentage - Total', 'trafficByAsin.pageViewsPercentageB2B':
  'Page Views Percentage - Total - B2B', 'trafficByAsin.buyBoxPercentage': 'Featured Offer (Buy Box) Percentage',
  'trafficByAsin.buyBoxPercentageB2B': 'Featured Offer (Buy Box) Percentage - B2B', 'salesByAsin.unitsOrdered':
  'Units Ordered', 'salesByAsin.unitsOrderedB2B': 'Units Ordered - B2B', 'trafficByAsin.unitSessionPercentage':
  'Unit Session Percentage', 'trafficByAsin.unitSessionPercentageB2B': 'Unit Session Percentage - B2B',
  'salesByAsin.orderedProductSales.amount': 'Ordered Product Sales', 'salesByAsin.orderedProductSalesB2B.amount':
  'Ordered Product Sales - B2B', 'salesByAsin.totalOrderItems': 'Total Order Items',
  'salesByAsin.totalOrderItemsB2B': 'Total Order Items - B2B'
};

// Google API authenticator
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive']
  }
);

// Google drive client
const drive = google.drive({
  version: 'v3',
  auth: auth,
});

// SP-API client
const spClient = new SellingPartner({
  region: 'na', // north america
  refresh_token: refreshToken
});

// Get raw data using SP-API
async function fetchData() {
  try {
    let res = await spClient.downloadReport({
      body: {
        reportType: 'GET_SALES_AND_TRAFFIC_REPORT',
        marketplaceIds: [marketplaceIds],
        dataStartTime: reportDate,
        dataEndTime: reportDate,
        reportOptions: {'asinGranularity': 'CHILD'}
      },
      version: '2021-06-30',
      interval: 6000, // 6 second polling interval
    });
    const json = JSON.parse(res);
    return json.salesAndTrafficByAsin;
    
  } catch (e) {
    console.log(e)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching data: ', e})
    }
  }
}

// Save data in shared drive
async function uploadFileToSharedDrive(fileBuffer, fileName) {
  const metaData = {
    'name': fileName,
    'parents': [folderId]
  };
  const media = {
    mimeType: 'text/csv',
    body: Readable.from(fileBuffer)
  };

  await drive.files.create({
    resource: metaData,
    media: media,
    fields: 'id',
    supportsAllDrives: true
  });
}

export function reorderColumns(jsonData, columns) {
  const apiColumns = Object.keys(columns);
  const reportColumns = Object.values(columns);
  const reorderedData = jsonData.map(row => {
    const reorderedRow = {};
    apiColumns.forEach((column, index) => {
      reorderedRow.Date = reportDate; // add date as first column
      reorderedRow[reportColumns[index]] = row[column];
    });
    return reorderedRow;
  });
  return reorderedData;
}

// Main lambda function
export const handler = async (event) => {
  try {
    const json = await fetchData();
    const flattenedJson = json.map(item => flatten(item));
    const reformattedJson = reorderColumns(flattenedJson, columnRenaming);
    const csvData = json2csv(reformattedJson);
    const buffer = Buffer.from(csvData, 'utf-8');
    await uploadFileToSharedDrive(buffer, `${reportDate}.csv`);
    return data;
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving report: ', e})
    }
  }
}

await handler();