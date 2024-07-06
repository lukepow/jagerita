import axios from "axios";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import zlib from "zlib";
import { google } from "googleapis";
import process from "process";
import { Readable } from "stream";

const tokenUrl = "https://api.amazon.com/auth/o2/token/";
const apiUrl = "https://advertising-api.amazon.com/reporting/reports";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const profileId = process.env.US_PROFILE_ID;
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive']
  }
);

const drive = google.drive({
  version: 'v3',
  auth: auth,
});

export async function uploadFileToSharedDrive(folderId, fileBuffer, fileName) {

  const metaData = {
    "name": fileName,
    "parents": [folderId]
  };
  const media = {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: Readable.from(fileBuffer)
  };

  await drive.files.create({
    resource: metaData,
    media: media,
    fields: "id",
    supportsAllDrives: true
  });
}

const columnsToAdd = {
  SPONSORED_PRODUCTS: [
    {
      name: "Portfolio name",
      value: {"106981549316271": "Double Spend", null: "No Portfolio", "65755187546504": "W Underwear Everyday Cheeky Brief", "280492966857691": "M Tops Everyday SS V-Neck", "5063832534086": "W Tops Everyday Cami", "165024236637009": "M Tops Everyday SS Crew", "104816120666296": "M Underwear Classic Boxer", "259764919944753": "M Tops Everyday SS Henley", "38813994682763": "M Tops Everyday SS Button Up", "25893144515343": "W Bottoms Everyday Flex Legging Pocket", "116842281474380": "W Tops Everyday SS Henley", "3896807676598": "W Tops Pro-Knit Hoodie Zip", "73870559377363": "W Underwear Everyday Hipster", "44809391797534": "W Bottoms Longhaul Pants Weekender", "131285460150335": "M Bottoms Longhaul Pant Shop", "23115784546632": "Auto Tests"},
    },
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
      name: "Cost per 1,000 viewable impressions (VCPM)",
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
      value: [1000, "viewableImpressions", "cost"]
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
      value: ["unitsSold"]
    }
  ]
}

const colsToRename = {
  SPONSORED_PRODUCTS: {
    // Key/value of object is column name of API/ column name of report from console
    "date": "Date", "Portfolio name": "Portfolio name", "campaignBudgetCurrencyCode": "Currency",
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

export async function getAccessToken() {
  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }), {
      headers: {
        "content_type": "application/x-www-form-urlencoded" 
      }
    });

    return response.data.access_token;

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
  }
}


export function getReportIds (bucket, key) {
  const client = new S3Client({ region: "us-west-2" });
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });

    try {
      const response = await client.send(getObjectCommand)
      let responseDataChunks = []

      response.Body.once('error', err => reject(err));
      response.Body.on('data', chunk => responseDataChunks.push(chunk));
      response.Body.once('end', () => resolve(responseDataChunks.join('')));

    } catch (err) {
      return reject(err)
    } 
  })
}

export async function getReportUrl(accessToken, reportId) {
  const url = `${apiUrl}/${reportId}`;

  const headers = {
    "Amazon-Advertising-API-ClientId": clientId,
    Authorization: `bearer ${accessToken}`,
    "Amazon-Advertising-API-Scope": profileId,
    "Content-Type": "application/vnd.createasyncreportrequest.v3+json"
  };

  try {
    const response = await axios.get(url, { headers: headers });
    const reportUrl = response.data.url;
    return reportUrl;
  } catch(err) {
    console.error(err.message);
  }
}

export async function getReportData(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    const bytesResponse = zlib.gunzipSync(Buffer.from(response.data));
    const jsonStr = bytesResponse.toString("utf-8");
    const reportData = JSON.parse(jsonStr);
    return(reportData);

  } catch(err) {
      console.error('Error:', err.response ? err.response.data : err.message);
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
      if (typeof colInfo.value !== "object") {
        row[colInfo.name] = colInfo.value;
      } else if (colInfo.value.length === 2) {
        const numerator = row[colInfo.value[0]];
        const denominator = row[colInfo.value[1]];
        const result = numerator / denominator;
        row[colInfo.name] = isNaN(result) || result === Infinity ? null : result;
      } else if (colInfo.value.length === 1) {
        row[colInfo.name] = row[colInfo.value[0]]
      } else if (colInfo.value.length === 3) {
        const result = colInfo.value[0] / row[colInfo.value[1]] * row[colInfo.value[2]];
        row[colInfo.name] = isNaN(result) || result === Infinity ? null : result;
      } else {
        // access to portfolio id
        const portfolioId = row.portfolioId;
        row[colInfo.name] = colInfo.value[portfolioId];
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
