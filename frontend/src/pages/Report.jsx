import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Nav from '../components/Nav';

// API URL - Use main API URL for auth, separate for GBIF
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const GBIF_API_URL = import.meta.env.VITE_GBIF_API_URL || 'http://localhost:8000';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Neon Marker Icon
const neonIcon = new L.DivIcon({
    className: 'custom-neon-marker',
    html: `<span class="material-symbols-outlined text-neon-green text-4xl drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]" style="font-size: 40px;">location_on</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// Component to handle map center updates smoothly
const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], 18);
    }, [lat, lon, map]);
    return null;
};

// --- Main Component ---

const Report = () => {
    // Form State
    const [obsType, setObsType] = useState('Species');
    const [speciesName, setSpeciesName] = useState('');
    const [expertVerify, setExpertVerify] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [riskResult, setRiskResult] = useState(null);
    
    // Map/Location State
    const [location, setLocation] = useState({ lat: 0, lon: 0 });
    const [address, setAddress] = useState('Initializing Sensors...');
    const [gpsLoading, setGpsLoading] = useState(true);
    const [gpsError, setGpsError] = useState(null);

    // File Upload State
    const [uploadedImages, setUploadedImages] = useState([]);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Get User Coordinates
    const getLocation = () => {
        setGpsLoading(true);
        setGpsError(null);
        setAddress("Triangulating signal...");

        if (!navigator.geolocation) {
            setGpsError("Geolocation not supported");
            setGpsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lon: longitude });
                fetchAddress(latitude, longitude);
            },
            () => {
                setGpsError("GPS Signal Lost");
                setGpsLoading(false);
                setAddress("Unable to retrieve location");
            },
            { enableHighAccuracy: true }
        );
    };

    // Fetch Address from Nominatim
    const fetchAddress = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'BioSentinel-App/1.0' } }
            );
            const data = await response.json();
            
            let displayAddress = "Unknown Territory";
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                const state = data.address.state || data.address.country;
                displayAddress = `${city ? city + ', ' : ''}${state}`;
            }
            
            setAddress(displayAddress);
        } catch {
            setAddress(`${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`);
        } finally {
            setGpsLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        getLocation();
    }, []);

    // Handle file selection
    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        newFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setUploadedImages(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        size: file.size,
                        data: event.target.result
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    // Remove image
    const removeImage = (id) => {
        setUploadedImages(prev => prev.filter(img => img.id !== id));
    };

    // Open file picker
    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Open camera
    const openCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.click();
        }
    };

    // Call GBIF ML API
    const classifyWithGBIF = async (species, lat, lon) => {
        try {
            const response = await fetch(`${GBIF_API_URL}/gbif/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ species, lat, lon, radius: 25 })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('GBIF classification error:', error);
        }
        return null;
    };

    // Handle Form Submission
    const handleSubmit = async () => {
        setSubmitting(true);
        
        let riskData = null;
        if (speciesName && location.lat !== 0) {
            riskData = await classifyWithGBIF(speciesName, location.lat, location.lon);
        }
        
        const reportData = {
            type: obsType,
            species: speciesName,
            verificationRequested: expertVerify,
            location: location,
            address: address,
            timestamp: new Date().toISOString(),
            images: uploadedImages,
            riskAssessment: riskData
        };
        
        console.log("Submitting Report Payload:", reportData);
        setRiskResult(riskData);
        setSubmitting(false);
    };

    // Get risk color
    const getRiskColor = (level) => {
        switch(level) {
            case 'Critical': return 'bg-red-500/20 border-red-500/50 text-red-400';
            case 'High': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
            case 'At Risk': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
            default: return 'bg-green-500/20 border-green-500/50 text-green-400';
        }
    };

    return (
        <div className="text-white/90 font-sans min-h-screen bg-bg-gradient-start selection:bg-neon-green/30">
            <div className="max-w-md mx-auto min-h-screen relative z-10 pb-32">
                
                {/* Header */}
                <div className="flex items-center p-6 justify-between">
                    <div className="flex-1 flex flex-col items-center">
                        <h2 className="frosted-text text-lg font-bold tracking-tight">Kaya</h2>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-neon-green font-bold">Report Observation</span>
                    </div>
                </div>

                <form className="px-5 space-y-6" onSubmit={(e) => e.preventDefault()}>
                    
                    {/* Observation Type */}
                    <section>
                        <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">Observation Type</h3>
                        <div className="flex h-12 w-full items-center glass-panel p-1.5 gap-1 rounded-2xl">
                            {['Species', 'Sacred Grove', 'Threat'].map((type) => (
                                <label key={type} className="flex-1 h-full cursor-pointer relative">
                                    <input 
                                        type="radio" 
                                        name="obs_type" 
                                        value={type} 
                                        checked={obsType === type}
                                        onChange={() => setObsType(type)}
                                        className="hidden peer" 
                                    />
                                    <div className={`h-full flex items-center justify-center rounded-[10px] text-xs font-bold transition-all ${
                                        obsType === type 
                                            ? `bg-white/10 ${type === 'Threat' ? 'text-hard-pink' : 'text-neon-green'} shadow-sm` 
                                            : 'text-white/50'
                                    }`}>
                                        {type === 'Sacred Grove' ? 'Grove' : type}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Evidence Upload */}
                    <section>
                        <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">Evidence</h3>
                        
                        {/* Hidden file inputs */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <input
                            type="file"
                            ref={cameraInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                        
                        {/* Upload Area */}
                        <div 
                            onClick={openFilePicker}
                            className="glass-panel border-dashed border-white/20 p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group rounded-3xl"
                        >
                            <div className="w-14 h-14 bg-neon-green/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                                <span className="material-symbols-outlined text-neon-green text-3xl">add_a_photo</span>
                            </div>
                            <p className="frosted-text font-bold text-sm">Upload Evidence</p>
                            <p className="text-white/30 text-[10px] mt-1 font-medium tracking-wide">High-resolution preferred</p>
                            <div className="flex gap-4 mt-3">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openCamera(); }}
                                    className="text-[10px] text-neon-green hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                    Camera
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                                    className="text-[10px] text-neon-green hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">folder</span>
                                    Gallery
                                </button>
                            </div>
                        </div>
                        
                        {/* Image Previews */}
                        {uploadedImages.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {uploadedImages.map((img) => (
                                    <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                                        <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img.id)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Identification */}
                    <section className="space-y-4">
                        <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ml-1">Identification</h3>
                        <div className="flex flex-col">
                            <div className="relative">
                                <input 
                                    className="glass-input w-full h-14 pr-12 pl-4 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 text-white placeholder-white/30 text-sm font-medium outline-none transition-all" 
                                    placeholder="Species Name (e.g. Panthera tigris)" 
                                    type="text" 
                                    value={speciesName}
                                    onChange={(e) => setSpeciesName(e.target.value)}
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
                            </div>
                        </div>
                        <div className="glass-panel p-4 bg-white/[0.03] rounded-2xl">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex flex-col">
                                    <span className="frosted-text text-sm font-bold">Expert Verification</span>
                                    <span className="text-white/40 text-[11px]">Request AI & specialist identification</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={expertVerify}
                                        onChange={(e) => setExpertVerify(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green shadow-inner"></div>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* Location */}
                    <section>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em]">Location</h3>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${gpsLoading ? 'bg-yellow-400' : 'bg-neon-green'} animate-pulse`}></div>
                                <span className={`${gpsLoading ? 'text-yellow-400' : 'text-neon-green'} text-[10px] font-bold uppercase tracking-wider`}>
                                    {gpsLoading ? 'FETCHING...' : 'ADDRESS FETCHED'}
                                </span>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="relative w-full h-44 rounded-3xl overflow-hidden border border-white/10 glass-panel z-0">
                            {location.lat !== 0 ? (
                                <MapContainer 
                                    center={[location.lat, location.lon]} 
                                    zoom={18} 
                                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                                    zoomControl={false}
                                    dragging={false} 
                                    attributionControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    <RecenterMap lat={location.lat} lon={location.lon} />
                                    <Marker position={[location.lat, location.lon]} icon={neonIcon} />
                                </MapContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-black/60">
                                    <span className="text-white/30 text-xs">Waiting for GPS signal...</span>
                                </div>
                            )}

                            {/* Address Overlay */}
                            <div className="absolute bottom-3 left-3 right-3 glass-panel px-3 py-2 bg-black/80 border-white/20 rounded-xl backdrop-blur-md flex items-center justify-between z-[400]">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[10px] font-mono text-neon-green font-bold mb-0.5">
                                        {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
                                    </span>
                                    <span className="text-[10px] text-white/70 truncate w-full">
                                        {gpsError ? gpsError : address}
                                    </span>
                                </div>
                                <span className="material-symbols-outlined text-neon-green text-lg animate-pulse ml-2">target</span>
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={getLocation}
                            disabled={gpsLoading}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-3 glass-panel border-white/5 text-neon-green text-xs font-bold bg-white/[0.02] rounded-2xl hover:bg-white/5 transition-colors active:scale-95 disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-[16px] ${gpsLoading ? 'animate-spin' : ''}`}>
                                {gpsLoading ? 'refresh' : 'my_location'}
                            </span>
                            {gpsLoading ? 'FETCHING...' : 'REFETCH ADDRESS'}
                        </button>
                    </section>

                    {/* Disclaimer */}
                    <div className="p-4 glass-panel border-hard-pink/20 bg-hard-pink/5 rounded-2xl">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-hard-pink text-[20px]">verified_user</span>
                            <p className="text-[10px] text-white/50 leading-relaxed italic">
                                Certified BioSentinel report. Data encryption active. Encrypted transit to biodiversity central node.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Submit Button & Risk Result */}
                <div className="max-w-md mx-auto p-6 z-70 relative">
                    <div className="absolute inset-0 bg-linear-to-t from-bg-gradient-end via-bg-gradient-end/90 to-transparent pointer-events-none -mt-10"></div>
                    
                    {riskResult && (
                        <div className={`mb-4 p-4 rounded-2xl border ${getRiskColor(riskResult.riskLevel)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">GBIF Risk Assessment</span>
                                <span className="text-sm font-bold">{riskResult.riskLevel}</span>
                            </div>
                            <div className="text-xs text-white/80 space-y-1">
                                <p>Score: {riskResult.riskScore}</p>
                                <p>Observations: {riskResult.observations} ({riskResult.trendRatio?.toFixed(1) || 1}x avg)</p>
                                {riskResult.reason && riskResult.reason.map((r, i) => (
                                    <p key={i}>• {r}</p>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="relative w-full glass-panel bg-neon-green hover:bg-neon-green/90 text-black font-black h-16 flex items-center justify-center neon-glow transition-all active:scale-95 uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                                ANALYZING...
                            </>
                        ) : (
                            <span>Submit Observation</span>
                        )}
                    </button>
                </div>
            </div>
            <Nav />
        </div>
    )
}

export default Report;
