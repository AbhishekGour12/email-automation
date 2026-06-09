# Abhi Services - Email Outreach & Automation Backend Setup Instructions

This document provides a comprehensive, 16-step guide to setting up, running, and integrating the **Email Outreach & Automation Backend**.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Redis Server** (v6.x or higher, required for BullMQ queues)

---

## Step-by-Step Setup Guide

### 1. Project Navigation
Open your terminal and navigate to the backend root directory where `package.json` is located:
```bash
cd backend
```

### 2. Configure Environment Variables
Copy the provided `.env.example` file to create your active `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in the placeholder values (Firebase Database URL, SMTP credentials, etc.).

### 3. Firebase Console Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., `email-outreach-crm`).
3. Click on the gear icon next to "Project Overview" and select **Project Settings**.
4. Go to the **Service Accounts** tab.
5. Click **Generate New Private Key** and download the JSON file.

### 4. Setup Firebase Realtime Database
1. In the Firebase Console left menu, navigate to **Build** -> **Realtime Database**.
2. Click **Create Database**, select your database location, and start in **Locked Mode**.
3. Under the **Rules** tab, ensure standard rules are present (or customize them). For full backend access, the rules can remain simple:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
4. Copy your Realtime Database URL (e.g., `https://your-project-id-default-rtdb.firebaseio.com/`) and set it as `FIREBASE_DATABASE_URL` in your `.env` file.

### 5. Install Firebase Private Key
Take the JSON credentials file downloaded in **Step 3** and save it in the `backend` folder as `firebase-service-account.json` (ensure this matches the name in your `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable).
> [!WARNING]
> Keep your service account JSON file secure and never commit it to source control.

### 6. Start Redis Server
Ensure your Redis instance is running locally or remotely. On Windows, you can start the Redis service or run:
```bash
redis-server
```
Make sure the host and port in your `.env` file match your running Redis instance (default is `127.0.0.1:6379`).

### 7. Install Dependencies
Run the install command to configure all node modules (Express, ioredis, BullMQ, Firebase Admin SDK, ExcelJS, Joi, etc.):
```bash
npm install
```

### 8. Run Core Verification Tests
Execute the self-contained verification suite to confirm that the parsers, template personalize engine, link rewriter, and token generators are fully functional:
```bash
node tests/verify.test.js
```

### 9. Start the Backend Server
Start the Express server along with the BullMQ workers in development mode:
```bash
npm run start
```
The server will boot on port `5000` (or the configured `PORT` in your `.env`) and the console will log:
`Server is running on port: 5000...`

### 10. Register Your First Admin Account
To access the secure APIs, register your admin user via the registration endpoint. You can use curl, Postman, or any HTTP client:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin User", "email": "admin@yourdomain.com", "password": "securepassword123", "role": "Admin"}'
```
This generates a user node in `/users/{uid}` and returns your JWT access and refresh tokens.

### 11. Define Global SMTP Settings
Log in as Admin, get the JWT token, and update the global Hostinger SMTP credentials in Firebase:
```bash
curl -X PUT http://localhost:5000/api/settings/smtp \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"host": "smtp.hostinger.com", "port": 465, "secure": true, "user": "outreach@yourdomain.com", "pass": "your_mailbox_password"}'
```

### 12. Create Email Templates
Create outreach templates using the Templates API. The body can contain default industry hooks (`{{intro_hook}}`, `{{value_hook}}`, `{{cta_hook}}` or `{{industry_hook}}`) and lead variables:
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "B2B Outreach Template",
    "category": "Project Outreach",
    "subject": "Quick question for {{company}}",
    "body": "Hi {{name}},\n\n{{intro_hook}} We notice that many companies in the {{industry}} space face similar issues. {{value_hook}}\n\n{{cta_hook}}",
    "followup1": "Hi {{name}},\n\nFollowing up on my last email. Would love to connect and share more on our outreach strategies.",
    "followup2": "Hi {{name}},\n\nI know you are busy. Let me know if you are the right person to talk to regarding growth at {{company}}.",
    "followup3": "Hi {{name}},\n\nFinal check-in. If you are not interested, no worries! Have a great week."
  }'
```

### 13. Import Leads via Excel or CSV
To import leads in bulk, upload an Excel (.xlsx) or CSV file.
Ensure your file contains an `Email` or `Email Address` column (other recognized columns: `Name`, `Phone`, `Company`, `Website`, `Industry`, `City`, `Country`, `LinkedIn`).
```bash
curl -X POST http://localhost:5000/api/leads/import \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -F "file=@/path/to/your/leads_sheet.csv"
```

### 14. Create and Start a Campaign
1. Create a campaign and assign lead IDs (e.g. `["-LeadID1", "-LeadID2"]`) and the template ID:
   ```bash
   curl -X POST http://localhost:5000/api/campaigns \
     -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"name": "June Dental Outreach", "templateId": "<TEMPLATE_ID>", "leadIds": ["<LEAD_ID_1>", "<LEAD_ID_2>"]}'
   ```
2. Start the campaign to trigger the initial sends:
   ```bash
   curl -X POST http://localhost:5000/api/campaigns/<CAMPAIGN_ID>/start \
     -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
   ```
This queues jobs in BullMQ and schedules delayed followups.

### 15. Track Email Opens and Clicks
- Open tracking is performed automatically via an embedded 1x1 image pixel pointing to `/api/email/track/open/:emailId`.
- Click tracking is done by rewriting email links to route through `/api/email/track/click/:emailId?url=...`.
- These endpoints are fully public and automatically log actions in Firebase while redirecting users seamlessly.

### 16. Integrate with n8n Webhooks
The backend exposes webhook endpoints under `/api/webhook` secured by `WEBHOOK_SECRET` passed in headers (`x-webhook-secret`):
- **Import Leads**: `POST /api/webhook/import-leads` -> Pass JSON list of leads to save.
- **Send Campaign**: `POST /api/webhook/send-campaign` -> Pass `{ "campaignId": "..." }` to launch.
- **Receive Reply**: `POST /api/webhook/reply-received` -> Pass incoming emails from your IMAP node.
- **Stop Followup**: `POST /api/webhook/stop-followup` -> Pass `{ "email": "..." }` to unsubscribe a lead and abort sequence.
- **Update Status**: `POST /api/webhook/update-status` -> Pass `{ "leadId": "...", "status": "Interested" }` to update lead state.
