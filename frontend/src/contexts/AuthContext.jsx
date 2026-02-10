import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    signInWithEmail, 
    signUpWithEmail, 
    logOut, 
    getCurrentUser, 
    isProfileComplete as checkProfileComplete,
    updateUserProfile,
    getRoleSpecificData,
    getDashboardPath,
    getRoleEmoji,
    getRoleLabel,
    ROLES
} from '../auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);

    // Initialize auth state
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            if (currentUser) {
                setProfileComplete(checkProfileComplete(currentUser));
            } else {
                setProfileComplete(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setProfileComplete(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        user,
        loading,
        profileComplete,
        isLoggedIn: () => !!user,
        signInWithEmail: async (email, password) => {
            const result = await signInWithEmail(email, password);
            await checkAuth();
            return result;
        },
        signUpWithEmail: async (name, email, password) => {
            const result = await signUpWithEmail(name, email, password);
            await checkAuth();
            return result;
        },
        logOut: () => {
            logOut();
            setUser(null);
            setProfileComplete(false);
        },
        checkAuth,
        updateProfile: async (profileData) => {
            if (!user) throw new Error('No user logged in');
            const updatedUser = await updateUserProfile(profileData);
            await checkAuth();
            return updatedUser;
        },
        getRoleSpecificData: () => getRoleSpecificData(user),
        getDashboardPath: () => user?.role ? getDashboardPath(user.role) : '/dashboard',
        getRoleEmoji: (role) => getRoleEmoji(role),
        getRoleLabel: (role) => getRoleLabel(role),
        ROLES,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-bg-dark">
                    <div className="text-white/50 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-sm">Loading...</span>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;
