# Code for amazon reporting automation
The structure of this git repository is some folders which represent a lambda currently on AWS. The folders contain an index.js file which is the actual lambda function that gets invoked and a .zip file which contains all the dependencies needed by index.js to run properly in a node.js environment (package.json, node modules, and sometimes helper functions).

## Sales report
This is the simplest piece. It uses the SP-API to query for sales data in tsv format. The data is passed into a helper function to do a bit of cleaning to make the columns match the console report generated (in particular, adding the url column). The data is then passed in as a buffer to the google drive api which saves it in the appropriate folder.

## Ads reports
There's a good bit more code in these so I am just going to describe the general flow of how the code works/ is structured.

Report generation is broken up into two separate lambdas, one lambda for requesting the reports and another for saving the reports in google drive. This is because it takes several minutes for Amazon to generate a report after it is requested.

### request ads reports
For each ads report, the main lambda function requests an access token and uses that to request the generation of a report. The specifics of each report are in the reportsInfo variable (which allowed me to keep the functions flexible). The requestReport function returns the response of the ads API request, in particular the ID of the report that is being generated. This ID is used in the second lambda to get the report data. Once the three report IDs are returned, they are saved in S3 as a JSON object (so they can be queried by the other lambda).

### save ads reports
This code is the most complex. I had to create a helpers.js file which is included in the dependency layer, and most of the logic is in this file. This lambda first queries the S3 bucket to find the report IDs. It then uses the IDs to query the "adsAPI/reportID" endpoint, which returns the URL with the data to be downloaded. Next, the URL is queried and the data for the report is returned in JSON format. Because the ads API does not have all the same columns as those generated from the seller central console, and since the columns are returned in an incorrect order, a fair bit of postprocessing had to be done. First, the missing columns are added, which involved constructing a huge object with all the info for the missing columns. Generally, the column values were either a static value or a division between other two columns, so there are some conditionals in the function that handle that. Then, the JSON data is arranged in the correct column order and returned. That data is converted to XLSX format and sent as a buffer to the google drive api to be saved in the correct folder.