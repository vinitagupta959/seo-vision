# SEO Vision - Responsive Layout Design Specifications

This document outlines the layout breakpoints, typography scales, sidebar drawer animations, and grid behaviors across desktop, tablet, and mobile viewports.

---

## 📐 Breakpoint Reference Grid

The platform uses three layout states:

| State | Viewport Range | Sidebar Type | Grid Structure | Top Navbar Content |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | `>= 1025px` | Permanent (260px) | 2 Columns first row, 3 Stats cards | Brand Logo + `/ Page Title` |
| **Tablet** | `700px - 1024px` | Permanent (230px) | 1 Column first row (stacked), 2 Stats cards | Brand Logo + `/ Page Title` |
| **Mobile** | `< 700px` | Slide-in Drawer | 1 Column everything stacked | `☰ SEO Vision` |

---

## 🖥 1. Desktop Layout State (`>= 1025px`)

### 1.1 Layout Grid
*   **Wider content wrapping**: Content wrapper matches `1600px` maximum width.
*   **Sidebar**: Left sidebar is fixed to `260px` width. The main content wrapper has a left margin of `260px` and width of `calc(100% - 260px)`.
*   **Auditing Panels**: First row lays out the Audit Form and Category Canvas Chart side-by-side using a grid column ratio of `1.1fr 1fr` (`align-items: stretch` ensures equal height).
*   **Statistics cards**: Laid out in a 3-column row (`1fr 1fr 1fr`).
*   **Recent Audits**: Rendered as a desktop table. Column widths are fixed to: URL: 35%, Score: 15%, Status: 15%, Date: 15%, Actions: 20%.

---

## ⚗ 2. Tablet Layout State (`700px - 1024px`)

### 2.1 Layout Grid
*   **Compact Sidebar**: To maximize space on smaller screens, the sidebar width is reduced to **`230px`** and remains visible. The main content wrapper has a left margin of `230px` and width of `calc(100% - 230px)`.
*   **First Row Stacking**: The Audit Form and Category Canvas Chart stack vertically (`grid-template-columns: 1fr !important`). This prevents chart labels and form inputs from compressing.
*   **Statistics Grid**: Arranged in a 2-column layout. The first card (Total Analyses) spans both columns (`grid-column: span 2 !important`), and the Average SEO and Performance Average cards sit side-by-side.
*   **Recent Audits Table**: Rendered in full width without column wrapping. The Action column is fixed to 20% to prevent "View Report" button wrapping, while the URL column is reduced to 35%.

---

## 📱 3. Mobile Layout State (`< 700px`)

### 3.1 Sidebar Drawer
*   The sidebar is hidden by default (`transform: translateX(-100%)`).
*   The top navbar contains only a hamburger menu button and the brand name: `☰ SEO Vision`.
*   Clicking the hamburger button slides the sidebar drawer in from the left (`transform: translateX(0)`).
*   An overlay backdrop (`.sidebar-overlay`) is displayed behind it.
*   The drawer closes when the user clicks the overlay, selects a link, or presses the Escape (ESC) key.

### 3.2 Spacing & Typography
*   Content padding is reduced to `0 8px` and card padding is set to `16px`.
*   Statistics cards stack vertically in a single column.
*   The Recent Audits table is hidden. Instead, audits are rendered as responsive cards displaying Website URL, Score Badge, Status Pill, Date, and a full-width View Report button.

---

## 🎨 Theme & Appearance Settings
*   **Instant Switcher**: Changes document attribute `data-theme` to trigger instant CSS updates without reloading the page.
*   **Theme Toggle Location**: Consolidated exclusively inside the sidebar under the `Appearance` section to avoid duplicate navigation items.
*   **No Flicks**: Core theme configurations are resolved early in page lifecycles to prevent white flashes on page loads.
