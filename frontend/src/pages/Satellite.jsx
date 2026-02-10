import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Nav from '../components/Nav';

// API URL - Use main API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SATELLITE_API_URL = import.meta.env.VITE_SATELLITE_API_URL || 'http://localhost:8000';

// Preset regions
const PRESET_REGIONS = {
    'India': { minLat: 6.0, maxLat: 37.0, minLon: 68.0, maxLon: 97.0 },
    'Amazon': { minLat: -20.0, maxLat: 5.0, minLon: -75.0, maxLon: -50.0 },
    'Himalayas': { minLat: 26.0, maxLat: 35.0, minLon: 75.0, maxLon: 100.0 },
    'Africa': { minLat: -35.0, maxLat: 37.0, minLon: -20.0, maxLon: 55.0 },
};

// Default AOI (India region)
const DEFAULT_AOI = {
    minLat: 26.0,
    maxLat: 31.0,
    minLon: 78.0,
    maxLon: 88.0,
};

const Satellite = () => {
    const [aoi, setAoi] = useState(DEFAULT_AOI);
    const [selectedRegion, setSelectedRegion] = useState('India');
    const [layers, setLayers] = useState({
        fire: true,
        vegetation: false,
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    // Run analysis
    const runAnalysis = async () => {
        setLoading(true);
        try {
            const selectedLayers = Object.entries(layers)
                .filter(([_, enabled]) => enabled)
                .map(([layer]) => layer);

            const response = await fetch(`${SATELLITE_API_URL}/satellite/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aoi: aoi,
                    layers: selectedLayers,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
            }
        } catch (error) {
            console.error('Error running analysis:', error);
        }
        setLoading(false);
    };

    // Handle region change
    const handleRegionChange = (region) => {
        setSelectedRegion(region);
        if (PRESET_REGIONS[region]) {
            setAoi(PRESET_REGIONS[region]);
        }
    };

    // Calculate center of AOI
    const centerLat = (aoi.minLat + aoi.maxLat) / 2;
    const centerLon = (aoi.minLon + aoi.maxLon) / 2;

    // Get risk color
    const getRiskColor = (level) => {
        switch(level) {
            case 'Critical': return 'text-red-400';
            case 'High': return 'text-orange-400';
            case 'At Risk': return 'text-yellow-400';
            default: return 'text-green-400';
        }
    };

    // Get risk bg
    const getRiskBg = (level) => {
        switch(level) {
            case 'Critical': return 'bg-red-500/20 border-red-500/50';
            case 'High': return 'bg-orange-500/20 border-orange-500/50';
            case 'At Risk': return 'bg-yellow-500/20 border-yellow-500/50';
            default: return 'bg-green-500/20 border-green-500/50';
        }
    };

    return (
        <div className="text-white/90 font-sans min-h-screen bg-bg-gradient-start">
            <div className="max-w-md mx-auto min-h-screen relative z-10 pb-32">
                
                {/* Header */}
                <div className="flex items-center p-6 justify-between">
                    <div className="flex-1 flex flex-col items-center">
                        <h2 className="frosted-text text-lg font-bold tracking-tight">Kaya</h2>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-neon-green font-bold">Satellite Monitoring</span>
                    </div>
                </div>

                {/* 1. AOI Selector */}
                <section className="px-5 mb-6">
                    <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">
                        1. Select Area (AOI)
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {Object.keys(PRESET_REGIONS).map((region) => (
                            <button
                                key={region}
                                onClick={() => handleRegionChange(region)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    selectedRegion === region
                                        ? 'bg-neon-green text-black'
                                        : 'glass-panel text-white/70 hover:bg-white/10'
                                }`}
                            >
                                {region}
                            </button>
                        ))}
                    </div>

                    {/* AOI Coordinates */}
                    <div className="glass-panel p-4 rounded-2xl">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-white/40">Lat:</span> <span className="ml-2 text-neon-green">{aoi.minLat.toFixed(1)}° - {aoi.maxLat.toFixed(1)}°</span></div>
                            <div><span className="text-white/40">Lon:</span> <span className="ml-2 text-neon-green">{aoi.minLon.toFixed(1)}° - {aoi.maxLon.toFixed(1)}°</span></div>
                        </div>
                    </div>
                </section>

                {/* 2. Map Preview */}
                <section className="px-5 mb-6">
                    <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-white/10 glass-panel">
                        <MapContainer
                            center={[centerLat, centerLon]}
                            zoom={4}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={true}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        </MapContainer>
                        <div className="absolute top-3 left-3 glass-panel px-3 py-1 bg-black/80 rounded-lg z-[400]">
                            <span className="text-xs font-bold text-neon-green">AOI: {selectedRegion}</span>
                        </div>
                    </div>
                </section>

                {/* 3. Layer Toggles */}
                <section className="px-5 mb-6">
                    <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">
                        2. Select Indicators
                    </h3>
                    <div className="space-y-3">
                        <label className="glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-400">local_fire_department</span>
                                <div>
                                    <span className="text-sm font-bold">Active Fire</span>
                                    <p className="text-[10px] text-white/40">NASA FIRMS</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={layers.fire}
                                onChange={(e) => setLayers({ ...layers, fire: e.target.checked })}
                                className="w-5 h-5 accent-neon-green"
                            />
                        </label>

                        <label className="glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-400">eco</span>
                                <div>
                                    <span className="text-sm font-bold">Vegetation Stress</span>
                                    <p className="text-[10px] text-white/40">NDVI Indicator</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={layers.vegetation}
                                onChange={(e) => setLayers({ ...layers, vegetation: e.target.checked })}
                                className="w-5 h-5 accent-neon-green"
                            />
                        </label>
                    </div>
                </section>

                {/* 4. Run Analysis Button */}
                <section className="px-5 mb-6">
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="w-full glass-panel bg-neon-green hover:bg-neon-green/90 text-black font-black h-14 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                ANALYZING...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">satellite_alt</span>
                                Run Analysis
                            </>
                        )}
                    </button>
                </section>

                {/* 5. Results Panel */}
                {results && (
                    <section className="px-5 mb-6">
                        <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">
                            3. Analysis Results
                        </h3>

                        {/* Fire Results */}
                        {results.fire && results.fire.hotspotCount !== undefined && (
                            <div className="glass-panel p-4 rounded-2xl mb-3 border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-red-400">local_fire_department</span>
                                    <span className="text-sm font-bold">Fire Hotspots</span>
                                </div>
                                <div className="text-3xl font-bold text-red-400">
                                    {results.fire.hotspotCount}
                                </div>
                                <p className="text-[10px] text-white/50">Hotspots detected</p>
                            </div>
                        )}

                        {/* Vegetation Results */}
                        {results.vegetation && results.vegetation.ndvi !== undefined && (
                            <div className="glass-panel p-4 rounded-2xl mb-3 border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-green-400">eco</span>
                                    <span className="text-sm font-bold">Vegetation Index</span>
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    {results.vegetation.ndvi}
                                </div>
                                <p className="text-[10px] text-white/50">NDVI Value</p>
                            </div>
                        )}

                        {/* Risk Level */}
                        <div className={`glass-panel p-4 rounded-2xl border-2 ${getRiskBg(results.riskLevel)}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider">Risk Level</span>
                                <span className={`text-xl font-black ${getRiskColor(results.riskLevel)}`}>
                                    {results.riskLevel.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Last Update */}
                        {(results.fire?.lastUpdate || results.vegetation?.lastUpdate) && (
                            <p className="text-[10px] text-white/40 mt-3 text-center">
                                Last satellite update: {new Date(results.fire?.lastUpdate || results.vegetation?.lastUpdate).toLocaleString()}
                            </p>
                        )}
                    </section>
                )}

                {/* Info Disclaimer */}
                <section className="px-5">
                    <div className="p-4 glass-panel border-blue-500/20 bg-blue-500/5 rounded-2xl">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">info</span>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                                Data sourced from NASA FIRMS and satellite indicators. 
                                Updates every 3-6 hours. Analysis based on AOI.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
            <Nav />
        </div>
    );
};

export default Satellite;
