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
            id: 'rcp_guide',
            category: 'vital',
            title: 'Reanimación Cardiopulmonar (RCP)',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
            desc: 'Para pacientes inconscientes que NO respiran o no tienen pulso.',
            steps: [
                '1. Coloca al paciente boca arriba en una superficie dura e inmoviliza la cabeza.',
                '2. Entrelaza tus manos y colócalas en el centro del pecho (mitad inferior del esternón).',
                '3. Comprime el tórax 5 a 6 cm de profundidad manteniendo los brazos rectos.',
                '4. Realiza 30 compresiones seguidas al ritmo de 100-120 por minuto (usa el metrónomo arriba).',
                '5. Da 2 insuflaciones (boca a boca) si tienes mascarilla o tela limpia. Si no, haz compresiones continuas.'
            ],
            audioGuide: 'Guia de RCP. Coloca el talon de tu mano en el centro del pecho del paciente. Mantén tus brazos firmes y rectos. Realiza compresiones continuas siguiendo el ritmo del sonido. Presiona con fuerza sin detenerte hasta que llegue el personal de salud.'
        },
        {
            id: 'heimlich_guide',
            category: 'vital',
            title: 'Atragantamiento (Maniobra de Heimlich)',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
            desc: 'Si la persona no puede hablar, toser ni respirar debido a un objeto atrapado.',
            steps: [
                '1. Colócate de pie detrás de la persona y rodea su cintura con tus brazos.',
                '2. Haz un puño con una mano y colócalo justo por encima del ombligo y debajo del esternón.',
                '3. Agarra tu puño con la otra mano y presiona hacia ADENTRO y hacia ARRIBA con fuerza rápida.',
                '4. Repite las presiones fuertemente hasta que el objeto sea expulsado o la persona tosas.',
                '5. En embarazadas o personas obesas, presiona en el centro del pecho (esternón).'
            ],
            audioGuide: 'Maniobra de Heimlich. Colocate detras del paciente. Pon tu puño sobre su ombligo y abraza fuerte empujando hacia adentro y arriba de forma rapida. Repite con fuerza hasta que expulse la obstruccion.'
        },
        {
            id: 'snake_guide',
            category: 'trauma',
            title: 'Picadura de Víbora / Serpiente Venenosa',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>',
            desc: 'Protocolo de urgencia en selva y sierra rural para envenenamiento oídico.',
            steps: [
                '1. MANTÉN A LA VÍCTIMA EN REPOSO ABSOLUTO. Quítale anillos, pulseras o calzado ajustado.',
                '2. NO cortes la piel, NO chupes el veneno con la boca, NO apliques hielo ni torniquete ajustado.',
                '3. Lava la mordedura con agua limpia y jabón neutro sin frotar con fuerza.',
                '4. Inmoviliza el brazo o pierna mordida con una tablilla manteniendo el miembro más bajo que el corazón.',
                '5. Transporta al paciente echado en camilla o hamaca hacia la posta médica para suero antiofídico.'
            ],
            audioGuide: 'Atencion por picadura de serpiente. Mantén al paciente completamente quieto y acostado. No intentes chupar el veneno ni cortar la piel. Lava la herida con agua y transporta de inmediato al puesto de salud para colocarle suero antiofídico.'
        },
        {
            id: 'bleeding_guide',
            category: 'lesion',
            title: 'Control de Hemorragias y Torniquete',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/></svg>',
            desc: 'Detención de sangrados profusos y amputaciones de trauma.',
            steps: [
                '1. Presiona fuertemente sobre la herida sangrante usando una gasa estéril o tela limpia.',
                '2. Mantén la presión firme sin levantar la tela por al menos 10 a 15 minutos continuos.',
                '3. Si la tela se empapa, coloca otra tela encima SIN retirar la primera.',
                '4. Si el sangrado es masivo en extremidad y no cesa, coloca un torniquete 5-7 cm sobre la herida.',
                '5. Ajusta el torniquete hasta que el sangrado rojo brillante se detenga y anota la hora exacta.'
            ],
            audioGuide: 'Control de hemorragia. Presiona fuerte la herida con tela limpia durante 10 minutos sin soltar. Si el sangrado es abundante en brazo o pierna, aplica torniquete 5 centimetros arriba de la herida y anota la hora.'
        },
        {
            id: 'birth_guide',
            category: 'parto',
            title: 'Atención de Parto Inminente Rural',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>',
            desc: 'Guía de asistencia cuando el bebé nace fuera del hospital en la comunidad.',
            steps: [
                '1. Prepara un espacio limpio, seco y cálido. Lava tus manos minuciosamente con agua y jabón.',
                '2. Cuando asome la cabeza del bebé, sostiene con suavidad sin jalar ni tirar del cuello.',
                '3. Una vez fuera el bebé, límpiale la boca y nariz con un paño limpio y colócalo sobre el pecho de la madre (contacto piel a piel).',
                '4. Abriga inmediatamente al recién nacido para evitar que sufra enfriamiento o hipotermia.',
                '5. Amarra el cordón umbilical en 2 puntos firmes con hilo desinfectado a 4 dedos del ombligo del bebé y corta entre los nudos con tijera hervida.'
            ],
            audioGuide: 'Atencion de parto rural. Mantén las manos muy limpias y un ambiente abrigado. Al nacer el bebe, secale la carita y colocalo de inmediato sobre el pecho de su mama. Abrégalos bien a ambos.'
        },
        {
            id: 'fracture_guide',
            category: 'lesion',
            title: 'Inmovilización de Fracturas y Traumas',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/></svg>',
            desc: 'Técnica de ferulizado improvisado en el campo con madera o caña.',
            steps: [
                '1. NO intentes mover ni estirar el hueso que parece roto o torcido.',
                '2. Busca 2 tablillas de madera, cañas de bambú o ramas rectas más largas que la zona lesionada.',
                '3. Acolcha las maderas con tela o ropa para no lastimar la piel.',
                '4. Amarra firmemente con tiras de tela por arriba y por debajo de la articulación sin apretar demasiado.',
                '5. Comprueba que los dedos del pie o mano mantengan temperatura y sensibilidad normal.'
            ],
            audioGuide: 'Guia de inmovilizacion. No trates de enderezar el hueso roto. Coloca tablillas de madera a los lados y amárralas suavemente con paños limpios para evitar que el hueso se mueva.'
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

        let html = '';
        filtered.forEach(guide => {
            html += `
                <div class="guide-card">
                    <div>
                        <div class="guide-icon-header">
                            <div class="guide-icon">${guide.icon}</div>
                            <span class="chip" style="font-size:0.7rem; pointer-events:none;">${guide.category.toUpperCase()}</span>
                        </div>
                        <h3>${guide.title}</h3>
                        <p>${guide.desc}</p>
                        <ol style="margin-left: 18px; font-size: 0.85rem; color: var(--text-main); margin-bottom: 16px;">
            `;
            guide.steps.forEach(st => {
                html += `<li style="margin-bottom:6px;">${st}</li>`;
            });
            html += `
                        </ol>
                    </div>
                    <button class="btn-secondary btn-block" onclick="MediRuralApp.speak('${guide.audioGuide.replace(/'/g, "\\'")}')">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <span>Escuchar Guía de Voz</span>
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
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
