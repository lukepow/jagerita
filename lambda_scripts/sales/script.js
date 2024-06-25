import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { SellingPartner } from "amazon-sp-api";
dotenv.config();

const tokenUrl = "https://api.amazon.com/auth/o2/token";
const apiUrl = "https://sellingpartnerapi-na.amazon.com/orders/v0/orders";
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const yesterday = new Date();
const today = new Date();
yesterday.setDate(yesterday.getDate()-1);
today.setDate(today.getDate());

const dateVals = yesterday.toISOString().split("T")[0].split("-");
const startDate = `${yesterday.toISOString().split("T")[0]}T07:00:00+00:00`;
const endDate = `${today.toISOString().split("T")[0]}T07:00:00+00:00`;
const yesterdayUsaFormat = `${dateVals[1]}-${dateVals[2]}-${dateVals[0]}`;



const marketplaceIds = {USA: "ATVPDKIKX0DER", CA: "A2EUQ1WTGCTBG2", MX: "A1AM78C64UM0Y8"};

const spClient = new SellingPartner({
  region: "na", // north america
  refresh_token: refreshToken
});

async function fetchData() {
  const filePath = path.join("/Users/lukepowers/Downloads", `${yesterdayUsaFormat}test.txt`);
  try {
    let res = await spClient.downloadReport({
      body: {
        reportType: "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL",
        marketplaceIds: ["ATVPDKIKX0DER"],
        dataStartTime: startDate,
        dataEndTime: endDate
      },
      version: "2021-06-30",
      interval: 8000,
      
    });
    return res;
    
  } catch (e) {
    console.log(e);
  }
}

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

function saveDocument(filePath, tsvData) {
  try {
    fs.writeFileSync(filePath, tsvData);
  } catch(err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

const data = await fetchData();
const transformedData = transformData(data);
const filePath = path.join("/Users/lukepowers/Downloads", `${yesterdayUsaFormat}testy.txt`);
saveDocument(filePath, transformedData);

