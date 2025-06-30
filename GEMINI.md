# Project Context for Gemini CLI

This document summarizes the key aspects of the `timer-app` project for the Gemini CLI, allowing for seamless continuation of work across sessions.

## Project Structure
The `timer-app` is a monorepo with two main components:
- **`client/`**: A Next.js application (originally Create React App) for the user interface, built with Material-UI (MUI).
- **`server/`**: A Node.js/Express application that handles timer data via WebSockets.

## Application Details
- The server runs on `http://localhost:3001`.
- The client runs on `http://localhost:3000`.
- The server is a background process and not directly accessible via a browser.

## Key Changes and Refactorings
1.  **Monorepo Conversion**: The project was converted from two separate Git repositories (client and server) into a single monorepo.
    -   Old `.git` directories in `client` and `server` were removed.
    -   A new Git repository was initialized in the project root (`timer-app`).
    -   All project files were committed to the new monorepo.
    -   The entire project was pushed to `https://github.com/nikalomoiris/timer-app.git`.
2.  **Client Migration to Next.js**: The `client` application was migrated from Create React App to Next.js.
    -   A new Next.js app (`client-next`) was created.
    -   Existing components (`AdminView.js`, `UserView.js`) were migrated.
    -   Next.js pages (`/` for AdminView, `/user` for UserView) were configured.
    -   Conflicting default Next.js files were removed, and `layout.js` and `globals.css` were simplified.
    -   `client-next` was renamed to `client`.
3.  **Material-UI Integration**: The client UI was modernized using Material-UI.
    -   MUI dependencies (`@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`) were installed.
    -   `AdminView.js` and `UserView.js` were refactored to use MUI components.
    -   A `ThemeRegistry.js` was implemented for a dark MUI theme and integrated into `layout.js`.

## Current Status
All changes, including the monorepo setup, Next.js migration, and Material-UI integration, have been committed and pushed to the GitHub repository. The root `README.md` has been updated to reflect these changes and provide updated instructions.
