# Amboras Analytics Frontend Implementation Notes

This file is a simple record of what was built in this conversation, how it was built, and why the decisions were taken.

## What was built

### 1. Login flow

- Created a proper `/login` page for the analytics app.
- Added email and password form handling.
- Login request goes to the API and stores the JWT as an `HttpOnly` cookie.
- After success, the user is redirected to `/dashboard`.
- Failed login shows a clear error message.

### 2. Dashboard page

- Created a protected `/dashboard` page.
- If the auth cookie is missing, the user is redirected back to `/login`.
- The dashboard shows:
  - overview metric cards
  - top products table
  - recent activity feed

### 3. Realtime style updates

- Added SWR polling so the dashboard keeps refreshing in the background.
- The top products and recent activity sections update automatically.
- Relative timestamps like `2 mins ago` keep changing without the user clicking refresh.
- Added a `Go live` button so if the user is on custom filters, they can quickly return to the live rolling view.

### 4. Store and owner name on top

- Added a secured backend endpoint to return the current store and owner details.
- The dashboard header now shows:
  - store name
  - owner name
- This makes the top bar feel more personal and useful.

### 5. Gain flash animation

- When a metric value increases, the card briefly flashes green.
- A small upward arrow appears for a second and fades away smoothly.
- This was added to give a stock-market style live feeling, without making the UI noisy.

### 6. Atomic design structure

- Restructured the analytics frontend into atomic design layers.
- The app now uses:
  - atoms for base UI primitives
  - molecules for smaller composed pieces like login form and filters
  - organisms for bigger dashboard blocks like header, overview grid, table, and activity feed
  - templates for the full page composition

## Backend changes

### Auth backend

- Login now sets an `HttpOnly` cookie.
- Logout clears the cookie.
- Added a secured `/auth/me` endpoint so the frontend can show store and owner details.
- JWT strategy now reads the token from cookie as well as Bearer header.
- CORS was enabled with credentials so the frontend can talk to the API properly.

### Analytics backend

- The top products endpoint was improved so it does not depend only on cache.
- If cache data is missing, it falls back to live event aggregation from the events table.
- Recent activity also supports filter-based fetching.

### Simulator fix

- The simulator was failing because it was pointed to the wrong API port.
- It was updated to send events to port `3001`.
- Batch failure logs were also improved so future issues are easier to understand.

## Why these decisions were made

### Why `HttpOnly` cookie auth

- It is more secure than storing JWT in local storage.
- The browser sends the cookie automatically, which keeps the login flow simple for the frontend.
- It reduces the chance of token leakage from client-side JavaScript.

### Why background polling with SWR

- The dashboard is supposed to feel live.
- SWR gives a simple and reliable way to refresh data in the background.
- It also keeps the loading and error handling clean.

### Why the `Go live` button exists

- Users may switch to custom date filters while exploring data.
- A single action to come back to the live rolling view makes the dashboard easier to use.
- It avoids confusion when someone forgets which filter is active.

### Why the gain flash effect was added

- It gives immediate feedback when revenue or activity goes up.
- The UI feels more like a live trading or marketing dashboard.
- The effect is short and gentle, so it does not distract from the data.

### Why atomic design was used

- The dashboard is no longer a single large component.
- Atomic design makes the app easier to read, maintain, and extend.
- Each part now has a clear job, which helps future work like new widgets, new cards, or a different dashboard layout.

### Why the store and owner details matter

- The dashboard should not feel anonymous.
- Showing the store name and owner name makes the UI more trustworthy and context-aware.
- It helps the user immediately understand which account they are looking at.

## Why this file is useful

- It acts like a small handover note for future changes.
- It explains the structure without needing to open every file.
- It gives future developers a quick understanding of the dashboard logic, backend auth flow, and realtime update approach.
- It is helpful when the codebase grows and someone wants to know why a certain logic was implemented.

## Short summary

In simple words, the work done here was to turn the analytics app into a proper production-style dashboard with secure cookie auth, live data refresh, filter support, store identity display, and a cleaner atomic design structure. The logic was added so the app feels more realtime, more reliable, and easier to maintain in the long run.
