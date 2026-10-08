/**
 * MediRural AI - Triage Protocol Module
 * Interactive decision tree wizard based on START / Manchester adaptations for rural healthcare.
 */

(function(window) {
    let currentStep = 0;
    let userAnswers = {};

    const triageQuestions = [
        {
            id: 'patient_type',
            title: '1. ¿Quién es la persona afectada?',
            subtitle: 'Selecciona la categoría del paciente para adaptar los rangos de urgencia.',
            options: [
                { value: 'adult', label: 'Adulto (Mayor de 12 años)', sub: 'Hombre o mujer', icon: '👤' },
                { value: 'child', label: 'Niño / Lactante (Menor a 12 años)', sub: 'Atención pediátrica', icon: '👶' },
                { value: 'pregnant', label: 'Mujer Gestante / Embarazada', sub: 'Riesgo obstétrico', icon: '🤰' }
            ]
        },
        {
            id: 'vital_alarm',
            title: '2. ¿Presenta algún SIGNO DE ALARMA CRÍTICO inmediato?',
            subtitle: 'Si el paciente tiene uno de estos síntomas, requiere atención roja prioritaria.',
            options: [
                { value: 'unconscious', label: 'Inconsciente / No responde al llamado', sub: 'Desmayo profundo o coma', icon: '🚨' },
                { value: 'breathing_severe', label: 'No respira o se asfixia', sub: 'Dificultad azulada o atragantamiento', icon: '🫁' },
                { value: 'bleeding_heavy', label: 'Hemorragia abundante que chorrea', sub: 'Sangrado de arteria o herida profunda', icon: '🩸' },
                { value: 'snake_bite', label: 'Picadura de Víbora / Serpiente o Alacrán', sub: 'Hinchazón rápida, mareo o dolor agudo', icon: '🐍' },
                { value: 'chest_pain', label: 'Dolor opresivo en el pecho o convulsión', sub: 'Posible infarto o ataque epiléptico', icon: '⚡' },
                { value: 'none_vital', label: 'Ninguno de los anteriores', sub: 'El paciente respira y está consciente', icon: '✅' }
            ]
        },
        {
            id: 'secondary_symptom',
            title: '3. ¿Cuál es la molestia principal o causa de consulta?',
            subtitle: 'Indica el síntoma predominante actual.',
            options: [
                { value: 'fever_high', label: 'Fiebre alta persistente (más de 38.5°C)', sub: 'Escalofríos, cuerpo cortado o sudoración', icon: '🌡️' },
                { value: 'trauma_bone', label: 'Golpe fuerte, caída o sospecha de fractura', sub: 'Deformidad de hueso, imposibilidad de mover', icon: '🦴' },
                { value: 'diarrhea_dehydration', label: 'Diarrea o vómitos continuos', sub: 'Boca seca, signos de deshidratación', icon: '💧' },
                { value: 'burn', label: 'Quemadura con agua caliente o fuego', sub: 'Ampollas o piel roja/negra', icon: '🔥' },
                { value: 'labor_pains', label: 'Contracciones de parto o sangrado vaginal', sub: 'Trabajo de parto en gestante', icon: '👶' },
                { value: 'minor_wound', label: 'Corte superficial, raspadura o dolor leve', sub: 'Herida sin sangrado abundante', icon: '🩹' }
            ]
        }
    ];

    function initTriage() {
        currentStep = 0;
        userAnswers = {};
        renderStep();
        setupSpeechInput();
    }

    function renderStep() {
        const container = document.getElementById('triage-step-container');
        const resultCard = document.getElementById('triage-result');
        if (!container) return;

        resultCard.classList.add('hidden');

        if (currentStep >= triageQuestions.length) {
            evaluateTriageResult();
            return;
        }

        const q = triageQuestions[currentStep];
        const progress = Math.round(((currentStep + 1) / triageQuestions.length) * 100);
        
        let html = `
            <div class="wizard-progress" aria-label="Progreso de la guía">
                <span class="wizard-progress-label">Paso ${currentStep + 1} de ${triageQuestions.length}</span>
                <div class="wizard-progress-track" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso">
                    <div class="wizard-progress-value" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="wizard-question-title">${q.title}</div>
            <div class="wizard-question-sub">${q.subtitle}</div>
            <div class="options-grid">
        `;

        q.options.forEach(opt => {
            html += `
                <div class="option-card" onclick="MediRuralTriage.selectOption('${q.id}', '${opt.value}')">
                    <div class="option-icon">${opt.icon}</div>
                    <div class="option-text">
                        <strong>${opt.label}</strong>
                        <small>${opt.sub}</small>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        if (currentStep > 0) {
            html += `<button class="btn-secondary wizard-back" type="button" onclick="MediRuralTriage.goBack()">← Volver</button>`;
        }
        container.innerHTML = html;
    }

    function goBack() {
        if (currentStep === 0) return;
        currentStep--;
        renderStep();
    }

    function selectOption(questionId, value) {
        userAnswers[questionId] = value;

        // If emergency vital alarm is selected, jump directly to red result!
        if (questionId === 'vital_alarm' && value !== 'none_vital') {
            evaluateTriageResult();
            return;
        }

        currentStep++;
        renderStep();
    }

    function evaluateTriageResult() {
        const container = document.getElementById('triage-step-container');
        const resultCard = document.getElementById('triage-result');
        container.innerHTML = `<p style="text-align:center; padding:20px;">Evaluando protocolo médico de urgencia...</p>`;

        setTimeout(() => {
            container.innerHTML = '';
            
            const vital = userAnswers.vital_alarm || 'none_vital';
            const secondary = userAnswers.secondary_symptom || '';
            const pType = userAnswers.patient_type || 'adult';

            let level = 'green';
            let title = 'NIVEL 3: PRIORIDAD LEVE (AMBULATORIO)';
            let actions = [];
            let speakText = '';

            if (vital !== 'none_vital') {
                level = 'red';
                title = '🚨 NIVEL 1: EMERGENCIA CRÍTICA INMEDIATA (CÓDIGO ROJO)';
                
                if (vital === 'unconscious') {
                    actions = [
                        'Verifica si el paciente respira. Si no respira, INICIA RCP INMEDIATAMENTE (usa la pestaña Primeros Auxilios).',
                        'Coloca al paciente de lado (posición lateral de seguridad) si respira para evitar que se asfixie.',
                        'Presiona el botón SOS arriba para alertar a la posta o vehículo de evacuación.',
                        'No intentes darle líquidos ni comida por la boca.'
                    ];
                    speakText = "Atención. Nivel de emergencia roja. Paciente inconsciente. Presiona el botón SOS para enviar coordenadas GPS y revisa si respira para iniciar RCP.";
                } else if (vital === 'breathing_severe') {
                    actions = [
                        'Asegura la vía aérea. Si se atragantó con comida o objeto, realiza la maniobra de Heimlich.',
                        'Afloja prendas apretadas en el cuello y pecho.',
                        'Inicia compresión torácica de RCP si cae inconsciente.',
                        'Solicita evacuación de urgencia al puesto de salud.'
                    ];
                    speakText = "Emergencia por asfixia o paro respiratorio. Inicia maniobra de compresión y solicita ayuda médica de inmediato.";
                } else if (vital === 'bleeding_heavy') {
                    actions = [
                        'Aplica PRESIÓN DIRECTA y constante con un paño o gasa limpia sobre la herida.',
                        'Eleva la extremidad afectada por encima del nivel del corazón si no hay fractura.',
                        'Si el sangrado no cesa y es en brazo o pierna, prepara un torniquete de emergencia 5 cm arriba de la herida.',
                        'Mantén al paciente abrigado para prevenir el shock.'
                    ];
                    speakText = "Hemorragia severa detectada. Aplica presión fuerte continua sobre la herida con tela limpia y eleva la extremidad.";
                } else if (vital === 'snake_bite') {
                    actions = [
                        'MANTÉN AL PACIENTE EN REPOSO ABSOLUTO. Evita que camine o se agite para frenar la propagación del veneno.',
                        'NO cortes la herida, NO succiones el veneno con la boca y NO apliques torniquete apretado.',
                        'Lava la zona con agua limpia y jabón suave. Inmoviliza el miembro afectado.',
                        'Transporta en camilla de inmediato a la posta médica para suero antiofídico.'
                    ];
                    speakText = "Alerta picadura de víbora o veneno. Mantén al paciente quieto sin caminar. No succiónes el veneno. Transporta a la posta médica.";
                } else {
                    actions = [
                        'Mantén al paciente recostado en posición cómoda.',
                        'Transmite alerta SOS con coordenadas GPS.',
                        'Proporciona apoyo constante y traslada de urgencia.'
                    ];
                    speakText = "Emergencia crítica. Traslada al paciente al centro de salud de inmediato.";
                }
            } else if (secondary === 'fever_high' || secondary === 'trauma_bone' || secondary === 'burn' || secondary === 'labor_pains') {
                level = 'yellow';
                title = '⚠️ NIVEL 2: URGENCIA MÉDICA PRIORITARIA (CÓDIGO AMARILLO)';
                
                if (secondary === 'fever_high') {
                    actions = [
                        'Administra paracetamol según el peso/edad del paciente (consultar pestaña Vademécum).',
                        'Aplica compresas de agua tibia (no fría) en frente, axilas e ingle.',
                        'Ofrece abundantes líquidos o Sales de Rehidratación Oral.',
                        'Acude al puesto de salud si la fiebre no baja en 24 horas o supera los 39°C.'
                    ];
                } else if (secondary === 'trauma_bone') {
                    actions = [
                        'INMOVILIZA la extremidad con tablillas o cartón rígido amarrado suavemente con tela.',
                        'No intentes acomodar el hueso deformado.',
                        'Aplica hielo o paños fríos envueltos en tela sobre la zona hinchada.',
                        'Traslada al paciente para evaluación radiológica.'
                    ];
                } else if (secondary === 'burn') {
                    actions = [
                        'Enfría la quemadura con abundante agua limpia corriente durante 15 a 20 minutos.',
                        'NO apliques pasta dental, aceite ni cremas caseras.',
                        'Cubre con una gasa estéril o paño limpio humedecido.',
                        'Da de beber líquidos si el paciente está consciente.'
                    ];
                } else if (secondary === 'labor_pains') {
                    actions = [
                        'Revisa la pestaña de Primeros Auxilios -> Guía de Parto Rural.',
                        'Prepara sábanas limpias, agua hervida tibia y cordón o hilo desinfectado.',
                        'Contacta a la partera o promotor de salud de la comunidad.'
                    ];
                }
                speakText = "Urgencia prioritaria detectada. Sigue los pasos recomendados de atencion y traslada al puesto de salud.";
            } else {
                level = 'green';
                title = '✅ NIVEL 3: ATENCIÓN LEVE O AMBULATORIA (CÓDIGO VERDE)';
                actions = [
                    'Lava las heridas con agua y jabón antiséptico.',
                    'Mantén reposo e hidratación adecuada.',
                    'Consulta la guía de medicamentos de la posta médica en el Vademécum.',
                    'Si los síntomas empeoran, vuelve a realizar el triaje.'
                ];
                speakText = "Nivel leve. El paciente requiere cuidados basicos y seguimiento en casa.";
            }

            resultCard.className = `triage-result-card level-${level}`;
            let resHtml = `
                <span class="result-badge">${title}</span>
                <p><strong>Recomendaciones Médicas Inmediatas:</strong></p>
                <ul class="result-actions-list">
            `;
            actions.forEach(act => {
                resHtml += `<li>${act}</li>`;
            });
            resHtml += `
                </ul>
                <div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">
                    <button class="btn-primary" onclick="MediRuralTriage.initTriage()">🔄 Reiniciar Triaje</button>
                    <button class="btn-secondary" onclick="MediRuralApp.speak('${speakText.replace(/'/g, "\\'")}')">🔊 Escuchar Instrucción por Voz</button>
                    <button class="btn-secondary" onclick="MediRuralApp.openTab('tab-auxilio')">📖 Ver Guías de Auxilio</button>
                </div>
            `;
            resultCard.innerHTML = resHtml;
            resultCard.classList.remove('hidden');

            if (window.MediRuralApp && window.MediRuralApp.isVoiceEnabled()) {
                window.MediRuralApp.speak(speakText);
            }
        }, 400);
    }

    function setupSpeechInput() {
        const btn = document.getElementById('btn-speech-input');
        const statusBar = document.getElementById('voice-status-bar');
        const statusText = document.getElementById('voice-status-text');

        if (!btn) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            btn.title = "Dictado de voz no soportado en este navegador";
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        btn.addEventListener('click', () => {
            try {
                recognition.start();
                statusBar.classList.remove('hidden');
                statusText.textContent = "Escuchando síntomas... habla claro (ej. dolor de pecho, picadura de culebra, inconsciente)";
            } catch (e) {
                console.log("Reconocimiento ya activo", e);
            }
        });

        recognition.onresult = (event) => {
            statusBar.classList.add('hidden');
            const text = event.results[0][0].transcript.toLowerCase();
            console.log("Voz capturada:", text);

            // Auto mapping keywords
            if (text.includes('inconsciente') || text.includes('no responde') || text.includes('desmayo')) {
                selectOption('vital_alarm', 'unconscious');
            } else if (text.includes('respirar') || text.includes('asfixia') || text.includes('ahogo')) {
                selectOption('vital_alarm', 'breathing_severe');
            } else if (text.includes('sangre') || text.includes('corte') || text.includes('hemorragia')) {
                selectOption('vital_alarm', 'bleeding_heavy');
            } else if (text.includes('serpiente') || text.includes('culebra') || text.includes('vibora') || text.includes('picadura')) {
                selectOption('vital_alarm', 'snake_bite');
            } else if (text.includes('fiebre') || text.includes('calentura')) {
                selectOption('secondary_symptom', 'fever_high');
            } else if (text.includes('hueso') || text.includes('caida') || text.includes('fractura')) {
                selectOption('secondary_symptom', 'trauma_bone');
            } else if (text.includes('parto') || text.includes('embarazo') || text.includes('bebe')) {
                selectOption('secondary_symptom', 'labor_pains');
            } else {
                alert(`Síntomas reconocidos por voz: "${text}". Por favor selecciona la opción correspondiente.`);
            }
        };

        recognition.onerror = () => {
            statusBar.classList.add('hidden');
        };

        recognition.onend = () => {
            statusBar.classList.add('hidden');
        };
    }

    window.MediRuralTriage = {
        initTriage: initTriage,
        selectOption: selectOption,
        goBack: goBack
    };
})(window);
