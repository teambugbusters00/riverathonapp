import express from 'express';
import { rateLimit } from 'express-rate-limit'
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiRoutes from './src/routes/ai.routes.js';
import alertRoutes from './src/routes/alert.routes.js';
import authRoutes from './src/routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	limit: 100,
})

app.use(limiter)

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/biosentinel';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => {
    res.send('Welcome to BioSentinel API! Use /health for health check or /api/alerts for alerts.');
});

app.get('/health', (req, res) => {
    res.send('Welcome to the BioSentinal AI API!');
});

app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes);
app.use('/api/alerts', alertRoutes);

// 404 Handler - Log missing endpoints
app.use((req, res) => {
    console.log(`❌ 404 - ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        message: `${req.method} ${req.path} is not defined`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Biosentinal AI API running on port ${PORT}!`);
});
