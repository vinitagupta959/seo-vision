# SEO Vision - Project Directory Architecture

This document outlines the organization, structure, and individual responsibilities of files and directories within the SEO Vision repository.

---

## 📁 Root Directory Layout

```
seoVision/
├── client/                     # Frontend Client Layer
├── server/                     # Backend API Application Layer
├── .env                        # Local Environment Configurations
├── .gitignore                  # Git Ignore Specifications
├── package.json                # Project Dependencies & Scripts
└── package-lock.json           # Exact Node Modules Dependency Tree
```

---

## 🖥 Client Layer (`client/`)

Contains static resources, stylesheets, and scripts loaded by browser viewports.

### `client/pages/`
Static HTML views for the application:
*   `index.html`: Public marketing landing page.
*   `login.html` & `register.html`: User onboarding and credential entry portals.
*   `dashboard.html`: Authenticated main panel containing audit forms, metrics charts, and recent scans.
*   `history.html`: Paginated list of all past user audits with keyword search, status, and score sorting.
*   `report.html`: Detailed results card containing category gauges, recommendation accordions, and report download buttons.
*   `profile.html`: User settings, display name modification, and password updates.
*   `loading.html`: Interactive processing screen displayed during active crawlers runs.
*   `404.html`: Custom 404 page error fallback.

### `client/assets/css/`
*   `variables.css`: Base custom CSS properties defining the HSL color palette (Light and Dark themes), radii, transitions, blur parameters, and shadows.
*   `responsive.css`: Consolidates media query breakpoints, separating desktop, tablet, and mobile layouts.
*   `style.css`: Base typography hierarchy, visual blobs, and global animation rules.
*   `components/`:
    *   `navbar.css`: Styles the left sidebar, user profile card, section dividers, and header wrappers.
    *   `buttons.css`: Button sizes, loading spinners, and hover/active transitions.
    *   `cards.css` & `tables.css`: Cards paddings and column widths.
    *   `toast.css` & `loader.css`: Overlay elements and notifications.
*   `pages/`: View-specific styling overrides (e.g. `dashboard.css`, `history.css`, `report.css`).

### `client/assets/js/`
*   `api.js`: REST client request handler. Attaches the `jwt_token` authorization header to outgoing requests.
*   `auth.js`: Implements login session caching and route guards (`checkAuthAndProtect`).
*   `ui.js`: Script bundle importing theme configuration and navbar renderers.
*   `components/`:
    *   `navbar.js`: Dynamically renders the sidebar and top navbar, setting active links, resolved titles, and bind toggles.
    *   `theme.js`: Instant theme switching engine, storing user preference to `localStorage`.
    *   `toast.js`: Dynamic notification banners.
*   `pages/`: Handles fetch requests and DOM renders for specific pages (e.g., loading charts in `dashboard.js`, mapping recommendation items in `report.js`).

---

## ⚙️ Server Layer (`server/`)

Handles REST APIs, crawler services, audit algorithms, and PDF compiling.

*   `server.js`: Platform entry point. Connects to MongoDB, handles environment variables, and launches the Express server listener.
*   `app.js`: Configures express app instances, mounting security headers (`helmet`), CORS definitions, route configurations, and centralized error logging middleware.

### `server/config/`
*   `db.js`: Mongoose ODM database connection setup.

### `server/routes/`
Express router configurations mapping API routes to controller actions:
*   `authRoutes.js`: User registration, logins, and profile endpoints.
*   `analyzeRoutes.js`: Scans triggers, user logs, and record deletion routes.
*   `reportRoutes.js`: Raw report details and PDF exports.

### `server/controllers/`
Implements HTTP route controllers:
*   `authController.js`: Registration, login validation, profile reads, and updates.
*   `analyzeController.js`: Orchestrates the scraper pipeline, handles history pages, and deletes records.
*   `reportController.js`: Delivers audit reports and exports PDF binary streams.

### `server/models/`
Mongoose schema declarations validating database models:
*   `User.js`: User profiles, email validator, and pre-save password salting.
*   `Analysis.js`: Tracks audits, started/completed times, and states.
*   `Report.js`: Stores metrics scores, recommendations, and parsed DOM tags.

### `server/services/`
Core scoring and crawling algorithms:
*   `crawlerService.js`: Fetches target URLs using `axios`.
*   `auditService.js`: Parses page structures via cheerio DOM traversal to audit metadata, headings, SSL protocols, images, and links.
*   `scoringService.js`: Calculates category scores and maps failures to remediation recommendations.

### `server/middleware/`
Express middlewares:
*   `authMiddleware.js`: Validates JWT session tokens and attaches the verified user model to incoming request context.
*   `errorMiddleware.js`: Intercepts route failures to return standardized JSON error messages.

### `server/utils/`
*   `errors.js`: Standardizes server errors (`AppError`).
*   `pdfTemplate.js`: Print-ready HTML markup skeleton parsed by Puppeteer to render PDFs.
