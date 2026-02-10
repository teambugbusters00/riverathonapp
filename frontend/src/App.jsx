import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Map from './pages/Map';
import SpeciesDetail from './pages/SpeciesDetail';
import Dashboard from './pages/Dashboard';
import Alert from './pages/Alert';
import Report from './pages/Report';
import Team from './pages/Team';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import StudentDashboard from './pages/StudentDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import Satellite from './pages/Satellite';

// Protected Route component
const ProtectedRoute = ({ children, requireAuth = true }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-dark">
                <div className="text-white/50 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    if (requireAuth && !user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Role-based Dashboard Route
const DashboardRoute = () => {
    const { user, profileComplete } = useAuth();

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If profile is incomplete, redirect to profile setup
    if (!profileComplete) {
        return <Navigate to="/profile-setup" replace />;
    }

    // Redirect to role-specific dashboard
    const role = user.role;
    if (role === 'student') {
        return <StudentDashboard />;
    } else if (role === 'researcher') {
        return <ResearcherDashboard />;
    } else if (role === 'community') {
        return <CommunityDashboard />;
    }
    
    return <Dashboard />;
};

// Role-specific dashboard pages
const StudentDashboardPage = () => (
    <ProtectedRoute>
        <StudentDashboard />
    </ProtectedRoute>
);

const ResearcherDashboardPage = () => (
    <ProtectedRoute>
        <ResearcherDashboard />
    </ProtectedRoute>
);

const CommunityDashboardPage = () => (
    <ProtectedRoute>
        <CommunityDashboard />
    </ProtectedRoute>
);

// Profile setup page (requires auth, redirects if complete)
const ProfileSetupPage = () => {
    const { user, profileComplete } = useAuth();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (profileComplete) {
        const dashboardPath = user.role ? `/dashboard/${user.role}` : '/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }
    
    return (
        <ProtectedRoute>
            <ProfileSetup />
        </ProtectedRoute>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/map" element={<Map />} />
                    <Route path="/species/:id" element={<SpeciesDetail />} />
                    <Route path="/alert" element={<Alert />} />
                    <Route path="/report" element={<Report />} />
                    <Route path="/satellite" element={<Satellite />} />
                    <Route path="/team" element={<Team />} />

                    {/* Auth Routes */}
                    <Route path="/profile-setup" element={<ProfileSetupPage />} />

                    {/* Dashboard Routes */}
                    <Route path="/dashboard" element={<DashboardRoute />} />
                    <Route path="/dashboard/student" element={<StudentDashboardPage />} />
                    <Route path="/dashboard/researcher" element={<ResearcherDashboardPage />} />
                    <Route path="/dashboard/community" element={<CommunityDashboardPage />} />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
