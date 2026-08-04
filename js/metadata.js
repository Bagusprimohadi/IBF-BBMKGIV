// ==========================================
// METADATA.JS - PENGELOLA METADATA PRODUK V1.1
// ==========================================

const MetadataManager = {
    currentData: null,

    /**
     * Mengambil file metadata JSON berdasarkan konfigurasi produk
     * @param {Object} productConfig - Konfigurasi dari CONFIG.products[category][productKey]
     * @param {Function} callback - Fungsi yang dijalankan setelah metadata sukses dimuat
     */
    fetchMetadata(productConfig, callback) {
        if (!productConfig || !productConfig.folder || !productConfig.metaFile) {
            console.error("Konfigurasi produk tidak valid untuk memuat metadata.");
            return;
        }

        let uniqueInit = new Date().getTime(); // Mencegah cache browser
        let metadataUrl = `${productConfig.folder}${productConfig.metaFile}?v=${uniqueInit}`;

        fetch(metadataUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Gagal memuat file metadata: ${productConfig.metaFile}`);
                return res.json();
            })
            .then(data => {
                this.currentData = data;
                
                // Simpan ke variabel global agar mudah diakses lintas modul
                window.validDates = data.dates || [];
                window.backendImpactData = data.regions || data.impactData || {};
                
                let bounds = data.bounds || CONFIG.map.defaultBounds;

                // Jalankan callback jika ada
                if (typeof callback === 'function') {
                    callback({
                        dates: window.validDates,
                        bounds: bounds,
                        regions: window.backendImpactData,
                        raw: data
                    });
                }
            })
            .catch(err => {
                console.warn("Peringatan Metadata:", err);
                window.validDates = [];
                window.backendImpactData = {};

                if (typeof callback === 'function') {
                    callback({
                        dates: [],
                        bounds: CONFIG.map.defaultBounds,
                        regions: {},
                        error: err
                    });
                }
            });
    },

    /**
     * Mendapatkan daftar tanggal valid yang sedang aktif
     */
    getValidDates() {
        return window.validDates || [];
    },

    /**
     * Mendapatkan data rekap dampak/warning backend untuk wilayah tertentu
     * @param {string} key - Kode wilayah atau nama wilayah
     */
    getRegionData(key) {
        if (!window.backendImpactData) return null;
        return window.backendImpactData[key] 
            || window.backendImpactData[String(key).toUpperCase()] 
            || window.backendImpactData[String(key).toLowerCase()] 
            || null;
    }
};
