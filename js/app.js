/**
 * MediRural AI - Main Application Controller
 * Manages tab navigation, TTS Speech Synthesis, theme toggling, and module initialization.
 */

(function(window) {
    let currentSpeech = null;
    let isVoiceNarratorEnabled = true;
    let speechRequestId = 0;

    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });

    function initApp() {
        console.log("MediRural AI - Bootstrapping Offline Rural Health Assistant...");
        
        setupNavigation();
        setupThemeToggle();
        setupVoiceToggle();
        setupOfflineMonitor();
        setupPrivacyControls();
        registerServiceWorker();

        // Initialize submodules
        if (window.MediRuralMedicalChat) window.MediRuralMedicalChat.initChat();
        if (window.MediRuralTriage) window.MediRuralTriage.initTriage();
        if (window.MediRuralFirstAid) window.MediRuralFirstAid.initFirstAid();
        if (window.MediRuralVademecum) window.MediRuralVademecum.initVademecum();
        if (window.MediRuralVitals) window.MediRuralVitals.initVitals();
        if (window.MediRuralLanguages) window.MediRuralLanguages.initLanguages();
        if (window.MediRuralProfile) window.MediRuralProfile.initProfile();
        if (window.MediRuralDirectory) window.MediRuralDirectory.initDirectory();
        if (window.MediRuralSOS) window.MediRuralSOS.initSOS();
        if (window.MediRuralBeacon) window.MediRuralBeacon.initBeacon();

        announceWelcome();
    }

    function announceWelcome() {
        try {
            if (sessionStorage.getItem('gaia_welcome_announced')) return;
            sessionStorage.setItem('gaia_welcome_announced', 'true');
        } catch (error) {
            return;
        }

        window.setTimeout(() => {
            speak('Bienvenido a Gaia Medica, orientación de salud para Ecuador. Si es una emergencia, llama al ECU 911. Esta información no sustituye a un profesional de salud.');
        }, 900);
    }

    /* Tab Navigation */
    function setupNavigation() {
        const navBtns = document.querySelectorAll('[data-tab]');
        const tabPages = document.querySelectorAll('.tab-page');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTabId = btn.dataset.tab;
                openTab(targetTabId);
            });
        });
    }

    function openTab(tabId) {
        const navBtns = document.querySelectorAll('.nav-btn');
        const tabPages = document.querySelectorAll('.tab-page');

        navBtns.forEach(b => {
            if (b.dataset.tab === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        tabPages.forEach(page => {
            if (page.id === tabId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* Theme Switcher (Emergency Dark vs High Contrast Solar Mode) */
    function setupThemeToggle() {
        const btn = document.getElementById('btn-theme-toggle');
        if (!btn) return;

        const savedTheme = localStorage.getItem('medirural_theme');
        if (savedTheme === 'solar') {
            document.body.classList.add('theme-solar');
        }

        btn.addEventListener('click', () => {
            document.body.classList.toggle('theme-solar');
            const isSolar = document.body.classList.contains('theme-solar');
            localStorage.setItem('medirural_theme', isSolar ? 'solar' : 'emergency');
        });
    }

    /* TTS Speech Synthesis Controller */
    function setupVoiceToggle() {
        const btnAudio = document.getElementById('btn-audio-toggle');
        const btnStopTTS = document.getElementById('btn-stop-tts');

        if (btnAudio) {
            btnAudio.addEventListener('click', () => {
                isVoiceNarratorEnabled = !isVoiceNarratorEnabled;
                btnAudio.style.opacity = isVoiceNarratorEnabled ? '1' : '0.4';
                if (!isVoiceNarratorEnabled) {
                    stopSpeech();
                }
            });
        }

        if (btnStopTTS) {
            btnStopTTS.addEventListener('click', () => {
                stopSpeech();
            });
        }
    }

    async function speak(text) {
        if (!isVoiceNarratorEnabled) return;
        if (!('speechSynthesis' in window)) {
            console.warn("Sintetizador de voz no disponible");
            return;
        }

        stopSpeech();
        const requestId = speechRequestId;
        const voices = await loadVoices();
        if (!isVoiceNarratorEnabled || requestId !== speechRequestId) return;

        const toast = document.getElementById('tts-indicator');
        const toastText = document.getElementById('tts-toast-text');

        if (toast && toastText) {
            toastText.textContent = `Voz: "${text.substring(0, 35)}..."`;
            toast.classList.remove('hidden');
        }

        currentSpeech = new SpeechSynthesisUtterance(text);
        const spanishVoices = voices
            .filter((voice) => voice.lang.toLowerCase().startsWith('es'));
        const maleSpanishVoice = spanishVoices.find((voice) =>
            /\b(pablo|jorge|diego|juan|carlos|miguel|antonio|raul|luis|javier|roberto|male|masculine|hombre)\b/i.test(voice.name)
        );
        const selectedVoice = maleSpanishVoice || spanishVoices.find((voice) => voice.default);
        currentSpeech.lang = selectedVoice ? selectedVoice.lang : 'es-ES';
        if (selectedVoice) currentSpeech.voice = selectedVoice;
        currentSpeech.rate = 0.95; // Slightly slower for clarity in rural environments

        currentSpeech.onend = () => {
            if (toast) toast.classList.add('hidden');
        };

        currentSpeech.onerror = () => {
            if (toast) toast.classList.add('hidden');
        };

        window.speechSynthesis.speak(currentSpeech);
    }

    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length) return Promise.resolve(voices);

        return new Promise((resolve) => {
            let settled = false;
            const finish = (availableVoices) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                resolve(availableVoices);
            };
            const onVoicesChanged = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length) finish(availableVoices);
            };
            const timeoutId = window.setTimeout(() => {
                finish(window.speechSynthesis.getVoices());
            }, 1000);

            window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        });
    }

    function stopSpeech() {
        speechRequestId += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        const toast = document.getElementById('tts-indicator');
        if (toast) toast.classList.add('hidden');
    }

    function isVoiceEnabled() {
        return isVoiceNarratorEnabled;
    }

    function setupPrivacyControls() {
        const clearButton = document.getElementById('btn-clear-local-health-data');
        const status = document.getElementById('local-health-data-status');
        if (!clearButton) return;

        clearButton.addEventListener('click', () => {
            const confirmed = window.confirm('Se borrarán de este navegador la ficha, signos vitales, historial del chat y contactos guardados. Esta acción no se puede deshacer. ¿Continuar?');
            if (!confirmed) return;

            const localKeys = [
                'medirural_patient_profile',
                'medirural_vitals_log',
                'medirural_medical_chat_history',
                'gaia_medica_chat_learning',
                'medirural_ecuador_contacts'
            ];
            const sessionKeys = [
                'medirural_medical_chat_session',
                'gaia_medica_chat_learning_session'
            ];

            try {
                localKeys.forEach((key) => localStorage.removeItem(key));
                sessionKeys.forEach((key) => sessionStorage.removeItem(key));
                if (status) status.textContent = 'Datos locales de salud borrados. Actualizando la página...';
                clearButton.disabled = true;
                window.setTimeout(() => window.location.reload(), 700);
            } catch (error) {
                if (status) status.textContent = 'No se pudieron borrar todos los datos. Revisa los permisos del navegador.';
            }
        });
    }

    /* Offline Status Indicator */
    function setupOfflineMonitor() {
        const statusElem = document.getElementById('connection-status');
        if (!statusElem) return;

        function updateStatus() {
            if (navigator.onLine) {
                statusElem.textContent = "⚡ CONECTADO / OFFLINE LISTO";
                statusElem.style.borderColor = "rgba(16, 185, 129, 0.4)";
            } else {
                statusElem.textContent = "📡 MODO OFFLINE ACTIVO";
                statusElem.style.borderColor = "rgba(245, 158, 11, 0.6)";
            }
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    /* PWA Service Worker Registration */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registrado:', reg.scope))
                .catch(err => console.log('Service Worker no registrado:', err));
        }
    }

    window.MediRuralApp = {
        openTab: openTab,
        speak: speak,
        stopSpeech: stopSpeech,
        isVoiceEnabled: isVoiceEnabled
    };
})(window);
