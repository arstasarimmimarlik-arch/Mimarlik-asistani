/* ========================================
   Mod Tanımları & System Prompt'lar
   ======================================== */

import { t } from './i18n.js';

export const MODES = {
  genel: {
    icon: '🏠',
    labelKey: 'modeGenel',
    prompt: `Sen uzman bir mimar yapay zeka asistanısın. Türkçe yanıt ver. Mimarlık, yapı teknolojisi, detay çizimi, malzeme bilgisi, yapı fiziği ve Türkiye mimarlık pratiği hakkında derin bilgiye sahipsin. Yanıtlarını açık, pratik ve eyleme dönüştürülebilir şekilde ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan: başlıklar, listeler, kalın metin, tablolar ile yanıtları yapılandır.`,
    suggestions: [
      { text: 'Yatak odası minimum kaç m² olmalı?', icon: '📐' },
      { text: 'Kolon-kiriş birleşim detayı nasıl çizilir?', icon: '🏗️' },
      { text: 'TBDY 2018 nedir?', icon: '📋' },
    ]
  },
  detay: {
    icon: '📐',
    labelKey: 'modeDetay',
    prompt: `Sen uzman bir yapı detay mimarısın. Türkçe yanıt ver. AutoCAD ve SketchUp'ta çalışan mimarlar için pratik detay çizim rehberi ver. Katman sırası, malzeme isimleri, TS standartları ve somut ölçüler kullan. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Düz çatı su yalıtım detayı', icon: '🏠' },
      { text: 'Temel-duvar birleşim detayı', icon: '🧱' },
      { text: 'Pencere kasası montaj detayı', icon: '🪟' },
    ]
  },
  malzeme: {
    icon: '🧱',
    labelKey: 'modeMalzeme',
    prompt: `Sen uzman bir yapı malzemeleri ve sistemleri mimarısın. Türkçe yanıt ver. Malzeme seçimi, TS EN standartları, Türkiye piyasasında mevcut markalar ve uygulama detayları konularında bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'XPS ve EPS farkı nedir?', icon: '🔬' },
      { text: 'Dış cephe yalıtım malzemeleri karşılaştırması', icon: '🏢' },
      { text: 'C30/37 beton sınıfı özellikleri', icon: '🧪' },
    ]
  },
  egitim: {
    icon: '📚',
    labelKey: 'modeEgitim',
    prompt: `Sen bir mimarlık öğretmeni/mentörüsün. Türkçe yanıt ver. Kavramları adım adım açıkla, örnekler ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Altın oran nedir ve mimarlıkta nasıl kullanılır?', icon: '🎨' },
      { text: 'Le Corbusier\'in 5 ilkesi nelerdir?', icon: '👤' },
      { text: 'Yapı statiğinde moment nedir?', icon: '📖' },
    ]
  },
  yonetmelik: {
    icon: '⚖️',
    labelKey: 'modeYonetmelik',
    prompt: `Sen Türk mimarlık mevzuatı uzmanısın. Türkçe yanıt ver. TBDY 2018, İmar Kanunu, BEP, Yangın Yönetmeliği hakkında detaylı bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Yangın merdiveni minimum genişliği', icon: '🚒' },
      { text: 'Emsal hesabı nasıl yapılır?', icon: '📊' },
      { text: 'Engelli rampa eğim oranı nedir?', icon: '♿' },
    ]
  },
  statik: {
    icon: '🏗️',
    labelKey: 'modeStatik',
    prompt: `Sen uzman bir yapı statiği mühendisi/mimarısın. Türkçe yanıt ver. Betonarme, çelik yapı, yük hesabı, deprem analizi, temel tasarımı konularında detaylı bilgi ver. TS 500, TBDY 2018 standartlarını referans al. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Kolon boyutlandırma nasıl yapılır?', icon: '📏' },
      { text: 'Deprem yükü hesaplama adımları', icon: '🌍' },
      { text: 'Döşeme kalınlığı hesabı', icon: '🧮' },
    ]
  },
  surdurulebilir: {
    icon: '🌿',
    labelKey: 'modeSurdurulebilir',
    prompt: `Sen sürdürülebilir mimarlık ve yeşil bina uzmanısın. Türkçe yanıt ver. LEED, BREEAM, pasif ev tasarımı, enerji verimliliği, yenilenebilir enerji sistemleri, su tasarrufu ve çevre dostu malzemeler hakkında detaylı bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'LEED sertifikası nasıl alınır?', icon: '🏅' },
      { text: 'Pasif ev tasarım prensipleri', icon: '🏡' },
      { text: 'Yeşil çatı uygulama detayları', icon: '🌱' },
    ]
  },
  restorasyon: {
    icon: '🏛️',
    labelKey: 'modeRestorasyon',
    prompt: `Sen tarihi yapı restorasyonu uzmanısın. Türkçe yanıt ver. Koruma ilkeleri, ICOMOS tüzükleri, rölöve-restitüsyon-restorasyon süreçleri, tarihi malzeme analizi, tescil süreçleri hakkında detaylı bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Rölöve çizimi nasıl yapılır?', icon: '📋' },
      { text: 'Venedik Tüzüğü ilkeleri', icon: '📜' },
      { text: 'Tarihi yapı taş onarım teknikleri', icon: '🪨' },
    ]
  },
  maliyet: {
    icon: '💰',
    labelKey: 'modeMaliyet',
    prompt: `Sen metraj, keşif ve maliyet analizi uzmanısın. Türkçe yanıt ver. Birim fiyat analizi, poz numaraları, metraj hesabı, hakediş düzenleme, Çevre ve Şehircilik Bakanlığı birim fiyatları hakkında detaylı bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'Kaba inşaat metraj hesabı nasıl yapılır?', icon: '📝' },
      { text: 'Poz numarası nedir?', icon: '🔢' },
      { text: '2024 birim fiyat listesi referansları', icon: '💵' },
    ]
  },
  peyzaj: {
    icon: '🌳',
    labelKey: 'modePeyzaj',
    prompt: `Sen peyzaj mimarlığı uzmanısın. Türkçe yanıt ver. Bitkilendirme, sert zemin tasarımı, kentsel peyzaj, sulama sistemleri, drenaj, peyzaj aydınlatma ve mekansal planlama hakkında detaylı bilgi ver. Sana verilen kaynak bilgisini öncelikli olarak kullan. Markdown formatını kullan.`,
    suggestions: [
      { text: 'İstanbul iklimine uygun ağaç türleri', icon: '🌲' },
      { text: 'Peyzaj sulama sistemi tasarımı', icon: '💧' },
      { text: 'Sert zemin malzeme seçenekleri', icon: '🪨' },
    ]
  }
};

export function getModePrompt(modeKey) {
  return MODES[modeKey]?.prompt || MODES.genel.prompt;
}

export function getModeSuggestions(modeKey) {
  return MODES[modeKey]?.suggestions || MODES.genel.suggestions;
}

export function getModeLabel(modeKey) {
  const mode = MODES[modeKey];
  if (!mode) return modeKey;
  return t(mode.labelKey);
}

export function getModeIcon(modeKey) {
  return MODES[modeKey]?.icon || '🏠';
}

export function getAllModes() {
  return Object.keys(MODES);
}
