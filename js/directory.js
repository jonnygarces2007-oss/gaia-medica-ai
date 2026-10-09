/**
 * MediRural ECU 🇪🇨 - Ecuadorian Health Directory & GPS Distance Engine
 * Created by Jonny for Rural Healthcare in Ecuador.
 */

(function(window) {
    const STORAGE_KEY = 'medirural_ecuador_contacts';
    const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

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
            const name = escapeHtml(c.name || 'Contacto de salud');
            const role = escapeHtml(c.role || 'Contacto local');
            const province = escapeHtml(c.provincia || 'Ecuador');
            const phone = String(c.phone || '');
            const telephone = escapeHtml(phone.replace(/[^0-9+]/g, ''));
            const safePhone = escapeHtml(phone);
            const radio = escapeHtml(c.radio || '');

            html += `
                <div class="contact-card">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span class="contact-role-badge">${role}</span>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--color-warning);">📍 ${province}</span>
                        </div>
                        <h3>${name}</h3>
                        <div style="margin: 10px 0;">
                            <a href="tel:${telephone}" class="contact-phone-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                <span>${safePhone}</span>
                            </a>
                        </div>
                        ${radio ? `<div class="contact-radio-freq">📻 ${radio}</div>` : ''}
                    </div>
                    <div style="margin-top:14px;">
                        <a href="tel:${telephone}" class="btn-primary btn-block" style="text-decoration:none;">Llamar Emergencia</a>
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
            if (!('geolocation' in navigator)) {
                statusText.textContent = 'Este dispositivo no ofrece geolocalización. Busca el centro en el mapa manualmente.';
                return;
            }

            btnCalc.disabled = true;
            btnCalc.textContent = 'Obteniendo ubicación...';
            statusText.textContent = 'Solicitando una ubicación GPS precisa...';
            grid.innerHTML = '<p class="gps-empty-state">Esperando permiso y señal de ubicación...</p>';

            navigator.geolocation.getCurrentPosition(async (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                const accuracy = Math.round(position.coords.accuracy);

                statusText.textContent = `Ubicación recibida con precisión aproximada de ±${accuracy} m. Buscando centros de salud cercanos en OpenStreetMap...`;

                try {
                    if (!navigator.onLine) throw new Error('offline');

                    const facilities = await findNearbyFacilities(userLocation);
                    if (!facilities.length) {
                        statusText.textContent = 'No encontramos centros mapeados en un radio de 60 km. Esto no confirma que no existan; consulta ECU 911 si es urgente.';
                        grid.innerHTML = '<p class="gps-empty-state">No hay resultados en el mapa colaborativo para esta zona.</p>';
                        return;
                    }

                    statusText.textContent = `Encontramos ${facilities.length} centros (precisión GPS aprox. ±${accuracy} m). El primero es el más cercano por distancia en línea recta; la ruta puede ser más larga.`;
                    renderFacilityResults(facilities, userLocation, grid);
                } catch (error) {
                    statusText.textContent = 'No se pudo consultar OpenStreetMap. Se muestran únicamente contactos locales de respaldo, que pueden no ser los más cercanos.';
                    renderLocalFallback(userLocation, grid);
                } finally {
                    btnCalc.disabled = false;
                    btnCalc.textContent = '📍 Buscar centros cercanos';
                }
            }, (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    statusText.textContent = 'Permite el acceso a la ubicación para buscar centros cercanos. Si es una emergencia, llama al ECU 911.';
                } else if (error.code === error.TIMEOUT) {
                    statusText.textContent = 'La ubicación tardó demasiado. Activa el GPS y vuelve a intentarlo.';
                } else {
                    statusText.textContent = 'No se pudo obtener una ubicación precisa. Comprueba el GPS y vuelve a intentarlo.';
                }
                grid.innerHTML = '<p class="gps-empty-state">Aún no hay resultados. Vuelve a intentar cuando la ubicación esté disponible.</p>';
                btnCalc.disabled = false;
                btnCalc.textContent = '📍 Buscar centros cercanos';
            }, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000
            });
        });

        renderInitialNearList();
    }

    async function findNearbyFacilities(userLocation) {
        for (const radiusMeters of [25000, 60000]) {
            const facilities = await queryOverpass(userLocation, radiusMeters);
            if (facilities.length) return facilities;
        }
        return [];
    }

    async function queryOverpass(userLocation, radiusMeters) {
        const query = `[out:json][timeout:20];(nwr["amenity"~"^(hospital|clinic|doctors|health_post)$"](around:${radiusMeters},${userLocation.lat},${userLocation.lon});nwr["healthcare"~"^(hospital|clinic|doctor|doctors|centre|health_centre|health_center|health_post)$"](around:${radiusMeters},${userLocation.lat},${userLocation.lon}););out center tags;`;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 25000);

        try {
            const response = await fetch(OVERPASS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: new URLSearchParams({ data: query }),
                signal: controller.signal
            });
            if (!response.ok) throw new Error('Overpass request failed');

            const data = await response.json();
            const facilities = (data.elements || []).map((element) => {
                const tags = element.tags || {};
                const coordinates = element.type === 'node' ? element : element.center;
                if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lon)) return null;

                const facilityType = tags.amenity || tags.healthcare || 'healthcare';
                const name = tags.name || tags['name:es'] || facilityTypeLabel(facilityType);
                return {
                    id: `${element.type}-${element.id}`,
                    name,
                    role: facilityTypeLabel(facilityType),
                    kind: facilityType,
                    phone: tags.phone || tags['contact:phone'] || '',
                    provincia: tags['addr:city'] || tags['addr:suburb'] || tags['addr:province'] || '',
                    lat: coordinates.lat,
                    lon: coordinates.lon,
                    distanceKm: calculateHaversineDistance(userLocation.lat, userLocation.lon, coordinates.lat, coordinates.lon)
                };
            }).filter(Boolean);

            const uniqueFacilities = new Map();
            facilities.forEach((facility) => {
                const key = `${facility.name.toLowerCase()}-${facility.lat.toFixed(4)}-${facility.lon.toFixed(4)}`;
                if (!uniqueFacilities.has(key)) uniqueFacilities.set(key, facility);
            });

            return [...uniqueFacilities.values()]
                .sort((first, second) => first.distanceKm - second.distanceKm)
                .slice(0, 8);
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function facilityTypeLabel(type) {
        const labels = {
            hospital: 'Hospital',
            clinic: 'Clínica',
            doctors: 'Consultorio médico',
            doctor: 'Consultorio médico',
            health_centre: 'Centro de salud',
            health_center: 'Centro de salud',
            health_post: 'Puesto de salud'
        };
        return labels[type] || 'Centro de salud';
    }

    function renderFacilityResults(facilities, userLocation, grid, isLocalFallback = false) {
        grid.innerHTML = facilities.map((facility, index) => {
            const distance = facility.distanceKm.toFixed(1);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${facility.lat},${facility.lon}&travelmode=driving`;
            const phone = String(facility.phone || '').replace(/[^0-9+]/g, '');

            return `
                <article class="contact-card facility-card ${index === 0 ? 'is-nearest' : ''}">
                    <div>
                        <div class="facility-meta">
                            <span class="contact-role-badge">${escapeHtml(facility.role)}</span>
                            <span class="facility-distance">${index === 0 ? 'Más cercano · ' : ''}${distance} km</span>
                        </div>
                        <h3>${escapeHtml(facility.name)}</h3>
                        <p class="facility-location">${escapeHtml(facility.provincia || 'Ubicación aproximada')} · ${distance} km en línea recta</p>
                        ${phone ? `<a href="tel:${phone}" class="contact-phone-link">📞 ${escapeHtml(facility.phone)}</a>` : '<p class="facility-no-phone">Teléfono no disponible en el mapa</p>'}
                    </div>
                    <div class="facility-actions">
                        ${phone ? `<a href="tel:${phone}" class="btn-primary">Llamar</a>` : ''}
                        <a href="${mapsUrl}" class="btn-secondary" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                    </div>
                </article>
            `;
        }).join('') + (isLocalFallback ? '<p class="facility-source-note">Contactos guardados en este dispositivo; no son resultados verificados en línea.</p>' : '');
    }

    function renderLocalFallback(userLocation, grid) {
        const localFacilities = getContacts()
            .filter((contact) => Number.isFinite(contact.lat) && Number.isFinite(contact.lon) && /(hospital|salud|subcentro|puesto)/i.test(`${contact.name} ${contact.role}`))
            .map((contact) => ({
                ...contact,
                kind: contact.role,
                distanceKm: calculateHaversineDistance(userLocation.lat, userLocation.lon, contact.lat, contact.lon)
            }))
            .sort((first, second) => first.distanceKm - second.distanceKm)
            .slice(0, 5);

        if (!localFacilities.length) {
            grid.innerHTML = '<p class="gps-empty-state">No hay centros guardados en este dispositivo.</p>';
            return;
        }
        renderFacilityResults(localFacilities, userLocation, grid, true);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderInitialNearList() {
        const grid = document.getElementById('nearest-centers-grid');
        if (!grid) return;
        grid.innerHTML = '<p class="gps-empty-state">Aquí aparecerán los centros ordenados por proximidad.</p>';
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
