# Changelog

All notable changes to this project.

## [v1.5.0] - 2026-05-14

### New Features
- **Admin:** Unified navigation by hiding the global navbar on admin routes and integrating public links into a dedicated admin sidebar.
- **Admin:** Workspace-focused layout that occupies the full screen height for a more professional experience.

### Bug Fixes
- **UI:** Fixed persistent sidebar overlap on desktop by migrating the Admin Panel layout to a robust CSS Grid system.
- **UI:** Resolved vertical overflow in the admin sidebar and standardized item spacing.
- **UI:** Improved `FormUsuario` layout with better button spacing and glass-morphism effects.
- **CI:** Fixed a TypeScript syntax error in `AdminPanel.tsx` that was breaking the GitHub Actions build.

---

## [v1.4.0] - 2026-05-14

### New Features
- **Admin:** Comprehensive redesign of the Admin Panel with a responsive sidebar navigation.
- **Admin:** Added a new Admin Dashboard showing system-wide statistics (User count, predictions, matches).
- **Backend:** Added `/api/admin/stats` endpoint for real-time tournament data.

### Improvements
- **UI:** Restricted match prediction inputs to integer values only.
- **UI:** Improved mobile responsiveness for the administrative interface.

## [v1.3.0] - 2026-05-13

### New Features
- **Backend:** Implemented generic knockout phase progression logic.
- **Backend:** Added support for tracking match winners (crucial for penalty shootouts).
- **Admin:** Enhanced Results entry with winner selection for knockout draws.
- **Admin:** Added dynamic "Close Phase" buttons to advance the entire tournament.
- **UI:** Brackets now highlight winning teams and accurately reflect advanced rivals.

## [v1.2.0] - 2026-05-13

### New Features
- **UI:** Added real-time standings simulator in Dashboard for group stage predictions.
- **UI:** Added visual tournament brackets in the Ranking page.
- **Admin:** Implemented "Close Group Stage" functionality to auto-generate round of 32 fixtures.
- **Assets:** Centralized static assets like the FIFA 2026 logo for reliable loading.

### Bug Fixes
- **UI:** Fixed broken image links in the Ranking page.

---

## [v1.1.0-vercel] - 2026-05-12
- Migration to Vercel serverless, Postgres, and Resend API.
