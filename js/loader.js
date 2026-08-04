// ==========================================
// LOADER.JS - PENGELOLA INDIKATOR PEMUATAN V1.1
// ==========================================

const Loader = {
    /**
     * Menampilkan indikator loading global
     * @param {string} message - Pesan opsional yang ingin ditampilkan
     */
    show(message = "Memuat data sistem...") {
        let loaderEl = document.getElementById('globalLoader');
        
        if (!loaderEl) {
            // Buat elemen loader secara dinamis jika belum ada di HTML
            loaderEl = document.createElement('div');
            loaderEl.id = 'globalLoader';
            loaderEl.className = 'global-loader-overlay';
            loaderEl.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p id="loaderMessage">${message}</p>
                </div>
            `;
            document.body.appendChild(loaderEl);
        } else {
            let msgEl = document.getElementById('loaderMessage');
            if (msgEl) msgEl.innerText = message;
            loaderEl.style.display = 'flex';
        }
    },

    /**
     * Menyembunyikan indikator loading
     */
    hide() {
        let loaderEl = document.getElementById('globalLoader');
        if (loaderEl) {
            loaderEl.style.display = 'none';
        }
    }
};
