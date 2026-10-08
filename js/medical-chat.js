(function(window) {
    const STORAGE_KEY = 'medirural_medical_chat_history';
    const MEMORY_KEY = 'gaia_medica_chat_learning';
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
    }

    function bindMemoryControls() {
        const clearButton = document.getElementById('btn-clear-chat-memory');
        if (!clearButton) return;

        clearButton.addEventListener('click', () => {
            try {
                localStorage.removeItem(MEMORY_KEY);
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
            }
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

    function sendMessage() {
        const input = document.getElementById('medical-chat-input');
        const chatWindow = document.getElementById('medical-chat-window');
        if (!input || !chatWindow) return;

        const text = input.value.trim();
        if (!text) return;

        const history = loadHistory();
        history.push({ role: 'user', text });
        learnFromMessage(text);

        const assistantReply = generateMedicalReply(text);
        history.push({ role: 'assistant', text: assistantReply });
        saveHistory(history);

        input.value = '';
        renderHistory();

        if (window.MediRuralApp && typeof window.MediRuralApp.speak === 'function') {
            window.MediRuralApp.speak(assistantReply.substring(0, 180));
        }
    }

    function learnFromMessage(message) {
        const normalizedMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchedTopic = topicPatterns.find((topic) => topic.pattern.test(normalizedMessage));
        if (!matchedTopic) return;

        const memory = loadMemory();
        memory.topics[matchedTopic.name] = (memory.topics[matchedTopic.name] || 0) + 1;
        memory.total = (memory.total || 0) + 1;

        try {
            localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
        } catch (error) {
            return;
        }
        renderMemory(memory);
    }

    function loadMemory() {
        try {
            const saved = localStorage.getItem(MEMORY_KEY);
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
        const text = input.toLowerCase();

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
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
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
