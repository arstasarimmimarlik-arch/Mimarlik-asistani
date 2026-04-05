/* ========================================
   Sohbet UI - Mesaj Ekleme, Render, Scroll
   ======================================== */

import { parseMarkdown } from './markdown.js';
import { escapeHtml } from './sanitize.js';
import { t } from './i18n.js';
import { copyToClipboard } from './export.js';
import { addFavorite, removeFavorite } from './history.js';
import { showToast } from './toast.js';
import { throttle } from './network.js';
import { MODES } from './modes.js';
import { openGuide } from './guides.js';

let messageContainer = null;
let scrollBtn = null;
let unreadCount = 0;
let userScrolledUp = false;
let modeChangeCallback = null;

export function setModeChangeCallback(cb) {
  modeChangeCallback = cb;
}

export function initChat() {
  messageContainer = document.getElementById('messages');
  scrollBtn = document.getElementById('scroll-bottom');

  // Scroll dinleme (throttle ile performans)
  messageContainer.addEventListener('scroll', throttle(() => {
    const { scrollTop, scrollHeight, clientHeight } = messageContainer;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;

    userScrolledUp = !isAtBottom;

    if (isAtBottom) {
      unreadCount = 0;
    }
    updateScrollBtn();
  }, 100));

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
  if (!text || text === 'undefined' || typeof text !== 'string') {
    text = '❌ Bir hata oluştu. Lütfen tekrar deneyin.';
  }
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
  contentEl.innerHTML = parseMarkdown(fullText || '');
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

  // ARS Tasarım Mimarlık kredi bloğu
  const creditBlock = document.createElement('div');
  creditBlock.style.cssText = 'margin-top:16px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;';

  const arsLogo = document.createElement('div');
  arsLogo.style.cssText = 'width:40px;height:40px;flex-shrink:0;';
  const arsImg = document.createElement('img');
  arsImg.src = 'https://www.arstasarimmimarlik.com/images/logo/logo-site.png';
  arsImg.alt = 'ARS Tasarım Mimarlık';
  arsImg.style.cssText = 'width:40px;height:40px;object-fit:contain;';
  arsImg.onerror = () => { arsImg.style.display = 'none'; arsLogo.textContent = 'A'; arsLogo.style.cssText += 'background:#1A1A1A;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#C9A96E;font-family:Georgia,serif;'; };
  arsLogo.appendChild(arsImg);

  const arsInfo = document.createElement('div');
  const arsLink = document.createElement('a');
  arsLink.href = 'https://www.arstasarimmimarlik.com';
  arsLink.target = '_blank';
  arsLink.rel = 'noopener noreferrer';
  arsLink.style.cssText = 'color:var(--text);text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.03em;display:block;';
  arsLink.textContent = 'ARS Tasarım Mimarlık';
  const arsSlogan = document.createElement('div');
  arsSlogan.style.cssText = 'font-size:10px;color:var(--text-tertiary);margin-top:1px;letter-spacing:0.02em;';
  arsSlogan.textContent = 'Ayrıntıdan Bütüne, Bilgiden Tasarıma.';
  arsInfo.appendChild(arsLink);
  arsInfo.appendChild(arsSlogan);

  creditBlock.appendChild(arsLogo);
  creditBlock.appendChild(arsInfo);
  bubble.appendChild(creditBlock);

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

// Karşılama kartları — moda göre dinamik
const MODE_CARDS = {
  genel: [
    { svg: './assets/icons/arch-design.svg', title: 'Mimari Tasarım', desc: 'Ölçüler, standartlar, mekan planlaması', targetMode: 'genel' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Detay Çizimi', desc: 'Birleşim noktaları, katman sırası', targetMode: 'detay' },
    { svg: './assets/icons/material.svg', title: 'Malzeme Bilgisi', desc: 'TS EN standartları, uygulamalar', targetMode: 'malzeme' },
    { svg: './assets/icons/regulation.svg', title: 'Yönetmelik', desc: 'TBDY 2018, İmar Kanunu', targetMode: 'yonetmelik' },
    { svg: './assets/icons/arch-design.svg', title: 'Eğitim', desc: 'Mimarlık kavramları, tarih, stiller', targetMode: 'egitim' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Statik', desc: 'Betonarme, çelik, deprem analizi', targetMode: 'statik' },
    { svg: './assets/icons/material.svg', title: 'Sürdürülebilir', desc: 'LEED, pasif ev, yeşil bina', targetMode: 'surdurulebilir' },
    { svg: './assets/icons/regulation.svg', title: 'Restorasyon', desc: 'Tarihi yapı koruma, rölöve', targetMode: 'restorasyon' },
    { svg: './assets/icons/arch-design.svg', title: 'Maliyet', desc: 'Metraj, hakediş, birim fiyat', targetMode: 'maliyet' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Peyzaj', desc: 'Bitkilendirme, sert zemin, sulama', targetMode: 'peyzaj' },
  ],
  detay: [
    { svg: './assets/icons/detail-drawing.svg', title: 'Çatı Detayları', desc: 'Su yalıtım, mahya, dereyolu', query: 'Düz çatı su yalıtım katman sırası nedir?' },
    { svg: './assets/icons/material.svg', title: 'Duvar Kesitleri', desc: 'Temel-duvar, döşeme-duvar birleşimleri', query: 'Temel-duvar birleşim detayı nasıl çizilir?' },
    { svg: './assets/icons/arch-design.svg', title: 'Doğrama Detayları', desc: 'Pencere, kapı montaj detayları', query: 'PVC pencere kasası montaj detayını anlat' },
    { svg: './assets/icons/regulation.svg', title: 'Isı Yalıtım', desc: 'Mantolama, ısı köprüsü çözümleri', query: 'Dış cephe mantolama katman sırası' },
  ],
  malzeme: [
    { svg: './assets/icons/material.svg', title: 'Yalıtım Malzemeleri', desc: 'XPS, EPS, taşyünü karşılaştırma', query: 'XPS ve EPS arasındaki farklar nelerdir?' },
    { svg: './assets/icons/arch-design.svg', title: 'Beton Sınıfları', desc: 'C25, C30, C35 özellikleri', query: 'C30/37 beton sınıfı özellikleri nelerdir?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Çelik Profiller', desc: 'HEA, HEB, IPE profil seçimi', query: 'HEA ve HEB profillerin farkı nedir?' },
    { svg: './assets/icons/regulation.svg', title: 'TS EN Standartları', desc: 'Yapı malzemeleri standart referansları', query: 'Yapı malzemelerinde CE işareti ne anlama gelir?' },
  ],
  egitim: [
    { svg: './assets/icons/arch-design.svg', title: 'Tasarım İlkeleri', desc: 'Altın oran, ölçek, proporsiyon', query: 'Altın oran nedir ve mimarlıkta nasıl kullanılır?' },
    { svg: './assets/icons/regulation.svg', title: 'Mimarlık Tarihi', desc: 'Akımlar, mimarlar, dönemler', query: 'Le Corbusier\'in 5 ilkesi nelerdir?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Yapı Bilgisi', desc: 'Strüktür, malzeme, teknik çizim', query: 'Yapı statiğinde moment nedir?' },
    { svg: './assets/icons/material.svg', title: 'Proje Yönetimi', desc: 'Süreçler, aşamalar, sorumluluklar', query: 'Bir mimari proje hangi aşamalardan oluşur?' },
  ],
  yonetmelik: [
    { svg: './assets/icons/regulation.svg', title: 'İmar Yönetmeliği', desc: 'TAKS, KAKS, emsal hesabı', query: 'Emsal (KAKS) hesabı nasıl yapılır?' },
    { svg: './assets/icons/arch-design.svg', title: 'Yangın Güvenliği', desc: 'Merdiven, kaçış yolu, genişlik', query: 'Yangın merdiveni minimum genişliği kaç cm olmalı?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Deprem Yönetmeliği', desc: 'TBDY 2018, deprem bölgeleri', query: 'TBDY 2018 deprem tasarım ilkeleri nelerdir?' },
    { svg: './assets/icons/material.svg', title: 'Erişilebilirlik', desc: 'Engelli rampa, asansör, WC ölçüleri', query: 'Engelli rampa eğim oranı ve ölçüleri nedir?' },
  ],
  statik: [
    { svg: './assets/icons/arch-design.svg', title: 'Betonarme', desc: 'Kolon, kiriş, döşeme boyutlandırma', query: 'Kolon boyutlandırma nasıl yapılır?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Deprem Hesabı', desc: 'Spektral analiz, yük kombinasyonları', query: 'Deprem yükü hesaplama adımları nelerdir?' },
    { svg: './assets/icons/material.svg', title: 'Çelik Yapı', desc: 'Profil seçimi, birleşim hesabı', query: 'Çelik yapı kolon-kiriş birleşim türleri' },
    { svg: './assets/icons/regulation.svg', title: 'Temel Tasarımı', desc: 'Radye, tekil, sürekli temel', query: 'Radye temel ne zaman tercih edilir?' },
  ],
  surdurulebilir: [
    { svg: './assets/icons/arch-design.svg', title: 'LEED & BREEAM', desc: 'Yeşil bina sertifikasyon süreçleri', query: 'LEED sertifikası nasıl alınır?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Pasif Ev', desc: 'Enerji verimli tasarım prensipleri', query: 'Pasif ev tasarım prensipleri nelerdir?' },
    { svg: './assets/icons/material.svg', title: 'Yeşil Çatı', desc: 'Uygulama detayları, bitki seçimi', query: 'Yeşil çatı uygulama katmanları nelerdir?' },
    { svg: './assets/icons/regulation.svg', title: 'Enerji Verimliliği', desc: 'BEP, U değeri, yalıtım kalınlığı', query: 'Binalarda enerji performansı nasıl hesaplanır?' },
  ],
  restorasyon: [
    { svg: './assets/icons/detail-drawing.svg', title: 'Rölöve', desc: 'Ölçüm teknikleri, çizim standartları', query: 'Rölöve çizimi nasıl yapılır?' },
    { svg: './assets/icons/regulation.svg', title: 'Koruma İlkeleri', desc: 'Venedik Tüzüğü, ICOMOS kararları', query: 'Venedik Tüzüğü temel ilkeleri nelerdir?' },
    { svg: './assets/icons/material.svg', title: 'Tarihi Malzeme', desc: 'Taş, tuğla, ahşap onarım teknikleri', query: 'Tarihi yapılarda taş onarım teknikleri nelerdir?' },
    { svg: './assets/icons/arch-design.svg', title: 'Tescil Süreci', desc: 'Koruma kurulu, tescil başvurusu', query: 'Bir yapı nasıl tescilli eser olur?' },
  ],
  maliyet: [
    { svg: './assets/icons/regulation.svg', title: 'Metraj Hesabı', desc: 'Kaba inşaat, ince işler, altyapı', query: 'Kaba inşaat metraj hesabı nasıl yapılır?' },
    { svg: './assets/icons/material.svg', title: 'Birim Fiyat', desc: 'Poz numaraları, analiz yöntemi', query: 'Poz numarası nedir ve nasıl kullanılır?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Hakediş', desc: 'Hakediş düzenleme, ödeme süreçleri', query: 'Hakediş raporu nasıl hazırlanır?' },
    { svg: './assets/icons/arch-design.svg', title: 'Maliyet Tahmini', desc: 'Yaklaşık maliyet, m² birim fiyatları', query: '2025 yılı yapı yaklaşık birim maliyetleri' },
  ],
  peyzaj: [
    { svg: './assets/icons/arch-design.svg', title: 'Bitkilendirme', desc: 'İklime uygun tür seçimi', query: 'İstanbul iklimine uygun ağaç türleri nelerdir?' },
    { svg: './assets/icons/detail-drawing.svg', title: 'Sulama Sistemleri', desc: 'Damlama, yağmurlama tasarımı', query: 'Peyzaj sulama sistemi nasıl tasarlanır?' },
    { svg: './assets/icons/material.svg', title: 'Sert Zemin', desc: 'Parke taş, beton, doğal taş seçimi', query: 'Dış mekan sert zemin malzeme seçenekleri' },
    { svg: './assets/icons/regulation.svg', title: 'Kentsel Peyzaj', desc: 'Meydan, park, yaya alanı tasarımı', query: 'Kentsel peyzaj tasarım ilkeleri nelerdir?' },
  ],
};

export function addWelcomeCards(mode = 'genel') {
  const cards = MODE_CARDS[mode] || MODE_CARDS.genel;

  const container = document.createElement('div');
  container.className = 'welcome-apps';

  for (const card of cards) {
    const btn = document.createElement('button');
    btn.className = 'welcome-app-card';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'welcome-app-icon';
    const img = document.createElement('img');
    img.src = card.svg;
    img.alt = '';
    img.width = 28;
    img.height = 28;
    iconDiv.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'welcome-app-info';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'welcome-app-title';
    titleDiv.textContent = card.title || t(card.titleKey);
    const descDiv = document.createElement('div');
    descDiv.className = 'welcome-app-desc';
    descDiv.textContent = card.desc || t(card.descKey);
    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(descDiv);

    const arrowDiv = document.createElement('div');
    arrowDiv.className = 'welcome-app-arrow';
    arrowDiv.textContent = '→';

    btn.appendChild(iconDiv);
    btn.appendChild(infoDiv);
    btn.appendChild(arrowDiv);

    btn.addEventListener('click', () => {
      if (card.targetMode && modeChangeCallback) {
        modeChangeCallback(card.targetMode);
      } else if (card.query) {
        const input = document.getElementById('user-input');
        if (input) {
          input.value = card.query;
          document.getElementById('send-btn')?.click();
        }
      }
    });
    container.appendChild(btn);
  }

  messageContainer.appendChild(container);

  // Yönetmelik modunda resmi kaynak kartları
  const modeData = MODES[mode];
  if (modeData?.officialSources) {
    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'welcome-apps';

    const sourcesTitle = document.createElement('div');
    sourcesTitle.className = 'welcome-section-title';
    sourcesTitle.textContent = 'Resmi Yönetmelikler';
    messageContainer.appendChild(sourcesTitle);

    for (const src of modeData.officialSources) {
      const link = document.createElement('a');
      link.className = 'welcome-app-card';
      link.href = src.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const iconDiv = document.createElement('div');
      iconDiv.className = 'welcome-app-icon';
      iconDiv.textContent = src.icon;
      link.appendChild(iconDiv);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'welcome-app-info';
      const titleDiv = document.createElement('div');
      titleDiv.className = 'welcome-app-title';
      titleDiv.textContent = src.title;
      infoDiv.appendChild(titleDiv);
      link.appendChild(infoDiv);

      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'welcome-app-arrow';
      arrowDiv.textContent = '→';
      link.appendChild(arrowDiv);

      sourcesContainer.appendChild(link);
    }
    messageContainer.appendChild(sourcesContainer);
  }

  // Harici uygulama kartları (sadece genel modda)
  if (mode !== 'genel') return;

  const appCards = [
    {
      title: 'Şantiyem',
      desc: 'Şantiye takip ve denetim sistemi',
      url: 'https://santiyem.csb.gov.tr/',
      logo: 'https://play-lh.googleusercontent.com/lcISzZjxZeWcci-zwRNwe91q2ohZukYiSejVSwqTrgjIalv55FykNbfNurh_wT9c4w=w240-h480-rw',
      fallbackIcon: '🏗️',
      guideKey: 'santiyem',
    },
    {
      title: 'Parsel Sorgu',
      desc: 'Ada/parsel sorgulama (TKGM)',
      url: 'https://parselsorgu.tkgm.gov.tr/',
      logo: 'https://play-lh.googleusercontent.com/RftNurm9mb_3SRRp-P7aQVI3Xsup6JPIvSUurUXWvCn5vSDQGA-UJVwQsSk8WRviSk0=w240-h480-rw',
      fallbackIcon: '📍',
      guideKey: 'parselsorgu',
    }
  ];

  const appContainer = document.createElement('div');
  appContainer.className = 'welcome-apps';

  for (const app of appCards) {
    const link = document.createElement('a');
    link.className = 'welcome-app-card';
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const iconDiv = document.createElement('div');
    iconDiv.className = 'welcome-app-icon';
    if (app.logo) {
      const img = document.createElement('img');
      img.src = app.logo;
      img.alt = app.title;
      img.width = 36;
      img.height = 36;
      img.style.borderRadius = '8px';
      img.onerror = () => { img.replaceWith(document.createTextNode(app.fallbackIcon)); };
      iconDiv.appendChild(img);
    } else {
      iconDiv.textContent = app.fallbackIcon;
    }
    link.appendChild(iconDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'welcome-app-info';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'welcome-app-title';
    titleDiv.textContent = app.title;
    const descDiv = document.createElement('div');
    descDiv.className = 'welcome-app-desc';
    descDiv.textContent = app.desc;
    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(descDiv);
    link.appendChild(infoDiv);

    const arrowDiv = document.createElement('div');
    arrowDiv.className = 'welcome-app-arrow';
    arrowDiv.textContent = '→';
    link.appendChild(arrowDiv);

    const cardWrap = document.createElement('div');
    cardWrap.appendChild(link);

    // "Nasıl Kullanılır?" butonu
    if (app.guideKey) {
      const guideBtn = document.createElement('button');
      guideBtn.className = 'welcome-guide-btn';
      guideBtn.textContent = 'Nasıl Kullanılır?';
      guideBtn.addEventListener('click', () => openGuide(app.guideKey));
      cardWrap.appendChild(guideBtn);
    }

    appContainer.appendChild(cardWrap);
  }

  messageContainer.appendChild(appContainer);
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
