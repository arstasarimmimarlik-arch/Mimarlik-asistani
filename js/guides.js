/* ========================================
   Kullanım Kılavuzları — Şantiyem & Parsel Sorgu
   ======================================== */

const GUIDES = {
  santiyem: {
    title: 'Şantiyem Kullanım Kılavuzu',
    subtitle: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı',
    sections: [
      {
        title: 'Şantiyem Nedir?',
        content: `Şantiye-M, Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Coğrafi Bilgi Sistemleri Genel Müdürlüğü tarafından geliştirilen Mobil Şantiye Defteri uygulamasıdır. 1 Ocak 2026 itibarıyla kullanımı zorunlu hale gelmiştir.`
      },
      {
        title: 'Giriş Yapma',
        steps: [
          'App Store veya Play Store\'dan "Şantiyem" uygulamasını indirin',
          'E-Devlet hesabınızla giriş yapın (T.C. kimlik doğrulaması gereklidir)',
          'Ana ekranda "İşlerim" veya "Aktif İşler Listesi" sekmesine tıklayın',
          'Tanımlı şantiyeleriniz listelenecektir'
        ],
        image: { src: 'https://play-lh.googleusercontent.com/lcISzZjxZeWcci-zwRNwe91q2ohZukYiSejVSwqTrgjIalv55FykNbfNurh_wT9c4w=w240-h480-rw', alt: 'Şantiyem uygulama ikonu', caption: 'Play Store\'dan indirin' }
      },
      {
        title: 'Günlük Rapor Oluşturma',
        steps: [
          'Şantiyenizi seçin ve "Günlük Rapor" butonuna tıklayın',
          'Hava durumu ve sıcaklık bilgisi Meteoroloji Genel Müdürlüğü\'nden otomatik çekilir',
          'Günlük yapılan işleri, iş gücünü ve kullanılan malzemeleri girin',
          'En az 1, en fazla 5 fotoğraf yükleyin (zorunlu)',
          'Konum bilgisi otomatik eklenir',
          'Raporu onaylayın ve gönderin'
        ]
      },
      {
        title: 'Önemli Kurallar',
        items: [
          'Günlük raporlar en fazla 7 gün geriye dönük girilebilir',
          'İleri tarihli giriş yapılamaz',
          'Her raporda en az 1 fotoğraf zorunludur',
          'Fotoğraflarda konum ve tarih bilgisi otomatik eklenir',
          'Raporlar onaylandıktan sonra düzenlenemez'
        ]
      },
      {
        title: 'Destek',
        content: 'Sorularınız için: santiyesefi@csb.gov.tr adresine e-posta gönderebilirsiniz.'
      }
    ],
    links: [
      { label: 'Resmi Kılavuz (CSB)', url: 'https://mugla.csb.gov.tr/santiye-m-uygulama-klavuzu-ve-sunum-dosyalari-113706' },
      { label: 'Web Uygulaması', url: 'https://santiyem.csb.gov.tr/' },
      { label: 'Play Store (Android)', url: 'https://play.google.com/store/apps/details?id=com.santiyem' },
      { label: 'App Store (iPhone)', url: 'https://apps.apple.com/tr/app/santiyem/id6504465498' },
    ]
  },

  parselsorgu: {
    title: 'Parsel Sorgu Kullanım Kılavuzu',
    subtitle: 'Tapu ve Kadastro Genel Müdürlüğü (TKGM)',
    sections: [
      {
        title: 'Parsel Sorgu Nedir?',
        content: 'TKGM Parsel Sorgu, Türkiye genelindeki parselleri ücretsiz olarak sorgulayabileceğiniz resmi uygulamadır. Ada/parsel bilgisi, parsel sınırları, alan, köşe koordinatları ve cephe uzunlukları gibi detaylı bilgilere ulaşabilirsiniz.'
      },
      {
        title: 'Sorgulama Yöntemleri',
        items: [
          'İdari Sorgu: İl > İlçe > Mahalle > Ada > Parsel hiyerarşisi ile sorgulama',
          'Adres Sorgu: Bina adresini girerek parsel bilgisine ulaşma',
          'Koordinat Sorgu: Enlem/boylam değerleri ile sorgulama',
          'Haritadan Sorgu: Harita üzerinde tıklayarak parsel seçme'
        ]
      },
      {
        title: 'İdari Sorgu Adımları',
        steps: [
          'parselsorgu.tkgm.gov.tr adresine gidin veya mobil uygulamayı açın',
          '"İdari Sorgu" sekmesini seçin',
          'İl, İlçe ve Mahalle bilgilerini sırasıyla seçin',
          'Ada ve Parsel numaralarını girin',
          '"Sorgula" butonuna tıklayın',
          'Parsel bilgileri ve harita görüntüsü ekrana gelecektir'
        ],
        image: { src: 'https://play-lh.googleusercontent.com/RftNurm9mb_3SRRp-P7aQVI3Xsup6JPIvSUurUXWvCn5vSDQGA-UJVwQsSk8WRviSk0=w240-h480-rw', alt: 'TKGM Parsel Sorgu ikonu', caption: 'TKGM Parsel Sorgu' }
      },
      {
        title: 'Elde Edebileceğiniz Bilgiler',
        items: [
          'Parsel alanı (m²)',
          'Parsel sınırları ve köşe noktaları',
          'Cephe uzunlukları',
          'Kadastro harita görüntüsü',
          'İmar durumu bilgisi',
          'Veri indirme (KML, GeoJSON, Shape, DXF formatları)'
        ]
      },
      {
        title: 'Dikkat Edilecekler',
        items: [
          'Uygulama ücretsizdir, kayıt gerekmez',
          'Sunulan bilgiler bilgi amaçlıdır, resmi belge yerine geçmez',
          'Eski tapularda mahalle adı/sınırları değişmiş olabilir — güncel bilgiyi kontrol edin',
          'Ada/parsel numarası değişmiş olabilir — tapu müdürlüğünden teyit edin'
        ]
      }
    ],
    links: [
      { label: 'Web Uygulaması', url: 'https://parselsorgu.tkgm.gov.tr/' },
      { label: 'Play Store (Android)', url: 'https://play.google.com/store/apps/details?id=com.tkgm.parselsorgu' },
      { label: 'App Store (iPhone)', url: 'https://apps.apple.com/tr/app/tkgm-parsel-sorgu/id1039822649' },
      { label: 'Detaylı Rehber (TKGM)', url: 'https://www.tkgm.gov.tr/en/node/13925' },
    ]
  }
};

