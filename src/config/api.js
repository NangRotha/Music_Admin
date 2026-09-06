// Environment API Configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://music-backend-7273.onrender.com').replace(/\/+$/, '');
export const PORTAL_NAME = import.meta.env.VITE_PORTAL_NAME || 'KhmerBeats Admin CMS';

/**
 * Resolves media and upload URLs.
 * On Vercel, /uploads/* is proxied to the Render backend via vercel.json rewrites.
 */
export function getMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return url.startsWith('/') ? url : `/${url}`;
}
