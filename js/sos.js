/**
 * MediRural AI - SOS Emergency Broadcast & Device Geolocation
 * Formats low-bandwidth text payloads for SMS, WhatsApp, and VHF emergency channels.
 */

(function(window) {
    let currentCoords = null;

    function initSOS() {
        const btnMainSOS = document.getElementById('btn-main-sos');
        const modal = document.getElementById('sos-modal');
        const btnClose = document.getElementById('btn-close-sos');
        const btnRefreshLocation = document.getElementById('btn-refresh-sos-location');
        const btnCopyLocation = document.getElementById('btn-copy-sos-location');

        if (!btnMainSOS || !modal) return;

        btnMainSOS.addEventListener('click', () => {
            openSOSModal();
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        if (btnRefreshLocation) {
            btnRefreshLocation.addEventListener('click', fetchLocationAndBuildPayload);
        }

        if (btnCopyLocation) {
            btnCopyLocation.addEventListener('click', copyCoordinates);
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
        const refreshButton = document.getElementById('btn-refresh-sos-location');
        const copyButton = document.getElementById('btn-copy-sos-location');
        const feedback = document.getElementById('gps-copy-feedback');
        const spinner = gpsBox.querySelector('.spinner');

        currentCoords = null;
        buildPayload(null);
        if (feedback) feedback.textContent = '';
        if (copyButton) copyButton.disabled = true;
        if (refreshButton) refreshButton.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        gpsBox.style.borderColor = 'var(--color-warning)';
        gpsText.textContent = 'Solicitando una ubicación actualizada al dispositivo…';

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    currentCoords = {
                        lat: latitude.toFixed(5),
                        lon: longitude.toFixed(5),
                        accuracy,
                        timestamp: pos.timestamp
                    };

                    gpsBox.style.borderColor = 'var(--color-success)';
                    gpsText.textContent = `Ubicación recibida: ${currentCoords.lat}, ${currentCoords.lon} · precisión reportada ±${Math.round(accuracy)} m · ${formatCaptureTime(pos.timestamp)}.`;
                    buildPayload(currentCoords);
                    if (copyButton) copyButton.disabled = false;
                    finishLocationRequest(refreshButton, spinner);
                },
                (err) => {
                    console.warn("GPS Error", err);
                    currentCoords = null;
                    gpsBox.style.borderColor = 'var(--color-danger)';
                    gpsText.textContent = locationErrorMessage(err);
                    buildPayload(null);
                    finishLocationRequest(refreshButton, spinner);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        } else {
            gpsBox.style.borderColor = 'var(--color-danger)';
            gpsText.textContent = 'La geolocalización no está disponible en este navegador o contexto. Usa una conexión segura (HTTPS) y revisa los permisos; el mensaje se puede enviar sin coordenadas.';
            buildPayload(null, null);
            finishLocationRequest(refreshButton, spinner);
        }
    }

    function finishLocationRequest(button, spinner) {
        if (button) button.disabled = false;
        if (spinner) spinner.classList.add('hidden');
    }

    function formatCaptureTime(timestamp) {
        return new Intl.DateTimeFormat('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(timestamp));
    }

    function locationErrorMessage(error) {
        if (error.code === error.PERMISSION_DENIED) {
            return 'No se concedió el permiso de ubicación. Revisa el permiso del navegador y que la página use una conexión segura; el mensaje se preparó sin coordenadas.';
        }
        if (error.code === error.TIMEOUT) {
            return 'La ubicación tardó demasiado y no se recibió una posición. Activa la ubicación y vuelve a intentar; el mensaje está sin coordenadas.';
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
            return 'El dispositivo no pudo determinar una ubicación. Comprueba sus ajustes de ubicación y vuelve a intentar; el mensaje está sin coordenadas.';
        }
        return 'No se pudo obtener la ubicación. El mensaje se preparó sin coordenadas; puedes volver a intentarlo.';
    }

    async function copyCoordinates() {
        const feedback = document.getElementById('gps-copy-feedback');
        if (!currentCoords) return;

        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
            await navigator.clipboard.writeText(`${currentCoords.lat}, ${currentCoords.lon}`);
            if (feedback) feedback.textContent = 'Coordenadas copiadas. Precisión reportada por el dispositivo: ±' + Math.round(currentCoords.accuracy) + ' m.';
        } catch (error) {
            if (feedback) feedback.textContent = 'No se pudieron copiar automáticamente. Puedes seleccionar las coordenadas en el mensaje SOS.';
        }
    }

    function buildPayload(location) {
        const textarea = document.getElementById('sos-text-payload');
        const profile = (window.MediRuralProfile) ? window.MediRuralProfile.getStoredProfile() : null;

        const locStr = location
            ? `Lat: ${location.lat}, Lon: ${location.lon} (precisión reportada ±${Math.round(location.accuracy)} m; https://maps.google.com/?q=${location.lat},${location.lon})`
            : 'Ubicación: no disponible (sin coordenadas)';

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
