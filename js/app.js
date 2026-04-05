/* ========================================
   Mimarlık AI Asistanı - Ana Uygulama
   ======================================== */

import { t, getLanguage, setLanguage } from './i18n.js';
import { validateInput } from './sanitize.js';
import { initNetwork, getOnlineStatus } from './network.js';
import { debounce } from './network.js';
import { MODES, getModeSuggestions, getModeIcon, getModeLabel, getAllModes } from './modes.js';
import {
  getSettings, openSettingsPanel, closeSettingsPanel, saveSettingsFromForm,
  applyTheme, applyFontSize, setTheme, setFontSize, setLang,
  isOnboarded, setOnboarded, trackMessage, getStats, getMostUsedMode,
  deleteApiKey, clearAllData, getTheme
} from './settings.js';
import {
  initChat, addUserMessage, addAiMessage, addTypingIndicator,
  removeTypingIndicator, clearMessages, addWelcomeMessage,
  addWelcomeCards, createStreamingBubble, updateStreamingContent,
  finalizeStreamingMessage, removeStreamingMessage, scrollToBottom,
  loadChatMessages
} from './chat.js';
import { sendStreamingMessage, stopGeneration, isGenerating } from './api.js';
import {
  initDB, createChat, saveChat, getChat, listChats, deleteChat,
  clearAllChats, searchChats, getChatCount, listFavorites,
  clearAllFavorites, formatDate
} from './history.js';
import { checkConnection, onSupabaseStatusChange, getConnectionStatus } from './supabase.js';
import { initTheme, toggleDarkMode } from './theme.js';
import { initSpeech, toggleListening, isSpeechSupported, getListeningState } from './speech.js';
import { downloadTxt, downloadPdf, copyToClipboard } from './export.js';
import { initPWA, promptInstall, canInstall } from './pwa.js';

// ========== DURUM ==========
let currentMode = 'genel';
let currentChat = null;
let isSending = false;

const APP_VERSION = '2.0.0';

