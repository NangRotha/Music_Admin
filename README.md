# ⚙️ KhmerBeats - Admin CMS Dashboard (ផ្ទាំងគ្រប់គ្រង Admin)

Dedicated administration portal and Content Management System (CMS) for **KhmerBeats**. Empowers store managers to manage music tracks, promo codes, categories, banner slides, announcements, order inquiries, and site configuration in real time.

---

## ✨ Features

- 📊 **Real-Time Overview**: Live metrics dashboard tracking total music catalog size, active promo codes, and customer Telegram order inquiries.
- 🎵 **Music Catalog Manager**: Full CRUD operations for audio tracks, including pricing, discounts, duration, audio previews, high-res album art, and featured status.
- 🏷️ **Category & Genre Manager**: Organize tracks by categories and genres with bilingual titles (English & Khmer), custom slugs, and active toggles.
- 🎟️ **Promo Codes Engine**: Generate custom coupon codes, set discount values (percent `%` or fixed `$`), expiration dates, minimum cart thresholds, and usage limits.
- 🖼️ **Hero Banner Slides**: Create interactive banner slides with custom badges, call-to-action links, and image/video media.
- 📢 **Alert & Announcement Manager**: Schedule and broadcast special promotional banners, holiday discounts, and urgent announcements with expiration dates.
- 📖 **About Us Story Editor**: Update the store's mission, story, quality guarantee cards, and showcase images.
- 📋 **Telegram Orders Log**: View customer checkout inquiries with reference IDs, selected songs, discounts applied, and contact info.
- ☁️ **UploadThing Cloud Storage**: Direct file uploading to UploadThing v7 UTApi CDN with instant preview and local backup support.
- 🔐 **Secure JWT Authentication**: Protected admin routes with Bearer token authentication, session auto-refresh, and credential management (change username/password).

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cloud Media**: [UploadThing Client](https://uploadthing.com/)
- **Deployment**: [Vercel](https://vercel.com/) (with `vercel.json` API proxy rewrites)
- **Backend API**: [FastAPI on Render](https://music-backend-7273.onrender.com)

---

## 📁 Project Structure

```
frontend-admin/
├── public/                 # Static admin assets & logos
├── src/
│   ├── components/         # Admin components
│   │   ├── DeleteConfirmModal.jsx
│   │   ├── Navbar.jsx          # Admin top bar with user profile & logout
│   │   ├── Sidebar.jsx         # Admin navigation drawer
│   │   └── Toast.jsx           # Action notification alerts
│   ├── config/
│   │   └── api.js              # Centralized API endpoints & media helpers
│   ├── context/
│   │   └── AuthContext.jsx     # Admin authentication & token persistence
│   ├── pages/              # CMS Management Views
│   │   ├── AboutManagement.jsx
│   │   ├── AlertManagement.jsx
│   │   ├── CategoryManagement.jsx
│   │   ├── DashboardOverview.jsx
│   │   ├── Login.jsx
│   │   ├── MusicManagement.jsx
│   │   ├── OrdersLog.jsx
│   │   ├── PromoManagement.jsx
│   │   ├── SiteSettings.jsx
│   │   └── SlideManagement.jsx
│   ├── App.jsx             # Admin route controller & layout wrapper
│   ├── index.css           # Tailwind CSS v4 styles
│   └── main.jsx            # React DOM entry point
├── .env.example            # Environment variables template
├── .env.production         # Production settings
├── package.json
├── vercel.json             # Vercel proxy & SPA rewrite configuration
└── vite.config.js          # Vite bundler configuration
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
```bash
# Navigate to the frontend-admin folder
cd frontend-admin

# Install dependencies
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

### 4. Default Admin Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
*(You can change your credentials anytime in **Site Settings**)*

> 💡 **Tip**: In local development, requests to `/api` and `/uploads` are automatically proxied to your local or remote backend via Vite proxy.

---

## ⚙️ Environment Variables

Create a `.env` file in `frontend-admin/` (or configure these in Vercel):

```env
# Backend API Base URL (default is /api when using Vercel rewrites)
VITE_API_BASE_URL=/api

# Live Backend Server URL
VITE_BACKEND_URL=https://music-backend-7273.onrender.com

# Admin Portal Title
VITE_PORTAL_NAME=KhmerBeats Admin CMS

# UploadThing Storage Configuration (Optional on frontend)
VITE_UPLOADTHING_APP_ID=vudv42k77n
```

---

## 🚢 Deploying to Vercel

This CMS dashboard ships with a `vercel.json` that installs/builds the app (`npm ci` → `npm run build` → `dist/`) and proxies all `/api/*` and `/uploads/*` requests to the live Render backend — so **no environment variables are required** (`.env.production` already holds the defaults).

1. Push your code to **GitHub** (this repository already contains the app at its root).
2. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** → **Project**.
3. Import the repository.
4. In **Configure Project**:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: leave it as the **repository root** (`./`) ⚠️ — this repo *is* the app, so do **not** type `frontend-admin` (Vercel fails with *“The specified Root Directory does not exist”* when that folder isn't present).
   - **Build Command / Output Directory**: already set in `vercel.json` (`npm run build` → `dist`), no need to change.
   - **Node.js Version**: 20.19+ (Vite 8 requirement) — enforced by `engines.node` in `package.json`.
5. (Optional) Environment Variables — only needed to override the defaults:
   - `VITE_API_BASE_URL`: `/api`
   - `VITE_BACKEND_URL`: `https://music-backend-7273.onrender.com`
   - `VITE_PORTAL_NAME`: `KhmerBeats Admin CMS`
   - `VITE_UPLOADTHING_APP_ID`: `vudv42k77n`
6. Click **Deploy**!

> ⚠️ **Don't pick the domain `music-admin.vercel.app` blindly** — that name is already taken by an unrelated project. Give your admin project its own unique name in Vercel.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server on port 5174 |
| `npm run build` | Compiles optimized production bundle into `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs Oxlint linter check |
