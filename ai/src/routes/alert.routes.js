import express from 'express';
import alertService from '../services/alertService.js';

const router = express.Router();

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
