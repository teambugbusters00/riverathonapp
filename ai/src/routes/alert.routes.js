import express from 'express';
import alertService from '../services/alertService.js';
import gbifService from '../../gbif_alert_service.js';

const router = express.Router();

// GBIF Classification Endpoint (matches Python API)
router.post('/gbif/classify', async (req, res) => {
    try {
        const { species, lat, lon, radius } = req.body;
        
        if (!species || !lat || !lon) {
            return res.status(400).json({ 
                error: 'Missing required fields: species, lat, lon' 
            });
        }
        
        const result = await gbifService.gbifClassify(species, lat, lon, radius || 25);
        
        res.json(result);
    } catch (error) {
        console.error('GBIF classification error:', error);
        res.status(500).json({ error: 'Classification failed' });
    }
});

// GBIF Species Search
router.get('/gbif/search', async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Missing query parameter: q' });
        }
        
        const response = await fetch(
            `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}&limit=${limit || 10}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('GBIF search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get all alerts (from Appwrite or mock)
router.get('/', async (req, res) => {
    try {
        // Try to fetch from Appwrite first
        const dbAlerts = await alertService.fetchAlertsFromDatabase();
        
        if (dbAlerts && dbAlerts.length > 0) {
            // Format Appwrite alerts for frontend
            const alerts = dbAlerts.map(doc => ({
                id: doc.$id,
                type: doc.type,
                level: doc.level,
                icon: doc.icon,
                title: doc.title,
                description: doc.description,
                time: alertService.generateMockAlerts()[0]?.time || 'Just now',
                location: doc.location,
                confidence: doc.confidence,
                source: doc.source,
                category: doc.category,
                verified: doc.verified,
                rangerCount: doc.rangerCount
            }));
            return res.json(alerts);
        }
        
        // Return mock alerts if no database alerts
        const mockAlerts = alertService.generateMockAlerts();
        res.json(mockAlerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        // Fall back to mock data
        res.json(alertService.generateMockAlerts());
    }
});

// Process new alerts (fetch from NASA FIRMS)
router.post('/process', async (req, res) => {
    try {
        const result = await alertService.processAlerts();
        res.json({
            success: true,
            riskAnalysis: result
        });
    } catch (error) {
        console.error('Error processing alerts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new alert manually
router.post('/', async (req, res) => {
    try {
        const alertData = req.body;
        const saved = await alertService.saveAlertToDatabase(alertData);
        
        if (saved) {
            res.json({
                success: true,
                alert: saved
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save alert'
            });
        }
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get risk analysis
router.get('/risk-analysis', async (req, res) => {
    try {
        const fireData = await alertService.fetchFireData('africa', 1);
        const analysis = alertService.calculateRiskLevel(fireData, null, null);
        res.json(analysis);
    } catch (error) {
        console.error('Error calculating risk analysis:', error);
        res.json({
            level: 'Low',
            color: '#22ff88',
            riskScore: 0,
            factors: []
        });
    }
});

export default router;
