# SEO Vision - System & Software Architecture Documentation

## 1. Introduction & Objectives

### 1.1 Project Overview
SEO Vision is a comprehensive software platform designed to audit public websites, scoring them across critical SEO, structural, and performance categories. By providing an automated scanning pipeline, interactive visual dashboards, and downloadable PDF reports, it serves as a complete auditing system for web developers, content strategists, and marketing teams.

### 1.2 Objectives
*   Provide a standardized grading model evaluating basic SEO tags, technical standards, speed indices, content lengths, links, and structured metadata.
*   Enforce a secure multi-user architecture separating individual scan audits and configuration settings.
*   Optimize crawler throughput to parse remote websites within short execution windows.
*   Ensure full visual layout fidelity across desktop, tablet, and mobile screens.

---

## 2. System Architecture

The platform uses a classic **three-tier client-server architecture** backed by an asynchronous crawler pipeline.

```
[Client Tier: HTML5/JS/CSS]
       │         ▲
  HTTPS Requests │ JSON Response
       ▼         │
[Application Tier: Node.js/Express.js] ◄──► [Crawler & Audit Engine (Cheerio/Puppeteer)]
       │         ▲
  Mongoose Query │ Data models
       ▼         │
[Database Tier: MongoDB Database]
```

### 2.1 Frontend Tier (Client)
*   **Decoupled Views**: Formatted as plain HTML5 files with localized page stylesheets.
*   **Modular API Client**: Centralizes token authorization headers, response parsing, and fetch wrappers.
*   **Authentication Guards**: Intercepts routing on page loads to redirect unauthenticated guest traffic back to the login views.

### 2.2 Application Tier (Server)
*   **REST Routing Engine**: Organizes endpoints by function: Authentication, Scanners, and Report Exporters.
*   **Audit Scraper**: Utilizes Cheerio to load and traverse DOM structures.
*   **Browser Sandbox**: Employs headless Puppeteer processes to render PDFs.

### 2.3 Database Tier (Persistence)
*   **MongoDB Database**: Houses user profiles, transient crawl jobs, and computed report entities.
*   **Mongoose ODM**: Handles data validation and relational model references.

---

## 3. Database Design & Models

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│     User     │          │   Analysis   │          │    Report    │
├──────────────┤          ├──────────────┤          ├──────────────┤
│ _id          │ 1 ───  * │ _id          │ 1 ───  1 │ _id          │
│ name         │          │ userId (Ref) │          │ analysisId   │
│ email (UQ)   │          │ url          │          │ seoScore     │
│ password     │          │ status       │          │ performance  │
│ avatar       │          │ startedAt    │          │ contentScore │
│ createdAt    │          │ completedAt  │          │ imagesScore  │
│              │          │ reportId(Ref)│          │ reportsData  │
└──────────────┘          └──────────────┘          └──────────────┘
```

### 3.1 User Schema
- `name`: String, required, capped at 50 chars.
- `email`: String, unique, lowercase, trimmed, validated via `validator.isEmail`.
- `password`: String, selected false by default, pre-saved using `bcryptjs` hashing.
- `avatar`: String, default empty.
- `createdAt`: Date, default current timestamp.

### 3.2 Analysis Schema
- `userId`: ObjectId, ref 'User', required.
- `url`: String, required, standardized protocol prefix.
- `status`: String, enum: `['pending', 'running', 'completed', 'failed']`.
- `startedAt`: Date, default current timestamp.
- `completedAt`: Date.
- `reportId`: ObjectId, ref 'Report'.

### 3.3 Report Schema
- `analysisId`: ObjectId, ref 'Analysis', required.
- `seoScore`: Number, overall grading average.
- `basicSeoScore`, `technicalScore`, `performanceScore`, `contentScore`, `imagesScore`, `linksScore`, `structuredDataScore`: Numbers.
- `recommendations`: Array of objects storing title, priority, description, and remediation code blocks.
- `reportData`: Object containing cheerio DOM metadata dumps (scraped tags, alt-less images, links).

---

## 4. Crawl & Audit Scoring Engine

```
[Start Scan] ──► [Normalize URL] ──► [Crawl Service (Cheerio)]
                                            │
                                            ▼
[Audit Service] ◄── [Scoring System] ◄── [DOM Tag Extraction]
      │
      ▼
[Generate Recommendations] ──► [Save Report & Analysis Models]
```

1.  **Normalization**: Resolves missing protocols (e.g. prepending `http://` if necessary) and validates URL structure.
2.  **HTML Extraction**: Fetches page contents using `axios` (with timeouts). In case of client-side renders, it utilizes Puppeteer's browser runtime.
3.  **DOM Audit**: Walks the Cheerio document tree to scrape:
    - `<title>` and `<meta name="description">` tags (length and existence checks).
    - Heading tag hierarchies (`<h1>` count, nesting consistency).
    - Image tags (`<img>` elements missing `alt` attributes).
    - Anchor links (`<a>` elements missing text content, internal vs. external ratios).
    - Structural elements (SSL checks, mobile responsiveness viewport tags).
4.  **Score Compilation**:
    - Deducts penalties for missing tags, structural issues, or performance load times.
    - Compiles category scores into a single weighted overall SEO Score.
5.  **Recommendation System**: Matches failures against a static database of remediation instructions to construct high, medium, and low-priority fixes.

---

## 5. Security & Verification Features

*   **Password Hashing**: Securely salts and hashes user passwords using `bcryptjs` before committing records to the DB.
*   **JWT Protection Middleware**: Inspects the Request Header `Authorization` parameter for standard bearer tokens, verifying payload signatures and user expiration status.
*   **Rate Limiting**: Employs `express-rate-limit` on authentication endpoints to prevent brute-force dictionary attacks.
*   **HTTP Header Protections**: Mounts `helmet` middleware to set standard secure headers, mitigating Cross-Site Scripting (XSS) and clickjacking vectors.
*   **Input Sanitization**: Automatically validates emails, URLs, and lengths using standard node validations.
*   **Resource Ownership Checks**: Validates that the requesting user's ID matches the database ownership fields of the requested analysis record before serving audit reports or compiling PDF exports.

---

## 6. Challenges & Performance Optimizations

### 6.1 Challenges Faced
*   **Single-Source Navigation Refactoring**: Consolidating navigation options on the left sidebar while eliminating duplications in the top navbar without causing visual clipping or alignment breakage.
*   **Race Conditions on Load**: Managing module-level script load states where the document was marked `interactive` before `DOMContentLoaded` triggers bound event handlers. Resolved by checking `document.readyState`.
*   **Tablet Viewport Layout Balance**: Designing custom stacking styles for tablet viewports (700px - 1024px) that prevent horizontal card compression while retaining a visible sidebar.

### 6.2 Optimizations
*   **Tailored CSS Grid Breakpoints**: Swapped standard percentage scaling for explicit 2-column stats grids and stacked form layouts on tablet viewports.
*   **Selective Data Population**: Utilizes Mongoose `.populate` and field projections selectively to keep JSON payloads small.
*   **Static PDF Pre-Rendering**: Converts JSON reports into clean, standalone HTML templates before launching Puppeteer. This minimizes page rendering time inside the browser context, enabling faster PDF generation.

---

## 7. Conclusion & Future Scope
SEO Vision represents a complete, robust SaaS tool for auditing and grading target site optimization. Future extensions can expand the crawler to support multi-page recursive crawling, implement scheduled audits with email notifications, and integrate Google PageSpeed Insights APIs for deeper, real-world core web vitals auditing.
