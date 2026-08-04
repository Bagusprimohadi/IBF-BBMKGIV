// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.2
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

    // 3. Inisialisasi Kontrol Tambahan UI
    if (typeof initScaleBar === 'function') initScaleBar();
    if (typeof initSearchControl === 'function') initSearchControl();

    // 4. Penanganan Event Global: Tutup Dropdown saat Klik Luar
    window.addEventListener('click', function (e) {
        if (!e.target.matches('.dropdown-btn')) {
            const dropdowns = document.querySelectorAll('.dropdown-wrapper');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // 5. Tangani State awal aplikasi dari URL / Load default product
    if (typeof UrlState !== 'undefined' && typeof UrlState.applyInitialState === 'function') {
        UrlState.applyInitialState();
    } else {
        if (typeof switchProduct === 'function') {
            switchProduct('hazard', 'angin');
        }
    }

    // 6. Sembunyikan loader setelah inisialisasi selesai
    setTimeout(() => {
        if (typeof Loader !== 'undefined') {
            Loader.hide();
        }
        console.log("✅ IBF WebGIS Berhasil Dimuat dan Siap Digunakan.");
    }, 800);
});
