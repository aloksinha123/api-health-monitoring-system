# API Health Monitoring System

API Health Monitoring System is a lightweight dashboard and serverless backend for tracking the availability and response time of external APIs. The project combines a static browser UI with AWS Lambda, DynamoDB, API Gateway, EventBridge, and SNS to store results, run scheduled checks, and display health status in real time.

## What it does

- Adds APIs to be monitored and stores them in DynamoDB.
- Checks each API on a schedule and records health, status, response time, and failure counts.
- Sends SNS alerts when monitored APIs fail according to their priority.
- Displays the current monitoring state in a browser dashboard with charts and status cards.
- Refreshes the dashboard automatically so the latest results stay visible.

## Project Structure

- [frontend/login.html](frontend/login.html) - simple client-side login gate for the dashboard.
- [frontend/index.html](frontend/index.html) - main dashboard page.
- [frontend/script.js](frontend/script.js) - loads API data, renders charts, and handles add/delete actions.
- [backend/lambda-addapi.py](backend/lambda-addapi.py) - Lambda for adding new API records.
- [backend/lambda-getdata.py](backend/lambda-getdata.py) - Lambda for reading API records from DynamoDB.
- [backend/lambda-healthchecker.py](backend/lambda-healthchecker.py) - Lambda for checking API health and sending alerts.
- [vercel.json](vercel.json) - deploys the frontend as a static site on Vercel.

## Tech Stack

- AWS Lambda
- Amazon DynamoDB
- Amazon API Gateway
- Amazon EventBridge
- Amazon SNS
- HTML, CSS, JavaScript
- Chart.js

## Local Run

The frontend is a static site, so the simplest local run option is a local HTTP server.

1. Start a server from the project root:

   ```bash
   python -m http.server 5500
   ```

2. Open the site in a browser:

   ```
   http://localhost:5500
   ```

3. If you want to open the dashboard directly, use:

   ```
   http://localhost:5500/frontend/
   ```

## Login

The login page uses client-side credentials only. The current hard-coded values are:

- Username: `admin`
- Password: `1234`

After login, the dashboard stores a flag in `localStorage` and redirects to the main page.

## Backend Flow

1. A user adds an API from the dashboard.
2. The add API Lambda stores the target URL and priority in DynamoDB.
3. EventBridge triggers the health checker Lambda on a schedule.
4. The health checker requests each API, updates the stored health data, and increments failure counts when needed.
5. SNS alerts are sent for failures based on priority rules.
6. The frontend reads the latest data through the API Gateway endpoint and renders the dashboard.

## Configured AWS Resources

The current code expects the following AWS resources to exist:

- DynamoDB table named `APIs`
- API Gateway endpoints for `getdata`, `addapi`, and `deleteapi`
- SNS topic in `ap-south-1` for failure alerts

The frontend currently contains hard-coded API Gateway URLs and an API key in `frontend/script.js`. If you deploy this project for real use, move those values to environment variables or a safer configuration layer and rotate any exposed key material.

## Important Notes

- The login is only client-side, so it is not secure authentication.
- The API key is visible in browser code, so it should be treated as exposed.
- The frontend references a delete endpoint, but no delete Lambda file is present in the repository.
- The backend code depends on AWS resources that must already exist in the target account.
- Vercel is configured to serve the frontend only; the Lambdas are deployed separately in AWS.

## Suggested Deployment Steps

1. Deploy the Lambda functions to AWS.
2. Create or verify the DynamoDB table named `APIs`.
3. Configure API Gateway routes for add, get, and delete operations.
4. Set up the EventBridge rule for scheduled health checks.
5. Create the SNS topic used for alerting.
6. Update the frontend API URLs and key handling before production use.

## Notes for Contributors

- Keep frontend and backend field names aligned so the dashboard can read the same data the Lambdas write.
- Prefer environment-based configuration for URLs, credentials, and keys.
- If you add a delete Lambda or change the API contract, update both the frontend and this README.
