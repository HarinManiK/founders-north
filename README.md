# Founders North

Founders North is an automated, AI-powered news and intelligence publishing platform built for founders, entrepreneurs, and business leaders.

It connects to an IMAP mailbox, inspects emails from the last 24 hours, filters out authentic newsletters, scrapes referenced source URLs with a resilient web crawler, writes comprehensive journalism-grade analytical articles with source citations, auto-categorizes topics dynamically, compiles a unified Daily Digest, and publishes everything to a consumer-facing editorial web portal.

---

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS + Custom Design System with Light/Dark theme switch
- **Database**: Google Firebase / Firestore (Free Spark Plan)
- **AI Engine**: OpenRouter API (`google/gemini-3.5-flash-lite` by default)
- **Email Ingestion**: `imapflow` + `mailparser` with 24-hour lookback and UID deduplication
- **Web Scraper**: `@mozilla/readability` + `jsdom` + `cheerio` with redirect resolution, 8s timeouts, size caps, and graceful fallbacks
- **Pipeline Runner**: Decoupled Firestore state machine with live console streaming and per-article immediate persistence
- **Admin Authentication**: Password-protected (`founder19North*`) with HTTP-only session cookies
- **Typography & Rules**: No em dashes in the UI or AI generated copy; clean hyphens and colons instead

---

## Getting Started (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Admin SDK Credentials (from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n"

# Session Secret (random 32+ character string)
SESSION_SECRET=a-very-long-and-secure-random-secret-key-32-chars

# Optional: Secret for automated cron triggers
CRON_SECRET=your-random-cron-secret
```

### 3. Run Development Server

```bash
npm run dev
```

Visit:
- **Consumer Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Control Center**: [http://localhost:3000/admin](http://localhost:3000/admin) (Password: `founder19North*`)

---

## Free Hosting & Zero-Cost Setup Guide

### Step 1: Set Up Google Firebase Firestore (100% Free)

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g. `founders-north`) and disable Google Analytics (optional).
3. In the left sidebar, click **Build** -> **Firestore Database** -> **Create Database**.
4. Choose a location closest to your users (e.g. `asia-south1` for India or `us-central1`).
5. Choose **Start in production mode**.
6. In Project Settings (gear icon) -> **Service Accounts** -> click **Generate new private key**.
7. Open the downloaded JSON file and extract:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

*Firestore Free Tier (Spark plan) includes 1GB storage, 50,000 reads/day, and 20,000 writes/day for $0.00.*

---

### Step 2: Set Up OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/).
2. Create an account and add a small balance (e.g. $5).
3. Generate an API key.
4. The default model `google/gemini-3.5-flash-lite` costs approximately $0.30 / million input tokens and $2.50 / million output tokens (~$3 to $5/month for daily runs).

---

### Step 3: Set Up Gmail IMAP App Password

1. Go to your Google Account -> [Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g. `Founders North`) and click **Create**.
5. Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).

---

### Step 4: Deploy to Vercel (100% Free)

1. Push this Git repository to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/founders-north.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `SESSION_SECRET`
   - `CRON_SECRET`
5. Click **Deploy**.

---

### Step 5: Configure Admin Settings & Run Pipeline

1. Open `https://your-domain.vercel.app/admin`.
2. Enter the password `founder19North*`.
3. Go to the **Settings** tab:
   - Enter your Gmail address and 16-character App Password.
   - Enter your OpenRouter API key.
   - Click **Save Settings**.
4. Go to the **Pipeline** tab and click **Run Pipeline**.
5. Watch the live console as the AI fetches your newsletters, scrapes the source links, writes in-depth articles, assigns categories, compiles the Daily Digest, and publishes!

---

### Step 6: Automated 7:30 AM IST Daily Run (Optional)

When you are ready to automate the morning run:
- **Option A (Vercel Cron)**: Configured in `vercel.json` to trigger `/api/cron/run` daily at `02:00 UTC` (7:30 AM IST).
- **Option B (cron-job.org or GitHub Actions)**: Call `https://your-domain.vercel.app/api/cron/run` at 7:30 AM IST with header `Authorization: Bearer <CRON_SECRET>`.

---

## Admin Panel Features

- **Pipeline Runner**: Single-click "Run Pipeline" button with live streaming execution logs and execution history.
- **Mailbox & API Settings**: Securely manage IMAP host/port/credentials and OpenRouter key/model directly in the UI.
- **Prompt Studio**: Customize the 4 pipeline prompts (Filter, Article Writer, Categorizer, Digest Compiler) with one-click "Reset to Default" for each.
- **Articles Manager**: View, edit title/excerpt/content/category, toggle published/draft status, or delete articles.
- **Digests Manager**: View and edit daily briefing summaries and headlines.
- **Categories Manager**: Create, rename, or delete topic categories.

---

## Consumer Portal Pages

- **Home (`/`)**: Displays today's Daily Digest hero briefing followed by "Top Stories This Week" (ranked by AI importance score) and "Recent Articles".
- **Daily Digests (`/digests`)**: Archive of all past daily briefings.
- **Article Reader (`/articles/[slug]`)**: Reading experience featuring Key Takeaways, full markdown content, and a dedicated **Sources & References** box with links.
- **Categories (`/categories`) & Category Feed (`/category/[slug]`)**: Browse articles by topic with real-time article counts.
- **Theme Switcher**: Instant Light / Dark mode toggle with persistent local storage.