// ========== TOAST ==========
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Kapat">✕</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== MOD YÖNETİMİ ==========
function renderModes() {
  const modeBar = document.getElementById('mode-bar');
  if (!modeBar) return;
  modeBar.innerHTML = '';

  for (const key of getAllModes()) {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (key === currentMode ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', key === currentMode ? 'true' : 'false');
    btn.innerHTML = `<span class="mode-icon">${getModeIcon(key)}</span> ${getModeLabel(key)}`;

    btn.addEventListener('click', () => handleModeChange(key));
    modeBar.appendChild(btn);
  }
}

async function handleModeChange(newMode) {
  if (newMode === currentMode) return;

  // Mevcut sohbette mesaj varsa onay sor
  if (currentChat && currentChat.messages.length > 0) {
    const confirmed = await showConfirmModal(
      'Mod Değişikliği',
      'Yeni mod seçilirse yeni bir sohbet başlayacak. Mevcut sohbet kaydedilecek. Devam etmek istiyor musunuz?'
    );
    if (!confirmed) return;

    // Mevcut sohbeti kaydet
    await saveChat(currentChat);
  }

  currentMode = newMode;

  // Yeni sohbet başlat
  currentChat = createChat(currentMode);

  clearMessages();
  addWelcomeMessage(getModeSuggestions(currentMode));
  addWelcomeCards();

  renderModes();
}

// ========== MESAJ GÖNDERME ==========
async function sendMessage() {
  if (isSending || isGenerating()) return;

  const input = document.getElementById('user-input');
  const text = input.value.trim();

  // Validasyon
  const validation = validateInput(text);
  if (!validation.valid) {
    if (validation.error === 'tooLong') {
      showToast(`Mesaj çok uzun (${validation.length}/5000)`, 'warning');
    }
    return;
  }

  // API key kontrolü
  const s = getSettings();
  if (!s.apiKey) {
    openSettingsPanel();
    showToast(t('apiKeyRequired'), 'warning');
    return;
  }

  // Online kontrolü
  if (!getOnlineStatus()) {
    showToast(t('networkError'), 'error');
    return;
  }

  isSending = true;
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('send-btn').disabled = true;
  updateCharCount('');

  // Sohbet yoksa oluştur
  if (!currentChat) {
    currentChat = createChat(currentMode);
  }

  // Kullanıcı mesajını ekle
  addUserMessage(validation.text);
  currentChat.messages.push({ role: 'user', content: validation.text });

  // İstatistik
  trackMessage(currentMode);

  // Durdur butonunu göster
  const stopBtn = document.getElementById('stop-btn');
  if (stopBtn) stopBtn.classList.add('visible');

  let streamBubble = null;
  let currentSource = null;

  await sendStreamingMessage(
    validation.text,
    currentMode,
    currentChat.messages.slice(0, -1), // Geçmiş (son mesaj hariç)
    {
      onStart: () => {
        addTypingIndicator();
      },
      onSource: (label, results) => {
        currentSource = label;
      },
      onChunk: (chunk, fullText) => {
        removeTypingIndicator();
        if (!streamBubble) {
          streamBubble = createStreamingBubble(currentSource);
        }
        updateStreamingContent(streamBubble.contentEl, fullText);
      },
      onDone: (fullText, sourceLabel, stopped) => {
        removeTypingIndicator();

        if (streamBubble) {
          // Streaming tamamlandı - aksiyonları ekle
          if (fullText) {
            finalizeStreamingMessage(streamBubble.wrapEl, fullText, {
              mode: currentMode,
              chatId: currentChat?.id
            });
            currentChat.messages.push({ role: 'assistant', content: fullText, source: sourceLabel });
          }
        } else if (fullText) {
          // Streaming olmadan geldi
          addAiMessage(fullText, sourceLabel, {
            mode: currentMode,
            chatId: currentChat?.id
          });
          currentChat.messages.push({ role: 'assistant', content: fullText, source: sourceLabel });
        }

        if (stopped) {
          showToast('Yanıt durduruldu', 'info');
        }

        // Geçmişi sınırla
        if (currentChat.messages.length > 40) {
          currentChat.messages = currentChat.messages.slice(-40);
        }

        // Kaydet
        saveChat(currentChat);

        isSending = false;
        document.getElementById('send-btn').disabled = false;
        if (stopBtn) stopBtn.classList.remove('visible');
        streamBubble = null;
      },
      onError: (err) => {
        removeTypingIndicator();
        removeStreamingMessage();
        addAiMessage(`❌ ${err.message}`, null);

        isSending = false;
        document.getElementById('send-btn').disabled = false;
        if (stopBtn) stopBtn.classList.remove('visible');
        streamBubble = null;
      }
    }
  );
}

// ========== INPUT YÖNETİMİ ==========
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}

function updateCharCount(text) {
  const counter = document.getElementById('char-count');
  if (!counter) return;

  const len = text.length;
  if (len > 4000) {
    counter.classList.add('visible');
    counter.textContent = `${len}/5000`;
    counter.className = 'visible' + (len > 4800 ? ' error' : len > 4500 ? ' warning' : '');
    counter.id = 'char-count';
  } else {
    counter.classList.remove('visible');
  }
}

