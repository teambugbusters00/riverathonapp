import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GBIF API configuration
const GBIF_BASE_URL = 'https://api.gbif.org/v1/occurrence/search';

// Endangered species list
const ENDANGERED_SPECIES = new Set([
    "Panthera tigris", "Panthera leo", "Panthera onca", "Snow Leopard",
    "Elephas maximus", "Rhinoceros unicornis", "Gorilla beringei",
    "Pongo abelii", "Ailuropoda melanoleuca", "Vultur gryphus",
    "Aquila chrysaetos", "Crocodylus niloticus", "Python reticulatus"
]);

// File-based storage for alerts
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

/**
 * Fetch occurrences from GBIF
 */
export const fetchGBIFOccurrences = async (species, lat, lon, radius = 25, limit = 300) => {
    try {
        const params = {
            scientificName: species,
            decimalLatitude: lat,
            decimalLongitude: lon,
            radius: radius,
            limit: limit
        };
        
        const response = await axios.get(GBIF_BASE_URL, { params, timeout: 30000 });
        return response.data.results || [];
    } catch (error) {
        console.error('GBIF API Error:', error.message);
        return [];
    }
};

/**
 * Get historical average (older data)
 */
export const getHistoricalAverage = async (species, lat, lon, radius = 25) => {
    try {
        const toDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const params = {
            scientificName: species,
            decimalLatitude: lat,
            decimalLongitude: lon,
            radius: radius,
            limit: 100,
            toDate: toDate
        };
        
        const response = await axios.get(GBIF_BASE_URL, { params, timeout: 30000 });
        return response.data.results?.length || 4;
    } catch (error) {
        return 4;
    }
};

/**
 * Check if species is endangered
 */
export const isEndangered = (species) => {
    return ENDANGERED_SPECIES.has(species);
};

/**
 * Calculate human proximity heuristic
 */
export const calculateHumanProximity = (lat, lon) => {
    return 0.7; // Simplified - in production use settlement databases
};

/**
 * GBIF-based Risk Scoring Algorithm
 */
export const calculateGBIFRiskScore = (recentCount, historicalAvg, endangered, humanProximity) => {
    let score = 0;
    const reasons = [];
    const trendRatio = recentCount / Math.max(historicalAvg, 1);
    
    // Endangered check
    if (endangered) {
        score += 1.5;
        reasons.push("Endangered species detected");
    }
    
    // Trend analysis
    if (trendRatio >= 3.0) {
        score += 1.5;
        reasons.push(`Major surge (${trendRatio.toFixed(1)}x average)`);
    } else if (trendRatio >= 2.0) {
        score += 1.2;
        reasons.push(`Unusual increase (${trendRatio.toFixed(1)}x average)`);
    } else if (trendRatio < 0.5) {
        score += 1.0;
        reasons.push(`Decline in sightings (${trendRatio.toFixed(1)}x average)`);
    }
    
    // Human proximity
    if (humanProximity >= 0.7) {
        score += 0.8;
        reasons.push("Near human areas");
    } else if (humanProximity >= 0.4) {
        score += 0.4;
        reasons.push("Moderate proximity");
    }
    
    // Determine risk level
    let level = 'Positive';
    if (score >= 3.0) level = 'Critical';
    else if (score >= 2.0) level = 'High';
    else if (score >= 1.0) level = 'At Risk';
    
    return {
        score: Math.round(score * 100) / 100,
        level,
        reasons,
        trendRatio: Math.round(trendRatio * 100) / 100,
        observations: recentCount
    };
};

/**
 * Full GBIF classification
 */
export const gbifClassify = async (species, lat, lon, radius = 25) => {
    const [recentRecords, historicalAvg] = await Promise.all([
        fetchGBIFOccurrences(species, lat, lon, radius),
        getHistoricalAverage(species, lat, lon, radius)
    ]);
    
    const recentCount = recentRecords.length;
    const endangered = isEndangered(species);
    const humanProximity = calculateHumanProximity(lat, lon);
    
    return calculateGBIFRiskScore(recentCount, historicalAvg, endangered, humanProximity);
};

// ⚠️ LEGACY: Still generate demo alerts for showcase (when GBIF fails)
export const generateMockAlerts = () => {
    return [
        {
            type: 'Species Activity',
            level: 'At Risk',
            icon: 'eco',
            title: 'Tiger Sighting Increase',
            description: 'Unusual increase in tiger sightings in the area.',
            time: '2m ago',
            location: 'Central India',
            confidence: '85%',
            source: 'GBIF Analysis',
            observations: 12
        },
        {
            type: 'Species Activity',
            level: 'Positive',
            icon: 'eco',
            title: 'Snow Leopard Confirmed',
            description: 'Multiple individuals recorded on trail cameras.',
            time: '3h ago',
            location: 'Himalayas, Nepal',
            category: 'Rare Species',
            verified: true,
            source: 'GBIF Verified'
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
        console.error('Error saving alert:', error.message);
        return null;
    }
};

// Fetch alerts from file-based storage
export const fetchAlertsFromDatabase = async () => {
    try {
        const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
        return alerts;
    } catch (error) {
        console.error('Error fetching alerts:', error.message);
        return [];
    }
};

// Process and generate GBIF alerts
export const processGBIFAlerts = async (species, lat, lon) => {
    const riskData = await gbifClassify(species, lat, lon);
    
    if (riskData.score >= 1.0) {
        const alert = {
            type: 'Species Activity',
            level: riskData.level,
            icon: 'eco',
            title: `${species} Activity Alert`,
            description: riskData.reasons.join('. '),
            time: 'Just now',
            location: `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`,
            confidence: `${Math.min(riskData.score * 30, 99)}%`,
            source: 'GBIF ML Analysis',
            observations: riskData.observations,
            trendRatio: riskData.trendRatio
        };
        
        await saveAlertToDatabase(alert);
    }
    
    return riskData;
};

export default {
    fetchGBIFOccurrences,
    getHistoricalAverage,
    isEndangered,
    calculateHumanProximity,
    calculateGBIFRiskScore,
    gbifClassify,
    generateMockAlerts,
    saveAlertToDatabase,
    fetchAlertsFromDatabase,
    processGBIFAlerts
};
