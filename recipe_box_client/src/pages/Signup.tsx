import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Home, Users } from 'lucide-react';

type SignupType = 'create_kitchen' | 'join_kitchen';
type Role = 'sous_chef' | 'line_cook';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [signupType, setSignupType] = useState<SignupType>('create_kitchen');
    const [inviteCode, setInviteCode] = useState('');
    const [role, setRole] = useState<Role>('sous_chef');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signup(email, password, username, signupType, inviteCode, role);
            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { status?: { message?: string } } } };
            setError(error.response?.data?.status?.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mb-4">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Create Account</h1>
                        <p className="text-gray-300 mt-2">Join Recipe Box today</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Signup Type Toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSignupType('create_kitchen')}
                                className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${signupType === 'create_kitchen'
                                        ? 'border-teal-500 bg-teal-500/20 text-white'
                                        : 'border-white/20 text-gray-400 hover:border-white/40'
                                    }`}
                            >
                                <Home className="w-6 h-6" />
                                <span className="text-sm font-medium">Create Kitchen</span>
                                <span className="text-xs text-gray-500">Start your own</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignupType('join_kitchen')}
                                className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${signupType === 'join_kitchen'
                                        ? 'border-teal-500 bg-teal-500/20 text-white'
                                        : 'border-white/20 text-gray-400 hover:border-white/40'
                                    }`}
                            >
                                <Users className="w-6 h-6" />
                                <span className="text-sm font-medium">Join Kitchen</span>
                                <span className="text-xs text-gray-500">Use invite code</span>
                            </button>
                        </div>

                        {/* Invite Code + Role (only for join) */}
                        {signupType === 'join_kitchen' && (
                            <>
                                <div>
                                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                                        Invite Code
                                    </label>
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition uppercase tracking-widest font-mono"
                                        placeholder="ABCD1234"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Role
                                    </label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as Role)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                    >
                                        <option value="sous_chef" className="bg-slate-800">Sous Chef (Can edit)</option>
                                        <option value="line_cook" className="bg-slate-800">Line Cook (View only)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="chef_master"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating account...' : signupType === 'create_kitchen' ? 'Create My Kitchen' : 'Join Kitchen'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
