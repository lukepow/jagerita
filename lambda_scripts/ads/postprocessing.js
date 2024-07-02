

const columnsToAdd = {
  SPONSORED_PRODUCTS: [
      {
        name: "7 Day Conversion Rate",
        value: ["purchases7d","clicks"],
      },
      {
        name: "Total Advertising Cost of Sales (ACOS)",
        value: ["spend", "sales7d"],
      }
  ],
  SPONSORED_DISPLAY: [
    {
      name: "Portfolio name",
      value: "-"
    },
    {
      name: "Cost Type",
      value: "CPC"
    },
    {
      name: "Bid Optimization",
      value: "SD_CONVERSIONS"
    },
    {
      name: "Click-Thru Rate (CTR)",
      value: ["clicks", "impressions"]
    },
    {
      name: "Cost Per Click (CPC)",
      value: ["cost", "clicks"]
    },
    {
      name: "Cost per 1,000 viewable impressions (VCPM)", // any values for past reports?
      value: ""
    },
    {
      name: "Total Advertising Cost of Sales (ACOS)",
      value: ["cost", "sales"]
    },
    {
      name: "Total Return on Advertising Spend (ROAS)",
      value: ["sales", "cost"]
    }, 
    {
      name: "Total Advertising Cost of Sales (ACOS) - (Click)",
      value: ["cost", "salesClicks"]
    },
    {
      name: "Total Return on Advertising Spend (ROAS) - (Click)",
      value: ["salesClicks", "cost"]
    }
  ],
  SPONSORED_BRANDS: [
    {
      name: "Portfolio name",
      value: "Not grouped"
    },
    {
      name: "Click-Thru Rate (CTR)",
      value: ["clicks", "impressions"]
    },
    {
      name: "Cost Per Click (CPC)",
      value: ["cost", "clicks"]
    },
    {
      name: "Cost per 1,000 viewable impressions (VCPM)",
      value: ["viewableImpressions", "cost"] // 1000 / viewable impressions * spend
    },
    {
      name: "Total Advertising Cost of Sales (ACOS)",
      value: ["cost", "sales"]
    },
    {
      name: "Total Return on Advertising Spend (ROAS)",
      value: ["sales", "cost"]
    },
    {
      name: "14 Day Conversion Rate",
      value: ["purchases", "clicks"]
    },
    {
      name: "Total Advertising Cost of Sales (ACOS) - (Click)",
      value: ["cost", "salesClicks"]
    },
    {
      name: "Total Return on Advertising Spend (ROAS) - (Click)",
      value: ["salesClicks", "cost"]
    },
    {
      name: "14 Day Total Units (#) - (Click)",
      value: "" // ? Check if it's the same as 14 day total units for all cases
    }
  ]
}

