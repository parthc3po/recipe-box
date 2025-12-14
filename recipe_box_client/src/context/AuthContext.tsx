import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: number;
    email: string;
    username: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, username: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if token exists and is valid on mount
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // Optionally fetch user profile here
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post('/login', { user: { email, password } });
        const authToken = response.headers['authorization']?.split(' ')[1];
        if (authToken) {
            localStorage.setItem('token', authToken);
            setToken(authToken);
            setUser(response.data.data);
        }
    };

    const signup = async (email: string, password: string, username: string) => {
        const response = await api.post('/signup', {
            user: { email, password, password_confirmation: password, username },
        });
        const authToken = response.headers['authorization']?.split(' ')[1];
        if (authToken) {
            localStorage.setItem('token', authToken);
            setToken(authToken);
            setUser(response.data.data);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // Optionally call API to invalidate token
        api.delete('/logout').catch(() => { });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
