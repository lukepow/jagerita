import { getAccessToken, requestReport, getYesterdayDate, getReportUrl, getReportData } from "./helpers.js";
import path from "path";
import XLSX from "xlsx";

const apiUrl = "https://advertising-api.amazon.com/reporting/reports";
const profileIds = {"US": process.env.US_PROFILE_ID, "CA": process.env.CA_PROFILE_ID, "MX": process.env.MX_PROFILE_ID};
const yesterday = getYesterdayDate();
const reportInfo = {
  SP: {
    adProduct: "SPONSORED_PRODUCTS",
    reportTypeId: "spAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: [
      "date", "portfolioId", "campaignBudgetCurrencyCode",
      "campaignName", "adGroupName", "advertisedSku", "advertisedAsin",
      "impressions", "clicks", "clickThroughRate", "costPerClick", "spend",
      "sales7d", "roasClicks7d", "purchases7d", "unitsSoldClicks7d",
      "unitsSoldSameSku7d", "unitsSoldOtherSku7d",
      "attributedSalesSameSku7d", "salesOtherSku7d"
    ]
  },
  SD: {
    adProduct: "SPONSORED_DISPLAY",
    reportTypeId: "sdAdvertisedProduct",
    groupBy: ["advertiser"],
    columns: [
      "date", "campaignBudgetCurrencyCode", "campaignName", "adGroupName", "bidOptimization", "promotedSku",
      "promotedAsin", "impressions", "impressionsViews", "clicks", "viewClickThroughRate", "detailPageViews",
      "cost", "newToBrandSales", "sales", "salesClicks"
    ]
  },
  SB: {
    adProduct: "SPONSORED_BRANDS",
    reportTypeId: "sbSearchTerm",
    groupBy: ["searchTerm"],
    columns: [
      "date", "campaignBudgetCurrencyCode", "campaignName", "adGroupName", "matchType", "searchTerm",
      "costType", "impressions", "viewableImpressions", "clicks", "viewClickThroughRate", "sales"
    ]
  }
}


async function saveReport(profileId, reportInfo) {
  const accessToken = await getAccessToken();
  const response = await requestReport(apiUrl, profileId, accessToken, yesterday, reportInfo);
  const reportId = response.reportId;
  const reportUrl = await getReportUrl(accessToken, profileId, reportId);
  const reportData = await getReportData(reportUrl);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const filePath = path.join("/Users/lukepowers/Downloads", "6-11-2024.xlsx")

  XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
  XLSX.writeFile(workbook, filePath);
}

saveReport(profileIds.US, reportInfo.SP);
