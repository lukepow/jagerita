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
  // const response = await requestReport(apiUrl, profileId, accessToken, yesterday, reportInfo);
  // const reportId = response.reportId;
  // const reportUrl = await getReportUrl(accessToken, profileId, reportId);
  const reportUrl = "https://offline-report-storage-us-east-1-prod.s3.amazonaws.com/4e592d92-0705-40d6-ac2c-49f6663b1865-1719254327614/report-4e592d92-0705-40d6-ac2c-49f6663b1865-1719254327614.json.gz?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEAMaCXVzLWVhc3QtMSJIMEYCIQDHlIV4rx5De5%2FKOxrdeFBqQqTkZdfP6%2FexGsyoza3jagIhAIuRnVfdeOdcqWcIbROkxVZCCHsizAzFvWLjloXoHGDmKuoFCKz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQAhoMODQxNjQ1NTQzMDc0IgzQuc%2FCitmeZNqIdawqvgUV3SPvTz0Ik9mLK9uAHFozZhcdTXvLLi%2BhxqeLl816LWvgrHEExRNPvN50vwk5WuoSx7w%2FRcDWPbi95IVNX6OYgIGCZrTMbA4tSDUCkcii%2B%2F0rl6%2B5gqxHJnBV1FrMuVejOxKz4spbE%2B4Uz1yC1KE6mhFsvg4Lq%2FGdjC2xXOkZwBBO%2B5P1p%2FimKM92EYdO1qwtrK4o%2B1%2FVqIYtEh1XBLu96jqi2qEh1SowaZCT7msDNfqjjrNG7Aov7vvNFLYp0wgVrlfxXYtaNFhdLwi9j2lF8dFycQfUrQ9UhVY6wjDGRkjP55KJNoW5aj9R7knsG425bsyCbQL9dJ28t%2BUuhR5n7PDxoMfPZygr0SbC7teT%2Fj2ctSkMwc6idSkrPgrsedhyN%2BkOF8Kpl6p2we0RXvs050u03PfjuTfIZusSKAiAIRIAvos%2FEQYqZbHkQU15OMRlUax2%2BtDbywOq8hXIIpN7BVCE8z1KiZq%2ByhHHYfkTBtHZP1jqLlynjgvQokgScia36mBiuWCRpK0ZdhH2lUlWYn5UHBixrPteHJgSPSltgtnNXy6pi7qDQEaC2bbE9A3SX%2F4di9ajaIZblnJVGkvfvm0RDMbWT%2B3ARSdSR%2Frspsjq0AMwH9wUN8KvIeAkoHEvgME7OJiXox%2BloPFB8XiIS5YANTKjyBQlc49jkd53CdMbye4n4BgZnm3TWnV771gr2ZTAz%2FoGFX65dKIPF297l4ZPGZzmuEZcjkwZ5ZIpegJD1PBhGxIU6lh1UVUGg3CLnlAXlH%2BXLieJOLHgdkHszfMZ6OMuz6wZ8rBN%2FUEk%2BtUkW9th%2FHsTXX1V6CVUSwDIeBgio6HpgFC78DcXtOIWca8ZcxK4AVsxFxKeAf38ZdPRzfpe6Tk8HRDp0giHHCMoLl78r1acIH%2FynRTsXgQyUdhVvNBL0bOY%2Fw60cd0wh%2FXmswY6qAGtHAFjkwcDfnEBGPQbg%2FgowuLNubetGQtM%2BK9%2BHs272s0DsuVR%2B370m5PC1rIpuZpS6Jdv6sf7GuopbSBtwzqdMr%2FXgVwO%2FPcfmEyevrQr92Sg63fP0zoIspeWgcornMH35uGxswRWfKvAFi1Y80ZGAhve5NccXvMtyTIexBxaxv27PdjbC6QaUjUQtwm0b7yUKMeSvP41UzbbwVsYmvphnwRzneUggSw%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240624T184821Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=ASIA4H5P3Z2RO45QKVYO%2F20240624%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=da08bace841dfd843b4e63c3288c82bdd3d041ade76905bd1cc90ad0c7d34536"
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
