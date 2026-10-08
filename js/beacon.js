/**
 * MediRural AI - Rescue Beacon & Wound Camera Assistant Module
 * Generates 3000Hz acoustic distress whistle sound and camera capture.
 */

(function(window) {
    let audioCtx = null;
    let whistleOsc = null;
    let isWhistleActive = false;
    let cameraStream = null;

    function initBeacon() {
        setupBeaconModal();
        setupCameraModal();
    }

    /* Rescue Beacon & Whistle */
    function setupBeaconModal() {
        const btnWhistle = document.getElementById('btn-whistle-toggle');
        const modal = document.getElementById('beacon-modal');
        const btnClose = document.getElementById('btn-close-beacon');
        const btnToggleSound = document.getElementById('btn-toggle-whistle-sound');

        if (!btnWhistle || !modal) return;

        btnWhistle.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                stopWhistle();
                modal.classList.add('hidden');
            });
        }

        if (btnToggleSound) {
            btnToggleSound.addEventListener('click', () => {
                if (isWhistleActive) {
                    stopWhistle();
                } else {
                    startWhistle();
                }
            });
        }
    }

    function startWhistle() {
        const btn = document.getElementById('btn-toggle-whistle-sound');
        const strobeBox = document.getElementById('beacon-strobe-box');

        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isWhistleActive = true;
        if (btn) btn.innerHTML = `<span>⏹️ DETENER SILBATO DE RESCATE</span>`;
        if (strobeBox) strobeBox.classList.add('strobe-active');

        // High frequency rescue whistle pitch (3000 Hz)
        whistleOsc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        whistleOsc.type = 'sawtooth';
        whistleOsc.frequency.setValueAtTime(3000, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);

        whistleOsc.connect(gain);
        gain.connect(audioCtx.destination);

        whistleOsc.start();
    }

    function stopWhistle() {
        const btn = document.getElementById('btn-toggle-whistle-sound');
        const strobeBox = document.getElementById('beacon-strobe-box');

        if (whistleOsc) {
            try { whistleOsc.stop(); } catch(e){}
            whistleOsc = null;
        }
        isWhistleActive = false;
        if (btn) btn.innerHTML = `<span>📢 ACTIVAR SILBATO Y LUZ</span>`;
        if (strobeBox) strobeBox.classList.remove('strobe-active');
    }

    /* Camera Capture for Wounds & Snakes */
    function setupCameraModal() {
        const btnOpen = document.getElementById('btn-open-wound-cam');
        const modal = document.getElementById('camera-modal');
        const btnClose = document.getElementById('btn-close-camera');
        const btnTake = document.getElementById('btn-take-photo');
        const video = document.getElementById('camera-video');

        if (!btnOpen || !modal) return;

        btnOpen.addEventListener('click', () => {
            modal.classList.remove('hidden');
            startCamera();
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                stopCamera();
                modal.classList.add('hidden');
            });
        }

        if (btnTake && video) {
            btnTake.addEventListener('click', () => {
                takeSnapshot();
            });
        }
    }

    function startCamera() {
        const video = document.getElementById('camera-video');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Acceso a cámara no disponible en este dispositivo.");
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                cameraStream = stream;
                video.srcObject = stream;
            })
            .catch(err => {
                console.warn("Camera error", err);
                alert("No se pudo iniciar la cámara. Verifica los permisos de tu navegador.");
            });
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    function takeSnapshot() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const img = document.getElementById('photo-img-element');
        const preview = document.getElementById('photo-preview-container');

        if (!video || !canvas || !img) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        img.src = dataUrl;
        preview.classList.remove('hidden');
    }

    window.MediRuralBeacon = {
        initBeacon: initBeacon
    };
})(window);
