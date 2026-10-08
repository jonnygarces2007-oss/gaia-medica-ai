/**
 * MediRural ECU 🇪🇨 - Native Ecuadorian Languages Medical Translator
 * Intercultural health phrases in Kichwa (Runa Shimi), Shuar Chicham, and Waorani.
 * Created by Jonny for Ecuador Healthcare.
 */

(function(window) {
    let currentLanguage = 'kichwa';

    const dictionary = [
        {
            category: 'Preguntas Clínicas Básicas',
            es: '¿Dónde te duele?',
            kichwa: '¿Maitataq nanakun?',
            shuar: '¿Tepeshar waitiapim?',
            waorani: '¿Kene nani impa?',
            phonetic: 'Mai-ta-taq na-na-kun'
        },
        {
            category: 'Preguntas Clínicas Básicas',
            es: '¿Tienes fiebre o dolor de cabeza?',
            kichwa: '¿Rupariwancha kanki icha uma nanaycha?',
            shuar: '¿Tsaasaitam tura tsumatai waitiapim?',
            waorani: '¿Ewe inike nani?',
            phonetic: 'Ru-pa-ri-wan-cha kan-ki'
        },
        {
            category: 'Instrucciones Médicas',
            es: 'Respira profundo y despacio.',
            kichwa: 'Allillamanta hatunta samay.',
            shuar: 'Penker ayamtai samatai.',
            waorani: 'Tome nene iniki.',
            phonetic: 'A-lli-lla-man-ta ha-tun-ta sa-may'
        },
        {
            category: 'Instrucciones Médicas',
            es: 'Toma este remedio con agua limpia.',
            kichwa: 'Kay hampita chuya yakuwan ukyay.',
            shuar: 'Ju ampijai umiu yumi.',
            waorani: 'Aka ampi nene.',
            phonetic: 'Kay ham-pi-ta chu-ya ya-ku-wan uk-yay'
        },
        {
            category: 'Emergencia y Rescate ECU 911',
            es: 'Tranquilo, la ayuda de emergencia del ECU 911 ya viene.',
            kichwa: 'Ama llakiychu, hampi yanapayqa shamuchunmi.',
            shuar: 'Paku amikua, yanapa winiai.',
            waorani: 'Tome nani iniki ampi.',
            phonetic: 'A-ma lla-kiy-chu sham-un-mi'
        },
        {
            category: 'Parto Rural Ecuatoriano',
            es: 'Puja suavemente cuando sientas la contracción.',
            kichwa: 'Nanay shamukpika allillamanta tangariy.',
            shuar: 'Penker tangatai nunia.',
            waorani: 'Kene wao iniki.',
            phonetic: 'Na-nay sha-muk-pi-ka tan-ga-riy'
        }
    ];

    function initLanguages() {
        renderPhrases('kichwa');
        setupLanguageChips();
    }

    function renderPhrases(lang) {
        currentLanguage = lang;
        const container = document.getElementById('phrases-grid-container');
        if (!container) return;

        let html = '';
        dictionary.forEach(item => {
            const nativeText = item[lang] || item.kichwa;
            html += `
                <div class="phrase-card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:20px; margin-bottom:14px;">
                    <span class="chip" style="font-size:0.7rem; pointer-events:none; margin-bottom:10px;">${item.category}</span>
                    <h3 style="font-size:1.05rem; margin-bottom:4px; color:var(--text-main);">${item.es}</h3>
                    <div style="font-size:1.2rem; font-weight:800; color:var(--color-info); margin:8px 0;">${nativeText}</div>
                    <small style="color:var(--text-muted); display:block; margin-bottom:14px;">Pronunciación: <em>${item.phonetic}</em></small>
                    
                    <button class="btn-secondary btn-block" onclick="MediRuralApp.speak('${nativeText.replace(/'/g, "\\'")}')">
                        🔊 Escuchar Pronunciación Kichwa
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function setupLanguageChips() {
        const chips = document.querySelectorAll('.language-selector-bar .chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                renderPhrases(chip.dataset.lang);
            });
        });
    }

    window.MediRuralLanguages = {
        initLanguages: initLanguages
    };
})(window);
