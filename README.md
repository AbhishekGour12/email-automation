# Abhi Services - Email Outreach & Automation CRM

A production-grade, scalable cold email outreach and B2B contact automation system.

---

## Workspace Structure

```
emailautomation/
├── backend/          # Node.js + Express.js API Backend
│   ├── src/          # Source files (Controllers, Routes, Services, Queues, Workers)
│   ├── tests/        # Verification test suite scripts
│   └── uploads/      # Temporary directory for uploaded CSV/Excel files
│
└── frontend/         # React + Vite + MUI + Tailwind UI Client
    ├── src/          # React components, pages, contexts, styles
    └── public/       # Static assets
```

---

## Getting Started

### 1. Backend Setup & Startup
Navigate to the `backend` folder:
```bash
cd backend
```
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables in `.env` by copying `.env.example`.
3. Create your Firebase service account JSON key file, and place it at the path matching `FIREBASE_SERVICE_ACCOUNT_PATH` (default: `./firebase-service-account.json`).
4. Ensure **Redis** is running on `127.0.0.1:6379`.
5. Run verification tests to validate all utilities and parsers:
   ```bash
   node tests/verify.test.js
   ```
6. Launch the server in development mode:
   ```bash
   npm run start
   ```
   The backend will start listening on port `5000`.

### 2. Frontend Setup & Startup
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
```
1. Install dependencies:
   ```bash
   npm install
   ```
2. Verify production build compiling:
   ```bash
   npm run build
   ```
3. Launch the local Vite development server:
   ```bash
   npm run dev
   ```
   The application will start running and print the local address (typically `http://localhost:5173`).

---

## Features Implemented

1. **Dual JWT & Firebase Auth**: Complete token verification, persistent login check, and role-based permissions (Admin vs Team Member).
2. **Leads Import Engine**: Excel and CSV drag-and-drop parser mapping headers automatically and previewing duplicate emails.
3. **Draggable Email Sequence Builder**: Rich text editor integrating selectable placeholder chips (`{{name}}`, `{{company}}`, etc.), custom call-to-actions, signatures, and mobile/desktop live previews.
4. **BullMQ Outreach Sequences**: Parallel email queue runs, scheduled follow-up steps (Day 3, Day 7, Day 14), and automatic sequence termination if a lead replies.
5. **Interactive Inbox Tracker**: Triage incoming email replies and update lead statuses dynamically.
6. **Recharts Dashboards**: Conversions rates and outreach performance graphs (open, click, and reply rates).
7. **n8n Webhooks Support**: Dedicated endpoints for n8n automation loops.
