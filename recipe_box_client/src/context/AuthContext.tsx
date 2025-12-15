import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface Household {
    id: number;
    name: string;
    invite_code: string;
    role: 'head_chef' | 'sous_chef' | 'line_cook';
}

interface User {
    id: number;
    email: string;
    username: string | null;
    household?: Household | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, username: string, signupType?: string, inviteCode?: string, role?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken) {
            setToken(storedToken);
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Invalid stored user
                }
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post('/api/login', { user: { email, password } });
        const authToken = response.headers['authorization']?.split(' ')[1];
        if (authToken) {
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(response.data.data));
            setToken(authToken);
            setUser(response.data.data);
        }
    };

    const signup = async (
        email: string,
        password: string,
        username: string,
        signupType: string = 'create_kitchen',
        inviteCode: string = '',
        role: string = 'sous_chef'
    ) => {
        const response = await api.post('/api/signup', {
            user: {
                email,
                password,
                password_confirmation: password,
                username,
                signup_type: signupType,
                invite_code: inviteCode,
                role,
            },
        });
        const authToken = response.headers['authorization']?.split(' ')[1];
        if (authToken) {
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(response.data.data));
            setToken(authToken);
            setUser(response.data.data);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        api.delete('/api/logout').catch(() => { });
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
