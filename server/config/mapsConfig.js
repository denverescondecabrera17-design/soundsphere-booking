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

const getRouteDistance = async (req, res) => {
    try {
        const fromLat = parseFloat(req.query.fromLat);
        const fromLng = parseFloat(req.query.fromLng);
        const toLat = parseFloat(req.query.toLat);
        const toLng = parseFloat(req.query.toLng);

        if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates provided' });
        }

        // Try OSRM driving route API for exact road distance in the Philippines
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        try {
            const osrmRes = await fetch(osrmUrl, { signal: controller.signal });
            clearTimeout(timeout);
            if (osrmRes.ok) {
                const data = await osrmRes.json();
                if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
                    const distanceMeters = data.routes[0].distance;
                    const durationSecs = data.routes[0].duration;
                    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
                    return res.status(200).json({
                        success: true,
                        distanceKm: distanceKm,
                        durationMins: Math.round(durationSecs / 60),
                        isRoadDistance: true
                    });
                }
            }
        } catch (osrmErr) {
            clearTimeout(timeout);
            console.warn('OSRM routing fetch notice:', osrmErr.message);
        }

        // Fallback: Haversine spherical distance multiplied by 1.25 road curvature factor
        const R = 6371;
        const dLat = (toLat - fromLat) * Math.PI / 180;
        const dLon = (toLng - fromLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const haversineKm = R * c;
        const roadEstimateKm = Math.round((haversineKm * 1.25) * 10) / 10;

        return res.status(200).json({
            success: true,
            distanceKm: roadEstimateKm,
            durationMins: Math.round(roadEstimateKm * 2),
            isRoadDistance: false
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getMapsConfig,
    geocodeAddress,
    getRouteDistance
};
