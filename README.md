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

This CMS dashboard is pre-configured with `vercel.json` to seamlessly proxy all `/api/*` and `/uploads/*` requests directly to your live Render backend:

1. Push your code to **GitHub**.
2. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** → **Project**.
3. Import your repository.
4. Set **Root Directory** to:
   ```
   frontend-admin
   ```
5. Add the Environment Variables:
   - `VITE_API_BASE_URL`: `/api`
   - `VITE_BACKEND_URL`: `https://music-backend-7273.onrender.com`
   - `VITE_PORTAL_NAME`: `KhmerBeats Admin CMS`
   - `VITE_UPLOADTHING_APP_ID`: `vudv42k77n`
6. Click **Deploy**!

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server on port 5174 |
| `npm run build` | Compiles optimized production bundle into `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs Oxlint linter check |
