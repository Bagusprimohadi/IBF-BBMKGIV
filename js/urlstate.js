// ==========================================
// URLSTATE.JS - MANAJEMEN STATE URL & SHARING V1.1
// ==========================================

const UrlState = {
    /**
     * Memperbarui parameter URL tanpa me-reload halaman saat produk atau hari berubah
     * @param {string} category 
     * @param {string} productKey 
     * @param {number} dayIndex 
     */
    update(category, productKey, dayIndex) {
        if (!history.pushState) return;

        let params = new URLSearchParams(window.location.search);
        
        if (category) params.set('cat', category);
        if (productKey) params.set('prod', productKey);
        if (dayIndex !== undefined && dayIndex !== null) params.set('day', dayIndex);

        let newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({ path: newUrl }, '', newUrl);
    },

    /**
     * Membaca parameter dari URL saat halaman pertama kali dimuat
     * @returns {Object} State awal (category, product, day)
     */
    parse() {
        let params = new URLSearchParams(window.location.search);
        
        let category = params.get('cat');
        let productKey = params.get('prod');
        let dayIndex = params.get('day');

        return {
            category: (category && CONFIG.products && CONFIG.products[category]) ? category : null,
            productKey: (category && productKey && CONFIG.products[category][productKey]) ? productKey : null,
            dayIndex: (dayIndex !== null && !isNaN(dayIndex)) ? parseInt(dayIndex, 10) : null
        };
    },

    /**
     * Menerapkan state dari URL saat inisialisasi aplikasi
     */
    applyInitialState() {
        let state = this.parse();

        // Jika parameter URL valid, gunakan nilainya; jika tidak, gunakan default dari overlay.js
        let targetCategory = state.category || (typeof currentCategory !== 'undefined' ? currentCategory : 'hazard');
        let targetProduct = state.productKey || (typeof currentProductKey !== 'undefined' ? currentProductKey : 'angin');

        if (typeof switchProduct === 'function') {
            switchProduct(targetCategory, targetProduct);
        }

        // Jika ada parameter hari, atur setelah data dimuat
        if (state.dayIndex !== null) {
            // Beri jeda sedikit agar data metadata sempat ter-fetch
            setTimeout(() => {
                if (typeof loadDay === 'function') {
                    loadDay(state.dayIndex);
                }
            }, 800);
        }
    }
};
