/* ========================================
   PWA - Service Worker & Install Prompt
   ======================================== */

import { t } from './i18n.js';
import { showToast } from './app.js';

let deferredPrompt = null;

export function initPWA() {
  // Service Worker kayıt
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('SW registered:', reg.scope);

        // Güncelleme kontrolü
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              showToast('Yeni güncelleme yüklendi. Sayfayı yenileyin.', 'info');
            }
          });
        });
      })
      .catch(err => {
        console.warn('SW registration failed:', err);
      });
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
    // iOS'ta install prompt yok, kullanıcıya yönlendirme göster
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
  // Header'da install butonu göster (varsa)
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
