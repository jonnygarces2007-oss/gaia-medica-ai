/**
 * MediRural AI - Patient Vitals Control Log Module
 * Logs temperature, pulse, blood pressure, and care notes with timestamp history.
 */

(function(window) {
    const STORAGE_KEY = 'medirural_vitals_log';

    function initVitals() {
        renderVitalsHistory();
        setupVitalsForm();
    }

    function getVitalsList() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [];
    }

    function setupVitalsForm() {
        const form = document.getElementById('vitals-form');
        const btnClear = document.getElementById('btn-clear-vitals');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const temp = document.getElementById('vital-temp').value;
                const pulse = document.getElementById('vital-pulse').value;
                const bp = document.getElementById('vital-bp').value.trim();
                const resp = document.getElementById('vital-resp').value;
                const notes = document.getElementById('vital-notes').value.trim();

                if (!temp && !pulse && !bp) {
                    alert('Por favor registra al menos la Temperatura, Pulso o Presión Arterial.');
                    return;
                }

                const newEntry = {
                    id: 'v_' + Date.now(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString(),
                    temp: temp || 'N/R',
                    pulse: pulse || 'N/R',
                    bp: bp || 'N/R',
                    resp: resp || 'N/R',
                    notes: notes || 'Sin notas'
                };

                const currentList = getVitalsList();
                currentList.unshift(newEntry);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));

                renderVitalsHistory();
                form.reset();
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('¿Deseas borrar el historial de controles del paciente?')) {
                    localStorage.removeItem(STORAGE_KEY);
                    renderVitalsHistory();
                }
            });
        }
    }

    function renderVitalsHistory() {
        const container = document.getElementById('vitals-history-table');
        if (!container) return;

        const list = getVitalsList();

        if (list.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:24px;">No hay lecturas registradas. Añade el primer control a la izquierda.</p>`;
            return;
        }

        let html = '';
        list.forEach(item => {
            const isFever = parseFloat(item.temp) >= 38.0;
            const isHighPulse = parseInt(item.pulse) >= 100;

            html += `
                <div class="vital-item-row" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; margin-bottom:10px;">
                    <div style="display:flex; justify-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">🕒 ${item.date} - ${item.time}</span>
                    </div>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.9rem; font-family:var(--font-mono); font-weight:700;">
                        <span style="${isFever ? 'color:var(--color-danger);' : ''}">🌡️ ${item.temp}°C</span>
                        <span style="${isHighPulse ? 'color:var(--color-warning);' : ''}">❤️ ${item.pulse} BPM</span>
                        <span>🩺 PA: ${item.bp}</span>
                        <span>🫁 Resp: ${item.resp}/min</span>
                    </div>
                    ${item.notes ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:6px;">📝 <em>${item.notes}</em></p>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    window.MediRuralVitals = {
        initVitals: initVitals
    };
})(window);
