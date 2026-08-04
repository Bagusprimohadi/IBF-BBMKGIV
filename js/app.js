// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.1
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

/**
 * Tutup semua menu dropdown yang terbuka
 */
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-wrapper');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

// Event Global: Menutup menu dropdown saat pengguna mengklik area luar menu / peta
window.addEventListener('click', function (e) {
    if (!e.target.matches('.dropdown-btn') && !e.target.closest('.dropdown-btn')) {
        closeAllDropdowns();
    }
});


// ==========================================
// INISIALISASI SISTEM SAAT DOM SIAP
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Menginisialisasi IBF WebGIS Operational System V1.1 - BBMKG IV...");

    // 1. Tampilkan indikator loading awal
    if (typeof showLoader === 'function') {
        showLoader();
    } else if (typeof Loader !== 'undefined' && typeof Loader.show === 'function') {
        Loader.show("Menyiapkan Command Center WebGIS...");
    }

    // 2. Inisialisasi Peta Dasar & Basemap (Wajib Pertama)
    if (typeof initMap === 'function') {
        initMap();
    }

    if (typeof initBasemaps === 'function') {
        initBasemaps();
    } else if (typeof initBasemap === 'function') {
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

    // 5. Sembunyikan loader setelah inisialisasi selesai
    setTimeout(() => {
        if (typeof hideLoader === 'function') {
            hideLoader();
        } else if (typeof Loader !== 'undefined' && typeof Loader.hide === 'function') {
            Loader.hide();
        }
        console.log("✅ IBF WebGIS V1.1 Berhasil Dimuat dan Siap Digunakan.");
    }, 800);
});
