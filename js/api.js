/* ========================================
   Claude API — Streaming Mesaj Gönderimi
   ======================================== */

import { getSettings } from './settings.js';
import { getModePrompt } from './modes.js';
import { searchSources } from './supabase.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

let abortController = null;

export function isGenerating() {
  return abortController !== null;
}

export function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

// HTTP durum koduna göre hata mesajı döndür
function getErrorMessage(status, errorBody) {
  const serverMsg = errorBody?.error?.message || errorBody?.message || '';

  switch (status) {
    case 400: return serverMsg || 'Geçersiz istek formatı';
    case 401: return 'API key geçersiz. Lütfen kontrol edin.';
    case 403: return 'Erişim reddedildi. API key yetkisini kontrol edin.';
    case 429: return 'Çok fazla istek. Lütfen biraz bekleyin.';
    default:
      if (status >= 500) return 'Sunucu hatası. Lütfen tekrar deneyin.';
      return serverMsg || 'Beklenmeyen bir hata oluştu.';
  }
}

// Mesaj geçmişini API formatına temizle (sadece role + content)
function cleanHistory(messages) {
  return messages
    .filter(m => m.role && m.content)
    .map(m => ({ role: m.role, content: m.content }));
}

/**
 * Streaming mesaj gönder
 * @param {string} text - Kullanıcı mesajı
 * @param {string} mode - Aktif mod (genel, detay, vb.)
 * @param {Array} history - Önceki mesajlar
 * @param {Object} callbacks - { onStart, onChunk, onSource, onDone, onError }
 *
 * Callback tanımları:
 *   onStart()                         — İstek başladı
 *   onSource(label, results)          — Kaynak bulundu
 *   onChunk(chunkText, accumulatedText) — Yeni chunk geldi
 *   onDone(fullText, sourceLabel)     — Tamamlandı
 *   onError(errorMessage)             — Hata oluştu (string mesaj)
 */
export async function sendStreamingMessage(text, mode, history, callbacks) {
  const { onStart, onChunk, onSource, onDone, onError } = callbacks;

  // API key kontrolü
  const settings = getSettings();
  if (!settings.apiKey) {
    onError('API key ayarlanmamış. Ayarlardan girin.');
    return;
  }

  // Dinamik kaynak kullanım algoritması
  let sourceLabel = null;
  let systemPrompt = getModePrompt(mode);

  // Yönetmelik modunda: sadece resmi kaynaklara referans ver, Supabase kaynaklarını kullanma
  // Diğer modlarda: Supabase varsa kaynak bilgisini ekle ama AI kendi bilgisiyle de zenginleştirsin
  const isRegulationMode = mode === 'yonetmelik';

  try {
    const sourceResult = await searchSources(text);
    if (sourceResult && sourceResult.results.length > 0) {
      if (isRegulationMode) {
        // Yönetmelik: kaynak varsa referans olarak ekle ama resmi yönetmelik öncelikli
        systemPrompt += `\n\n--- REFERANS BİLGİSİ ---\nAşağıda veritabanında bulunan ilgili bilgi var. Bu bilgiyi yalnızca resmi yönetmelik maddeleriyle doğrulayabiliyorsan kullan. Resmi yönetmelik madde numarası veremediğin bilgiyi paylaşma.\n\n${sourceResult.formatted}`;
        sourceLabel = 'Resmi Yönetmelikler';
      } else {
        // Diğer modlar: kaynağı kullan + AI uzmanlığıyla zenginleştir
        systemPrompt += `\n\n--- KAYNAK BİLGİSİ ---\nAşağıdaki güvenilir kaynaklarda ilgili bilgi bulundu. Bu bilgiyi yanıtına entegre et ve kendi uzmanlığınla zenginleştir. Kaynak bilgisi ile kendi bilgini birleştir. Kaynaktan bilgi kullandığında "[Kaynak: ...]" şeklinde referans ver. Emin olmadığın teknik bilgileri (ölçüler, standart numaraları, yönetmelik maddeleri) tahmin etme — bilmediğini belirt.\n\n${sourceResult.formatted}`;
        sourceLabel = 'Neufert & Kaynaklar';
      }
      if (onSource) onSource(sourceLabel, sourceResult.results);
    } else if (isRegulationMode) {
      sourceLabel = 'Resmi Yönetmelikler';
      if (onSource) onSource(sourceLabel, []);
    }
  } catch (e) {
    // Kaynak arama başarısız — AI kendi güvenilir bilgisiyle devam eder
    if (isRegulationMode) {
      sourceLabel = 'Resmi Yönetmelikler';
      if (onSource) onSource(sourceLabel, []);
    }
  }

  // Tüm modlara güvenilir kaynak kullanım talimatı ekle
  if (!isRegulationMode) {
    systemPrompt += `\n\nÖNEMLİ: Teknik bilgilerde (ölçüler, standartlar, yönetmelik maddeleri) yalnızca güvenilir kaynaklara dayan. Emin olmadığın rakamları veya madde numaralarını uydurma. Bilmediğini açıkça belirt ve kullanıcıyı ilgili resmi kaynağa yönlendir.`;
  }

  // Mesaj listesi hazırla
  const messages = [
    ...cleanHistory(history),
    { role: 'user', content: text }
  ];

  // AbortController oluştur (30s stream timeout)
  abortController = new AbortController();
  const streamTimeout = setTimeout(() => {
    if (abortController) abortController.abort();
  }, 30000);

  onStart();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages: messages
      }),
      signal: abortController.signal
    });

    // HTTP hata kontrolü
    if (!response.ok) {
      abortController = null;
      let errorBody = {};
      try { errorBody = await response.json(); } catch {}
      onError(getErrorMessage(response.status, errorBody));
      return;
    }

    // Streaming yanıtı oku
    clearTimeout(streamTimeout);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let chunkTimeout;
    const resetChunkTimeout = () => {
      clearTimeout(chunkTimeout);
      chunkTimeout = setTimeout(() => { if (abortController) abortController.abort(); }, 30000);
    };
    resetChunkTimeout();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetChunkTimeout();

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        let event;
        try { event = JSON.parse(data); } catch { continue; }

        if (event.type === 'content_block_delta' && event.delta?.text) {
          accumulated += event.delta.text;
          onChunk(event.delta.text, accumulated);
        }

        if (event.type === 'message_stop') {
          break;
        }

        if (event.type === 'error') {
          abortController = null;
          onError(event.error?.message || 'Streaming hatası');
          return;
        }
      }
    }

    // Başarılı tamamlama
    clearTimeout(chunkTimeout);
    abortController = null;
    onDone(accumulated, sourceLabel);

  } catch (err) {
    abortController = null;

    if (err.name === 'AbortError') {
      // Kullanıcı durdurdu
      onDone('', sourceLabel, true);
      return;
    }

    // Ağ hatası
    if (!navigator.onLine) {
      onError('İnternet bağlantısı yok. Bağlantınızı kontrol edin.');
    } else {
      onError(err.message || 'Bağlantı hatası. Lütfen tekrar deneyin.');
    }
  }
}
