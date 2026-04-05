/* ========================================
   Supabase Bağlantısı & Kaynak Arama
   ======================================== */

import { getSettings } from './settings.js';

let connectionStatus = 'disconnected'; // 'connected' | 'disconnected' | 'checking'
let onConnectionChange = null;

export function onSupabaseStatusChange(callback) {
  onConnectionChange = callback;
}

export function getConnectionStatus() {
  return connectionStatus;
}

function setStatus(status) {
  connectionStatus = status;
  if (onConnectionChange) onConnectionChange(status);
}

// Bağlantı kontrolü
export async function checkConnection() {
  const s = getSettings();
  if (!s.sbUrl || !s.sbKey) {
    setStatus('disconnected');
    return false;
  }

  setStatus('checking');
  try {
    const res = await fetch(`${s.sbUrl}/rest/v1/kitap_parcalari?select=kitap&limit=1`, {
      headers: {
        'apikey': s.sbKey,
        'Authorization': `Bearer ${s.sbKey}`
      }
    });
    if (res.ok) {
      setStatus('connected');
      return true;
    }
    setStatus('disconnected');
    return false;
  } catch {
    setStatus('disconnected');
    return false;
  }
}

// Türkçe stop words (arama dışı bırakılacak kelimeler)
const STOP_WORDS = new Set([
  've', 'veya', 'ile', 'bir', 'bu', 'şu', 'o', 'de', 'da', 'den', 'dan',
  'mi', 'mı', 'mu', 'mü', 'ne', 'nasıl', 'nedir', 'neden', 'kaç',
  'için', 'gibi', 'daha', 'en', 'çok', 'az', 'var', 'yok', 'olan',
  'olarak', 'üzerinde', 'arasında', 'sonra', 'önce', 'hakkında',
  'olmalı', 'yapılır', 'edilir', 'kullanılır', 'nelerdir'
]);

// Sorgudan anahtar kelimeleri çıkar
function extractKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Full-text search ile kaynak arama
export async function searchSources(query) {
  const s = getSettings();
  if (!s.sbUrl || !s.sbKey) return null;

  const keywords = extractKeywords(query);
  if (keywords.length === 0) return null;

  try {
    // Strateji 1: ilike ile anahtar kelime araması
    const orConditions = keywords.map(kw =>
      `icerik.ilike.*${kw}*,bolum.ilike.*${kw}*`
    ).join(',');

    const res = await fetch(
      `${s.sbUrl}/rest/v1/kitap_parcalari?select=kitap,bolum,icerik&or=(${orConditions})&limit=8`,
      {
        headers: {
          'apikey': s.sbKey,
          'Authorization': `Bearer ${s.sbKey}`
        }
      }
    );

    if (!res.ok) {
      // Fallback: basit limit sorgusu
      return await fallbackSearch(s, keywords);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return await fallbackSearch(s, keywords);
    }

    // Sonuçları relevance skoruna göre sırala
    const scored = data.map(item => {
      let score = 0;
      const contentLower = item.icerik.toLowerCase();
      const sectionLower = item.bolum.toLowerCase();

      for (const kw of keywords) {
        // Bölüm başlığında eşleşme daha değerli
        if (sectionLower.includes(kw)) score += 3;
        // İçerikte eşleşme sayısı
        const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = (contentLower.match(new RegExp(escapedKw, 'g')) || []).length;
        score += matches;
      }

      return { ...item, score };
    });

    // Skora göre sırala, en iyi 5'i al
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5);

    if (top.length === 0 || top[0].score === 0) return null;

    return {
      results: top.map(k => ({
        book: k.kitap,
        section: k.bolum,
        content: k.icerik,
        score: k.score
      })),
      formatted: top.map(k => `[${k.kitap} - ${k.bolum}]\n${k.icerik}`).join('\n\n')
    };

  } catch (e) {
    console.warn('Supabase arama hatası:', e);
    return null;
  }
}

// Fallback: basit arama
async function fallbackSearch(s, keywords) {
  try {
    const res = await fetch(
      `${s.sbUrl}/rest/v1/kitap_parcalari?select=kitap,bolum,icerik&limit=10`,
      {
        headers: {
          'apikey': s.sbKey,
          'Authorization': `Bearer ${s.sbKey}`
        }
      }
    );

    const data = await res.json();
    if (!data || data.length === 0) return null;

    // İstemci tarafında filtreleme
    const matches = data.filter(k => {
      const text = (k.bolum + ' ' + k.icerik).toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });

    const results = (matches.length > 0 ? matches : data).slice(0, 5);

    return {
      results: results.map(k => ({
        book: k.kitap,
        section: k.bolum,
        content: k.icerik,
        score: 1
      })),
      formatted: results.map(k => `[${k.kitap} - ${k.bolum}]\n${k.icerik}`).join('\n\n')
    };
  } catch {
    return null;
  }
}
