import { getAccessToken, requestReport, formatDate, getReportUrl, getReportData, reorderColumns } from "./helpers.js";
import path from "path";
import XLSX from "xlsx";

const apiUrl = "https://advertising-api.amazon.com/reporting/reports";
const profileIds = {"US": process.env.US_PROFILE_ID, "CA": process.env.CA_PROFILE_ID, "MX": process.env.MX_PROFILE_ID};
const yesterdayUnformatted = new Date();
const lastWeekUnformatted = new Date();
yesterdayUnformatted.setDate(yesterdayUnformatted.getDate()-1);
lastWeekUnformatted.setDate(lastWeekUnformatted.getDate()-8);
const yesterday = "2024-06-18";
const lastWeek = "2024-06-10";
// const yesterday = formatDate(yesterdayUnformatted);
// const lastWeek = formatDate(lastWeekUnformatted);
const reportInfo = {
  SP: {
    adProduct: "SPONSORED_PRODUCTS",
    reportTypeId: "spAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: {
      // Key/value of object is column name of API/ column name of report from console
      "date": "Date", "portfolioId": "Portfolio ID", "campaignBudgetCurrencyCode": "Currency",
      "campaignName": "Campaign Name", "adGroupName": "Ad Group Name", "advertisedSku": "Advertised SKU",
      "advertisedAsin": "Advertised ASIN", "impressions": "Impressions", "clicks": "Clicks", 
      "clickThroughRate": "Click-Thru Rate (CTR)", "costPerClick": "Cost Per Click (CPC)", "spend": "Spend",
      "sales7d": "7 Day Total Sales", "roasClicks7d": "Total Return on Advertising Spend (ROAS)", 
      "purchases7d": "7 Day Total Orders (#)", "unitsSoldClicks7d": "7 Day Total Units (#)",
      "unitsSoldSameSku7d": "7 Day Advertised SKU Units (#)", "unitsSoldOtherSku7d": "7 Day Other SKU Units (#)",
      "attributedSalesSameSku7d": "7 Day Advertised SKU Sales ", "salesOtherSku7d": "7 Day Other SKU Sales"
    },
    startDate: yesterday,
    endDate: yesterday
  },
  SD: {
    adProduct: "SPONSORED_DISPLAY",
    reportTypeId: "sdAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: {
      "date": "Date", "campaignBudgetCurrencyCode": "Currency", "campaignName": "Campaign Name", 
      "adGroupName": "Ad Group Name", "bidOptimization": "Bid Optimization", "promotedSku": "Advertised SKU",
      "promotedAsin": "Advertised ASIN", "impressions": "Impressions", "impressionsViews": "Viewable Impressions", 
      "clicks": "Clicks", "viewClickThroughRate": "Click-Thru Rate (CTR)", "detailPageViews": "14 Day Detail Page Views (DPV)",
      "cost": "Spend", "purchases": "14 Day Total Orders (#)", "unitsSold": "14 Day Total Units (#)", 
      "sales": "14 Day Total Sales", "newToBrandPurchases": "14 Day New-to-brand Orders (#)", 
      "newToBrandSales": "14 Day New-to-brand Sales", "newToBrandUnitsSold": "14 Day New-to-brand Units (#)", 
      "purchasesClicks": "14 Day Total Orders (#) - (Click)", "unitsSoldClicks": "14 Day Total Units (#) - (Click)", 
      "salesClicks": "14 Day Total Sales - (Click)", "newToBrandPurchasesClicks": "14 Day New-to-brand Orders (#) - (Click)",
      "newToBrandUnitsSold": "14 Day New-to-brand Sales - (Click)",
      "newToBrandUnitsSoldClicks": "14 Day New-to-brand Units (#) - (Click)"
    },
    startDate: lastWeek,
    endDate: yesterday
  },
  SB: {
    adProduct: "SPONSORED_BRANDS",
    reportTypeId: "sbSearchTerm",
    groupBy: ["searchTerm"],
    columns: {
      "date": "Date", "campaignBudgetCurrencyCode": "Currency", "campaignName": "Campaign Name",
      "adGroupName": "Ad Group Name", "matchType": "Match Type", "searchTerm": "Customer Search Term",
      "costType": "Cost Type", "impressions": "Impressions", "viewableImpressions": "Viewable Impressions",
      "clicks": "Clicks", "viewClickThroughRate": "Click-Thru Rate (CTR)", "sales": "14 Day Total Sales", 
      "purchases": "14 Day Total Orders (#)", "unitsSold": "14 Day Total Units (#)", 
      "salesClicks": "14 Day Total Sales - (Click)", "purchasesClicks": "14 Day Total Orders (#) - (Click)"
    },
    startDate: lastWeek,
    endDate: yesterday
  }
}


async function saveReport(profileId, reportInfo, fileName) {
  const accessToken = await getAccessToken();
  const response = await requestReport(apiUrl, profileId, accessToken, yesterday, reportInfo);
  const reportId = response.reportId;
  const reportUrl = await getReportUrl(accessToken, profileId, reportId);
  const reportData = await getReportData(reportUrl);
  const cleanedData = reorderColumns(reportData, reportInfo.columns);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(cleanedData);
  const filePath = path.join("/Users/lukepowers/Downloads/code", fileName)

  XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
  XLSX.writeFile(workbook, filePath);
}

// saveReport(profileIds.US, reportInfo.SP, `SP ${yesterday}.xlsx`);
// saveReport(profileIds.US, reportInfo.SD, `Sponsored Display Advertised product report ${yesterday}.xlsx`);
saveReport(profileIds.US, reportInfo.SB, `Sponsored Brands Search term report ${yesterday}.xlsx`);
