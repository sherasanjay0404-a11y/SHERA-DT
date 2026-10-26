/**
 * Magilir Kulu — RuralShield AI
 * Vanilla JavaScript Authentication Client with Bilingual Tamil/English Support
 */

(function () {
  'use strict';

  let currentLang = localStorage.getItem('magilir_kulu_lang') || 'en';
  let currentCondition = 'STRONG'; // 'STRONG', 'WEAK', 'OFFLINE'
  let csrfToken = '';

  const DICT = {
    en: {
      appName: 'Magilir Kulu',
      tagline: "Authentication That Works Even When the Network Doesn't.",
      purpose: "Provide secure and accessible login for Magilir Kulu users, especially those in rural areas with unstable internet connectivity.",
      welcome: "Welcome Back",
      subtitle: "Verify your identity securely.",
      email: "Email Address",
      badgeStrong: "Strong Network",
      badgeWeak: "Weak Network",
      badgeOffline: "Offline Mode",
      descStrong: "A stable connection is available. Passkey authentication is recommended.",
      descWeak: "Your connection is unstable. TOTP authentication is recommended.",
      descOffline: "The server cannot be reached. Only previously provisioned trusted-device access may be available.",
      passkeyHdr: "Passkey Authentication",
      passkeyPrompt: "Continue securely with your passkey.",
      passkeyBtn: "Verify with Passkey",
      totpHdr: "TOTP Authentication",
      totpPrompt: "Enter the code from your authenticator application.",
      totpBtn: "Submit Code",
      offlineHdr: "Trusted Device PIN",
      offlinePrompt: "Check this device for authorized offline access.",
      offlineBtn: "Unlock Trusted Device",
      offlineUnprov: "Offline access has not been configured on this device. Connect to the internet and complete the approved device-provisioning process first.",
      policyNotice: "The authentication method is automatically selected based on current network conditions. User manual selection is disabled by cybersecurity policy."
    },
    ta: {
      appName: 'மகளிர் குழு',
      tagline: "இணைய இணைப்பு இல்லாதபோதும் பாதுகாப்பான அங்கீகாரம்.",
      purpose: "இணைய இணைப்பு நிலையற்ற கிராமப்புற மகளிர் குழு உறுப்பினர்கள் மற்றும் தலைவர்களுக்கான பாதுகாப்பான உள்நுழைவு.",
      welcome: "மீண்டும் வரவேற்கிறோம்",
      subtitle: "உங்கள் அடையாளத்தைப் பாதுகாப்பாகச் சரிபார்க்கவும்.",
      email: "மின்னஞ்சல் முகவரி",
      badgeStrong: "வலுவான இணைய இணைப்பு",
      badgeWeak: "பலவீனமான இணைய இணைப்பு",
      badgeOffline: "இணைய இணைப்பு இல்லை",
      descStrong: "நிலையான இணைய இணைப்பு உள்ளது. Passkey அங்கீகாரம் பரிந்துரைக்கப்படுகிறது.",
      descWeak: "உங்கள் இணைய இணைப்பு சீரற்றதாக உள்ளது. TOTP அங்கீகாரம் பரிந்துரைக்கப்படுகிறது.",
      descOffline: "சேவையகத்தை அணுக முடியவில்லை. முன்பே அமைக்கப்பட்ட அங்கீகரிக்கப்பட்ட சாதன அணுகல் மட்டுமே கிடைக்கும்.",
      passkeyHdr: "Passkey அங்கீகாரம்",
      passkeyPrompt: "உங்கள் Passkey மூலம் பாதுகாப்பாகத் தொடரவும்.",
      passkeyBtn: "Passkey மூலம் சரிபார்க்கவும்",
      totpHdr: "TOTP குறியீடு அங்கீகாரம்",
      totpPrompt: "உங்கள் அங்கீகாரச் செயலியில் உள்ள குறியீட்டை உள்ளிடவும்.",
      totpBtn: "குறியீட்டைச் சரிபார்க்கவும்",
      offlineHdr: "அங்கீகரிக்கப்பட்ட சாதன PIN",
      offlinePrompt: "இந்தச் சாதனத்தில் அங்கீகரிக்கப்பட்ட இணையமில்லா அணுகலைச் சரிபார்க்கவும்.",
      offlineBtn: "நம்பகமான சாதனத்தைத் திறக்கவும்",
      offlineUnprov: "இந்தச் சாதனத்தில் இணையமில்லா அணுகல் அமைக்கப்படவில்லை. முதலில் இணையத்துடன் இணைந்து அங்கீகரிக்கப்பட்ட சாதன அமைப்பை முடிக்கவும்.",
      policyNotice: "இணைய இணைப்பு நிலையின் அடிப்படையில் அங்கீகார முறை தானாகவே தேர்ந்தெடுக்கப்படுகிறது. பாதுகாப்பு விதிகளின்படி பயனர்கள் கைமுறையாக மாற்ற முடியாது."
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('magilir_kulu_lang', lang);
    const t = DICT[lang];

    document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-lang-ta').classList.toggle('active', lang === 'ta');

    document.getElementById('hdr-app-name').textContent = t.appName;
    document.getElementById('txt-tagline').textContent = t.tagline;
    document.getElementById('txt-purpose').textContent = t.purpose;
    document.getElementById('txt-welcome').textContent = t.welcome;
    document.getElementById('txt-subtitle').textContent = t.subtitle;
    document.getElementById('lbl-email').textContent = t.email;
    document.getElementById('txt-no-switch').textContent = t.policyNotice;

    document.getElementById('txt-passkey-hdr').textContent = t.passkeyHdr;
    document.getElementById('txt-passkey-prompt').textContent = t.passkeyPrompt;
    document.getElementById('btn-passkey').textContent = t.passkeyBtn;

    document.getElementById('txt-totp-hdr').textContent = t.totpHdr;
    document.getElementById('txt-totp-prompt').textContent = t.totpPrompt;
    document.getElementById('btn-totp').textContent = t.totpBtn;

    document.getElementById('txt-offline-hdr').textContent = t.offlineHdr;
    document.getElementById('txt-offline-prompt').textContent = t.offlinePrompt;
    document.getElementById('btn-pin').textContent = t.offlineBtn;
    document.getElementById('txt-offline-unprov').textContent = t.offlineUnprov;

    updateNetworkUI();
  }

  function updateNetworkUI() {
    const t = DICT[currentLang];
    const badge = document.getElementById('network-badge');
    const recomDesc = document.getElementById('recom-desc');
    const recomTitle = document.getElementById('recom-title');

    badge.className = 'status-badge';
    document.getElementById('section-passkey').classList.add('hidden');
    document.getElementById('section-totp').classList.add('hidden');
    document.getElementById('section-offline').classList.add('hidden');

    document.getElementById('rule-strong').classList.remove('active');
    document.getElementById('rule-weak').classList.remove('active');
    document.getElementById('rule-offline').classList.remove('active');

    if (currentCondition === 'STRONG') {
      badge.textContent = t.badgeStrong;
      recomTitle.textContent = t.passkeyHdr;
      recomDesc.textContent = t.descStrong;
      document.getElementById('section-passkey').classList.remove('hidden');
      document.getElementById('rule-strong').classList.add('active');
    } else if (currentCondition === 'WEAK') {
      badge.classList.add('weak');
      badge.textContent = t.badgeWeak;
      recomTitle.textContent = t.totpHdr;
      recomDesc.textContent = t.descWeak;
      document.getElementById('section-totp').classList.remove('hidden');
      document.getElementById('rule-weak').classList.add('active');
    } else {
      badge.classList.add('offline');
      badge.textContent = t.badgeOffline;
      recomTitle.textContent = t.offlineHdr;
      recomDesc.textContent = t.descOffline;
      document.getElementById('section-offline').classList.remove('hidden');
      document.getElementById('rule-offline').classList.add('active');

      // Check if trusted device lease exists
      const lease = localStorage.getItem('ruralshield_device_lease');
      if (!lease) {
        document.getElementById('offline-unprovisioned').classList.remove('hidden');
        document.getElementById('offline-form').classList.add('hidden');
      } else {
        document.getElementById('offline-unprovisioned').classList.add('hidden');
        document.getElementById('offline-form').classList.remove('hidden');
      }
    }
  }

  async function probeNetwork() {
    if (!navigator.onLine) {
      currentCondition = 'OFFLINE';
      updateNetworkUI();
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/network/status?t=' + Date.now(), { signal: controller.signal });
      clearTimeout(tid);

      const rtt = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        if (data.csrf_token) csrfToken = data.csrf_token;
        currentCondition = rtt <= 500 ? 'STRONG' : 'WEAK';
      } else {
        currentCondition = 'OFFLINE';
      }
    } catch {
      currentCondition = 'OFFLINE';
    }
    updateNetworkUI();
  }

  // Setup event listeners
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-lang-en').addEventListener('click', () => applyLanguage('en'));
    document.getElementById('btn-lang-ta').addEventListener('click', () => applyLanguage('ta'));

    applyLanguage(currentLang);
    probeNetwork();
    setInterval(probeNetwork, 9000);

    // Network simulation buttons
    document.querySelectorAll('.sim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (mode === 'STRONG') currentCondition = 'STRONG';
        else if (mode === 'WEAK') currentCondition = 'WEAK';
        else if (mode === 'OFFLINE') currentCondition = 'OFFLINE';
        else probeNetwork();
        updateNetworkUI();
      });
    });
  });
})();
