/**
 * SoundSphere - Google Maps API Secure Configuration
 * Provides safe API key endpoint without exposing secret credentials
 */

const getMapsConfig = (req, res) => {
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || '';
    
    res.status(200).json({
        success: true,
        hasKey: Boolean(mapsApiKey),
        mapsApiKey: mapsApiKey, // Served safely to authenticated app frontend
        defaultLocation: {
            lat: 13.9782,
            lng: 120.6272,
            address: 'Nasugbu, Batangas, Philippines',
            allowedMunicipalities: ['Lian', 'Balayan', 'Nasugbu']
        }
    });
};

const geocodeAddress = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(200).json([]);
        }

        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5`;
        const fetchRes = await fetch(url, {
            headers: {
                'User-Agent': 'SoundSphere-App/1.0 (contact@soundsphere.online)',
                'Accept': 'application/json'
            }
        });

        if (fetchRes.ok) {
            const data = await fetchRes.json();
            return res.status(200).json(Array.isArray(data) ? data : []);
        }
        return res.status(200).json([]);
    } catch (err) {
        return res.status(200).json([]);
    }
};

module.exports = {
    getMapsConfig,
    geocodeAddress
};
