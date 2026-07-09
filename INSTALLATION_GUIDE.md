# SEO Vision - Installation & Deployment Guide

This guide walks you through setting up a local or staging deployment of the SEO Vision platform.

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed:
*   **Node.js**: Version `18.0.0` or higher.
*   **npm**: Version `9.0.0` or higher.
*   **MongoDB**: Version `6.0` or higher (either a local instance or MongoDB Atlas cluster connection string).

---

## 🛠 Step-by-Step Setup

### 1. Clone the Repository
Clone the codebase and navigate to the project directory:
```bash
git clone https://github.com/your-username/seoVision.git
cd seoVision
```

### 2. Install Dependencies
Install all package dependencies declared in `package.json` for the runtime:
```bash
npm install
```
This automatically installs the required packages, including `express`, `mongoose`, `puppeteer`, `cheerio`, `jsonwebtoken`, and developer tools like `nodemon`.

### 3. Configure Environment Variables
Create a file named `.env` in the project root directory and add the following settings:
```env
# Application Server Port
PORT=5000

# MongoDB Connection Endpoint
MONGODB_URI=mongodb://localhost:27017/seovision

# JSON Web Token Secret (used to sign sessions)
JWT_SECRET=your_jwt_signature_secret_key_here

# JWT Expiration Period
JWT_EXPIRES_IN=7d

# Environment Mode (development or production)
NODE_ENV=development
```

### 4. Boot the Backend API Server
*   **Development Mode** (auto-reloads on file updates using `nodemon`):
    ```bash
    npm run dev
    ```
*   **Production Mode**:
    ```bash
    npm start
    ```
You should see console logs confirming a successful database connection and the active server port:
```text
MongoDB connected successfully
Server running in development mode on port 5000
```

### 5. Access the Frontend Application
Since the frontend client communicates with the server dynamically via REST fetches, you can serve the `client/` subdirectory files using any standard HTTP server.
*   **Option A**: Run a local static server like `live-server` in the `client/` folder:
    ```bash
    # Install globally if needed
    npm install -g live-server
    cd client
    live-server
    ```
*   **Option B**: Open the client index file directly (e.g. via VS Code Live Server extension or clicking `client/index.html`).

---

## 🔍 Verifying the Installation

To verify that the application is running correctly:
1.  Open the landing page (`http://127.0.0.1:8080/index.html` or similar, depending on your static server).
2.  Click **Register** to create a new user profile.
3.  Upon successful creation, the system caches the JWT token and redirects you to the **Dashboard**.
4.  Enter a URL (e.g., `https://example.com`) in the audit input field and click **Run Audit**.
5.  Wait for the loader screen to finish. The page should redirect to the **Report View**, presenting the crawled category scores and recommendations.
6.  Click **Download Report (PDF)** in the report toolbar to verify that Puppeteer renders and exports the A4-sized PDF successfully.

---

## ⚡ Troubleshooting

### 1. Puppeteer Launch Failures
If Puppeteer fails to launch headless Chrome, it is typically due to missing operating system sandbox dependencies.
*   **Solution**: Ensure your Linux kernel has sandboxing libraries installed:
    ```bash
    sudo apt-get install -y libxss1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
    ```

### 2. MongoDB Access Denied
*   **Solution**: Ensure your local MongoDB daemon is running (`sudo systemctl start mongod` or `brew services start mongodb-community`). If using a remote cluster, check that your network IP is whitelisted in MongoDB Atlas.
