/* ========================================
   Ayarlar Yönetimi
   ======================================== */

import { t, setLanguage, getLanguage } from './i18n.js';
import { validateApiKey, validateSupabaseUrl, maskApiKey } from './sanitize.js';
import { showToast } from './toast.js';

const KEYS = {
  apiKey: 'archiAIKey',
  sbUrl: 'sb_url',
  sbKey: 'sb_anon_key',
  theme: 'app_theme',
  fontSize: 'app_fontsize',
  lang: 'app_lang',
  onboarded: 'app_onboarded',
  stats: 'app_stats',
};

// Ayarları oku
export function getSettings() {
  return {
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
    sbUrl: localStorage.getItem(KEYS.sbUrl) || '',
    sbKey: localStorage.getItem(KEYS.sbKey) || '',
    theme: localStorage.getItem(KEYS.theme) || 'auto',
    fontSize: localStorage.getItem(KEYS.fontSize) || 'normal',
    lang: getLanguage(),
    onboarded: localStorage.getItem(KEYS.onboarded) === 'true',
  };
}

// API Key kaydet
export function saveApiKey(key) {
  if (key) {
    localStorage.setItem(KEYS.apiKey, key);
  }
}

// API Key sil
export function deleteApiKey() {
  localStorage.removeItem(KEYS.apiKey);
}

// Supabase ayarlarını kaydet
export function saveSupabaseSettings(url, key) {
  if (url) localStorage.setItem(KEYS.sbUrl, url);
  else localStorage.removeItem(KEYS.sbUrl);
  if (key) localStorage.setItem(KEYS.sbKey, key);
  else localStorage.removeItem(KEYS.sbKey);
}

// Tema yönetimi
export function getTheme() {
  const saved = localStorage.getItem(KEYS.theme);
  if (saved === 'dark' || saved === 'light') return saved;
  // Auto: sistem temasını algıla
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(theme) {
  localStorage.setItem(KEYS.theme, theme);
  applyTheme();
}

export function applyTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  // Meta theme-color güncelle
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content = theme === 'dark' ? '#1A1A1A' : '#0F6E56';
  }
}

// Font boyutu
export function setFontSize(size) {
  localStorage.setItem(KEYS.fontSize, size);
  applyFontSize();
}

export function applyFontSize() {
  const size = localStorage.getItem(KEYS.fontSize) || 'normal';
  document.documentElement.setAttribute('data-fontsize', size);
}

// Dil
export function setLang(lang) {
  setLanguage(lang);
}

// Onboarding
export function isOnboarded() {
  return localStorage.getItem(KEYS.onboarded) === 'true';
}

export function setOnboarded() {
  localStorage.setItem(KEYS.onboarded, 'true');
}

// İstatistikler
export function getStats() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.stats)) || {
      totalMessages: 0,
      modeUsage: {},
    };
  } catch {
    return { totalMessages: 0, modeUsage: {} };
  }
}

export function trackMessage(mode) {
  const stats = getStats();
  stats.totalMessages++;
  stats.modeUsage[mode] = (stats.modeUsage[mode] || 0) + 1;
  localStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export function getMostUsedMode() {
  const stats = getStats();
  const usage = stats.modeUsage;
  let maxMode = 'genel';
  let maxCount = 0;
  for (const [mode, count] of Object.entries(usage)) {
    if (count > maxCount) {
      maxCount = count;
      maxMode = mode;
    }
  }
  return maxMode;
}

// Tüm verileri sil
export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

// Ayarlar panelini aç/kapat
export function openSettingsPanel() {
  const s = getSettings();
  const panel = document.getElementById('settings-panel');

  // API Key
  const apiInput = document.getElementById('api-key-input');
  apiInput.value = s.apiKey;

  // Supabase
  document.getElementById('sb-url-input').value = s.sbUrl;
  document.getElementById('sb-key-input').value = s.sbKey;

  // Dark mode toggle
  const darkToggle = document.getElementById('dark-mode-toggle');
  if (darkToggle) {
    darkToggle.checked = getTheme() === 'dark';
  }

  // Font size
  document.querySelectorAll('.fontsize-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === s.fontSize);
  });

  // Dil
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === s.lang);
  });

  panel.classList.add('open');
}

export function closeSettingsPanel() {
  document.getElementById('settings-panel').classList.remove('open');
}

// Ayarları form'dan kaydet
export function saveSettingsFromForm() {
  const apiKey = document.getElementById('api-key-input').value.trim();
  const sbUrl = document.getElementById('sb-url-input').value.trim();
  const sbKey = document.getElementById('sb-key-input').value.trim();

  // Validasyon
  if (!apiKey) {
    showToast(t('apiKeyRequired'), 'error');
    document.getElementById('api-key-input').classList.add('error');
    return false;
  }

  if (!validateApiKey(apiKey)) {
    showToast(t('apiKeyInvalid'), 'error');
    document.getElementById('api-key-input').classList.add('error');
    return false;
  }

  if (sbUrl && !validateSupabaseUrl(sbUrl)) {
    showToast('Geçersiz Supabase URL formatı', 'error');
    document.getElementById('sb-url-input').classList.add('error');
    return false;
  }

  document.querySelectorAll('.setting-input').forEach(i => i.classList.remove('error'));

  saveApiKey(apiKey);
  saveSupabaseSettings(sbUrl, sbKey);
  closeSettingsPanel();
  showToast(t('settingsSaved'), 'success');
  return true;
}
