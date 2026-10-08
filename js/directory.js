/**
 * MediRural ECU 🇪🇨 - Ecuadorian Health Directory & GPS Distance Engine
 * Created by Jonny for Rural Healthcare in Ecuador.
 */

(function(window) {
    const STORAGE_KEY = 'medirural_ecuador_contacts';

    // Preset MSP Ecuador Rural Health Centers across Sierra, Costa, and Amazonía
    const ecuadorCenters = [
        {
            id: 'ec_911',
            name: 'Servicio Integrado de Seguridad ECU 911 (Nacional)',
            phone: '911',
            radio: 'VHF 148.500 MHz (Canal Emergencia Ecuador)',
            role: 'ECU 911 / Emergencia Nacional',
            provincia: 'Ecuador Nacional',
            lat: -0.18065,
            lon: -78.46784
        },
        {
            id: 'ec_171',
            name: 'MSP 171 - Ministerio de Salud Pública del Ecuador',
            phone: '171',
            radio: 'VHF 146.400 MHz',
            role: 'MSP Ecuador / Citas y Orientación',
            provincia: 'Ecuador Nacional',
            lat: -0.22016,
            lon: -78.51232
        },
        {
            id: 'ec_cr',
            name: 'Cruz Roja Ecuatoriana - Central de Evacuación',
            phone: '022582482',
            radio: 'VHF 150.100 MHz',
            role: 'Ambulancia / Cruz Roja Ecuatoriana',
            provincia: 'Pichincha / Quito',
            lat: -0.20500,
            lon: -78.49000
        },
        {
            id: 'ec_pichincha',
            name: 'Subcentro de Salud MSP Tipo A - Tabacundo / Pedro Moncayo',
            phone: '022365120',
            radio: 'VHF Canal 2 (145.200 MHz)',
            role: 'Subcentro de Salud MSP Tipo A/B/C',
            provincia: 'Pichincha',
            lat: 0.04314,
            lon: -78.22345
        },
        {
            id: 'ec_amazon_napo',
            name: 'Puesto de Salud MSP El Chaco / Tena (Amazonía Ecuatoriana)',
            phone: '062886100',
            radio: 'HF 7.150 MHz SSB (Canal Fluvial Amazonía)',
            role: 'Ambulancia ECU 911 / Fluvial Amazonía',
            provincia: 'Napo / Amazonía',
            lat: -0.34000,
            lon: -77.81000
        },
        {
            id: 'ec_chimborazo',
            name: 'Subcentro de Salud Rural MSP - Colta / Guamote',
            phone: '032960100',
            radio: 'VHF 144.800 MHz',
            role: 'Subcentro de Salud MSP Tipo A/B/C',
            provincia: 'Chimborazo',
            lat: -1.71000,
            lon: -78.75000
        },
        {
            id: 'ec_manabi',
            name: 'Centro de Salud MSP Tipo C - Chone / Pedernales',
            phone: '052695200',
            radio: 'VHF 147.300 MHz',
            role: 'Subcentro de Salud MSP Tipo A/B/C',
            provincia: 'Manabí',
            lat: -0.69800,
            lon: -80.09300
        }
    ];

    function initDirectory() {
        renderDirectory();
        setupContactModal();
        setupNearGPSCalculator();
    }

    function getContacts() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return ecuadorCenters;
    }

    function renderDirectory() {
        const container = document.getElementById('contacts-grid-container');
        if (!container) return;

        const contacts = getContacts();

        let html = '';
        contacts.forEach(c => {
            html += `
                <div class="contact-card">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span class="contact-role-badge">${c.role}</span>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--color-warning);">📍 ${c.provincia || 'Ecuador'}</span>
                        </div>
                        <h3>${c.name}</h3>
                        <div style="margin: 10px 0;">
                            <a href="tel:${c.phone}" class="contact-phone-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                <span>${c.phone}</span>
                            </a>
                        </div>
                        ${c.radio ? `<div class="contact-radio-freq">📻 ${c.radio}</div>` : ''}
                    </div>
                    <div style="margin-top:14px;">
                        <a href="tel:${c.phone}" class="btn-primary btn-block" style="text-decoration:none;">Llamar Emergencia</a>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /* Haversine Distance Formula in Kilometers between 2 GPS points */
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in Km
    }

    function setupNearGPSCalculator() {
        const btnCalc = document.getElementById('btn-calc-gps-near');
        const grid = document.getElementById('nearest-centers-grid');
        const statusText = document.getElementById('patient-coords-text');

        if (!btnCalc || !grid) return;

        btnCalc.addEventListener('click', () => {
            if ('geolocation' in navigator) {
                statusText.textContent = "⌛ Obteniendo posición GPS del paciente en Ecuador...";
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userLat = pos.coords.latitude;
                        const userLon = pos.coords.longitude;

                        statusText.innerHTML = `✅ Ubicación Paciente: <strong>${userLat.toFixed(5)}, ${userLon.toFixed(5)}</strong>`;

                        const contacts = getContacts();

                        // Map distances
                        const mapped = contacts.map(c => {
                            let dist = (c.lat && c.lon) 
                                ? calculateHaversineDistance(userLat, userLon, c.lat, c.lon)
                                : 15.0; // fallback default
                            return { ...c, distanceKm: dist };
                        });

                        // Sort nearest to farthest
                        mapped.sort((a, b) => a.distanceKm - b.distanceKm);

                        let html = '';
                        mapped.forEach(c => {
                            const distKm = c.distanceKm.toFixed(1);
                            const walkMins = Math.round(c.distanceKm * 15); // ~ 4 km/h walking

                            html += `
                                <div class="contact-card" style="border:1.5px solid var(--color-info);">
                                    <div>
                                        <div style="display:flex; justify-between; align-items:center; margin-bottom:8px;">
                                            <span class="contact-role-badge">${c.role}</span>
                                            <span style="background:var(--color-info); color:#fff; font-weight:800; font-size:0.8rem; padding:3px 10px; border-radius:var(--radius-full);">
                                                📍 a ${distKm} Km
                                            </span>
                                        </div>
                                        <h3>${c.name}</h3>
                                        <p style="font-size:0.82rem; color:var(--text-muted); margin:6px 0;">
                                            ⏱️ Tiempo estimado a pie: ~${walkMins} mins | Provincia: ${c.provincia}
                                        </p>
                                        <div style="margin: 10px 0;">
                                            <a href="tel:${c.phone}" class="contact-phone-link">
                                                📞 <span>${c.phone}</span>
                                            </a>
                                        </div>
                                        ${c.radio ? `<div class="contact-radio-freq">📻 ${c.radio}</div>` : ''}
                                    </div>
                                    <div style="margin-top:14px; display:flex; gap:8px;">
                                        <a href="tel:${c.phone}" class="btn-primary btn-block" style="text-decoration:none;">Llamar</a>
                                        <a href="https://maps.google.com/?q=${c.lat},${c.lon}" target="_blank" class="btn-secondary" style="text-decoration:none;">🗺️ Mapa</a>
                                    </div>
                                </div>
                            `;
                        });

                        grid.innerHTML = html;
                    },
                    (err) => {
                        statusText.textContent = "⚠️ No se pudo obtener el GPS del teléfono. Asegúrate de permitir acceso a la ubicación.";
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }
        });

        // Trigger initial render
        renderInitialNearList();
    }

    function renderInitialNearList() {
        const grid = document.getElementById('nearest-centers-grid');
        if (!grid) return;
        const contacts = getContacts();

        let html = '';
        contacts.forEach(c => {
            html += `
                <div class="contact-card">
                    <div>
                        <span class="contact-role-badge">${c.role}</span>
                        <h3>${c.name}</h3>
                        <p style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">Provincia: ${c.provincia}</p>
                        <div style="margin: 10px 0;">
                            <a href="tel:${c.phone}" class="contact-phone-link">📞 ${c.phone}</a>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    function setupContactModal() {
        const btnAdd = document.getElementById('btn-add-contact');
        const modal = document.getElementById('contact-modal');
        const btnClose = document.getElementById('btn-close-contact-modal');
        const form = document.getElementById('add-contact-form');

        if (!btnAdd || !modal) return;

        btnAdd.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const newContact = {
                    id: 'c_' + Date.now(),
                    name: document.getElementById('contact-name').value.trim(),
                    phone: document.getElementById('contact-phone').value.trim(),
                    radio: document.getElementById('contact-radio').value.trim(),
                    role: document.getElementById('contact-role').value,
                    provincia: 'Comunidad Ecuatoriana'
                };

                const currentList = getContacts();
                currentList.unshift(newContact);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));

                renderDirectory();
                modal.classList.add('hidden');
                form.reset();
            });
        }
    }

    window.MediRuralDirectory = {
        initDirectory: initDirectory,
        getContacts: getContacts
    };
})(window);
