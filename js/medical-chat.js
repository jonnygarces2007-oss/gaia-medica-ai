(function(window) {
    const STORAGE_KEY = 'medirural_medical_chat_session';
    const LEGACY_STORAGE_KEY = 'medirural_medical_chat_history';
    const MEMORY_KEY = 'gaia_medica_chat_learning_session';
    const LEGACY_MEMORY_KEY = 'gaia_medica_chat_learning';
    let geminiAvailable = false;
    let geminiStatusChecked = false;
    let isSending = false;
    let inMemoryHistory = [];
    const topicPatterns = [
        { name: 'Respiración', pattern: /respir|ahogo|asfixia|falta.*aire/ },
        { name: 'Corazón y pecho', pattern: /pecho|corazon|opresion|angina/ },
        { name: 'Fiebre', pattern: /fiebre|temperatura|escalofrio/ },
        { name: 'Digestión e hidratación', pattern: /vomit|diarrea|deshidrat|abdomen|nausea/ },
        { name: 'Heridas y lesiones', pattern: /herida|sangrado|fractura|caida|golpe/ },
        { name: 'Embarazo', pattern: /embarazo|parto|contraccion|sangrado.*vaginal/ },
        { name: 'Alergias y picaduras', pattern: /alergia|hinchazon|urticaria|serpiente|alacran|picadura/ },
        { name: 'Convulsiones y desmayos', pattern: /convulsi|desmayo|inconsciente|perdida.*conciencia/ }
    ];
    const quickPrompts = [
        'Dolor en el pecho',
        'Fiebre y vómitos',
        'Dificultad para respirar',
        'Herida con sangrado',
        'Embarazo con contracciones',
        'Deshidratación por diarrea',
        'Alergia con hinchazón',
        'Convulsión o desmayo'
    ];

    function initChat() {
        bindSendButton();
        bindQuickPrompts();
        bindMemoryControls();
        renderMemory();
        renderHistory();
        checkGeminiStatus();
    }

    function bindMemoryControls() {
        const clearButton = document.getElementById('btn-clear-chat-memory');
        if (!clearButton) return;

        clearButton.addEventListener('click', () => {
            try {
                sessionStorage.removeItem(MEMORY_KEY);
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(LEGACY_MEMORY_KEY);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch (error) {
            }
            inMemoryHistory = [];
            renderMemory();
            renderHistory();
        });
    }

    function bindSendButton() {
        const input = document.getElementById('medical-chat-input');
        const button = document.getElementById('btn-medical-chat-send');
        if (!input || !button) return;

        button.addEventListener('click', sendMessage);

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    function bindQuickPrompts() {
        const chips = document.querySelectorAll('.chat-quick-pill');
        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('medical-chat-input');
                if (!input) return;
                input.value = chip.dataset.prompt || chip.textContent.trim();
                input.focus();
            });
        });
    }

    function renderHistory() {
        const chatWindow = document.getElementById('medical-chat-window');
        if (!chatWindow) return;

        let history = loadHistory();
        if (!history || history.length === 0) {
            history = [
                {
                    role: 'assistant',
                    text: 'Hola. Soy tu asistente médico de apoyo. Te puedo ayudar a identificar señales de riesgo, qué hacer de inmediato y cuándo ir a atención urgente. Importante: esto no sustituye a un médico ni a un centro de salud.'
                }
            ];
            saveHistory(history);
        }

        chatWindow.innerHTML = history.map((message) => `
            <div class="chat-message ${message.role === 'user' ? 'user' : 'assistant'}">
                <div class="chat-bubble">
                    ${escapeHtml(message.text).replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const input = document.getElementById('medical-chat-input');
        const chatWindow = document.getElementById('medical-chat-window');
        const button = document.getElementById('btn-medical-chat-send');
        if (!input || !chatWindow || !button || isSending) return;

        const text = input.value.trim();
        if (!text) return;
        const consent = document.getElementById('gemini-sharing-consent')?.checked === true;
        const containsSensitiveIdentifiers = hasSensitiveIdentifiers(text);

        isSending = true;
        input.disabled = true;
        button.disabled = true;
        button.textContent = 'Consultando...';

        const history = loadHistory();
        history.push({ role: 'user', text });
        learnFromMessage(text);
        saveHistory(history);
        input.value = '';
        renderHistory();

        const responseStatus = document.getElementById('chat-response-status');
        if (responseStatus) {
            responseStatus.textContent = geminiAvailable && consent && !containsSensitiveIdentifiers
                ? 'Se enviará solo esta pregunta a Gemini...'
                : 'Respuesta local; no se compartirá esta pregunta con Google.';
        }

        let assistantReply;
        try {
            if (!geminiStatusChecked) await checkGeminiStatus();
            if (geminiAvailable && consent && containsSensitiveIdentifiers) {
                setGeminiStatus('No envié la consulta: parece contener un correo, teléfono o documento. Elimina esos datos y vuelve a intentarlo.', true);
                assistantReply = `${generateMedicalReply(text)}\n\nPor privacidad, no envié este mensaje a Gemini. Quita nombres, cédulas, teléfonos y direcciones antes de activar el envío.`;
            } else if (geminiAvailable && consent) {
                assistantReply = await requestGemini(text);
            } else {
                assistantReply = generateMedicalReply(text);
                if (geminiAvailable) {
                    assistantReply += '\n\nGemini no recibió este mensaje porque el permiso de envío está desactivado.';
                }
            }
        } catch (error) {
            geminiAvailable = false;
            setGeminiStatus('Gemini no respondió; se usará la orientación local.', false);
            assistantReply = `${generateMedicalReply(text)}\n\nNo se pudo consultar Gemini; esta respuesta es orientación local básica.`;
        } finally {
            isSending = false;
            input.disabled = false;
            button.disabled = false;
            button.textContent = 'Enviar';
            if (responseStatus) responseStatus.textContent = '';
        }

        history.push({ role: 'assistant', text: assistantReply });
        saveHistory(history);
        renderHistory();

        if (window.MediRuralApp && typeof window.MediRuralApp.speak === 'function') {
            window.MediRuralApp.speak(assistantReply.substring(0, 180));
        }
    }

    async function checkGeminiStatus() {
        try {
            const response = await fetch('/api/health', { cache: 'no-store' });
            if (!response.ok) throw new Error('Servidor no disponible');
            const status = await response.json();
            geminiAvailable = Boolean(status.configured);
            setGeminiStatus(
                geminiAvailable
                    ? 'Gemini conectado. Las respuestas pueden tardar unos segundos.'
                    : 'Gemini no tiene una clave configurada; se usarán respuestas locales.',
                geminiAvailable
            );
        } catch (error) {
            geminiAvailable = false;
            setGeminiStatus('Servidor Gemini no disponible; respuestas locales activas.', false);
        } finally {
            geminiStatusChecked = true;
        }
    }

    function setGeminiStatus(message, connected) {
        const status = document.getElementById('gemini-status');
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('is-connected', connected);
        status.classList.toggle('is-local', !connected);
    }

    function hasSensitiveIdentifiers(text) {
        const normalizedPhone = text.replace(/[\s()-]/g, '');
        return /[\w.+-]+@[\w.-]+\.[A-Z]{2,}/i.test(text)
            || /\d{10,}/.test(normalizedPhone)
            || /(?:\+?593)?09\d{8}\b/.test(normalizedPhone);
    }

    async function requestGemini(text) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', text }] })
        });
        const result = await response.json();
        if (!response.ok || typeof result.reply !== 'string') {
            throw new Error(result.error || 'Gemini no pudo responder.');
        }
        return result.reply;
    }

    function learnFromMessage(message) {
        const normalizedMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchedTopic = topicPatterns.find((topic) => topic.pattern.test(normalizedMessage));
        if (!matchedTopic) return;

        const memory = loadMemory();
        memory.topics[matchedTopic.name] = (memory.topics[matchedTopic.name] || 0) + 1;
        memory.total = (memory.total || 0) + 1;

        try {
            sessionStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
        } catch (error) {
            return;
        }
        renderMemory(memory);
    }

    function loadMemory() {
        try {
            let saved = sessionStorage.getItem(MEMORY_KEY);
            if (!saved) {
                saved = localStorage.getItem(LEGACY_MEMORY_KEY);
                if (saved) {
                    sessionStorage.setItem(MEMORY_KEY, saved);
                    localStorage.removeItem(LEGACY_MEMORY_KEY);
                }
            }
            if (!saved) return { total: 0, topics: {} };
            const parsed = JSON.parse(saved);
            return {
                total: Number.isFinite(parsed.total) ? parsed.total : 0,
                topics: parsed.topics && typeof parsed.topics === 'object' ? parsed.topics : {}
            };
        } catch (error) {
            return { total: 0, topics: {} };
        }
    }

    function renderMemory(memory = loadMemory()) {
        const summary = document.getElementById('chat-memory-summary');
        if (!summary) return;

        const frequentTopics = Object.entries(memory.topics)
            .sort((first, second) => second[1] - first[1])
            .slice(0, 3)
            .map(([name, count]) => `${name} (${count})`);

        summary.textContent = memory.total
            ? `${memory.total} ${memory.total === 1 ? 'consulta registrada' : 'consultas registradas'}. Temas frecuentes: ${frequentTopics.join(', ')}.`
            : 'Aún no hay temas aprendidos.';
    }

    function generateMedicalReply(input) {
        const text = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (/^(hola|buenas(?: tardes| noches)?|buenos dias)\b/.test(text)) {
            return 'Hola. Cuéntame qué le ocurre a la persona y desde cuándo. Si tiene dificultad para respirar, dolor en el pecho, convulsiones, pérdida del conocimiento o sangrado abundante, llama al ECU 911 ahora.';
        }

        if (/^(gracias|muchas gracias)\b/.test(text)) {
            return 'De nada. Si los síntomas empeoran o aparece una señal de alarma, busca atención urgente. ¿Hay algo más sobre esta situación que quieras consultar?';
        }

        if (/(medicamento|medicina|pastilla|dosis|antibiotico|que puedo tomar|que debo tomar|que le puedo dar)/.test(text)) {
            return 'No puedo recomendar un medicamento ni una dosis por chat. Depende de la edad, alergias, embarazo, enfermedades y otros medicamentos. Consulta a un profesional de salud o farmacéutico; no uses medicamentos de otra persona. Si hay dificultad para respirar, dolor en el pecho, pérdida del conocimiento o sangrado abundante, llama al ECU 911.';
        }

        if (/(que puede ser|que tengo|cual es la causa|causa de|diagnostico|diagnosticar|es grave)/.test(text)) {
            return 'No puedo confirmar una causa ni dar un diagnóstico por chat. Para orientarte mejor, dime qué síntoma presenta, en qué parte, desde cuándo, qué tan intenso es y si hay otros síntomas. Si tiene dificultad para respirar, dolor en el pecho, confusión, convulsiones o empeora rápidamente, llama al ECU 911.';
        }

        if (/(cuando.*(ir|acudir|consultar)|debo.*(ir|acudir)|necesito.*(urgencia|hospital)|es.*(emergencia|urgencia)|llamar.*(911|emergencia))/.test(text)) {
            return 'Llama al ECU 911 o busca atención urgente ante dificultad para respirar, dolor en el pecho, pérdida del conocimiento, convulsiones, sangrado abundante o hinchazón de cara o garganta. Si no hay esas señales pero el problema persiste, empeora o te preocupa, contacta a un centro de salud.';
        }

        if (/(que datos|que informacion|que necesitas|que debo decir|como te explico|como describo)/.test(text)) {
            return 'Para orientarte, dime sin incluir nombres ni datos de identidad: edad aproximada, síntoma principal, cuándo comenzó, si está empeorando y si respira y responde normalmente. Añade temperatura u otros signos medidos, alergias, embarazo o medicamentos solo si son relevantes.';
        }

        if (/(dolor.*pecho|opresion.*pecho|pecho.*aprieta|angina)/.test(text)) {
            return 'Dolor en el pecho puede ser una emergencia. Si hay sudor frío, náusea, debilidad o falta de aire, busca atención urgente de inmediato y llama a ECU 911 o al centro de salud más cercano. Si la persona está incómoda, siéntala y no la dejes sola.';
        }

        if (/(convulsi|desmayo|inconsciente|desmayado|perdida.*conciencia)/.test(text)) {
            return 'Si hay convulsión o pérdida de conocimiento, coloca a la persona de lado si está vomitando, protege la cabeza y no intentes abrirle la boca. Busca atención urgente de inmediato. Si deja de respirar, inicia RCP y llama a emergencias.';
        }

        if (/(hinchazon|urticaria|picazon|ronchas|alergia|angioedema)/.test(text)) {
            return 'La alergia con hinchazón de cara, labios o garganta puede ser peligrosa. Si hay dificultad respiratoria, sibilancias o sensación de ahogo, busca atención urgente inmediata. Si es leve, sigue el consejo médico y evita el alérgeno.';
        }

        if (/(no respira|dificultad.*respirar|ahogo|asfixia|falta.*aire|se le corta.*aire)/.test(text)) {
            return 'Si la persona no respira o se está ahogando, inicia RCP si está inconsciente y llama a emergencias enseguida. Si está consciente pero ahogándose, ayuda a sentarla y solicita atención inmediata. No esperes demasiado.';
        }

        if (/(fiebre|temperatura|caliente|sudor|escalofrio)/.test(text)) {
            return 'Para fiebre, revisa si hay dolor fuerte, confusión, dificultad para respirar o convulsiones. Da líquidos, controla la temperatura con agua tibia y observa. Si la fiebre es alta o dura más de 24 a 48 horas, acude al centro de salud.';
        }

        if (/(vomito|diarrea|deshidrat|boca seca|sed)/.test(text)) {
            return 'Si hay vómitos o diarrea repetidos, da líquidos poco a poco y rehidratación oral si la persona está consciente. Busca ayuda si no puede sostener líquidos, tiene debilidad extrema, sangrado o letargo.';
        }

        if (/(dolor.*abdominal|abdomen.*dolor|vomito.*dolor|nausea.*dolor)/.test(text)) {
            return 'Dolor abdominal fuerte o persistente puede ser serio si se acompaña de fiebre, vómitos, torpeza, sangre o abdomen rígido. Si es intenso o empeora, consulta de inmediato; no tome analgésicos sin indicación médica.';
        }

        if (/(herida|sangrado|fractura|caida|golpe|hueso)/.test(text)) {
            return 'Para heridas o golpes, limpia con agua limpia y aplica presión si hay sangrado. Si hay deformidad o dolor fuerte, inmoviliza la zona sin intentar moverla y acude a atención médica. Si el sangrado es abundante, llama a emergencias.';
        }

        if (/(embarazo|parto|contracciones|sangrado.*vaginal)/.test(text)) {
            return 'Si es embarazo o parto, revisa la frecuencia de las contracciones, la presencia de sangrado y si la madre está muy débil. Si hay sangre intensa, dolor fuerte, convulsiones o pérdida de conciencia, acude de inmediato al centro de salud o a emergencias.';
        }

        if (/(serpiente|alacran|veneno|picadura)/.test(text)) {
            return 'En picaduras de serpiente o alacrán, mantén a la persona tranquila y sin caminar. No hagas cortes ni torniquetes fuertes. Trasládala de inmediato a un centro de salud o a una posta cercana para evaluación.';
        }

        if (/(dolor.*cabeza|migraña|mareo|desmayo|inconsciente)/.test(text)) {
            return 'Dolor fuerte de cabeza, mareo o desmayo requiere atención si hay confusión, vómito, debilidad o dificultad respiratoria. Si la persona está inconsciente, revisa si respira y llama de inmediato a emergencias.';
        }

        return 'Necesito un poco más de detalle para ayudarte bien: ¿qué síntoma principal presenta, si respira normalmente, si tiene fiebre, dolor intenso o sangrado? Con esa información puedo guiarte con pasos básicos y decirte cuándo buscar atención urgente. Recuerda: esto no reemplaza a un médico.';
    }

    function loadHistory() {
        try {
            let saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) {
                saved = localStorage.getItem(LEGACY_STORAGE_KEY);
                if (saved) {
                    sessionStorage.setItem(STORAGE_KEY, saved);
                    localStorage.removeItem(LEGACY_STORAGE_KEY);
                }
            }
            if (!saved) return inMemoryHistory;
            const parsed = JSON.parse(saved);
            inMemoryHistory = Array.isArray(parsed) ? parsed.slice(-20) : [];
            return inMemoryHistory;
        } catch (error) {
            return inMemoryHistory;
        }
    }

    function saveHistory(history) {
        inMemoryHistory = history.slice(-20);
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryHistory));
        } catch (error) {
            return;
        }
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.MediRuralMedicalChat = {
        initChat: initChat,
        quickPrompts: quickPrompts,
        generateMedicalReply: generateMedicalReply
    };
})(window);
