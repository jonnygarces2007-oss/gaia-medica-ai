/**
 * MediRural AI - First Aid Guides & Metronome Module
 * Contains visual offline emergency cards, step-by-step procedures, and AudioContext RCP metronome.
 */

(function(window) {
    let audioCtx = null;
    let metronomeInterval = null;
    let isMetronomeRunning = false;
    let bpm = 110;

    const firstAidData = [
        {
            id: 'rcp_guide', category: 'vital', title: 'RCP en adulto',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
            desc: 'Para una persona adulta inconsciente que no respira normalmente. No pierdas tiempo buscando el pulso.',
            emergency: 'Llama al ECU 911, activa el altavoz y pide un DEA si hay uno disponible.',
            steps: [
                'Comprueba que el lugar sea seguro, háblale en voz alta y pide ayuda.',
                'Abre la vía aérea con cuidado y observa la respiración por no más de 10 segundos. Jadeos aislados no son respiración normal.',
                'Pon el talón de una mano en el centro del pecho y la otra encima. Con brazos rectos, comprime fuerte y rápido: 100 a 120 por minuto, dejando que el pecho vuelva a subir.',
                'Si no tienes entrenamiento o no puedes dar ventilaciones, continúa solo con compresiones. Si estás entrenado, alterna 30 compresiones y 2 ventilaciones.',
                'Sigue las instrucciones del ECU 911 hasta que llegue ayuda, respire normalmente o no puedas continuar.'
            ],
            audioGuide: 'RCP en adulto. Si no responde y no respira normalmente, llama al ECU 911 en altavoz. Coloca las manos en el centro del pecho y comprime fuerte y rápido, de cien a ciento veinte veces por minuto. Sigue las instrucciones del operador.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/cpr/'
        },
        {
            id: 'heimlich_guide', category: 'vital', title: 'Atragantamiento en adulto o niño mayor de 1 año',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
            desc: 'Actúa si no puede hablar, respirar o toser eficazmente. En lactantes, llama al ECU 911 y sigue sus instrucciones.',
            emergency: 'Pide a alguien que llame al ECU 911 mientras ayudas.',
            steps: [
                'Si puede toser o hablar, anímale a toser y observa; no hagas maniobras mientras la tos sea eficaz.',
                'Si no puede, inclínale hacia delante y da hasta 5 golpes firmes entre los omóplatos.',
                'Si no se libera, realiza hasta 5 compresiones abdominales hacia dentro y arriba. Revisa después de cada intento si el objeto salió.',
                'Alterna 5 golpes en la espalda y 5 compresiones hasta que respire, llegue ayuda o quede inconsciente.',
                'Si queda inconsciente, bájale al suelo con cuidado, llama al ECU 911 e inicia RCP siguiendo al operador. Retira solo objetos claramente visibles; no introduzcas los dedos a ciegas.'
            ],
            audioGuide: 'Atragantamiento grave. Pide que llamen al ECU 911. Inclina a la persona hacia delante y da hasta cinco golpes entre los omóplatos. Si no funciona, realiza hasta cinco compresiones abdominales. Alterna y sigue las instrucciones del operador.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/choking/'
        },
        {
            id: 'snake_guide', category: 'trauma', title: 'Mordedura de serpiente',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>',
            desc: 'Toda mordedura requiere evaluación urgente. No intentes reconocer la especie ni acercarte para fotografiarla.',
            emergency: 'Llama al ECU 911 y solicita traslado urgente a un centro de salud.',
            steps: [
                'Aléjate de la serpiente. No intentes capturarla ni matarla.',
                'Mantén a la persona quieta y tranquila; limita el movimiento de la extremidad sin apretar.',
                'Retira anillos, reloj o prendas apretadas antes de que aparezca hinchazón.',
                'No cortes, succiones, exprimas ni apliques hielo, sustancias o torniquetes. No retrases el traslado.',
                'Sigue las instrucciones del ECU 911 y del personal sanitario.'
            ],
            audioGuide: 'Mordedura de serpiente. Aléjate del animal y llama al ECU 911. Mantén a la persona quieta, retira objetos apretados y no cortes, succiones ni pongas torniquetes. Sigue las instrucciones del operador.'
        },
        {
            id: 'bleeding_guide', category: 'lesion', title: 'Hemorragia grave',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/></svg>',
            desc: 'Sangrado abundante, continuo o que empapa rápidamente la ropa puede ser una emergencia.',
            emergency: 'Llama al ECU 911 de inmediato; usa el altavoz si estás solo.',
            steps: [
                'Si hay guantes, póntelos. Presiona directamente la herida con una gasa o tela limpia.',
                'Mantén presión firme y continua. Si hay un objeto incrustado, no lo retires ni presiones encima; presiona alrededor.',
                'Pide a otra persona que llame al ECU 911. No levantes la tela para revisar; si se empapa, añade otra encima.',
                'Mantén a la persona abrigada y quieta, y vigila su respuesta y respiración.',
                'Usa un torniquete solo si dispones de uno adecuado y sabes aplicarlo, o si el operador del ECU 911 te guía.'
            ],
            audioGuide: 'Hemorragia grave. Llama al ECU 911. Presiona directamente la herida con una tela limpia y mantén presión continua. No retires objetos incrustados. Sigue las instrucciones del operador.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/severe-bleeding/'
        },
        {
            id: 'birth_guide', category: 'parto', title: 'Parto inminente mientras llega ayuda',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>',
            desc: 'Si el nacimiento parece inminente, prioriza ayuda profesional y sigue la orientación del ECU 911.',
            emergency: 'Llama al ECU 911. No dejes sola a la madre.',
            steps: [
                'Llama al ECU 911 y sigue al operador. Prepara un lugar limpio, seco y abrigado.',
                'Ayuda a la madre a estar en una posición cómoda y conserva su privacidad.',
                'Si el bebé nace antes de que llegue ayuda, sosténlo con cuidado; no tires de él ni del cordón umbilical.',
                'Sécalo y mantenlo abrigado piel con piel sobre el pecho de la madre, si ambos están estables.',
                'No cortes ni tires del cordón y no intentes retirar la placenta. Vigila el sangrado y la respiración mientras llega el personal sanitario.'
            ],
            audioGuide: 'Parto inminente. Llama al ECU 911 y sigue al operador. Si el bebé nace antes de la ayuda, sécalo y mantenlo abrigado piel con piel. No tires ni cortes el cordón y no intentes retirar la placenta.'
        },
        {
            id: 'fracture_guide', category: 'lesion', title: 'Sospecha de fractura',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/></svg>',
            desc: 'Dolor intenso, deformidad, herida sobre el hueso o pérdida de sensibilidad requiere evaluación.',
            emergency: 'Llama al ECU 911 ante hueso expuesto, lesión de cabeza, cuello, espalda o cadera, o pérdida de sensibilidad.',
            steps: [
                'No intentes enderezar, mover ni recolocar la parte lesionada. Pide ayuda.',
                'Mantén la extremidad quieta en la posición encontrada y apóyala con cuidado, sin apretar.',
                'Si hay una herida, cúbrela con una tela limpia. Presiona alrededor, no sobre un hueso expuesto.',
                'Retira anillos o elementos apretados si puede hacerse sin mover la lesión.',
                'Vigila dolor, color, temperatura y sensibilidad mientras contactas a un servicio de salud.'
            ],
            audioGuide: 'Sospecha de fractura. No endereces ni muevas la zona. Manténla apoyada como está y llama al ECU 911 si hay hueso expuesto, lesión de espalda o pérdida de sensibilidad.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/fractures-and-broken-bones/'
        },
        {
            id: 'burns_guide', category: 'other', title: 'Quemadura o escaldadura',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/></svg>',
            desc: 'Enfría la zona y busca ayuda si la lesión es extensa, profunda o afecta la cara o la respiración.',
            emergency: 'Llama al ECU 911 si es extensa o profunda, afecta cara o vía aérea, o fue química o eléctrica.',
            steps: [
                'Asegura el lugar y detén el contacto con la fuente sin exponerte.',
                'Enfría la quemadura con agua corriente fresca durante 20 minutos si está disponible.',
                'Retira joyas o prendas cercanas antes de que aparezca hinchazón; no retires nada pegado a la piel.',
                'No uses hielo, pasta, aceites ni cremas; no rompas ampollas.',
                'Cúbrela sin apretar con material limpio y solicita valoración sanitaria.'
            ],
            audioGuide: 'Quemadura. Enfría la zona con agua corriente fresca durante veinte minutos. No uses hielo, aceites ni cremas, y no retires ropa pegada. Llama al ECU 911 si es extensa, profunda o afecta la respiración.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/burns-and-scalds/'
        },
        {
            id: 'seizure_guide', category: 'other', title: 'Convulsión',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="m13 2 1 6 5-2-2 6 5 1"/></svg>',
            desc: 'Protege a la persona de golpes y mide cuánto dura la convulsión.',
            emergency: 'Llama al ECU 911 si dura 5 minutos o más, se repite, es la primera, hay lesión o no recupera la respiración normal.',
            steps: [
                'Retira objetos peligrosos alrededor y protege la cabeza con algo blando.',
                'Afloja la ropa del cuello y mide el tiempo. No sujetes a la persona ni intentes detener los movimientos.',
                'No introduzcas nada en la boca y no le des agua, comida ni medicamentos durante la convulsión.',
                'Cuando terminen los movimientos, comprueba si respira normalmente. Si respira, colócala de lado y vigílala.',
                'Si no respira normalmente, llama al ECU 911 e inicia RCP si sabes hacerlo, siguiendo al operador.'
            ],
            audioGuide: 'Convulsión. Aleja objetos y protege la cabeza. No sujetes a la persona ni pongas nada en su boca. Mide cuánto dura. Al terminar, revisa si respira y sigue las instrucciones del ECU 911.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/seizure/'
        },
        {
            id: 'chest_pain_guide', category: 'vital', title: 'Dolor fuerte en el pecho',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
            desc: 'Dolor opresivo en el pecho, falta de aire, sudor frío o desmayo puede ser una emergencia.',
            emergency: 'Llama al ECU 911 ahora. No conduzcas a la persona por cuenta propia.',
            steps: [
                'Ayuda a la persona a detener la actividad y descansar en una posición cómoda.',
                'Llama al ECU 911 y describe los síntomas y la ubicación; sigue al operador.',
                'Afloja ropa ajustada y mantén a la persona acompañada y abrigada.',
                'No le des comida, bebida ni medicamentos ajenos. Solo ayuda con su propio tratamiento previamente indicado.',
                'Vigila respiración y respuesta. Si queda inconsciente y no respira normalmente, inicia RCP guiada por el operador.'
            ],
            audioGuide: 'Dolor fuerte en el pecho. Llama al ECU 911 ahora. Ayuda a la persona a descansar, no la dejes sola y no le des medicamentos ajenos. Sigue las instrucciones del operador.',
            sourceUrl: 'https://www.sja.org.uk/first-aid-advice/heart-attack/'
        }
    ];

    function initFirstAid() {
        renderGuides('all');
        setupMetronome();
        setupFilterChips();
    }

    function renderGuides(filter) {
        const container = document.getElementById('guides-grid-container');
        if (!container) return;

        const filtered = (filter === 'all') 
            ? firstAidData 
            : firstAidData.filter(g => g.category === filter);

        const categoryLabels = {
            vital: 'Soporte vital',
            trauma: 'Mordeduras',
            lesion: 'Lesiones',
            parto: 'Parto',
            other: 'Otras urgencias'
        };

        container.innerHTML = filtered.map((guide) => `
            <article class="guide-card">
                <div class="guide-icon-header">
                    <div class="guide-icon">${guide.icon}</div>
                    <span class="guide-category-label">${categoryLabels[guide.category] || 'Primeros auxilios'}</span>
                </div>
                <h3>${escapeHtml(guide.title)}</h3>
                <p class="guide-description">${escapeHtml(guide.desc)}</p>
                <div class="guide-emergency-callout"><strong>Escalamiento:</strong> ${escapeHtml(guide.emergency)}</div>
                <ol class="guide-steps">${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
                ${guide.sourceUrl ? `<a class="guide-source" href="${guide.sourceUrl}" target="_blank" rel="noopener noreferrer">Referencia clínica: St John Ambulance</a>` : '<p class="guide-source">Guía general. Confirma indicaciones con ECU 911 o MSP Ecuador.</p>'}
                <button class="btn-secondary btn-block guide-audio-button" type="button" data-guide-id="${guide.id}" aria-label="Escuchar guía: ${escapeHtml(guide.title)}">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                    <span>Escuchar guía</span>
                </button>
            </article>
        `).join('');

        container.querySelectorAll('.guide-audio-button').forEach((button) => {
            button.addEventListener('click', () => {
                const guide = firstAidData.find((item) => item.id === button.dataset.guideId);
                if (guide && window.MediRuralApp) window.MediRuralApp.speak(guide.audioGuide);
            });
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setupFilterChips() {
        const chips = document.querySelectorAll('.filter-chips .chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                renderGuides(chip.dataset.filter);
            });
        });
    }

    function setupMetronome() {
        const btnStart = document.getElementById('btn-start-metronome');
        const beatCircle = document.getElementById('metronome-beat-circle');
        const btnSpeech = document.getElementById('btn-speech-rcp');

        if (!btnStart) return;

        btnStart.addEventListener('click', () => {
            if (isMetronomeRunning) {
                stopMetronome();
            } else {
                startMetronome();
            }
        });

        if (btnSpeech) {
            btnSpeech.addEventListener('click', () => {
                MediRuralApp.speak(firstAidData[0].audioGuide);
            });
        }
    }

    function startMetronome() {
        const btnStart = document.getElementById('btn-start-metronome');
        const beatCircle = document.getElementById('metronome-beat-circle');

        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isMetronomeRunning = true;
        btnStart.classList.add('btn-sos-pulse');
        btnStart.innerHTML = `<span>⏹️ DETENER METRÓNOMO</span>`;

        const intervalMs = (60 / bpm) * 1000;

        metronomeInterval = setInterval(() => {
            playBeatTone();
            if (beatCircle) {
                beatCircle.classList.add('beat-pulse');
                setTimeout(() => beatCircle.classList.remove('beat-pulse'), 120);
            }
        }, intervalMs);
    }

    function stopMetronome() {
        const btnStart = document.getElementById('btn-start-metronome');
        if (metronomeInterval) {
            clearInterval(metronomeInterval);
            metronomeInterval = null;
        }
        isMetronomeRunning = false;
        if (btnStart) {
            btnStart.classList.remove('btn-sos-pulse');
            btnStart.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>INICIAR RITMO RCP</span>
            `;
        }
    }

    function playBeatTone() {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beat A5
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.09);
        } catch (e) {
            console.log("Audio error", e);
        }
    }

    window.MediRuralFirstAid = {
        initFirstAid: initFirstAid
    };
})(window);
