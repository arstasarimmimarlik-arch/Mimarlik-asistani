/* ========================================
   Claude API Çağrıları (Streaming dahil)
   ======================================== */

import { getSettings } from './settings.js';
import { getModePrompt } from './modes.js';
import { fetchWithRetry, classifyError } from './network.js';
import { searchSources } from './supabase.js';

let currentController = null;

export function isGenerating() {
  return currentController !== null;
}

// Yanıt üretimini durdur
export function stopGeneration() {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
}

// Streaming mesaj gönder
export async function sendStreamingMessage(text, mode, history, { onStart, onChunk, onSource, onDone, onError }) {
  const s = getSettings();
  if (!s.apiKey) {
    onError({ type: 'auth', message: 'API key ayarlanmamış' });
    return;
  }

  // Kaynak ara
  let sourceLabel = null;
  let systemPrompt = getModePrompt(mode);

  const sourceResult = await searchSources(text);
  if (sourceResult) {
    systemPrompt += `\n\nAşağıdaki kaynak bilgisini kullanarak yanıt ver:\n\n${sourceResult.formatted}`;
    sourceLabel = 'Neufert & Kaynaklar';
    if (onSource) onSource(sourceLabel, sourceResult.results);
  }

  // Mesaj geçmişi
  const messages = [...history, { role: 'user', content: text }];

  // AbortController
  currentController = new AbortController();

  onStart();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': s.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: messages
      }),
      signal: currentController.signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const classified = classifyError(response.status, errData.error || {});
      onError(classified);
      currentController = null;
      return null;
    }

    // Streaming okuma
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE event'larını parse et
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Son tamamlanmamış satırı buffer'da tut

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'content_block_delta' && event.delta?.text) {
              fullText += event.delta.text;
              onChunk(event.delta.text, fullText);
            }

            if (event.type === 'message_stop') {
              break;
            }

            // Hata event'ı
            if (event.type === 'error') {
              onError({ type: 'server', message: event.error?.message || 'Streaming hatası' });
              currentController = null;
              return null;
            }
          } catch {
            // JSON parse hatası, devam et
          }
        }
      }
    }

    currentController = null;
    onDone(fullText, sourceLabel);
    return fullText;

  } catch (err) {
    currentController = null;

    if (err.name === 'AbortError') {
      // Kullanıcı tarafından durduruldu
      onDone(null, sourceLabel, true);
      return null;
    }

    const classified = classifyError(null, err);

    // Retryable ise tekrar dene (streaming olmadan)
    if (classified.retryable) {
      try {
        return await sendNonStreamingWithRetry(systemPrompt, messages, s.apiKey, { onStart, onChunk, onSource, onDone, onError });
      } catch (retryErr) {
        onError(classifyError(null, retryErr));
        return null;
      }
    }

    onError(classified);
    return null;
  }
}

// Streaming başarısız olursa retry ile non-streaming
async function sendNonStreamingWithRetry(systemPrompt, messages, apiKey, { onChunk, onDone, onError }) {
  const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    })
  }, 3, 30000);

  const data = await response.json();

  if (data.error) {
    onError({ type: 'server', message: data.error.message });
    return null;
  }

  const text = data.content[0].text;
  onChunk(text, text);
  onDone(text, null);
  return text;
}
