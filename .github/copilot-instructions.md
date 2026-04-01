# Copilot Instructions — Album Viewer

## Project Overview

Album Viewer is a React SPA that browses images/videos from Azure Blob Storage. No backend — it calls Azure Blob Storage REST APIs directly using SAS tokens.

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 8**
- **React Router DOM 7** for client-side routing
- **Azure Blob Storage REST API** (no SDK — raw fetch with XML parsing)
- No CSS framework — plain CSS in `src/index.css`

## Architecture

- `src/context/ConfigContext.tsx` — Provides Azure credentials (account name, container, SAS token) via React Context
- `src/services/blobService.ts` — All Azure Blob Storage API calls (list blobs, get thumbnails, pagination)
- `src/pages/AlbumList.tsx` — Main page: lists albums (virtual directories) and media items
- `src/components/MediaViewer.tsx` — Lightbox for full-screen image/video viewing
- `src/components/Navbar.tsx` — Top navbar with theme toggle
- `src/pages/Unauthorized.tsx` — Shown when no SAS token is available

## Key Conventions

- Use functional components with hooks (no class components)
- Use TypeScript strict mode — all types defined in `src/types/index.ts`
- State management via React Context API (no Redux or external state libraries)
- Environment variables prefixed with `VITE_` (Vite convention)
- Dev server runs on port 3000 with a CORS proxy at `/azure-blob` targeting Azure Blob Storage

## Authentication

SAS tokens are resolved in order: URL `?t=` param (base64-encoded) → sessionStorage → `VITE_AZURE_SAS_TOKEN` env var. Never log or expose SAS tokens in UI or console output.

## File Naming

- Components: PascalCase (e.g., `MediaViewer.tsx`)
- Services: camelCase (e.g., `blobService.ts`)
- Types: `src/types/index.ts` (barrel export)

## When Generating Code

- Prefer `fetch` over Axios or other HTTP libraries
- Parse Azure Blob Storage XML responses with `DOMParser`
- Use React Router's `useSearchParams` for query-based navigation
- Use `IntersectionObserver` for infinite scroll / lazy loading
- Support both image and video media types
