/* ========================================
   Tema Yönetimi (Dark/Light)
   ======================================== */

import { getTheme, setTheme, applyTheme } from './settings.js';

// Tema değişikliğini dinle
export function initTheme() {
  applyTheme();

  // Sistem teması değişirse otomatik güncelle (auto modundaysa)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const saved = localStorage.getItem('app_theme');
    if (!saved || saved === 'auto') {
      applyTheme();
    }
  });
}

// Toggle dark mode
export function toggleDarkMode() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
  return getTheme();
}

export function isDarkMode() {
  return getTheme() === 'dark';
}
