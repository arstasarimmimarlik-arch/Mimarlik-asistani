/* ========================================
   Sohbet Geçmişi - IndexedDB
   ======================================== */

const DB_NAME = 'mimarlik_ai';
const DB_VERSION = 1;
const STORE_CHATS = 'chats';
const STORE_FAVORITES = 'favorites';

let db = null;

// Veritabanını aç/oluştur
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORE_CHATS)) {
        const chatStore = database.createObjectStore(STORE_CHATS, { keyPath: 'id' });
        chatStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        chatStore.createIndex('mode', 'mode', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORE_FAVORITES)) {
        const favStore = database.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
        favStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB hatası:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getDB() {
  if (!db) throw new Error('Veritabanı başlatılmadı');
  return db;
}

// ========== SOHBET İŞLEMLERİ ==========

// Yeni sohbet oluştur
export function createChat(mode = 'genel') {
  return {
    id: generateId(),
    title: '',
    mode: mode,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// Sohbeti kaydet
export function saveChat(chat) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    chat.updatedAt = Date.now();

    // Otomatik başlık oluştur
    if (!chat.title && chat.messages.length > 0) {
      const firstUserMsg = chat.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        chat.title = firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
      }
    }

    const request = store.put(chat);
    request.onsuccess = () => resolve(chat);
    request.onerror = () => reject(request.error);
  });
}

// Sohbeti getir
export function getChat(id) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readonly');
    const store = tx.objectStore(STORE_CHATS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Tüm sohbetleri listele (en yeni önce)
export function listChats() {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readonly');
    const store = tx.objectStore(STORE_CHATS);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev');
    const chats = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        chats.push(cursor.value);
        cursor.continue();
      } else {
        resolve(chats);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Sohbeti sil
export function deleteChat(id) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Tüm sohbetleri sil
export function clearAllChats() {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sohbetlerde arama
export async function searchChats(query) {
  const chats = await listChats();
  const q = query.toLowerCase();
  return chats.filter(chat => {
    if (chat.title?.toLowerCase().includes(q)) return true;
    return chat.messages.some(m => m.content?.toLowerCase().includes(q));
  });
}

// Sohbet sayısı
export function getChatCount() {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_CHATS, 'readonly');
    const store = tx.objectStore(STORE_CHATS);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ========== FAVORİ İŞLEMLERİ ==========

// Favori ekle
export function addFavorite(message) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const fav = {
      id: generateId(),
      content: message.content,
      mode: message.mode || 'genel',
      chatId: message.chatId || null,
      createdAt: Date.now()
    };
    const request = store.put(fav);
    request.onsuccess = () => resolve(fav);
    request.onerror = () => reject(request.error);
  });
}

// Favori sil
export function removeFavorite(id) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Tüm favorileri listele
export function listFavorites() {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_FAVORITES, 'readonly');
    const store = tx.objectStore(STORE_FAVORITES);
    const index = store.index('createdAt');
    const request = index.openCursor(null, 'prev');
    const favorites = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        favorites.push(cursor.value);
        cursor.continue();
      } else {
        resolve(favorites);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Tüm favorileri temizle
export function clearAllFavorites() {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========== YARDIMCI ==========

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Tarih formatlama
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Dışa aktarma: TXT
export function exportChatTxt(chat) {
  let text = `Sohbet: ${chat.title || 'İsimsiz'}\n`;
  text += `Mod: ${chat.mode}\n`;
  text += `Tarih: ${new Date(chat.createdAt).toLocaleString('tr-TR')}\n`;
  text += '─'.repeat(40) + '\n\n';

  for (const msg of chat.messages) {
    const role = msg.role === 'user' ? 'Kullanıcı' : 'AI Asistan';
    text += `[${role}]\n${msg.content}\n\n`;
  }

  return text;
}

// Dışa aktarma: PDF (print yöntemi)
export function exportChatPdf(chat) {
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${chat.title || 'Sohbet'}</title>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px; color: #1A1A1A; }
        h1 { font-size: 20px; border-bottom: 2px solid #1D9E75; padding-bottom: 10px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 30px; }
        .msg { margin: 16px 0; padding: 12px 16px; border-radius: 12px; }
        .user { background: #E1F5EE; }
        .ai { background: #F7F7F5; }
        .role { font-weight: 700; font-size: 12px; color: #0F6E56; margin-bottom: 6px; text-transform: uppercase; }
        .content { line-height: 1.6; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>${chat.title || 'Sohbet'}</h1>
      <div class="meta">Mod: ${chat.mode} | Tarih: ${new Date(chat.createdAt).toLocaleString('tr-TR')}</div>
      ${chat.messages.map(m => `
        <div class="msg ${m.role === 'user' ? 'user' : 'ai'}">
          <div class="role">${m.role === 'user' ? 'Kullanıcı' : 'AI Asistan'}</div>
          <div class="content">${m.content}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}
