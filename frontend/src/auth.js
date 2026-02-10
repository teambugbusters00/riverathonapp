// MongoDB-based authentication API

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// User Roles
export const ROLES = {
    STUDENT: 'student',
    RESEARCHER: 'researcher',
    COMMUNITY: 'community',
};

// Get stored token
const getToken = () => localStorage.getItem('biosentinel_token');

// Get stored user
const getStoredUser = () => {
    const user = localStorage.getItem('biosentinel_user');
    return user ? JSON.parse(user) : null;
};

// Sign up with email/password
export const signUpWithEmail = async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
    }

    // Store token and user
    localStorage.setItem('biosentinel_token', data.token);
    localStorage.setItem('biosentinel_user', JSON.stringify(data.user));

    return data.user;
};

// Sign in with email/password
export const signInWithEmail = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Signin failed');
    }

    // Store token and user
    localStorage.setItem('biosentinel_token', data.token);
    localStorage.setItem('biosentinel_user', JSON.stringify(data.user));

    return data.user;
};

// Sign out
export const logOut = () => {
    localStorage.removeItem('biosentinel_token');
    localStorage.removeItem('biosentinel_user');
};

// Get current user
export const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Token invalid
            logOut();
            return null;
        }

        const user = await response.json();
        
        // Update stored user
        localStorage.setItem('biosentinel_user', JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return getStoredUser();
    }
};

// Check if user is logged in
export const isLoggedIn = () => {
    return !!getToken();
};

// Check if user profile is complete
export const isProfileComplete = (user) => {
    if (!user) return false;
    if (!user.profileComplete) return false;
    if (!user.role) return false;
    if (!user.country) return false;
    if (!user.bio) return false;
    
    // Check role-specific fields
    const role = user.role;
    if (role === 'student') {
        return user.college && user.course;
    } else if (role === 'researcher') {
        return user.organization && user.expertise;
    } else if (role === 'community') {
        return user.localArea;
    }
    return false;
};

// Update user profile
export const updateUserProfile = async (profileData) => {
    const token = getToken();
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
    }

    // Update stored user
    localStorage.setItem('biosentinel_user', JSON.stringify(data));
    
    return data;
};

// Get role-specific data
export const getRoleSpecificData = (user) => {
    if (!user) return null;
    
    const { role, _id, createdAt, updatedAt, password, ...commonData } = user;
    
    const roleSpecificData = {
        student: {
            college: user.college,
            course: user.course,
            year: user.year,
            interests: user.interests || [],
        },
        researcher: {
            organization: user.organization,
            expertise: user.expertise,
            experience: user.experience,
            orcid: user.orcid,
        },
        community: {
            localArea: user.localArea,
            occupation: user.occupation,
            onGroundAccess: user.onGroundAccess,
        },
    };
    
    return {
        role,
        ...commonData,
        ...(roleSpecificData[role] || {}),
    };
};

// Helper to get role emoji
export const getRoleEmoji = (role) => {
    const emojis = {
        [ROLES.STUDENT]: '🎓',
        [ROLES.RESEARCHER]: '🔬',
        [ROLES.COMMUNITY]: '🌱',
    };
    return emojis[role] || '👤';
};

// Helper to get role label
export const getRoleLabel = (role) => {
    const labels = {
        [ROLES.STUDENT]: 'Student',
        [ROLES.RESEARCHER]: 'Researcher',
        [ROLES.COMMUNITY]: 'Community',
    };
    return labels[role] || 'Unknown';
};

// Get dashboard path based on role
export const getDashboardPath = (role) => {
    const paths = {
        [ROLES.STUDENT]: '/dashboard/student',
        [ROLES.RESEARCHER]: '/dashboard/researcher',
        [ROLES.COMMUNITY]: '/dashboard/community',
    };
    return paths[role] || '/dashboard';
};
