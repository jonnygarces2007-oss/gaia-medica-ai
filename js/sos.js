/**
 * MediRural AI - SOS Emergency Broadcast & Satellite Geolocation Engine
 * Formats low-bandwidth text payloads for SMS, WhatsApp, and VHF emergency channels.
 */

(function(window) {
    let currentCoords = null;

    function initSOS() {
        const btnMainSOS = document.getElementById('btn-main-sos');
        const modal = document.getElementById('sos-modal');
        const btnClose = document.getElementById('btn-close-sos');

        if (!btnMainSOS || !modal) return;

        btnMainSOS.addEventListener('click', () => {
            openSOSModal();
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        setupChannelButtons();
    }

    function openSOSModal() {
        const modal = document.getElementById('sos-modal');
        modal.classList.remove('hidden');
        fetchLocationAndBuildPayload();
    }

    function fetchLocationAndBuildPayload() {
        const gpsBox = document.getElementById('gps-status-box');
        const gpsText = document.getElementById('gps-status-text');
        const textarea = document.getElementById('sos-text-payload');

        gpsBox.style.borderColor = 'var(--color-warning)';
        gpsText.textContent = "Obteniendo Coordenadas GPS Satelitales en tiempo real...";

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude.toFixed(5);
                    const lon = pos.coords.longitude.toFixed(5);
                    const acc = Math.round(pos.coords.accuracy);
                    currentCoords = { lat, lon };

                    gpsBox.style.borderColor = 'var(--color-success)';
                    gpsText.innerHTML = `✅ GPS Conectado: <strong>${lat}, ${lon}</strong> (Precisión ~${acc}m)`;
                    buildPayload(lat, lon);
                },
                (err) => {
                    console.warn("GPS Error", err);
                    gpsBox.style.borderColor = 'var(--color-danger)';
                    gpsText.textContent = "⚠️ No se pudo obtener GPS automáticamente. Usando plantilla sin coordenadas.";
                    buildPayload(null, null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            gpsBox.style.borderColor = 'var(--color-danger)';
            gpsText.textContent = "⚠️ Dispositivo no soporta Geolocalización GPS.";
            buildPayload(null, null);
        }
    }

    function buildPayload(lat, lon) {
        const textarea = document.getElementById('sos-text-payload');
        const profile = (window.MediRuralProfile) ? window.MediRuralProfile.getStoredProfile() : null;

        let locStr = (lat && lon) 
            ? `Lat: ${lat}, Lon: ${lon} (https://maps.google.com/?q=${lat},${lon})` 
            : `Ubicación: Sector Rural s/n`;

        let nameStr = profile ? `${profile.name} (DNI: ${profile.dni || 'S/I'}, Sangre: ${profile.blood || 'S/I'})` : `Paciente sin registrar`;
        let allergyStr = profile && profile.allergies ? ` | Alergia: ${profile.allergies}` : '';

        const payload = `🚨 ALERTA SOS MEDICA RURAL 🚨\nUBICACION: ${locStr}\nPACIENTE: ${nameStr}${allergyStr}\nREQUIERE AUXILIO Y EVACUACION MEDICA URGENTE.`;

        textarea.value = payload;
    }

    function setupChannelButtons() {
        const btnSMS = document.getElementById('btn-send-sms');
        const btnWA = document.getElementById('btn-send-whatsapp');
        const btnCall = document.getElementById('btn-call-emergency');

        if (btnSMS) {
            btnSMS.addEventListener('click', () => {
                const text = encodeURIComponent(document.getElementById('sos-text-payload').value);
                // Trigger native SMS protocol without internet
                window.location.href = `sms:?body=${text}`;
            });
        }

        if (btnWA) {
            btnWA.addEventListener('click', () => {
                const text = encodeURIComponent(document.getElementById('sos-text-payload').value);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            });
        }

        if (btnCall) {
            btnCall.addEventListener('click', () => {
                const contacts = (window.MediRuralDirectory) ? window.MediRuralDirectory.getContacts() : [];
                const targetNum = (contacts.length > 0) ? contacts[0].phone : '106';
                window.location.href = `tel:${targetNum}`;
            });
        }
    }

    window.MediRuralSOS = {
        initSOS: initSOS,
        openSOSModal: openSOSModal
    };
})(window);
