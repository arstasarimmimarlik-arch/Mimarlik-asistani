/* ========================================
   Sesli Giriş - Web Speech API
   ======================================== */

import { t, getLanguage } from './i18n.js';
import { showToast } from './app.js';

let recognition = null;
let isListening = false;
let onResultCallback = null;
let onStateChangeCallback = null;

export function isSpeechSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function initSpeech(onResult, onStateChange) {
  if (!isSpeechSupported()) return false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = getLanguage() === 'tr' ? 'tr-TR' : 'en-US';

  onResultCallback = onResult;
  onStateChangeCallback = onStateChange;

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }

    if (onResultCallback) {
      onResultCallback(transcript, isFinal);
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (onStateChangeCallback) onStateChangeCallback(false);
  };

  recognition.onerror = (event) => {
    isListening = false;
    if (onStateChangeCallback) onStateChangeCallback(false);

    if (event.error === 'no-speech') return;
    if (event.error === 'aborted') return;

    console.warn('Speech error:', event.error);
  };

  return true;
}

export function startListening() {
  if (!recognition) {
    showToast(t('speechNotSupported'), 'warning');
    return false;
  }

  // Dili güncelle
  recognition.lang = getLanguage() === 'tr' ? 'tr-TR' : 'en-US';

  try {
    recognition.start();
    isListening = true;
    if (onStateChangeCallback) onStateChangeCallback(true);
    return true;
  } catch (e) {
    console.warn('Speech start error:', e);
    return false;
  }
}

export function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    if (onStateChangeCallback) onStateChangeCallback(false);
  }
}

export function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
  return isListening;
}

export function getListeningState() {
  return isListening;
}