let guideOverlay = null;

function createGuideOverlay() {
  if (guideOverlay) return guideOverlay;

  guideOverlay = document.createElement('div');
  guideOverlay.id = 'guide-overlay';
  guideOverlay.innerHTML = `
    <div class="guide-panel">
      <div class="guide-header">
        <button class="guide-close" aria-label="Kapat">←</button>
        <span class="guide-header-title"></span>
      </div>
      <div class="guide-body"></div>
    </div>
  `;

  guideOverlay.querySelector('.guide-close').addEventListener('click', closeGuide);
  guideOverlay.addEventListener('click', (e) => {
    if (e.target === guideOverlay) closeGuide();
  });

  document.getElementById('app').appendChild(guideOverlay);
  return guideOverlay;
}

export function openGuide(guideKey) {
  const guide = GUIDES[guideKey];
  if (!guide) return;

  const overlay = createGuideOverlay();
  overlay.querySelector('.guide-header-title').textContent = guide.title;

  const body = overlay.querySelector('.guide-body');
  body.innerHTML = '';

  // Subtitle
  if (guide.subtitle) {
    const sub = document.createElement('div');
    sub.className = 'guide-subtitle';
    sub.textContent = guide.subtitle;
    body.appendChild(sub);
  }

  // Sections
  for (const section of guide.sections) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'guide-section';

    const titleEl = document.createElement('h3');
    titleEl.className = 'guide-section-title';
    titleEl.textContent = section.title;
    sectionEl.appendChild(titleEl);

    if (section.content) {
      const p = document.createElement('p');
      p.className = 'guide-text';
      p.textContent = section.content;
      sectionEl.appendChild(p);
    }

    if (section.steps) {
      const ol = document.createElement('ol');
      ol.className = 'guide-steps';
      for (const step of section.steps) {
        const li = document.createElement('li');
        li.textContent = step;
        ol.appendChild(li);
      }
      sectionEl.appendChild(ol);
    }

    if (section.items) {
      const ul = document.createElement('ul');
      ul.className = 'guide-list';
      for (const item of section.items) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      sectionEl.appendChild(ul);
    }

    if (section.image) {
      const imgWrap = document.createElement('div');
      imgWrap.style.cssText = 'text-align:center;margin:12px 0;';
      const img = document.createElement('img');
      img.src = section.image.src;
      img.alt = section.image.alt || '';
      img.className = 'guide-image';
      img.style.cssText = 'max-width:120px;border-radius:16px;';
      imgWrap.appendChild(img);
      if (section.image.caption) {
        const cap = document.createElement('div');
        cap.style.cssText = 'font-size:11px;color:var(--text-tertiary);margin-top:6px;';
        cap.textContent = section.image.caption;
        imgWrap.appendChild(cap);
      }
      sectionEl.appendChild(imgWrap);
    }

    body.appendChild(sectionEl);
  }

  // Links
  if (guide.links) {
    const linksSection = document.createElement('div');
    linksSection.className = 'guide-section';

    const linksTitle = document.createElement('h3');
    linksTitle.className = 'guide-section-title';
    linksTitle.textContent = 'Bağlantılar';
    linksSection.appendChild(linksTitle);

    for (const link of guide.links) {
      const a = document.createElement('a');
      a.className = 'guide-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      linksSection.appendChild(a);
    }

    body.appendChild(linksSection);
  }

  overlay.classList.add('open');
}

function closeGuide() {
  if (guideOverlay) guideOverlay.classList.remove('open');
}
