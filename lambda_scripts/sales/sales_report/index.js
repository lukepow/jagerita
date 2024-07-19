import { SellingPartner } from "amazon-sp-api";
import { google } from "googleapis";
import { Readable } from "stream";

const refreshToken = process.env.REFRESH_TOKEN;
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
const marketplaceIds = process.env.MARKETPLACE_IDS
const folderId = process.env.FOLDER_ID;

const yesterday = new Date();
const today = new Date();
yesterday.setDate(yesterday.getDate()-1);
today.setDate(today.getDate());

const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const startDate = `${yesterday.toLocaleString("en-CA", dateOptions)}T07:00:00+00:00`;
const endDate = `${today.toLocaleString("en-CA", dateOptions)}T07:00:00+00:00`;
const yesterdayUsaFormat = yesterday.toLocaleString("en-us", dateOptions).replaceAll("/", "-")

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
  region: "na", // north america
  refresh_token: refreshToken
});

// Get raw data using SP-API
async function fetchData() {
  try {
    let res = await spClient.downloadReport({
      body: {
        reportType: "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL",
        marketplaceIds: [marketplaceIds],
        dataStartTime: startDate,
        dataEndTime: endDate
      },
      version: "2021-06-30",
      interval: 6000, // 6 second polling interval
    });
    return res;
    
  } catch (e) {
    console.log(e)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching data: ", e})
    }
  }
}

// insert url field in data to match manually pulled report
function transformData(tsvData) {
  const rows = tsvData.split("\n");
  const alteredRows = [];
  rows.forEach((row, index) => {
    let columns = row.split("\t");
    if (index === 0) {
      columns.splice(8, 0, "url");
    } else {
      columns.splice(8, 0, " ");
    }
    
    alteredRows.push(columns.join("\t"));
  })
  return alteredRows.join("\n");
}

// Save data in shared drive
async function uploadFileToSharedDrive(fileBuffer, fileName) {
  const metaData = {
    "name": fileName,
    "parents": [folderId]
  };
  const media = {
    mimeType: "text/tab-separated-values",
    body: Readable.from(fileBuffer)
  };

  await drive.files.create({
    resource: metaData,
    media: media,
    fields: "id",
    supportsAllDrives: true
  });
}

// Main lambda function
export const handler = async (event) => {
  try {
    const data = await fetchData();
    const transformedData = transformData(data);
    const buffer = Buffer.from(transformedData, "utf-8");
    await uploadFileToSharedDrive(buffer, `${yesterdayUsaFormat}.txt`);
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Report saved!"})
    }
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error saving report: ", e})
    }
  }
}
