/* ========================================
   Sohbet UI - Mesaj Ekleme, Render, Scroll
   ======================================== */

import { parseMarkdown } from './markdown.js';
import { escapeHtml } from './sanitize.js';
import { t } from './i18n.js';
import { copyToClipboard } from './export.js';
import { addFavorite, removeFavorite } from './history.js';
import { showToast } from './app.js';

let messageContainer = null;
let scrollBtn = null;
let unreadCount = 0;
let userScrolledUp = false;

export function initChat() {
  messageContainer = document.getElementById('messages');
  scrollBtn = document.getElementById('scroll-bottom');

  // Scroll dinleme
  messageContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = messageContainer;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;

    userScrolledUp = !isAtBottom;

    if (isAtBottom) {
      unreadCount = 0;
      updateScrollBtn();
    }
    updateScrollBtn();
  });

  // Scroll-to-bottom butonu
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      scrollToBottom(true);
      unreadCount = 0;
      updateScrollBtn();
    });
  }
}

function updateScrollBtn() {
  if (!scrollBtn) return;
  if (userScrolledUp) {
    scrollBtn.classList.add('visible');
    const badge = scrollBtn.querySelector('.badge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  } else {
    scrollBtn.classList.remove('visible');
  }
}

export function scrollToBottom(force = false) {
  if (!messageContainer) return;
  if (force || !userScrolledUp) {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
}

// Kullanıcı mesajı ekle
export function addUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'msg user';
  div.setAttribute('role', 'listitem');

  const avatar = document.createElement('div');
  avatar.className = 'avatar user-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'A';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text; // XSS-safe: textContent kullanıyoruz

  div.appendChild(avatar);
  div.appendChild(bubble);
  messageContainer.appendChild(div);
  scrollToBottom(true);
}

// AI mesajı ekle (markdown render ile)
export function addAiMessage(text, sourceLabel = null, options = {}) {
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.setAttribute('role', 'listitem');
  if (options.msgId) div.dataset.msgId = options.msgId;

  const avatar = document.createElement('div');
  avatar.className = 'avatar ai-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'M';

  const contentWrap = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'bubble md-content';

  // Kaynak badge
  if (sourceLabel) {
    const badge = document.createElement('div');
    badge.className = 'source-badge';
    badge.textContent = '📚 ' + sourceLabel;
    bubble.appendChild(badge);
  }

  // Markdown render
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = parseMarkdown(text);
  bubble.appendChild(contentDiv);

  contentWrap.appendChild(bubble);

  // Mesaj aksiyonları
  const actions = createMessageActions(text, div, options);
  contentWrap.appendChild(actions);

  div.appendChild(avatar);
  div.appendChild(contentWrap);
  messageContainer.appendChild(div);

  if (userScrolledUp) {
    unreadCount++;
    updateScrollBtn();
  } else {
    scrollToBottom(true);
  }

  return div;
}

// Streaming mesaj balonu oluştur
export function createStreamingBubble(sourceLabel = null) {
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'streaming-msg';
  div.setAttribute('role', 'listitem');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ai-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'M';

  const contentWrap = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'bubble md-content';

  if (sourceLabel) {
    const badge = document.createElement('div');
    badge.className = 'source-badge';
    badge.textContent = '📚 ' + sourceLabel;
    bubble.appendChild(badge);
  }

  const streamContent = document.createElement('div');
  streamContent.id = 'stream-content';
  bubble.appendChild(streamContent);

  contentWrap.appendChild(bubble);
  div.appendChild(avatar);
  div.appendChild(contentWrap);
  messageContainer.appendChild(div);
  scrollToBottom(true);

  return { element: div, contentEl: streamContent, wrapEl: contentWrap };
}

// Streaming içeriği güncelle
export function updateStreamingContent(contentEl, fullText) {
  contentEl.innerHTML = parseMarkdown(fullText);
  scrollToBottom();
}

// Streaming'i tamamla, aksiyonları ekle
export function finalizeStreamingMessage(wrapEl, fullText, options = {}) {
  const actions = createMessageActions(fullText, wrapEl.parentElement, options);
  wrapEl.appendChild(actions);
}

// Yazıyor göstergesi
export function addTypingIndicator() {
  removeTypingIndicator();

  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing';
  div.setAttribute('aria-label', t('typing'));

  const avatar = document.createElement('div');
  avatar.className = 'avatar ai-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'M';

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

  div.appendChild(avatar);
  div.appendChild(bubble);
  messageContainer.appendChild(div);
  scrollToBottom(true);
}

export function removeTypingIndicator() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

// Streaming mesajı kaldır
export function removeStreamingMessage() {
  const el = document.getElementById('streaming-msg');
  if (el) el.remove();
}

// Mesaj aksiyonları oluştur
function createMessageActions(text, msgEl, options = {}) {
  const actions = document.createElement('div');
  actions.className = 'msg-actions';

  // Kopyala
  const copyBtn = document.createElement('button');
  copyBtn.className = 'msg-action-btn';
  copyBtn.setAttribute('aria-label', t('copy'));
  copyBtn.title = t('copy');
  copyBtn.textContent = '📋';
  copyBtn.addEventListener('click', () => copyToClipboard(text));

  // Favori
  const favBtn = document.createElement('button');
  favBtn.className = 'msg-action-btn';
  favBtn.setAttribute('aria-label', t('favorite'));
  favBtn.title = t('favorite');
  favBtn.textContent = '⭐';
  let isFavorited = false;
  let favId = null;

  favBtn.addEventListener('click', async () => {
    if (isFavorited && favId) {
      await removeFavorite(favId);
      favBtn.classList.remove('favorited');
      favBtn.title = t('favorite');
      isFavorited = false;
      favId = null;
      showToast(t('unfavorite'), 'info');
    } else {
      const fav = await addFavorite({
        content: text,
        mode: options.mode || 'genel',
        chatId: options.chatId || null
      });
      favBtn.classList.add('favorited');
      favBtn.title = t('unfavorite');
      isFavorited = true;
      favId = fav.id;
      showToast(t('favorite'), 'success');
    }
  });

  actions.appendChild(copyBtn);
  actions.appendChild(favBtn);

  return actions;
}

// Karşılama mesajı
export function addWelcomeMessage(suggestions) {
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.setAttribute('role', 'listitem');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ai-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'M';

  const contentWrap = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'bubble md-content';
  const welcomeText = document.createElement('p');
  welcomeText.textContent = t('welcome');
  bubble.appendChild(welcomeText);

  const descText = document.createElement('p');
  descText.textContent = t('welcomeDesc');
  descText.style.marginTop = '8px';
  bubble.appendChild(descText);

  contentWrap.appendChild(bubble);

  // Hızlı sorular
  if (suggestions && suggestions.length > 0) {
    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.setAttribute('role', 'list');

    for (const s of suggestions) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.setAttribute('role', 'listitem');
      chip.textContent = (s.icon ? s.icon + ' ' : '') + s.text;
      chip.addEventListener('click', () => {
        const input = document.getElementById('user-input');
        if (input) {
          input.value = s.text;
          // sendMessage event'ı tetikle
          document.getElementById('send-btn')?.click();
        }
      });
      chips.appendChild(chip);
    }

    contentWrap.appendChild(chips);
  }

  div.appendChild(avatar);
  div.appendChild(contentWrap);
  messageContainer.appendChild(div);
}

