/* ========================================
   Markdown → Güvenli HTML Dönüşümü
   ======================================== */

import { sanitizeHtml, escapeHtml } from './sanitize.js';

// Kod bloklarını geçici olarak sakla (iç içe parse'ı engelle)
let codeBlocks = [];

function stashCodeBlock(match, lang, code) {
  const index = codeBlocks.length;
  const escapedCode = escapeHtml(code.trim());
  const langLabel = lang ? escapeHtml(lang.trim()) : '';

  codeBlocks.push(
    `<pre><div class="code-header"><span>${langLabel}</span><button class="code-copy-btn" onclick="window.__copyCode(this)" aria-label="Kopyala">Kopyala</button></div><code class="language-${langLabel}">${escapedCode}</code></pre>`
  );
  return `%%CODEBLOCK_${index}%%`;
}

function stashInlineCode(match, code) {
  const index = codeBlocks.length;
  codeBlocks.push(`<code>${escapeHtml(code)}</code>`);
  return `%%CODEBLOCK_${index}%%`;
}

// Tabloyu parse et
function parseTable(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return text;

  const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  // 2. satır ayraç satırı mı kontrol et
  if (!/^[\s|:-]+$/.test(lines[1])) return text;

  let html = '<div class="table-wrap"><table><thead><tr>';
  for (const cell of headerCells) {
    html += `<th>${cell}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    html += '<tr>';
    for (const cell of cells) {
      html += `<td>${cell}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

// Ana markdown parse fonksiyonu
export function parseMarkdown(text) {
  if (!text) return '';

  codeBlocks = [];

  // 1. Kod bloklarını sakla (``` ... ```)
  let result = text.replace(/```(\w*)\n([\s\S]*?)```/g, stashCodeBlock);

  // 2. Inline kodu sakla (` ... `)
  result = result.replace(/`([^`]+)`/g, stashInlineCode);

  // 3. Satırlara böl ve işle
  const lines = result.split('\n');
  let output = [];
  let inList = false;
  let listType = '';
  let inTable = false;
  let tableLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Tablo algılama
    if (line.includes('|') && !inTable) {
      // Sonraki satır ayraç mı?
      if (i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1])) {
        inTable = true;
        tableLines = [line];
        continue;
      }
    }
    if (inTable) {
      if (line.includes('|') || /^[\s|:-]+$/.test(line)) {
        tableLines.push(line);
        continue;
      } else {
        output.push(parseTable(tableLines.join('\n')));
        tableLines = [];
        inTable = false;
      }
    }

    // Liste kapat
    if (inList && !/^(\s*[-*+]\s|^\s*\d+\.\s)/.test(line) && line.trim() !== '') {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }

    // Başlıklar
    if (/^####\s/.test(line)) {
      line = `<h4>${line.replace(/^####\s*/, '')}</h4>`;
    } else if (/^###\s/.test(line)) {
      line = `<h3>${line.replace(/^###\s*/, '')}</h3>`;
    } else if (/^##\s/.test(line)) {
      line = `<h2>${line.replace(/^##\s*/, '')}</h2>`;
    } else if (/^#\s/.test(line)) {
      line = `<h1>${line.replace(/^#\s*/, '')}</h1>`;
    }
    // Sırasız liste
    else if (/^\s*[-*+]\s/.test(line)) {
      if (!inList || listType !== 'ul') {
        if (inList) output.push(listType === 'ul' ? '</ul>' : '</ol>');
        output.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      line = `<li>${line.replace(/^\s*[-*+]\s*/, '')}</li>`;
    }
    // Sıralı liste
    else if (/^\s*\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) output.push(listType === 'ul' ? '</ul>' : '</ol>');
        output.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      line = `<li>${line.replace(/^\s*\d+\.\s*/, '')}</li>`;
    }
    // Blockquote
    else if (/^>\s?/.test(line)) {
      line = `<blockquote>${line.replace(/^>\s?/, '')}</blockquote>`;
    }
    // Yatay çizgi
    else if (/^---+$/.test(line.trim())) {
      line = '<hr>';
    }
    // Boş satır
    else if (line.trim() === '') {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
      }
      line = '';
    }
    // Normal paragraf
    else if (!line.startsWith('<')) {
      // Sadece düz metin ise <p> ile sar
    }

    output.push(line);
  }

  // Açık kalan listeyi kapat
  if (inList) {
    output.push(listType === 'ul' ? '</ul>' : '</ol>');
  }
  if (inTable && tableLines.length > 0) {
    output.push(parseTable(tableLines.join('\n')));
  }

  result = output.join('\n');

  // Inline formatlama
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');
  result = result.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Linkler
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Satır sonlarını <br> yap (liste/tablo/başlık dışında)
  result = result.replace(/\n(?!<)/g, '<br>\n');
  // Çift <br> temizle
  result = result.replace(/(<br>\s*){3,}/g, '<br><br>');

  // Kod bloklarını geri koy
  for (let i = 0; i < codeBlocks.length; i++) {
    result = result.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
  }

  // Sanitize ve dön
  return sanitizeHtml(result);
}

// Kod kopyalama fonksiyonu (global)
window.__copyCode = function(btn) {
  const code = btn.closest('pre').querySelector('code');
  if (code) {
    navigator.clipboard.writeText(code.textContent).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Kopyalandı!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }
};
