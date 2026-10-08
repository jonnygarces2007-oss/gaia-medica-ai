/**
 * MediRural AI - Patient Emergency Card & Offline QR Module
 * Encodes medical profile into localStorage and renders readable canvas QR for rural first responders.
 */

(function(window) {
    const STORAGE_KEY = 'medirural_patient_profile';

    function initProfile() {
        loadProfileData();
        setupProfileForm();
        setupPrintButton();
    }

    function loadProfileData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                renderEmergencyCard(null);
                return;
            }

            const data = JSON.parse(saved);
            document.getElementById('prof-fullname').value = data.name || '';
            document.getElementById('prof-dni').value = data.dni || '';
            document.getElementById('prof-blood').value = data.blood || 'Desconocido';
            document.getElementById('prof-age').value = data.age || '';
            document.getElementById('prof-allergies').value = data.allergies || '';
            document.getElementById('prof-conditions').value = data.conditions || '';
            document.getElementById('prof-medications').value = data.medications || '';
            document.getElementById('prof-contact').value = data.contact || '';

            renderEmergencyCard(data);
        } catch (e) {
            showStatus('No se pudo leer la ficha guardada. Puedes borrarla y crear otra.', true);
            renderEmergencyCard(null);
        }
    }

    function setupProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const profileData = {
                name: document.getElementById('prof-fullname').value.trim(),
                dni: document.getElementById('prof-dni').value.trim(),
                blood: document.getElementById('prof-blood').value,
                age: document.getElementById('prof-age').value.trim(),
                allergies: document.getElementById('prof-allergies').value.trim(),
                conditions: document.getElementById('prof-conditions').value.trim(),
                medications: document.getElementById('prof-medications').value.trim(),
                contact: document.getElementById('prof-contact').value.trim(),
                updatedAt: new Date().toISOString().split('T')[0]
            };

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
                renderEmergencyCard(profileData);
                showStatus('Ficha guardada en este dispositivo. No se envió a ningún servicio.', false);
            } catch (error) {
                showStatus('No se pudo guardar. Revisa el espacio disponible en el dispositivo.', true);
            }
        });

        const clearButton = document.getElementById('btn-clear-profile');
        clearButton?.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            form.reset();
            renderEmergencyCard(null);
            showStatus('Ficha borrada de este dispositivo.', false);
        });
    }

    function renderEmergencyCard(data) {
        const container = document.getElementById('emergency-card-details');
        if (!container) return;
        container.replaceChildren();

        if (!data) {
            const emptyState = document.createElement('p');
            emptyState.textContent = 'Ingresa los datos y guarda la ficha para ver aquí la vista previa.';
            container.appendChild(emptyState);
            return;
        }

        const details = [
            ['Nombre', data.name],
            ['Documento', data.dni],
            ['Grupo sanguíneo indicado', data.blood],
            ['Edad / ubicación', data.age],
            ['Alergias', data.allergies],
            ['Condiciones de salud', data.conditions],
            ['Medicamentos actuales', data.medications],
            ['Contacto de emergencia', data.contact],
            ['Actualizada', data.updatedAt]
        ];

        details.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'emergency-card-row';
            const term = document.createElement('strong');
            const description = document.createElement('span');
            term.textContent = label;
            description.textContent = value || 'No registrado';
            row.append(term, description);
            container.appendChild(row);
        });
    }

    function setupPrintButton() {
        const btnPrint = document.getElementById('btn-print-card');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                document.body.classList.add('print-emergency-card');
                window.print();
            });
            window.addEventListener('afterprint', () => {
                document.body.classList.remove('print-emergency-card');
            });
        }
    }

    function showStatus(message, isError) {
        const status = document.getElementById('profile-status');
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function getStoredProfile() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return null;
    }

    window.MediRuralProfile = {
        initProfile: initProfile,
        getStoredProfile: getStoredProfile
    };
})(window);
