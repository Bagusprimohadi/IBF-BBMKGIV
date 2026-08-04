// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.3
// ==========================================

// ==========================================
// FUNGSI KONTROL UI GLOBAL
// ==========================================

/**
 * Fungsi untuk membuka/menutup dropdown menu (Dipanggil langsung dari HTML)
 * @param {string} id - ID dari container dropdown
 */
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        // 1. Tutup semua dropdown lain yang sedang terbuka agar tidak bertumpuk
        const allDropdowns = document.querySelectorAll('.dropdown-wrapper');
        allDropdowns.forEach(dw => {
            if (dw.id !== id) dw.classList.remove('active');
        });
        
        // 2. Buka/tutup dropdown yang sedang diklik
        dropdown.classList.toggle('active');
    }
}

// Event Global: Menutup menu dropdown saat pengguna mengklik area luar menu / peta
window.addEventListener('click', function (e) {
    if (!e.target.matches('.dropdown-btn')) {
        const dropdowns = document.querySelectorAll('.dropdown-wrapper');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});


// ==========================================
// INISIALISASI SISTEM SAAT DOM SIAP
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Menginisialisasi IBF WebGIS Operational System - BBMKG IV...");

    // 1. Tampilkan indikator loading awal
    if (typeof Loader !== 'undefined') {
        Loader.show("Menyiapkan Command Center WebGIS...");
    }

    // 2. Inisialisasi Peta Dasar & Basemap (Wajib Pertama)
    if (typeof initMap === 'function') {
        initMap();
    }
    if (typeof initBasemap === 'function') {
        initBasemap();
    }

    // 3. Inisialisasi Kontrol Tambahan UI (Skala & Pencarian)
    if (typeof initScaleBar === 'function') initScaleBar();
    if (typeof initSearchControl === 'function') initSearchControl();

    // 4. Tangani State awal aplikasi dari URL atau muat produk default
    if (typeof UrlState !== 'undefined' && typeof UrlState.applyInitialState === 'function') {
        UrlState.applyInitialState();
    } else {
        if (typeof switchProduct === 'function') {
            switchProduct('hazard', 'angin');
        }
    }

    // 5. Sembunyikan loader setelah inisialisasi selesai (jeda 800ms agar smooth)
    setTimeout(() => {
        if (typeof Loader !== 'undefined') {
            Loader.hide();
        }
        console.log("✅ IBF WebGIS Berhasil Dimuat dan Siap Digunakan.");
    }, 800);
});
