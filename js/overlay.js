// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER PNG & METADATA V1.1
// ==========================================

let currentCategory = 'hazard'; // Default kategori awal ('hazard' atau 'risiko')
let currentProductKey = 'angin'; // Default produk awal
let currentOpacity = 0.85; // Default transparan (85%)

/**
 * Fungsi utama untuk mengganti produk dari menu tombol terpisah (Bahaya / Risiko)
 * @param {string} category ('hazard' atau 'risiko')
 * @param {string} productKey (kunci produk dari CONFIG.products)
 */
function switchProduct(category, productKey) {
    if (typeof stopPlay === 'function') stopPlay();
    
    currentCategory = category;
    currentProductKey = productKey;
    
    // Tutup semua dropdown terbuka
    if (typeof closeAllDropdowns === 'function') {
        closeAllDropdowns();
    }

    // Ambil konfigurasi dari CONFIG (config.js)
    let productConfig = CONFIG.products[category][productKey];
    if (!productConfig) {
        console.error("Konfigurasi produk tidak ditemukan untuk:", category, productKey);
        return;
    }

    // 1. Update Judul di Header Utama secara Dinamis (Menyesuaikan properti name & subtitle dari config.js)
    let subtitleEl = document.getElementById('systemSubtitle');
    let titleEl = document.getElementById('hazardTitle');
    if (subtitleEl) subtitleEl.innerText = productConfig.subtitle || '';
    if (titleEl) titleEl.innerText = productConfig.title || productConfig.name || '';

    // 2. Render Legenda Sesuai Produk Aktif (Menyesuaikan property legends dari config.js)
    if (typeof renderLegend === 'function') {
        renderLegend(productConfig);
    }

    // 3. Bersihkan Layer PNG Sebelumnya dari Peta
    if (typeof imageLayers !== 'undefined' && Array.isArray(imageLayers)) {
        imageLayers.forEach(layer => map.removeLayer(layer));
        imageLayers = [];
    }

    // 4. Muat Data Metadata & Layer PNG Baru
    loadProductData(category, productKey);
}

/**
 * Memuat file metadata JSON dan menyusun tombol navigasi waktu (Hari)
 */
function loadProductData(category, productKey) {
    let productConfig = CONFIG.products[category][productKey];
    let uniqueInit = new Date().getTime(); // Mencegah cache browser

    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = "Valid: Memuat data...";

    // Mengambil file metadata JSON dari folder produk yang bersangkutan
    let metadataUrl = productConfig.folder + productConfig.metaFile + '?v=' + uniqueInit;

    fetch(metadataUrl)
        .then(res => {
            if (!res.ok) throw new Error("Metadata tidak ditemukan");
            return res.json();
        })
        .then(data => {
            window.validDates = data.dates || [];
            let bounds = data.bounds || CONFIG.map.defaultBounds;

            // Simpan juga data atribut rekap wilayah dari metadata jika disediakan backend
            window.backendImpactData = data.regions || data.impactData || {};

            const btnContainer = document.getElementById('dayButtonsContainer');
            if (btnContainer) {
                btnContainer.innerHTML = "";
            }

            window.imageLayers = [];

            // Buat overlay gambar PNG dan tombol hari secara dinamis
            for (let i = 0; window.validDates && i < window.validDates.length; i++) {
                // Penamaan file PNG mengikuti prefiks di dalam folder produk
                let imgUrl = `${productConfig.folder}${productConfig.prefix}${i}.png?v=${uniqueInit}`;
                
                let overlay = L.imageOverlay(imgUrl, bounds, { 
                    opacity: 0, 
                    interactive: false 
                }).addTo(map);
                
                window.imageLayers.push(overlay);

                if (btnContainer) {
                    let btn = document.createElement('button');
                    btn.className = 'time-btn';
                    btn.id = 'day-btn-' + i;
                    // Label tombol otomatis H-1, H+0, H+1, dst
                    btn.innerText = `H${i === 0 ? '-1' : '+' + (i - 1)}`; 
                    btn.onclick = function() { 
                        if (typeof stopPlay === 'function') stopPlay(); 
                        loadDay(i); 
                    };
                    btnContainer.appendChild(btn);
                }
            }

            // Muat hari pertama sebagai default tampilan awal
            if (window.validDates.length > 0) {
                loadDay(0);
            }
        })
        .catch(err => {
            console.warn("Gagal memuat metadata:", err);
            window.validDates = [];
            if (dateTextEl) dateTextEl.innerText = "⚠️ Data Produk Belum Tersedia";
            
            const btnContainer = document.getElementById('dayButtonsContainer');
            if (btnContainer) {
                btnContainer.innerHTML = "<span style='font-size:12px; color:#f43f5e; font-weight:bold;'>Data belum diunggah ke server.</span>";
            }
            if (typeof imageLayers !== 'undefined') {
                imageLayers.forEach(layer => map.removeLayer(layer));
                imageLayers = [];
            }
        });
}

/**
 * Menampilkan layer gambar PNG pada indeks hari tertentu
 */
function loadDay(index) {
    if (!window.validDates || window.validDates.length === 0) return;
    window.currentIndex = index;

    if (typeof imageLayers !== 'undefined') {
        for (let i = 0; i < imageLayers.length; i++) {
            if (i === index) {
                imageLayers[i].setOpacity(currentOpacity); // Mengikuti nilai slider opacity aktif
            } else {
                imageLayers[i].setOpacity(0);
            }
        }
    }

    for (let i = 0; i < window.validDates.length; i++) {
        let btn = document.getElementById('day-btn-' + i);
        if (btn) {
            btn.classList.toggle('active', i === index);
        }
    }

    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl && typeof Utils !== 'undefined') {
        dateTextEl.innerText = `Valid: ${Utils.formatTanggal(window.validDates[index])}`;
    }
}
