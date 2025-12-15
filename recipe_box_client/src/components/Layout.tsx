import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, LogOut, Home, BookOpen, Calendar, ShoppingCart, Package, BarChart3, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/recipes', icon: BookOpen, label: 'Recipes' },
        { path: '/pantry', icon: Package, label: 'Pantry' },
        { path: '/meal-planner', icon: Calendar, label: 'Meal Planner' },
        { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping' },
        { path: '/stats', icon: BarChart3, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const roleDisplay = user?.household?.role === 'head_chef' ? '👨‍🍳 Head Chef'
        : user?.household?.role === 'sous_chef' ? '🥄 Sous Chef'
            : user?.household?.role === 'line_cook' ? '🍳 Line Cook' : null;

    const roleColor = user?.household?.role === 'head_chef'
        ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
        : user?.household?.role === 'sous_chef'
            ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
            : 'bg-gray-400/20 text-gray-300 border border-gray-400/40';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-3">
                            <ChefHat className="w-8 h-8 text-purple-400" />
                            <span className="text-xl font-bold text-white">Recipe Box</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-purple-500/20 text-white border-l-4 border-purple-500'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {(user?.username || user?.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{user?.username || user?.email}</p>
                                {roleDisplay && (
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
                                        {roleDisplay}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-gray-300 rounded-lg transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (mobile only) */}
                <header className="lg:hidden bg-white/5 backdrop-blur-lg border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setSidebarOpen(true)} className="text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link to="/" className="flex items-center gap-2">
                            <ChefHat className="w-6 h-6 text-purple-400" />
                            <span className="font-bold text-white">Recipe Box</span>
                        </Link>
                        <div className="w-6" /> {/* Spacer */}
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
