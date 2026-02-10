import React, { useState, useEffect } from 'react';
import '../css/alert.css';
import Nav from '../components/Nav';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/alerts');
            if (!response.ok) {
                throw new Error('Failed to fetch alerts');
            }
            const data = await response.json();
            setAlerts(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getLevelStyles = (level) => {
        switch (level) {
            case 'Critical':
                return 'border-l-pink-500 bg-pink-500/5';
            case 'High':
                return 'border-l-red-500 bg-red-500/5';
            case 'At Risk':
                return 'border-l-yellow-500 bg-yellow-500/5';
            case 'Positive':
                return 'border-l-green-500 bg-green-500/5';
            default:
                return 'border-l-gray-500 bg-gray-500/5';
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'Critical':
                return '#ff2288';
            case 'High':
                return '#FF007F';
            case 'At Risk':
                return '#ffffff';
            case 'Positive':
                return '#39FF14';
            default:
                return '#22ff88';
        }
    };

    return (
        <div className="text-white/90 font-sans min-h-screen bg-bg-dark selection:bg-neon-green/30">
            {/* Header */}
            <div className="flex items-center pt-6 justify-between">
                <div className="flex-1 flex flex-col items-center">
                    <h2 className="frosted-text text-lg font-bold tracking-tight">Alerts</h2>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-neon-green font-bold">Bio Sentinel</span>
                </div>
            </div>
            <main className="p-6 space-y-6 max-w-md mx-auto pb-32">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="material-symbols-outlined animate-spin text-neon-green text-4xl mb-4">sync</span>
                        <p className="text-white/50 text-sm">Loading alerts...</p>
                    </div>
                ) : error ? (
                    <div className="glass-card flex flex-col items-center justify-center py-16 rounded-3xl bg-white/[0.03]">
                        <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
                        <h3 className="text-xl font-bold text-white mb-2">Error Loading Alerts</h3>
                        <p className="text-white/50 text-sm text-center px-8">{error}</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-16 rounded-3xl bg-white/[0.03]">
                        <span className="material-symbols-outlined text-white/20 text-6xl mb-4">notifications_off</span>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Alerts</h3>
                        <p className="text-white/50 text-sm text-center px-8">
                            All systems are operating normally. You'll be notified when new alerts are detected.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`glass-card p-4 rounded-2xl border-l-4 ${getLevelStyles(alert.level)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <span
                                            className="material-symbols-outlined text-2xl"
                                            style={{ color: getLevelColor(alert.level) }}
                                        >
                                            {alert.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `${getLevelColor(alert.level)}20`,
                                                    color: getLevelColor(alert.level)
                                                }}
                                            >
                                                {alert.level}
                                            </span>
                                            <span className="text-xs text-white/40">{alert.time}</span>
                                        </div>
                                        <h4 className="font-bold text-white mb-1">{alert.title}</h4>
                                        <p className="text-sm text-white/60 mb-2">{alert.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            <span>{alert.location}</span>
                                        </div>
                                        {alert.source && (
                                            <p className="text-xs text-white/30 mt-1">{alert.source}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Nav />
        </div>
    );
};

export default Alerts;
