import XLSX from "xlsx";

import { getAccessToken,
  getReportIds,
  getReportUrl,
  getReportData,
  processData,
  uploadFileToSharedDrive,
  serializeDate } from "/opt/helpers.js";

const folderIds = JSON.parse(process.env.FOLDER_IDS);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);
const dateOptions = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
const reportDate = yesterday.toLocaleString('en-CA', dateOptions);

const BUCKET = "amazon-ads-report-ids";
const KEY = "report-ids.json";

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
  const reportIds = await getReportIds(BUCKET, KEY);
  const reportIdsObj = JSON.parse(reportIds);
  const reportType = reportInfo.adProduct;
  const reportId = reportIdsObj[reportType];
  const reportUrl = await getReportUrl(accessToken, reportId);
  const reportData = await getReportData(reportUrl);
  
  const processedData = processData(reportData, reportInfo);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(processedData);

  XLSX.utils.book_append_sheet(workbook, worksheet, fileNameInfo.tabName);
  serializeDate(worksheet);
  const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await uploadFileToSharedDrive(folderId, fileBuffer, fileNameInfo.fileName);
}

// handler function invoked by lambda to call saveReport with all 3 ads reports
export const handler = async (event) => {
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