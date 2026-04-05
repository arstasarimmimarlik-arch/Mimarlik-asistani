/* ========================================
   PWA - Service Worker & Install Prompt
   ======================================== */

import { t } from './i18n.js';
import { showToast } from './toast.js';

let deferredPrompt = null;

export function initPWA() {
  // SW ve cache temizliği — production'da SW register edilecek
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }

  // Install prompt yakalama
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  // iOS kontrolü
  const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone === true;

  if (isIos && !isInStandaloneMode) {
    const shown = sessionStorage.getItem('ios_install_shown');
    if (!shown) {
      setTimeout(() => {
        showToast(t('installIos'), 'info');
        sessionStorage.setItem('ios_install_shown', 'true');
      }, 5000);
    }
  }
}

function showInstallButton() {
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'flex';
  }
}

export async function promptInstall() {
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;

  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }

  return result.outcome === 'accepted';
}

export function canInstall() {
  return deferredPrompt !== null;
}
