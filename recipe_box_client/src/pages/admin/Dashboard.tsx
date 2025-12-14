import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, TrendingUp, Settings, BookOpen } from 'lucide-react';

interface AdminStats {
    total_users: number;
    users_by_role: {
        head_chef: number;
        sous_chef: number;
        line_cook: number;
    };
    total_recipes: number;
    recent_users: Array<{
        id: number;
        email: string;
        username: string;
        role: string;
        joined_at: string;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/v1/admin/stats');
            setStats(response.data.data);
        } catch (err) {
            setError('Failed to load stats. You must be a Head Chef.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-red-300">
                {error}
            </div>
        );
    }

    const statCards = [
        { label: 'Household Members', value: stats?.total_users || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'Total Recipes', value: stats?.total_recipes || 0, icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <Link
                    to="/admin/users"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
                >
                    <Settings className="w-4 h-4" />
                    Manage Users
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className={`bg-gradient-to-br ${stat.color} p-6 rounded-xl text-white`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-sm">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <Icon className="w-12 h-12 opacity-50" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Users by Role */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Members by Role
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{stats?.users_by_role.line_cook || 0}</p>
                        <p className="text-gray-400 text-sm">Line Cooks</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats?.users_by_role.sous_chef || 0}</p>
                        <p className="text-gray-400 text-sm">Sous Chefs</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">{stats?.users_by_role.head_chef || 0}</p>
                        <p className="text-gray-400 text-sm">Head Chefs</p>
                    </div>
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Recent Members
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                                <th className="pb-3">Username</th>
                                <th className="pb-3">Email</th>
                                <th className="pb-3">Role</th>
                                <th className="pb-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_users.map((user) => (
                                <tr key={user.id} className="border-b border-white/5">
                                    <td className="py-3 text-white">{user.username || '—'}</td>
                                    <td className="py-3 text-gray-300">{user.email}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'head_chef' ? 'bg-purple-500/20 text-purple-300' :
                                                user.role === 'sous_chef' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-green-500/20 text-green-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-400 text-sm">
                                        {new Date(user.joined_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
