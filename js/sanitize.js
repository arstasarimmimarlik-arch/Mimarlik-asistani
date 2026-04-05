/* ========================================
   XSS Koruması & HTML Sanitize
   ======================================== */

// Tehlikeli karakterleri escape et
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Whitelist tabanlı HTML sanitizer
// Sadece izin verilen tag'leri ve attribute'ları geçirir
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'span', 'div', 'sup', 'sub'
]);

const ALLOWED_ATTRS = {
  'a': ['href', 'title', 'target', 'rel'],
  'td': ['align'],
  'th': ['align'],
  'code': ['class'],
  'pre': ['class'],
  'span': ['class'],
  'div': ['class']
};

// Tehlikeli URL şemalarını kontrol et
function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:')) return false;
  if (trimmed.startsWith('vbscript:')) return false;
  if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) return false;
  return true;
}

export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = sanitizeNode(doc.body);
  return clean.innerHTML;
}

function sanitizeNode(node) {
  const fragment = document.createDocumentFragment();

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.appendChild(document.createTextNode(child.textContent));
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const tagName = child.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      // Tag izinli değilse, içeriğini düz metin olarak ekle
      const inner = sanitizeNode(child);
      fragment.appendChild(inner);
      continue;
    }

    const el = document.createElement(tagName);

    // Sadece izin verilen attribute'ları kopyala
    const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
    for (const attr of allowedAttrs) {
      if (child.hasAttribute(attr)) {
        let value = child.getAttribute(attr);

        // URL attribute'larını kontrol et
        if (attr === 'href') {
          if (!isSafeUrl(value)) continue;
          el.setAttribute('rel', 'noopener noreferrer');
          el.setAttribute('target', '_blank');
        }

        el.setAttribute(attr, value);
      }
    }

    // Alt düğümleri recursive olarak temizle
    const cleanChildren = sanitizeNode(child);
    el.appendChild(cleanChildren);
    fragment.appendChild(el);
  }

  return fragment;
}

// Mesaj metnini güvenli şekilde DOM'a ekle
export function createSafeTextNode(text) {
  return document.createTextNode(text);
}

// Input validasyonu
export function validateInput(text, maxLength = 5000) {
  if (!text || typeof text !== 'string') return { valid: false, error: 'empty' };
  const trimmed = text.trim();
  if (trimmed.length === 0) return { valid: false, error: 'empty' };
  if (trimmed.length > maxLength) return { valid: false, error: 'tooLong', length: trimmed.length };
  return { valid: true, text: trimmed };
}

// API Key format doğrulama
export function validateApiKey(key) {
  if (!key) return false;
  // sk-ant- (eski format) veya sk- (yeni format) kabul et
  return key.startsWith('sk-');
}

// Supabase URL format doğrulama
export function validateSupabaseUrl(url) {
  if (!url) return true; // opsiyonel alan
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase');
  } catch {
    return false;
  }
}

// API key maskeleme
export function maskApiKey(key) {
  if (!key || key.length < 12) return '***';
  return key.substring(0, 10) + '***' + key.substring(key.length - 4);
}
