/* ========================================
   Çok Dilli Destek (TR / EN)
   ======================================== */

const translations = {
  tr: {
    // Header
    appTitle: 'Mimarlık AI Asistanı',
    headerSub: 'Detay çizimi · Eğitim · Neufert',

    // Modlar
    modeGenel: 'Genel',
    modeDetay: 'Detay Çizimi',
    modeMalzeme: 'Malzeme',
    modeEgitim: 'Eğitim',
    modeYonetmelik: 'Yönetmelik',
    modeStatik: 'Statik',
    modeSurdurulebilir: 'Sürdürülebilir',
    modeRestorasyon: 'Restorasyon',
    modeMaliyet: 'Maliyet',
    modePeyzaj: 'Peyzaj',

    // Input
    inputPlaceholder: 'Sorunuzu yazın...',
    charLimit: 'karakter',

    // Mesajlar
    welcome: 'Merhaba! Ben mimarlık yapay zeka asistanınım.',
    welcomeDesc: 'Neufert dahil kayıtlı kaynaklardan bilgi çekerek sorularınızı yanıtlayabilirim. Başlamak için ayarları yapın.',
    sourceLabel: 'Neufert & Kaynaklar',
    typing: 'Yazıyor...',
    stopGenerating: 'Durdur',
    regenerate: 'Yeniden oluştur',
    copy: 'Kopyala',
    copied: 'Kopyalandı!',
    favorite: 'Favori',
    unfavorite: 'Favoriden çıkar',
    deleteMsg: 'Sil',

    // Ayarlar
    settings: 'Ayarlar',
    apiKeyLabel: 'Anthropic API Key',
    supabaseUrl: 'Supabase URL',
    supabaseKey: 'Supabase Anon Key',
    save: 'Kaydet',
    settingsSaved: 'Ayarlar kaydedildi!',
    apiKeyRequired: 'Anthropic API key zorunludur',
    apiKeyInvalid: 'API key geçersiz. Kontrol edin.',
    apiKeyHint: 'sk-ant-api03- ile başlamalıdır',
    supabaseUrlHint: 'https://xxx.supabase.co formatında',
    securityWarning: 'Tüm bilgiler bu cihazda yerel olarak saklanır. Kimseyle paylaşmayın.',
    deleteApiKey: 'API Key\'i Sil',
    appearance: 'Görünüm',
    darkMode: 'Karanlık Tema',
    darkModeDesc: 'Koyu renkli arayüz',
    fontSize: 'Yazı Boyutu',
    fontSmall: 'Küçük',
    fontNormal: 'Normal',
    fontLarge: 'Büyük',
    language: 'Dil',
    about: 'Hakkında',
    version: 'Versiyon',
    clearAllData: 'Tüm Verileri Sil',

    // Geçmiş
    chatHistory: 'Sohbet Geçmişi',
    searchHistory: 'Sohbetlerde ara...',
    noHistory: 'Henüz sohbet geçmişi yok',
    newChat: 'Yeni Sohbet',
    deleteChat: 'Sohbeti Sil',
    deleteChatConfirm: 'Bu sohbet kalıcı olarak silinecek. Emin misiniz?',
    cancel: 'İptal',
    confirm: 'Sil',
    today: 'Bugün',
    yesterday: 'Dün',
    daysAgo: 'gün önce',
    messages: 'mesaj',

    // Favoriler
    favorites: 'Favoriler',
    noFavorites: 'Henüz favori yanıt yok',

    // Dışa Aktarma
    export: 'Dışa Aktar',
    exportTxt: 'TXT olarak indir',
    exportPdf: 'PDF olarak indir',

    // Onboarding
    onboardingTitle1: 'Mimarlık AI Asistanına Hoş Geldiniz',
    onboardingDesc1: 'Yapay zeka destekli mimarlık asistanınız ile projelerinizi hızlandırın.',
    onboardingTitle2: 'Modları Keşfedin',
    onboardingDesc2: '10 farklı uzmanlaşmış mod ile detay çizimi, malzeme seçimi, yönetmelik ve daha fazlası.',
    onboardingTitle3: 'Hemen Başlayın',
    onboardingDesc3: 'API ayarlarınızı yapın ve sorularınızı sormaya başlayın.',
    skip: 'Atla',
    next: 'İleri',
    start: 'Başla',

    // Hatalar
    networkError: 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.',
    serverError: 'Sunucu hatası. Otomatik yeniden deneniyor...',
    rateLimitError: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.',
    timeoutError: 'Yanıt çok uzun sürdü. Tekrar deneyin.',
    unknownError: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    retrying: 'Yeniden deneniyor',
    offline: 'Çevrimdışı - İnternet bağlantısı bekleniyor',
    online: 'Bağlantı sağlandı',
    supabaseConnected: 'Kaynak veritabanı bağlı',
    supabaseDisconnected: 'Kaynak veritabanı bağlı değil',

    // Karşılama Kartları
    cardArchTitle: 'Mimari Tasarım',
    cardArchDesc: 'Ölçüler, standartlar, mekan planlaması',
    cardDetailTitle: 'Detay Çizimi',
    cardDetailDesc: 'Birleşim noktaları, katman sırası',
    cardMaterialTitle: 'Malzeme Bilgisi',
    cardMaterialDesc: 'TS EN standartları, uygulamalar',
    cardRegTitle: 'Yönetmelik',
    cardRegDesc: 'TBDY 2018, İmar Kanunu',

    // Sesli giriş
    speechStart: 'Dinliyorum...',
    speechStop: 'Dinleme durduruldu',
    speechNotSupported: 'Sesli giriş bu tarayıcıda desteklenmiyor',

    // PWA
    installApp: 'Uygulamayı yükle',
    installPrompt: 'Daha iyi bir deneyim için ana ekrana ekleyin',
    installIos: 'Paylaş butonuna basın ve "Ana Ekrana Ekle" seçin',

    // İstatistikler
    stats: 'İstatistikler',
    totalMessages: 'Toplam Mesaj',
    totalChats: 'Toplam Sohbet',
    favoriteMode: 'En Çok Kullanılan Mod',
  },

  en: {
    appTitle: 'Architecture AI Assistant',
    headerSub: 'Detail drawing · Education · Neufert',

    modeGenel: 'General',
    modeDetay: 'Detail Drawing',
    modeMalzeme: 'Material',
    modeEgitim: 'Education',
    modeYonetmelik: 'Regulation',
    modeStatik: 'Structural',
    modeSurdurulebilir: 'Sustainable',
    modeRestorasyon: 'Restoration',
    modeMaliyet: 'Cost',
    modePeyzaj: 'Landscape',

    inputPlaceholder: 'Ask your question...',
    charLimit: 'characters',

    welcome: 'Hello! I am your architecture AI assistant.',
    welcomeDesc: 'I can answer your questions by pulling information from registered sources including Neufert. Configure settings to get started.',
    sourceLabel: 'Neufert & Sources',
    typing: 'Typing...',
    stopGenerating: 'Stop',
    regenerate: 'Regenerate',
    copy: 'Copy',
    copied: 'Copied!',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    deleteMsg: 'Delete',

    settings: 'Settings',
    apiKeyLabel: 'Anthropic API Key',
    supabaseUrl: 'Supabase URL',
    supabaseKey: 'Supabase Anon Key',
    save: 'Save',
    settingsSaved: 'Settings saved!',
    apiKeyRequired: 'Anthropic API key is required',
    apiKeyInvalid: 'API key is invalid. Please check.',
    apiKeyHint: 'Must start with sk-ant-api03-',
    supabaseUrlHint: 'Format: https://xxx.supabase.co',
    securityWarning: 'All data is stored locally on this device. Do not share with anyone.',
    deleteApiKey: 'Delete API Key',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Dark themed interface',
    fontSize: 'Font Size',
    fontSmall: 'Small',
    fontNormal: 'Normal',
    fontLarge: 'Large',
    language: 'Language',
    about: 'About',
    version: 'Version',
    clearAllData: 'Clear All Data',

    chatHistory: 'Chat History',
    searchHistory: 'Search chats...',
    noHistory: 'No chat history yet',
    newChat: 'New Chat',
    deleteChat: 'Delete Chat',
    deleteChatConfirm: 'This chat will be permanently deleted. Are you sure?',
    cancel: 'Cancel',
    confirm: 'Delete',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    messages: 'messages',

    favorites: 'Favorites',
    noFavorites: 'No favorite responses yet',

    export: 'Export',
    exportTxt: 'Download as TXT',
    exportPdf: 'Download as PDF',

    onboardingTitle1: 'Welcome to Architecture AI Assistant',
    onboardingDesc1: 'Accelerate your projects with AI-powered architecture assistant.',
    onboardingTitle2: 'Explore Modes',
    onboardingDesc2: '10 specialized modes for detail drawing, material selection, regulations and more.',
    onboardingTitle3: 'Get Started',
    onboardingDesc3: 'Configure your API settings and start asking questions.',
    skip: 'Skip',
    next: 'Next',
    start: 'Start',

    networkError: 'No internet connection. Please check your connection.',
    serverError: 'Server error. Retrying automatically...',
    rateLimitError: 'Too many requests. Please wait a moment.',
    timeoutError: 'Response took too long. Try again.',
    unknownError: 'An error occurred. Please try again.',
    retrying: 'Retrying',
    offline: 'Offline - Waiting for internet connection',
    online: 'Connected',
    supabaseConnected: 'Source database connected',
    supabaseDisconnected: 'Source database not connected',

    cardArchTitle: 'Architectural Design',
    cardArchDesc: 'Dimensions, standards, space planning',
    cardDetailTitle: 'Detail Drawing',
    cardDetailDesc: 'Joints, layer order',
    cardMaterialTitle: 'Material Info',
    cardMaterialDesc: 'TS EN standards, applications',
    cardRegTitle: 'Regulations',
    cardRegDesc: 'TBDY 2018, Zoning Law',

    speechStart: 'Listening...',
    speechStop: 'Listening stopped',
    speechNotSupported: 'Voice input is not supported in this browser',

    installApp: 'Install App',
    installPrompt: 'Add to home screen for a better experience',
    installIos: 'Tap Share button and select "Add to Home Screen"',

    stats: 'Statistics',
    totalMessages: 'Total Messages',
    totalChats: 'Total Chats',
    favoriteMode: 'Most Used Mode',
  }
};

let currentLang = localStorage.getItem('app_lang') || 'tr';

export function t(key) {
  return translations[currentLang]?.[key] || translations['tr'][key] || key;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
  }
}

export function getLanguage() {
  return currentLang;
}

export function getAllTranslations() {
  return translations;
}
