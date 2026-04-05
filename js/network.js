/* ========================================
   Ağ Yönetimi, Retry & Timeout
   ======================================== */

import { t } from './i18n.js';

// Ağ durumu
let isOnline = navigator.onLine;
let onStatusChange = null;

export function initNetwork(callback) {
  onStatusChange = callback;

  window.addEventListener('online', () => {
    isOnline = true;
    if (onStatusChange) onStatusChange(true);
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    if (onStatusChange) onStatusChange(false);
  });
}

export function getOnlineStatus() {
  return isOnline;
}

// API hata sınıflandırma
export function classifyError(status, error) {
  if (!isOnline) return { type: 'network', message: t('networkError'), retryable: true };
  if (status === 401) return { type: 'auth', message: t('apiKeyInvalid'), retryable: false };
  if (status === 429) return { type: 'rateLimit', message: t('rateLimitError'), retryable: true };
  if (status >= 500) return { type: 'server', message: t('serverError'), retryable: true };
  if (error?.name === 'AbortError') return { type: 'timeout', message: t('timeoutError'), retryable: true };
  return { type: 'unknown', message: error?.message || t('unknownError'), retryable: false };
}

// Exponential backoff ile retry
export async function fetchWithRetry(url, options, maxRetries = 3, timeoutMs = 30000) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      // AbortController ile timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Eğer dışarıdan signal verilmişse, onu da dinle
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status < 500) {
        return response;
      }

      // 5xx hata - retry
      lastError = { status: response.status };
      if (attempt === maxRetries) return response;

    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError' && options.signal?.aborted) {
        // Kullanıcı tarafından iptal edildi, retry yapma
        throw err;
      }
      if (attempt === maxRetries) throw err;
    }
  }

  throw lastError;
}

// Debounce
export function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Throttle
export function throttle(fn, ms) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      return fn.apply(this, args);
    }
  };
}
