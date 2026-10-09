/**
 * MediRural AI - Searchable medicine and traditional plant reference.
 */

(function(window) {
    let currentSubtab = 'meds-essential';

    const medsCatalog = [
        {
            type: 'essential',
            name: 'Paracetamol (Acetaminofén)',
            category: 'Analgésico / Antipirético',
            keywords: ['acetaminofen', 'dolor', 'fiebre'],
            uses: 'Se utiliza para aliviar dolor o fiebre según la indicación del envase o de un profesional.',
            precautions: 'Puede estar combinado en medicamentos para gripe. Evita duplicarlo y consulta si hay enfermedad hepática, embarazo o dudas.'
        },
        {
            type: 'essential',
            name: 'Ibuprofeno',
            category: 'Antiinflamatorio (AINE)',
            keywords: ['antiinflamatorio', 'dolor', 'fiebre', 'aine'],
            uses: 'Antiinflamatorio que puede indicarse para dolor o fiebre; confirma que sea apropiado para la persona.',
            precautions: 'Consulta antes de usarlo en embarazo, deshidratación, enfermedad renal, úlcera o si toma anticoagulantes. No combines AINE sin indicación.'
        },
        {
            type: 'essential',
            name: 'Sales de Rehidratación Oral (SRO)',
            category: 'Rehidratación de Emergencia',
            keywords: ['suero oral', 'rehidratacion', 'diarrea', 'vomito', 'sales'],
            uses: 'Ayudan a reponer agua y sales perdidas por diarrea o vómitos.',
            precautions: 'Prepara el sobre exactamente con el volumen de agua indicado en su envase. Si hay somnolencia, no puede beber o empeora, busca atención urgente.'
        },
        {
            type: 'essential',
            name: 'Amoxicilina (Antibiótico)',
            category: 'Antibiótico de prescripción',
            keywords: ['antibiotico', 'infeccion bacteriana'],
            uses: 'Antibiótico que un profesional puede indicar para determinadas infecciones bacterianas.',
            precautions: 'No sirve para virus ni resfriados. No lo inicies, compartas ni reutilices sobrantes; sigue la receta y consulta ante alergia o reacción.'
        },
        {
            type: 'essential',
            name: 'Clorfenamina (Antihistamínico)',
            category: 'Antialérgico',
            keywords: ['clorfeniramina', 'alergia', 'picazon', 'urticaria'],
            uses: 'Antihistamínico que puede aliviar algunos síntomas leves de alergia.',
            precautions: 'Puede causar sueño e interactuar con otros medicamentos. Hinchazón de lengua o garganta, o dificultad para respirar, requiere ECU 911.'
        },
        {
            type: 'essential',
            name: 'Loratadina',
            category: 'Antihistamínico',
            keywords: ['alergia', 'rinitis', 'estornudos', 'urticaria'],
            uses: 'Se utiliza para aliviar algunos síntomas leves de rinitis alérgica o urticaria.',
            precautions: 'Revisa el envase y consulta a un profesional si es para un niño, embarazo, enfermedad crónica o uso junto a otros fármacos. No trata una anafilaxia.'
        },
        {
            type: 'essential',
            name: 'Cetirizina',
            category: 'Antihistamínico',
            keywords: ['alergia', 'rinitis', 'picazon', 'urticaria'],
            uses: 'Puede aliviar síntomas leves de alergia, como picazón o estornudos.',
            precautions: 'Puede producir somnolencia. La dificultad para respirar o hinchazón de cara o garganta es una emergencia, no se trata solo con antihistamínicos.'
        },
        {
            type: 'essential',
            name: 'Salbutamol inhalador',
            category: 'Broncodilatador de rescate',
            keywords: ['asma', 'broncoespasmo', 'silbidos', 'inhalador'],
            uses: 'Medicamento inhalado que puede formar parte del plan de acción para asma indicado a una persona.',
            precautions: 'Úsalo solo según el plan prescrito. Si la dificultad respiratoria es intensa, empeora o no responde al plan, llama al ECU 911.'
        },
        {
            type: 'essential',
            name: 'Omeprazol',
            category: 'Reductor de ácido gástrico',
            keywords: ['reflujo', 'acidez', 'estomago', 'gastritis'],
            uses: 'Se utiliza para algunas afecciones relacionadas con el ácido gástrico, según evaluación o indicación profesional.',
            precautions: 'No es un tratamiento de rescate para dolor fuerte de pecho o abdomen. Consulta si los síntomas persisten, hay vómito con sangre o dificultad para tragar.'
        },
        {
            type: 'essential',
            name: 'Metformina',
            category: 'Antidiabético de prescripción',
            keywords: ['diabetes', 'glucosa', 'azucar'],
            uses: 'Medicamento prescrito para el manejo de algunas personas con diabetes tipo 2.',
            precautions: 'No la inicies, suspendas ni cambies sin indicación. Informa al equipo de salud sobre problemas renales, deshidratación o estudios con contraste.'
        },
        {
            type: 'essential',
            name: 'Losartán',
            category: 'Antihipertensivo de prescripción',
            keywords: ['presion alta', 'hipertension', 'presion arterial'],
            uses: 'Medicamento prescrito para controlar la presión arterial y algunas condiciones cardiovasculares.',
            precautions: 'No es para bajar la presión de forma urgente. Puede ser riesgoso durante el embarazo; no lo compartas ni cambies sin asesoría profesional.'
        },
        {
            type: 'essential',
            name: 'Amlodipino',
            category: 'Antihipertensivo de prescripción',
            keywords: ['presion alta', 'hipertension', 'angina'],
            uses: 'Medicamento de uso continuo que puede indicarse para presión arterial alta o angina.',
            precautions: 'No lo uses como tratamiento de emergencia ni dupliques una toma olvidada sin consultar el envase o a un profesional.'
        },
        /* TRADITIONAL / HERBAL SUPPORT */
        {
            type: 'traditional',
            name: 'Muña (Minthostachys mollis)',
            category: 'Medicina Tradicional Andina',
            uses: 'Digestivo para gases, cólicos estomacales y soroche (mal de altura).',
            prep: 'Infusión de 3 a 4 hojas en agua hervida durante 5 minutos.',
            warning: '⚠️ ADVERTENCIA: No sustituye atención para apendicitis o dolor abdominal agudo persistente.'
        },
        {
            type: 'traditional',
            name: 'Llantén (Plantago major)',
            category: 'Medicina Tradicional',
            uses: 'Cicatrizante externo y desinflamante de encías y garganta.',
            prep: 'Hervir 5 hojas en 1 litro de agua. Usar para gárgaras o compresas externas.',
            warning: '⚠️ ADVERTENCIA: No aplicar sobre heridas profundas abiertas o infectadas.'
        },
        {
            type: 'traditional',
            name: 'Sangre de Grado (Croton lechleri)',
            category: 'Resina Natural Amazónica',
            uses: 'Antiséptico y cicatrizante superficial para raspones y cortes pequeños.',
            prep: 'Aplicar 1 o 2 gotas puras frotando suavemente en el corte superficial limpio.',
            warning: '⚠️ ADVERTENCIA: NUNCA ingerir grandes cantidades ni aplicar en ojos o heridas profundas.'
        },
        {
            type: 'traditional',
            name: 'Manzanilla (Matricaria chamomilla)',
            category: 'Infusión Natural',
            uses: 'Calmante de irritación estomacal leve y lavado ocular de legañas.',
            prep: 'Infusión suave tibia para compresas o beber entibiado.',
            warning: '⚠️ ADVERTENCIA: Asegurar que el agua esté filtrada y limpia antes de contacto ocular.'
        }
    ];

    function initVademecum() {
        renderMeds('meds-essential', '');
        setupSubtabs();
        setupSearch();
    }

    function normalizeText(value) {
        return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderMeds(subtab, searchQuery) {
        currentSubtab = subtab;
        const container = document.getElementById('vademecum-list');
        if (!container) return;

        const targetType = (subtab === 'meds-essential') ? 'essential' : 'traditional';
        const query = normalizeText(searchQuery);

        const filtered = medsCatalog.filter(m => {
            const matchesType = m.type === targetType;
            const searchableText = normalizeText([
                m.name,
                m.category,
                m.uses,
                m.precautions,
                ...(m.keywords || [])
            ].join(' '));
            const matchesSearch = !query || searchableText.includes(query);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">No se encontraron medicamentos o plantas para la búsqueda.</p>`;
            return;
        }

        let html = '';
        filtered.forEach(med => {
            html += `
                <article class="med-card">
                    <div class="med-header">
                        <h3 class="med-title">${escapeHtml(med.name)}</h3>
                        <span class="med-category">${escapeHtml(med.category)}</span>
                    </div>
                    <div class="med-detail-item"><strong>Uso general:</strong> ${escapeHtml(med.uses)}</div>
            `;

            if (med.type === 'essential') {
                html += `
                    <div class="med-detail-item med-safety-detail"><strong>Precauciones:</strong> ${escapeHtml(med.precautions)}</div>
                    <p class="med-no-dose">Esta ficha no indica dosis ni sustituye una receta o la etiqueta del producto.</p>
                `;
            } else {
                html += `
                    <div class="med-detail-item"><strong>Preparación tradicional:</strong> ${escapeHtml(med.prep)}</div>
                    <div class="herbal-warning">${escapeHtml(med.warning)}</div>
                `;
            }

            html += `</article>`;
        });

        container.innerHTML = html;
    }

    function setupSubtabs() {
        const btns = document.querySelectorAll('.subtab-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const searchVal = document.getElementById('vademecum-search').value;
                renderMeds(btn.dataset.subtab, searchVal);
            });
        });
    }

    function setupSearch() {
        const input = document.getElementById('vademecum-search');
        if (input) {
            input.addEventListener('input', (e) => {
                renderMeds(currentSubtab, e.target.value);
            });
        }
    }

    window.MediRuralVademecum = {
        initVademecum: initVademecum
    };
})(window);