// ========== SOHBET GEÇMİŞİ PANELİ ==========
async function openHistoryPanel() {
  const panel = document.getElementById('history-panel');
  if (!panel) return;

  const list = document.getElementById('history-list');
  list.innerHTML = '';

  const chats = await listChats();

  if (chats.length === 0) {
    list.innerHTML = `<div class="history-empty">${t('noHistory')}</div>`;
  } else {
    for (const chat of chats) {
      const item = document.createElement('div');
      item.className = 'history-item';

      const msgCount = chat.messages.length;
      const icon = getModeIcon(chat.mode);

      item.innerHTML = `
        <div class="history-item-icon">${icon}</div>
        <div class="history-item-content">
          <div class="history-item-title">${escapeForDisplay(chat.title || 'İsimsiz Sohbet')}</div>
          <div class="history-item-meta">${formatDate(chat.updatedAt)} · ${msgCount} ${t('messages')}</div>
        </div>
      `;

      // Silme butonu
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-item-delete';
      deleteBtn.setAttribute('aria-label', t('deleteChat'));
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirmModal(t('deleteChat'), t('deleteChatConfirm'));
        if (confirmed) {
          await deleteChat(chat.id);
          item.remove();
          if (currentChat && currentChat.id === chat.id) {
            startNewChat();
          }
          showToast(t('deleteChat'), 'success');
        }
      });
      item.appendChild(deleteBtn);

      // Sohbeti aç
      item.addEventListener('click', async () => {
        const loaded = await getChat(chat.id);
        if (loaded) {
          currentChat = loaded;
          currentMode = loaded.mode;
          renderModes();
          loadChatMessages(loaded.messages);
          closeHistoryPanel();
        }
      });

      list.appendChild(item);
    }
  }

  panel.classList.add('open');
}

function closeHistoryPanel() {
  const panel = document.getElementById('history-panel');
  if (panel) panel.classList.remove('open');
}

