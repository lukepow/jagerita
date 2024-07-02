import { getAccessToken, requestReport, getReportUrl, getReportData } from "./helpers.js";
import { processData } from "./postprocessing.js";
import path from "path";
import XLSX from "xlsx";

const apiUrl = "https://advertising-api.amazon.com/reporting/reports";
const profileIds = {"US": process.env.US_PROFILE_ID, "CA": process.env.CA_PROFILE_ID, "MX": process.env.MX_PROFILE_ID};
const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);

const reportDate = yesterday.toISOString().split("T")[0];

const reportInfo = {
  SP: {
    adProduct: "SPONSORED_PRODUCTS",
    reportTypeId: "spAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: [
      'date', 'portfolioId', 'campaignBudgetCurrencyCode', 'campaignName', 'adGroupName', 'advertisedSku', 'advertisedAsin', 'impressions', 'clicks', 'clickThroughRate', 'costPerClick', 'spend', 'sales7d', 'roasClicks7d', 'purchases7d', 'unitsSoldClicks7d', 'unitsSoldSameSku7d', 'unitsSoldOtherSku7d', 'attributedSalesSameSku7d', 'salesOtherSku7d'
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
      'impressions', "impressionsViews", 'clicks', "detailPageViews", 'cost', "purchases", "unitsSold", 'sales', "newToBrandPurchases", "newToBrandSales", "newToBrandUnitsSold", "purchasesClicks", "unitsSoldClicks", "salesClicks", "newToBrandPurchasesClicks", "newToBrandSalesClicks", "newToBrandUnitsSoldClicks"
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
}


async function saveReport(profileId, reportInfo, fileName) {
  const accessToken = await getAccessToken();
  const response = await requestReport(apiUrl, profileId, accessToken, reportDate, reportInfo);
  const reportId = response.reportId;
  const reportUrl = await getReportUrl(accessToken, profileId, reportId);
  const reportData = await getReportData(reportUrl);
  const processedData = processData(reportData, reportInfo);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(processedData);
  const filePath = path.join("/Users/lukepowers/Downloads/code", fileName)

  XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
  XLSX.writeFile(workbook, filePath);
}

// saveReport(profileIds.US, reportInfo.SP, `SP ${reportDate}.xlsx`);
// saveReport(profileIds.US, reportInfo.SD, `Sponsored Display Advertised product report ${reportDate}.xlsx`);
  saveReport(profileIds.US, reportInfo.SB, `Sponsored Brands Search term report ${reportDate}.xlsx`);