const colsToRename = {
  SPONSORED_PRODUCTS: {
    // Key/value of object is column name of API/ column name of report from console
    "date": "Date", "portfolioId": "Portfolio ID", "campaignBudgetCurrencyCode": "Currency",
    "campaignName": "Campaign Name", "adGroupName": "Ad Group Name", "advertisedSku": "Advertised SKU",
    "advertisedAsin": "Advertised ASIN", "impressions": "Impressions", "clicks": "Clicks", 
    "clickThroughRate": "Click-Thru Rate (CTR)", "costPerClick": "Cost Per Click (CPC)", "spend": "Spend",
    "sales7d": "7 Day Total Sales", "Total Advertising Cost of Sales (ACOS)": "Total Advertising Cost of Sales (ACOS)" ,"roasClicks7d": "Total Return on Advertising Spend (ROAS)", 
    "purchases7d": "7 Day Total Orders (#)", "unitsSoldClicks7d": "7 Day Total Units (#)",
    "7 Day Conversion Rate": "7 Day Conversion Rate",
    "unitsSoldSameSku7d": "7 Day Advertised SKU Units (#)", "unitsSoldOtherSku7d": "7 Day Other SKU Units (#)",
    "attributedSalesSameSku7d": "7 Day Advertised SKU Sales ", "salesOtherSku7d": "7 Day Other SKU Sales"
  },
  SPONSORED_DISPLAY: {
    "date": "Date", 'campaignBudgetCurrencyCode': "Currency", "campaignName": "Campaign Name", 'Portfolio name': "Portfolio name", "Cost Type": "Cost Type", 'adGroupName': "Ad Group Name", "Bid Optimization": "Bid Optimization",'promotedSku': "Advertised SKU", 'promotedAsin': "Advertised ASIN", 'impressions': "Impressions", "impressionsViews": "Viewable Impressions", 'clicks': "Clicks", 'Click-Thru Rate (CTR)': "Click-Thru Rate (CTR)", "detailPageViews": "14 Day Detail Page Views (DPV)", 'cost': "Spend", 'Cost Per Click (CPC)': "Cost Per Click (CPC)", "Cost per 1,000 viewable impressions (VCPM)": "Cost per 1,000 viewable impressions (VCPM)", "Total Advertising Cost of Sales (ACOS)": "Total Advertising Cost of Sales (ACOS)", "Total Advertising Cost of Sales (ACOS)": "Total Advertising Cost of Sales (ACOS)", "Total Return on Advertising Spend (ROAS)": "Total Return on Advertising Spend (ROAS)", "purchases": "14 Day Total Orders (#)", "unitsSold": "14 Day Total Units (#)", 'sales': "14 Day Total Sales", "newToBrandPurchases": "14 Day New-to-brand Orders (#)", "newToBrandSales": "14 Day New-to-brand Sales", "newToBrandUnitsSold": "14 Day New-to-brand Units (#)", "Total Advertising Cost of Sales (ACOS) - (Click)": "Total Advertising Cost of Sales (ACOS) - (Click)", "Total Return on Advertising Spend (ROAS) - (Click)": "Total Return on Advertising Spend (ROAS) - (Click)", "purchasesClicks": "14 Day Total Orders (#) - (Click)", "unitsSoldClicks": "14 Day Total Units (#) - (Click)", "salesClicks": "14 Day Total Sales - (Click)", "newToBrandPurchasesClicks": "14 Day New-to-brand Orders (#) - (Click)", "newToBrandSalesClicks": "14 Day New-to-brand Sales - (Click)", "newToBrandUnitsSoldClicks": "14 Day New-to-brand Units (#) - (Click)"
  },
  SPONSORED_BRANDS: {
    "date": "Date", "Portfolio name": "Portfolio name", "campaignBudgetCurrencyCode": "Currency", "campaignName": "Campaign Name", "adGroupName": "Ad Group Name", "keywordText": "Targeting", "matchType": "Match Type", "searchTerm": "Customer Search Term", "costType": "Cost Type", "impressions": "Impressions", "viewableImpressions": "Viewable Impressions",
    "clicks": "Clicks", "Click-Thru Rate (CTR)": "Click-Thru Rate (CTR)", "cost": "Spend", "Cost Per Click (CPC)": "Cost Per Click (CPC)", "Cost per 1,000 viewable impressions (VCPM)": "Cost per 1,000 viewable impressions (VCPM)", "Total Advertising Cost of Sales (ACOS)": "Total Advertising Cost of Sales (ACOS)", "Total Return on Advertising Spend (ROAS)": "Total Return on Advertising Spend (ROAS)", "sales": "14 Day Total Sales", 
    "purchases": "14 Day Total Orders (#)", "unitsSold": "14 Day Total Units (#)", "14 Day Conversion Rate": "14 Day Conversion Rate", "Total Advertising Cost of Sales (ACOS) - (Click)": "Total Advertising Cost of Sales (ACOS) - (Click)",
    "Total Return on Advertising Spend (ROAS) - (Click)": "Total Return on Advertising Spend (ROAS) - (Click)", "salesClicks": "14 Day Total Sales - (Click)", "purchasesClicks": "14 Day Total Orders (#) - (Click)", "14 Day Total Units (#) - (Click)": "14 Day Total Units (#) - (Click)"
  }
}
export function reorderColumns(jsonData, columns) {
  const apiColumns = Object.keys(columns);
  const worksheetColumns = Object.values(columns);
  const reorderedData = jsonData.map(row => {
    const reorderedRow = {};
    apiColumns.forEach((column, index) => {
      reorderedRow[worksheetColumns[index]] = row[column];
    });
    return reorderedRow;
  });
  return reorderedData;
}

export function addColumns(jsonData, newColData) {
  const completedData = jsonData.map(row => {
    newColData.forEach(colInfo => {
      if (Array.isArray(colInfo.value)) {
        const numerator = row[colInfo.value[0]];
        const denominator = row[colInfo.value[1]];
        const result = numerator / denominator;
        row[colInfo.name] = isNaN(result) || result === Infinity ? null : result;

      } else {
        row[colInfo.name] = colInfo.value;
      }
    });
    return row;
  });
  return completedData;
}

export function processData(reportData, reportInfo) {
  const reportType = reportInfo.adProduct;
  const completedData = addColumns(reportData, columnsToAdd[reportType]);
  const orderedData = reorderColumns(completedData, colsToRename[reportType]);
  return orderedData;
}
