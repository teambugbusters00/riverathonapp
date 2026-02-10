import express from 'express';
import axios from 'axios';

const router = express.Router();

// NASA FIRMS API (uses DEMO_KEY for free tier)
const NASA_FIRMS_API_KEY = process.env.NASA_FIRMS_API_KEY || 'DEMO_KEY';
const NASA_FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/region';

// Helper: Calculate risk from fire data
const calculateFireRisk = (fireData) => {
    if (!fireData || !fireData.hotspots) {
        return { hotspotCount: 0, riskLevel: 'Low' };
    }
    
    const hotspotCount = fireData.hotspots.length;
    let riskLevel = 'Low';
    
    if (hotspotCount > 20) {
        riskLevel = 'Critical';
    } else if (hotspotCount > 10) {
        riskLevel = 'High';
    } else if (hotspotCount > 5) {
        riskLevel = 'At Risk';
    } else if (hotspotCount > 0) {
        riskLevel = 'Low';
    }
    
    return { hotspotCount, riskLevel };
};

// Fetch fire data from NASA FIRMS for AOI
const fetchFireData = async (aoi) => {
    try {
        // Use bounding box for AOI query
        const response = await axios.get(
            `${NASA_FIRMS_BASE_URL}/world/VIIRS/1/1?day=nrt&geotiff=false`,
            {
                params: {
                    key: NASA_FIRMS_API_KEY
                }
            }
        );
        
        // Filter hotspots within AOI
        const hotspots = (response.data.hotspots || []).filter(hotspot => {
            return (
                hotspot.latitude >= aoi.minLat &&
                hotspot.latitude <= aoi.maxLat &&
                hotspot.longitude >= aoi.minLon &&
                hotspot.longitude <= aoi.maxLon
            );
        });
        
        return { hotspots };
    } catch (error) {
        console.error('NASA FIRMS Error:', error.message);
        // Return mock data for demo when API fails
        return {
            hotspots: [
                { latitude: (aoi.minLat + aoi.maxLat) / 2, longitude: (aoi.minLon + aoi.maxLon) / 2, brightness: 320 }
            ]
        };
    }
};

// Generate NDVI data (simulated for demo - real implementation needs Sentinel Hub API)
const generateNDVIData = (aoi) => {
    // In production, integrate with Sentinel Hub or Google Earth Engine
    // For demo, generate realistic NDVI value
    const ndvi = 0.3 + Math.random() * 0.5; // 0.3 to 0.8 range
    
    let status = 'Healthy';
    if (ndvi < 0.3) status = 'Stressed';
    else if (ndvi < 0.5) status = 'Moderate';
    else status = 'Healthy';
    
    return { ndvi, status };
};

// Generate land cover data (simulated)
const generateLandCoverData = (aoi) => {
    // In production, use ESA WorldCover API
    // For demo, return typical land cover type
    return {
        type: 'Forest/Non-Forest',
        forestPercentage: 35,
        dominantClass: 'Evergreen Broadleaf Forest'
    };
};

/**
 * POST /satellite/fetch
 * Fetch satellite data for a given AOI and layers
 */
router.post('/fetch', async (req, res) => {
    try {
        const { aoi, layers } = req.body;
        
        if (!aoi || !layers || layers.length === 0) {
            return res.status(400).json({ 
                error: 'Missing required fields: aoi, layers' 
            });
        }
        
        const result = {};
        let totalRiskScore = 0;
        let riskFactors = [];
        
        // Fetch fire data
        if (layers.includes('fire')) {
            const fireData = await fetchFireData(aoi);
            const fireRisk = calculateFireRisk(fireData);
            result.fire = {
                hotspotCount: fireRisk.hotspotCount,
                riskLevel: fireRisk.riskLevel,
                lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6h ago
            };
            
            if (fireRisk.hotspotCount > 10) {
                totalRiskScore += 2;
                riskFactors.push('High fire activity');
            } else if (fireRisk.hotspotCount > 5) {
                totalRiskScore += 1;
                riskFactors.push('Moderate fire activity');
            }
        }
        
        // Fetch vegetation data
        if (layers.includes('vegetation')) {
            const ndviData = generateNDVIData(aoi);
            result.vegetation = {
                ndvi: ndviData.ndvi,
                status: ndviData.status,
                lastUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
            };
            
            if (ndviData.ndvi < 0.3) {
                totalRiskScore += 1.5;
                riskFactors.push('Vegetation stress detected');
            }
        }
        
        // Fetch land cover data
        if (layers.includes('landcover')) {
            result.landcover = generateLandCoverData(aoi);
        }
        
        // Calculate combined risk level
        let riskLevel = 'Positive';
        if (totalRiskScore >= 3) riskLevel = 'Critical';
        else if (totalRiskScore >= 2) riskLevel = 'High';
        else if (totalRiskScore >= 1) riskLevel = 'At Risk';
        
        result.riskScore = totalRiskScore;
        result.riskLevel = riskLevel;
        result.riskFactors = riskFactors;
        result.aoi = aoi;
        result.timestamp = new Date().toISOString();
        
        res.json(result);
    } catch (error) {
        console.error('Satellite fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch satellite data' });
    }
});

/**
 * GET /satellite/layers
 * Get available satellite layers
 */
router.get('/layers', (req, res) => {
    res.json({
        layers: [
            {
                id: 'fire',
                name: 'Active Fire',
                source: 'NASA FIRMS',
                updateFrequency: '6 hours',
                description: 'Near-real-time fire detection from VIIRS satellite'
            },
            {
                id: 'vegetation',
                name: 'Vegetation Index (NDVI)',
                source: 'Sentinel-2',
                updateFrequency: '5-10 days',
                description: 'Normalized Difference Vegetation Index'
            },
            {
                id: 'landcover',
                name: 'Land Cover',
                source: 'ESA WorldCover',
                updateFrequency: 'Annual',
                description: 'Global land cover classification'
            }
        ]
    });
});

export default router;
