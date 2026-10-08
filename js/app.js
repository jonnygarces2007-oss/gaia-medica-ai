/**
 * MediRural AI - Main Application Controller
 * Manages tab navigation, TTS Speech Synthesis, theme toggling, and module initialization.
 */

(function(window) {
    let currentSpeech = null;
    let isVoiceNarratorEnabled = true;

    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });

    function initApp() {
        console.log("MediRural AI - Bootstrapping Offline Rural Health Assistant...");
        
        setupNavigation();
        setupThemeToggle();
        setupVoiceToggle();
        setupOfflineMonitor();
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
    }

    /* Tab Navigation */
    function setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
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

    function speak(text) {
        if (!isVoiceNarratorEnabled) return;
        if (!('speechSynthesis' in window)) {
            console.warn("Sintetizador de voz no disponible");
            return;
        }

        stopSpeech();

        const toast = document.getElementById('tts-indicator');
        const toastText = document.getElementById('tts-toast-text');

        if (toast && toastText) {
            toastText.textContent = `Voz: "${text.substring(0, 35)}..."`;
            toast.classList.remove('hidden');
        }

        currentSpeech = new SpeechSynthesisUtterance(text);
        currentSpeech.lang = 'es-ES';
        currentSpeech.rate = 0.95; // Slightly slower for clarity in rural environments

        currentSpeech.onend = () => {
            if (toast) toast.classList.add('hidden');
        };

        currentSpeech.onerror = () => {
            if (toast) toast.classList.add('hidden');
        };

        window.speechSynthesis.speak(currentSpeech);
    }

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        const toast = document.getElementById('tts-indicator');
        if (toast) toast.classList.add('hidden');
    }

    function isVoiceEnabled() {
        return isVoiceNarratorEnabled;
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
