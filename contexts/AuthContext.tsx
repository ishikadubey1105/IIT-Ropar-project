
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isGuest: boolean;
}

interface AuthContextType {
    user: User | null;
    login: () => Promise<void>;
    logout: () => void;
    guestLogin: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    logout: () => { },
    guestLogin: () => { },
    loading: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Check for persisted session (simulation)
    useEffect(() => {
        const stored = localStorage.getItem('atmosphera_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const login = async () => {
        setLoading(true);
        // Simulate Google Sign-In Delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock User Data (In production, this comes from Firebase/Supabase)
        const mockUser: User = {
            id: 'g-12345',
            name: 'Explorer',
            email: 'reader@example.com',
            avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Atmosphera',
            isGuest: false
        };

        setUser(mockUser);
        localStorage.setItem('atmosphera_user', JSON.stringify(mockUser));
        setLoading(false);
    };

    const guestLogin = () => {
        setLoading(true);

        const guest: User = {
            id: 'guest-' + Date.now(),
            name: 'Guest Reader',
            email: '',
            avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Guest', // Placeholder
            isGuest: true
        };

        // IMPORTANT: Set session storage BEFORE redirecting
        sessionStorage.setItem('guest_session', JSON.stringify({
            id: guest.id,
            timestamp: new Date(),
            isGuest: true
        }));

        localStorage.setItem('atmosphera_user', JSON.stringify(guest));

        // Redirect immediately to home
        setTimeout(() => {
            setUser(guest);
            setLoading(false);
        }, 300);
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('atmosphera_user');
        window.location.reload(); // Hard reset state
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, guestLogin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