// ========== FAVORİLER PANELİ ==========
async function openFavoritesPanel() {
  const panel = document.getElementById('favorites-panel');
  if (!panel) return;

  const list = panel.querySelector('.favorites-list');
  if (!list) return;
  list.innerHTML = '';

  const favorites = await listFavorites();

  if (favorites.length === 0) {
    list.innerHTML = `<div class="history-empty">${t('noFavorites')}</div>`;
  } else {
    for (const fav of favorites) {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item-icon">⭐</div>
        <div class="history-item-content">
          <div class="history-item-title">${escapeForDisplay(fav.content.substring(0, 80))}</div>
          <div class="history-item-meta">${formatDate(fav.createdAt)}</div>
        </div>
      `;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'history-item-delete';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(fav.content);
      });
      item.appendChild(copyBtn);

      list.appendChild(item);
    }
  }

  panel.classList.add('open');
}

function closeFavoritesPanel() {
  const panel = document.getElementById('favorites-panel');
  if (panel) panel.classList.remove('open');
}

// ========== ONBOARDING ==========
function showOnboarding() {
  const onboarding = document.getElementById('onboarding');
  if (!onboarding) return;

  let step = 0;
  const steps = [
    { icon: '🏛️', titleKey: 'onboardingTitle1', descKey: 'onboardingDesc1' },
    { icon: '📐', titleKey: 'onboardingTitle2', descKey: 'onboardingDesc2' },
    { icon: '🚀', titleKey: 'onboardingTitle3', descKey: 'onboardingDesc3' },
  ];

  function renderStep() {
    const s = steps[step];
    onboarding.querySelector('.onboarding-icon').textContent = s.icon;
    onboarding.querySelector('.onboarding-title').textContent = t(s.titleKey);
    onboarding.querySelector('.onboarding-desc').textContent = t(s.descKey);

    // Dots
    const dots = onboarding.querySelectorAll('.onboarding-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === step));

    // Butonlar
    const nextBtn = onboarding.querySelector('.onboarding-next');
    nextBtn.textContent = step === steps.length - 1 ? t('start') : t('next');
  }

  renderStep();
  onboarding.classList.add('open');

  onboarding.querySelector('.onboarding-next').addEventListener('click', () => {
    if (step < steps.length - 1) {
      step++;
      renderStep();
    } else {
      setOnboarded();
      onboarding.classList.remove('open');
      openSettingsPanel();
    }
  });

  onboarding.querySelector('.onboarding-skip').addEventListener('click', () => {
    setOnboarded();
    onboarding.classList.remove('open');
  });
}

// ========== CONFIRM MODAL ==========
function showConfirmModal(title, description) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-modal');
    if (!overlay) { resolve(false); return; }

    overlay.querySelector('.modal-title').textContent = title;
    overlay.querySelector('.modal-desc').textContent = description;

    const cancelBtn = overlay.querySelector('.modal-cancel');
    const confirmBtn = overlay.querySelector('.modal-confirm');

    function cleanup() {
      overlay.classList.remove('open');
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
    }

    function onCancel() { cleanup(); resolve(false); }
    function onConfirm() { cleanup(); resolve(true); }

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);

    overlay.classList.add('open');
  });
}

// ========== YENİ SOHBET ==========
function startNewChat() {
  if (currentChat && currentChat.messages.length > 0) {
    saveChat(currentChat);
  }
  currentChat = createChat(currentMode);
  clearMessages();
  addWelcomeMessage(getModeSuggestions(currentMode));
  addWelcomeCards();
}

// ========== YARDIMCI ==========
function escapeForDisplay(str) {
  const div = document.createElement('span');
  div.textContent = str;
  return div.innerHTML;
}

// ========== UI GÜNCELLEMELERİ ==========
function updateConnectionStatus(status) {
  const dot = document.querySelector('.status-dot');
  if (dot) {
    dot.className = 'status-dot ' + (status === 'connected' ? 'online' : 'offline');
  }
}

function updateNetworkStatus(online) {
  const banner = document.getElementById('offline-banner');
  const input = document.getElementById('user-input');

  if (banner) {
    banner.classList.toggle('visible', !online);
    banner.textContent = online ? '' : t('offline');
  }
  if (input) {
    input.disabled = !online;
  }

  if (online) {
    showToast(t('online'), 'success');
    checkConnection();
  }
}

function updateUI() {
  // Header
  document.getElementById('header-title').textContent = t('appTitle');

  // Input placeholder
  const input = document.getElementById('user-input');
  if (input) input.placeholder = t('inputPlaceholder');

  // Modları yeniden render
  renderModes();
}

// ========== BAŞLATMA ==========
async function init() {
  // Tema ve font uygula
  initTheme();
  applyFontSize();

  // IndexedDB başlat
  try {
    await initDB();
  } catch (e) {
    console.error('DB init hatası:', e);
  }

  // Ağ dinleme
  initNetwork(updateNetworkStatus);

  // Supabase durum dinleme
  onSupabaseStatusChange(updateConnectionStatus);

  // Chat modülü başlat
  initChat();

  // Modları render et
  renderModes();

  // UI güncelle
  updateUI();

  // Yeni sohbet başlat
  currentChat = createChat(currentMode);
  addWelcomeMessage(getModeSuggestions(currentMode));
  addWelcomeCards();

  // Supabase bağlantı kontrolü
  checkConnection();

  // Speech
  if (isSpeechSupported()) {
    initSpeech(
      (transcript, isFinal) => {
        const input = document.getElementById('user-input');
        if (input) {
          input.value = transcript;
          autoResize(input);
          if (isFinal) {
            // Otomatik gönderme yok, kullanıcı onaylasın
          }
        }
      },
      (listening) => {
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
          micBtn.classList.toggle('recording', listening);
          micBtn.setAttribute('aria-label', listening ? t('speechStart') : 'Sesli giriş');
        }
      }
    );
  } else {
    const micBtn = document.getElementById('mic-btn');
    if (micBtn) micBtn.style.display = 'none';
  }

  // PWA
  initPWA();

  // Onboarding
  if (!isOnboarded()) {
    showOnboarding();
  }

  // ========== EVENT LISTENERS ==========

  // Gönder butonu
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);

  // Enter tuşu
  document.getElementById('user-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto resize & char count
  document.getElementById('user-input')?.addEventListener('input', (e) => {
    autoResize(e.target);
    updateCharCount(e.target.value);
  });

  // Durdur butonu
  document.getElementById('stop-btn')?.addEventListener('click', () => {
    stopGeneration();
  });

  // Ayarlar
  document.getElementById('settings-btn')?.addEventListener('click', openSettingsPanel);
  document.getElementById('back-btn')?.addEventListener('click', closeSettingsPanel);
  document.getElementById('save-settings-btn')?.addEventListener('click', saveSettingsFromForm);

  // Dark mode toggle
  document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  });

  // Font size
  document.querySelectorAll('.fontsize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fontsize-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setFontSize(btn.dataset.size);
    });
  });

  // Dil seçimi
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setLang(btn.dataset.lang);
      updateUI();
      showToast('Dil değiştirildi', 'success');
    });
  });

  // Geçmiş paneli
  document.getElementById('history-btn')?.addEventListener('click', openHistoryPanel);
  document.getElementById('history-back-btn')?.addEventListener('click', closeHistoryPanel);
  document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    startNewChat();
    closeHistoryPanel();
  });

  // Geçmiş arama
  document.getElementById('history-search')?.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    const list = document.getElementById('history-list');
    if (!list) return;

    const chats = query ? await searchChats(query) : await listChats();
    // Basit re-render (performans için optimize edilebilir)
    // openHistoryPanel zaten render ediyor, burada kısa yol
    list.innerHTML = '';
    if (chats.length === 0) {
      list.innerHTML = `<div class="history-empty">${t('noHistory')}</div>`;
    }
    for (const chat of chats) {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item-icon">${getModeIcon(chat.mode)}</div>
        <div class="history-item-content">
          <div class="history-item-title">${escapeForDisplay(chat.title || 'İsimsiz Sohbet')}</div>
          <div class="history-item-meta">${formatDate(chat.updatedAt)} · ${chat.messages.length} ${t('messages')}</div>
        </div>
      `;
      item.addEventListener('click', async () => {
        const loaded = await getChat(chat.id);
        if (loaded) {
          currentChat = loaded;
          currentMode = loaded.mode;
          renderModes();
          loadChatMessages(loaded.messages);
          closeHistoryPanel();
        }
      });
      list.appendChild(item);
    }
  }, 300));

  // Favoriler
  document.getElementById('favorites-btn')?.addEventListener('click', openFavoritesPanel);
  document.getElementById('favorites-back-btn')?.addEventListener('click', closeFavoritesPanel);

  // Mikrofon
  document.getElementById('mic-btn')?.addEventListener('click', () => {
    toggleListening();
  });

  // Dışa aktarma
  document.getElementById('export-txt-btn')?.addEventListener('click', () => {
    if (currentChat) downloadTxt(currentChat);
  });
  document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
    if (currentChat) downloadPdf(currentChat);
  });

  // API key silme
  document.getElementById('delete-apikey-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal('API Key Sil', 'API anahtarınız silinecek. Emin misiniz?');
    if (confirmed) {
      deleteApiKey();
      document.getElementById('api-key-input').value = '';
      showToast('API key silindi', 'success');
    }
  });

  // Tüm verileri sil
  document.getElementById('clear-all-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal(
      'Tüm Verileri Sil',
      'Tüm sohbet geçmişi, favoriler ve ayarlar silinecek. Bu işlem geri alınamaz!'
    );
    if (confirmed) {
      clearAllData();
      await clearAllChats();
      await clearAllFavorites();
      startNewChat();
      showToast('Tüm veriler silindi', 'success');
    }
  });

  // Install PWA
  document.getElementById('install-btn')?.addEventListener('click', promptInstall);

  // Escape ile panelleri kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettingsPanel();
      closeHistoryPanel();
      closeFavoritesPanel();
      const modal = document.getElementById('confirm-modal');
      if (modal?.classList.contains('open')) {
        modal.classList.remove('open');
      }
    }
  });

  // Version bilgisi
  const versionEl = document.getElementById('app-version');
  if (versionEl) versionEl.textContent = `v${APP_VERSION}`;

  console.log(`Mimarlık AI Asistanı v${APP_VERSION} başlatıldı`);
}

// Uygulama başlat
document.addEventListener('DOMContentLoaded', init);
