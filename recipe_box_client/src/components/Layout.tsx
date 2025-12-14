import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, LogOut, Home, BookOpen, Calendar, ShoppingCart, Package, BarChart3, Settings } from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/recipes', icon: BookOpen, label: 'Recipes' },
        { path: '/pantry', icon: Package, label: 'Pantry' },
        { path: '/meal-planner', icon: Calendar, label: 'Meal Planner' },
        { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
        { path: '/stats', icon: BarChart3, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2">
                                <ChefHat className="w-8 h-8 text-purple-400" />
                                <span className="text-xl font-bold text-white">Recipe Box</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-300 hidden sm:inline">
                                {user?.username || user?.email}
                            </span>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
