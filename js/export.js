/* ========================================
   Dışa Aktarma (TXT, PDF)
   ======================================== */

import { exportChatTxt, exportChatPdf } from './history.js';
import { showToast } from './app.js';
import { t } from './i18n.js';

// TXT olarak indir
export function downloadTxt(chat) {
  if (!chat || !chat.messages || chat.messages.length === 0) {
    showToast('Dışa aktarılacak mesaj yok', 'warning');
    return;
  }

  const text = exportChatTxt(chat);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(chat.title || 'sohbet')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(t('copied'), 'success');
}

// PDF olarak indir (print dialog)
export function downloadPdf(chat) {
  if (!chat || !chat.messages || chat.messages.length === 0) {
    showToast('Dışa aktarılacak mesaj yok', 'warning');
    return;
  }

  exportChatPdf(chat);
}

// Tek mesajı panoya kopyala
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('copied'), 'success');
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(t('copied'), 'success');
      return true;
    } catch {
      showToast('Kopyalama başarısız', 'error');
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// Dosya adı temizle
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s_-]/g, '').trim().substring(0, 50) || 'sohbet';
}
