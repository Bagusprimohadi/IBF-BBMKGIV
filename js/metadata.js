// ==========================================
// METADATA.JS - PENGELOLA MANIFEST & ATRIBUT GEOJSON V1.2
// ==========================================

const MetadataManager = {
    manifestData: null,

    /**
     * Memuat manifest global (data/manifest.json) jika backend Python memperbarui timestamp sistem
     * @param {Function} callback - Fungsi callback setelah manifest dimuat
     */
    fetchManifest(callback) {
        let uniqueInit = new Date().getTime();
        let manifestUrl = `${CONFIG.paths.manifest || 'data/manifest.json'}?v=${uniqueInit}`;

        fetch(manifestUrl)
            .then(res => {
                if (!res.ok) throw new Error("Manifest file tidak ditemukan");
                return res.json();
            })
            .then(data => {
                this.manifestData = data;
                if (typeof callback === 'function') callback(data);
            })
            .catch(err => {
                console.warn("Peringatan Manifest:", err.message);
                if (typeof callback === 'function') callback(null);
            });
    },

    /**
     * Mengekstrak seluruh fitur dan atribut yang ada di layer GeoJSON aktif
     * @returns {Array} List properti dari setiap fitur di peta
     */
    getActiveFeaturesProperties() {
        if (!activeOverlayLayer) return [];
        let propertiesList = [];
        activeOverlayLayer.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                propertiesList.push(layer.feature.properties);
            }
        });
        return propertiesList;
    },

    /**
     * Mencari atribut spesifik wilayah berdasarkan nama kabupaten/wilayah dari GeoJSON aktif
     * @param {string} regionName - Nama kabupaten / wilayah
     */
    getRegionPropsFromGeoJSON(regionName) {
        if (!activeOverlayLayer || !regionName) return null;
        let foundProps = null;
        let searchKey = String(regionName).toLowerCase().trim();

        activeOverlayLayer.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                let props = layer.feature.properties;
                let nameInProps = (props.kabupaten || props.WADMKK || props.NAME_2 || '').toLowerCase().trim();
                if (nameInProps === searchKey) {
                    foundProps = props;
                }
            }
        });

        return foundProps;
    }
};
