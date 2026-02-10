import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NASA FIRMS API configuration
const NASA_FIRMS_API_KEY = process.env.NASA_FIRMS_API_KEY || 'DEMO_KEY';
const NASA_FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/region';

// File-based storage for alerts (Node.js compatible)
const ALERTS_FILE = path.join(__dirname, '../../data/alerts.json');

// Ensure data directory exists
const dataDir = path.dirname(ALERTS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize alerts file if it doesn't exist
if (!fs.existsSync(ALERTS_FILE)) {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify([]));
}

// Fetch fire data from NASA FIRMS
export const fetchFireData = async (region = 'africa', days = 1) => {
    try {
        const response = await axios.get(
            `${NASA_FIRMS_BASE_URL}/${encodeURIComponent(region)}/VIIRS/1/${days}?key=${NASA_FIRMS_API_KEY}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching NASA FIRMS data:', error.message);
        return null;
    }
};

// Calculate risk level based on multiple signals
export const calculateRiskLevel = (fireData, speciesData, citizenReports) => {
    let riskScore = 0;
    let factors = [];

    // Fire analysis
    if (fireData && fireData.hotspots) {
        const hotspotCount = fireData.hotspots.length;
        if (hotspotCount > 10) {
            riskScore += 3;
            factors.push('High wildfire activity');
        } else if (hotspotCount > 5) {
            riskScore += 2;
            factors.push('Moderate wildfire activity');
        } else if (hotspotCount > 0) {
            riskScore += 1;
            factors.push('Minor wildfire activity');
        }
    }

    // Species/growth analysis
    if (speciesData && speciesData.species_growth) {
        if (speciesData.species_growth >= 2) {
            riskScore -= 2;
            factors.push('Species population growth');
        }
    }

    // Citizen reports analysis
    if (citizenReports && citizenReports.count > 5) {
        riskScore += 1;
        factors.push('Multiple citizen reports');
    }

    // Determine level
    let level = 'Low';
    let color = '#22ff88';
    
    if (riskScore >= 3) {
        level = 'Critical';
        color = '#ff2288';
    } else if (riskScore >= 2) {
        level = 'High';
        color = '#FF007F';
    } else if (riskScore >= 1) {
        level = 'At Risk';
        color = '#ffffff';
    } else if (riskScore < 0) {
        level = 'Positive';
        color = '#39FF14';
    }

    return {
        level,
        color,
        riskScore,
        factors,
        riskLevel: Math.max(0, Math.min(100, (riskScore / 3) * 100))
    };
};

// Generate mock alerts for demo
export const generateMockAlerts = () => {
    return [
        {
            type: 'Wildfire',
            level: 'Critical',
            icon: 'local_fire_department',
            title: 'Active Wildfire Expansion',
            description: 'Rapid spread detected near conservation zone. Immediate intervention required.',
            time: '2m ago',
            location: 'Amazon Basin, Brazil',
            confidence: '98%',
            source: 'NASA FIRMS',
            rangerCount: 14
        },
        {
            type: 'Logging',
            level: 'At Risk',
            icon: 'agriculture',
            title: 'Illegal Logging Activity',
            description: 'Heavy machinery acoustic signatures detected.',
            time: '45m ago',
            location: 'Boreal, Canada',
            source: 'Satellite · 09:14 UTC'
        },
        {
            type: 'Species',
            level: 'Positive',
            icon: 'eco',
            title: 'Snow Leopard Sightings',
            description: 'Multiple individuals recorded on trail cameras in protected sector.',
            time: '3h ago',
            location: 'Himalayas, Nepal',
            category: 'Rare Species',
            verified: true
        }
    ];
};

// Save alert to file-based storage
export const saveAlertToDatabase = async (alertData) => {
    try {
        const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
        const newAlert = {
            ...alertData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        alerts.unshift(newAlert);
        fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
        return newAlert;
    } catch (error) {
        console.error('Error saving alert to file storage:', error.message);
        return null;
    }
};

// Fetch alerts from file-based storage
export const fetchAlertsFromDatabase = async () => {
    try {
        const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
        return alerts;
    } catch (error) {
        console.error('Error fetching alerts from file storage:', error.message);
        return [];
    }
};

// Process and generate new alerts
export const processAlerts = async () => {
    const fireData = await fetchFireData('africa', 1);
    
    const riskAnalysis = calculateRiskLevel(fireData, null, null);
    
    if (riskAnalysis.riskScore >= 2) {
        const alert = {
            type: 'Wildfire',
            level: riskAnalysis.level,
            icon: 'local_fire_department',
            title: 'Wildfire Alert',
            description: `${riskAnalysis.factors.join('. ')}. Risk Score: ${riskAnalysis.riskScore}`,
            time: 'Just now',
            location: 'Detection Zone',
            confidence: `${Math.round(riskAnalysis.riskLevel)}%`,
            source: 'NASA FIRMS'
        };
        
        await saveAlertToDatabase(alert);
    }
    
    return riskAnalysis;
};

export default {
    fetchFireData,
    calculateRiskLevel,
    generateMockAlerts,
    saveAlertToDatabase,
    fetchAlertsFromDatabase,
    processAlerts
};
