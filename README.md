# Album Viewer

A lightweight, modern gallery app for browsing images and videos stored in Azure Blob Storage. No backend server required — connects directly to Azure Blob Storage via SAS tokens.

## Features

- **Album browsing** — Navigate virtual folder structures as albums
- **Media gallery grid** — View images and videos in a responsive grid layout
- **Full-screen lightbox** — Keyboard navigation (← → Escape)
- **Breadcrumb navigation** — Easy path traversal through nested folders
- **Infinite scroll** — Lazy-loads media as you scroll (Intersection Observer)
- **Dark / light theme** — Toggle with persistent preference (localStorage)
- **No backend** — Direct Azure Blob Storage REST API access with SAS tokens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript |
| Routing | React Router DOM 7 |
| Build | Vite 8 |
| Cloud | Azure Blob Storage REST API |
| Auth | Shared Access Signature (SAS) tokens |

## Getting Started

### Prerequisites

- Node.js 18+
- An Azure Storage account with a blob container

### Setup

```bash
cd Album
npm install
```

Create a `.env` file in the `Album/` directory:

```env
VITE_AZURE_ACCOUNT_NAME=<your-storage-account>
VITE_AZURE_CONTAINER_NAME=<your-container>
VITE_AZURE_SAS_TOKEN=<your-sas-token>   # dev only
```

### Run

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Type-check + production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Authentication

SAS tokens are resolved in priority order:

1. **URL parameter** — `?t=<base64-encoded-token>` (decoded, stored in sessionStorage, then stripped from URL)
2. **sessionStorage** — `album-viewer-sas` key (persists across refreshes within a session)
3. **Environment variable** — `VITE_AZURE_SAS_TOKEN` (dev fallback)

If no token is found, the app shows an Unauthorized page.

## Project Structure

```
Album/
├── src/
│   ├── components/     # MediaViewer (lightbox), Navbar (theme toggle)
│   ├── context/        # ConfigContext (Azure credentials)
│   ├── pages/          # AlbumList (main), Unauthorized (fallback)
│   ├── services/       # blobService (Azure Blob Storage API)
│   ├── types/          # TypeScript interfaces
│   ├── App.tsx          # Router + providers
│   └── main.tsx         # Entry point
├── vite.config.ts      # Dev server, CORS proxy for Azure
└── package.json
```

## Supported Media

| Type | Extensions |
|------|-----------|
| Images | jpg, jpeg, png, gif, webp, bmp, svg |
| Videos | mp4, webm, ogg, mov, avi, mkv |