// Karşılama kartları
export function addWelcomeCards() {
  const cards = [
    { icon: '🏛️', titleKey: 'cardArchTitle', descKey: 'cardArchDesc', query: 'Yatak odası minimum kaç m² olmalı?' },
    { icon: '📐', titleKey: 'cardDetailTitle', descKey: 'cardDetailDesc', query: 'Betonarme kolon-kiriş birleşim detayı' },
    { icon: '🧱', titleKey: 'cardMaterialTitle', descKey: 'cardMaterialDesc', query: 'XPS ve EPS farkı nedir?' },
    { icon: '⚖️', titleKey: 'cardRegTitle', descKey: 'cardRegDesc', query: 'TBDY 2018 nedir?' },
  ];

  const container = document.createElement('div');
  container.className = 'welcome-cards';

  for (const card of cards) {
    const btn = document.createElement('button');
    btn.className = 'welcome-card';
    btn.innerHTML = `
      <div class="welcome-card-icon">${card.icon}</div>
      <div class="welcome-card-title">${t(card.titleKey)}</div>
      <div class="welcome-card-desc">${t(card.descKey)}</div>
    `;
    btn.addEventListener('click', () => {
      const input = document.getElementById('user-input');
      if (input) {
        input.value = card.query;
        document.getElementById('send-btn')?.click();
      }
    });
    container.appendChild(btn);
  }

  messageContainer.appendChild(container);
}

// Mesaj alanını temizle
export function clearMessages() {
  if (messageContainer) {
    messageContainer.innerHTML = '';
    unreadCount = 0;
    userScrolledUp = false;
  }
}

// Mevcut sohbeti yükle
export function loadChatMessages(messages) {
  clearMessages();
  for (const msg of messages) {
    if (msg.role === 'user') {
      addUserMessage(msg.content);
    } else {
      addAiMessage(msg.content, msg.source || null);
    }
  }
  scrollToBottom(true);
}
