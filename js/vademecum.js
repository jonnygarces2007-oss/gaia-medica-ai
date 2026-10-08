/**
 * MediRural AI - Vademecum & Pediatric Dosage Module
 * Essential rural medicine handbook, pediatric mg/kg dosage calculator, and herbal safety index.
 */

(function(window) {
    let currentSubtab = 'meds-essential';

    const medsCatalog = [
        {
            type: 'essential',
            name: 'Paracetamol (Acetaminofén)',
            category: 'Analgésico / Antipirético',
            uses: 'Fiebre alta, dolor de cabeza, malestar muscular o dolor de muela.',
            doseAdult: '500 mg a 1000 mg cada 6 u 8 horas (Máx 4000 mg/día).',
            doseChild: '10 a 15 mg/Kg por dosis cada 6 horas (Usa la calculadora arriba).',
            precautions: 'No exceder la dosis para prevenir daño hepático/hígado.'
        },
        {
            type: 'essential',
            name: 'Ibuprofeno',
            category: 'Antiinflamatorio (AINE)',
            uses: 'Inflamación, dolores fuertes por golpes, torceduras o fiebre persistente.',
            doseAdult: '400 mg cada 8 horas después de comer.',
            doseChild: '5 a 10 mg/Kg por dosis cada 8 horas (Usa la calculadora arriba).',
            precautions: 'Tomar siempre con alimento. Evitar en personas con gastritis o úlceras.'
        },
        {
            type: 'essential',
            name: 'Sales de Rehidratación Oral (SRO)',
            category: 'Rehidratación de Emergencia',
            uses: 'Prevención y tratamiento de la deshidratación por diarrea o vómitos.',
            doseAdult: 'Beber a voluntad después de cada deposición (1 a 2 litros al día).',
            doseChild: '50 a 100 ml por cada deposición líquida dada a cucharaditas.',
            precautions: 'Disolver 1 sobre entero en exactamente 1 litro de agua hervida o potable.'
        },
        {
            type: 'essential',
            name: 'Amoxicilina (Antibiótico)',
            category: 'Antibiótico de Amplio Espectro',
            uses: 'Infecciones bacterianas respiratorias, de oído o garganta graves.',
            doseAdult: '500 mg cada 8 horas por 7 días completos.',
            doseChild: '25 a 50 mg/Kg al día divididos en 3 tomas (Solo bajo criterio médico).',
            precautions: '¡ATENCIÓN! No usar para resfríos o virus. Cumplir los 7 días completos aunque mejore.'
        },
        {
            type: 'essential',
            name: 'Clorfenamina (Antihistamínico)',
            category: 'Antialérgico',
            uses: 'Picaduras de insectos, urticaria, picazón severa, alergias respiratorias.',
            doseAdult: '4 mg cada 8 a 12 horas.',
            doseChild: '0.35 mg/Kg al día divididos en 3 a 4 tomas.',
            precautions: 'Produce somnolencia intensa. No conducir ni manipular maquinaria.'
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
        setupDosageCalc();
    }

    function renderMeds(subtab, searchQuery) {
        currentSubtab = subtab;
        const container = document.getElementById('vademecum-list');
        if (!container) return;

        const targetType = (subtab === 'meds-essential') ? 'essential' : 'traditional';

        const filtered = medsCatalog.filter(m => {
            const matchesType = m.type === targetType;
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query || 
                m.name.toLowerCase().includes(query) || 
                m.category.toLowerCase().includes(query) || 
                m.uses.toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">No se encontraron medicamentos o plantas para la búsqueda.</p>`;
            return;
        }

        let html = '';
        filtered.forEach(med => {
            html += `
                <div class="med-card">
                    <div class="med-header">
                        <span class="med-title">${med.name}</span>
                        <span class="med-category">${med.category}</span>
                    </div>
                    <div class="med-detail-item"><strong>Usos:</strong> ${med.uses}</div>
            `;

            if (med.type === 'essential') {
                html += `
                    <div class="med-detail-item"><strong>Dosis Adulto:</strong> ${med.doseAdult}</div>
                    <div class="med-detail-item"><strong>Dosis Niños:</strong> ${med.doseChild}</div>
                    <div class="med-detail-item" style="color:var(--color-warning);"><strong>Precaución:</strong> ${med.precautions}</div>
                `;
            } else {
                html += `
                    <div class="med-detail-item"><strong>Preparación:</strong> ${med.prep}</div>
                    <div class="herbal-warning">${med.warning}</div>
                `;
            }

            html += `</div>`;
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

    function setupDosageCalc() {
        const btnOpen = document.getElementById('btn-open-dosage-calc');
        const btnClose = document.getElementById('btn-close-dosage');
        const card = document.getElementById('dosage-calc-card');
        const btnCalc = document.getElementById('btn-calc-dose');
        const resultBox = document.getElementById('dosage-result');

        if (!btnOpen || !card) return;

        btnOpen.addEventListener('click', () => {
            card.classList.toggle('hidden');
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                card.classList.add('hidden');
            });
        }

        if (btnCalc) {
            btnCalc.addEventListener('click', () => {
                const weight = parseFloat(document.getElementById('child-weight').value);
                const med = document.getElementById('med-select').value;

                if (!weight || weight <= 0) {
                    alert('Por favor ingresa un peso válido en Kilogramos (ej. 12 kg).');
                    return;
                }

                let text = '';
                if (med === 'paracetamol') {
                    // 120mg/5ml => 24mg per ml. Dosis 15mg/kg => ml = (weight * 15) / 24
                    const mlDose = ((weight * 15) / 24).toFixed(1);
                    const drops = Math.round(weight * 3); // ~ 3 gotas por kg
                    text = `<strong>Paracetamol Jarabe (120mg/5mL):</strong><br>
                            • Dosis recomendada: <strong>${mlDose} mL</strong> (aproximadamente ${drops} gotas) cada 6 horas.<br>
                            <small>*No dar más de 4 veces en 24 horas.</small>`;
                } else if (med === 'ibuprofeno') {
                    // 100mg/5ml => 20mg per ml. Dosis 10mg/kg => ml = (weight * 10) / 20
                    const mlDose = ((weight * 10) / 20).toFixed(1);
                    text = `<strong>Ibuprofeno Jarabe (100mg/5mL):</strong><br>
                            • Dosis recomendada: <strong>${mlDose} mL</strong> cada 8 horas con alimentos.<br>
                            <small>*No usar en bebés menores de 6 meses o con deshidratación grave.</small>`;
                } else if (med === 'sro') {
                    const mlDose = Math.round(weight * 10);
                    text = `<strong>Sales de Rehidratación Oral (SRO):</strong><br>
                            • Dar <strong>${mlDose} mL</strong> a cucharaditas lentas después de CADA deposición líquida o vómito.`;
                } else if (med === 'amoxicilina') {
                    const mlDose = ((weight * 40) / 50).toFixed(1);
                    text = `<strong>Amoxicilina Jarabe (250mg/5mL):</strong><br>
                            • Dosis estándar aproximada: <strong>${mlDose} mL</strong> cada 8 horas.<br>
                            <small style="color:var(--color-warning);">⚠️ Requiere evaluación por el puesto de salud.</small>`;
                }

                resultBox.innerHTML = text;
                resultBox.classList.remove('hidden');
            });
        }
    }

    window.MediRuralVademecum = {
        initVademecum: initVademecum
    };
})(window);
