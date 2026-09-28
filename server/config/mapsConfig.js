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

module.exports = {
    getMapsConfig
};
