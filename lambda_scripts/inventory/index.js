import { SellingPartner } from 'amazon-sp-api';
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from "dotenv";

dotenv.config();

const refreshToken = process.env.REFRESH_TOKEN;
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
const marketplaceIds = process.env.MARKETPLACE_IDS
const folderId = process.env.FOLDER_ID;

const date = new Date();
date.setDate(date.getDate()-3); // set date to 3 days ago

const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = date.toLocaleString('en-CA', dateOptions);
const reportDateUsaFormat = date.toLocaleString('en-us', dateOptions).replaceAll('/', '-');

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
        reportType: 'GET_FBA_MYI_ALL_INVENTORY_DATA',
        marketplaceIds: [marketplaceIds],
        dataStartTime: reportDate,
        dataEndTime: reportDate,
        // reportOptions: {'asinGranularity': 'CHILD'}
      },
      version: '2021-06-30',
      interval: 6000, // 6 second polling interval
    });
    return res;
    
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
    const data = await fetchData();
    
    // const buffer = Buffer.from(csvData, 'utf-8');
    // await uploadFileToSharedDrive(buffer, `${reportDate}.csv`);
    return data;
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving report: ', e})
    }
  }
}

const data = await handler();
console.log(data);