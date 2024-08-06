// library to convert data to XLSX format
import XLSX from "xlsx";
// functions I wrote in helpers.js which is located in the lambda layer
import { getAccessToken,
  getReportIds,
  getReportUrl,
  getReportData,
  processData,
  uploadFileToSharedDrive,
  serializeDate } from "/opt/helpers.js";

// environment variable for the folder IDs for the relevant google drive folder (where files are saved)
// the folder IDs are the last part of the URL of drive folder you are currently in
const folderIds = JSON.parse(process.env.FOLDER_IDS);

// Date constructor used to get yesterday's date in string value YYYY/MM/DD format in reportDate variable
const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);
const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = yesterday.toLocaleString('en-CA', dateOptions);

const BUCKET = "amazon-ads-report-ids";
const KEY = "report-ids.json";

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
      'date', 'portfolioId', 'campaignBudgetCurrencyCode', 'campaignName', 'adGroupName', 
      'advertisedSku', 'advertisedAsin', 'impressions', 'clicks', 'clickThroughRate', 'costPerClick', 
      'spend', 'sales7d', 'roasClicks7d', 'purchases7d', 'unitsSoldClicks7d', 'unitsSoldSameSku7d', 
      'unitsSoldOtherSku7d', 'attributedSalesSameSku7d', 'salesOtherSku7d'
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

// main function to call previous functions to save report in share drive
async function saveReport(folderId, fileNameInfo, reportInfo) {
  const accessToken = await getAccessToken();
  // get report IDs from S3
  const reportIds = await getReportIds(BUCKET, KEY);
  // convert string response to a valid JS object
  const reportIdsObj = JSON.parse(reportIds);
  // get the report type currently being dealt with to extract the relevant report ID
  const reportType = reportInfo.adProduct;
  const reportId = reportIdsObj[reportType];
  // use access token and report ID to get the URL where report data is stored
  const reportUrl = await getReportUrl(accessToken, reportId);
  // use the returned report URL to get the report data in JSON format
  const reportData = await getReportData(reportUrl);
  
  // add necessary columns to report data, rename columns, put data in the correct order
  const processedData = processData(reportData, reportInfo);
  // create a XLSX workbook and convert the JSON data to XLSX sheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(processedData);
  // append sheet to workbook and name the excel tab
  XLSX.utils.book_append_sheet(workbook, worksheet, fileNameInfo.tabName);
  // serialize date column so it's not in string format
  serializeDate(worksheet);
  // save data as buffer (this format is needed by google drive API)
  const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  // save file to shared drive in folder specified and with specified name
  await uploadFileToSharedDrive(folderId, fileBuffer, fileNameInfo.fileName);
}

// handler function invoked by lambda to call saveReport with all 3 ads reports
export const handler = async (event) => {
  // object that contains each report's file name and the excel tab name
  const fileNameInfo = {
    SP: {fileName: `SP ${reportDate}.xlsx`, tabName: "Sponsored Product Advertised Pr"},
    SD: {fileName: `SD ${reportDate}.xlsx`, tabName: "Sponsored Display Advertised Pr"},
    SB: {fileName: `SB ${reportDate}.xlsx`, tabName: "Sponsored Brands Search Term Re"}
  };
  try {
    await saveReport(folderIds.SP, fileNameInfo.SP, reportsInfo.SP);
    await saveReport(folderIds.SD, fileNameInfo.SD, reportsInfo.SD);
    await saveReport(folderIds.SB, fileNameInfo.SB, reportsInfo.SB);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'reports saved successfully' })
  };
  } catch(error) {
      console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving reports: ', error })
  };
  }
};
