import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, Calendar, ShoppingCart, ChefHat, Package, ArrowRight } from 'lucide-react';

interface MealPlanItem {
    id: number;
    recipe_id: number;
    recipe_title: string;
    recipe_image_url: string | null;
    date: string;
    meal_type: string;
}

interface Recipe {
    id: number;
    title: string;
    image_url: string | null;
}

export default function Home() {
    const { user } = useAuth();
    const [nextMeal, setNextMeal] = useState<MealPlanItem | null>(null);
    const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch today's meal plan
            const today = new Date().toISOString().split('T')[0];
            const planRes = await api.get('/api/v1/meal_plans', {
                params: { start_date: today, end_date: today },
            });
            const items = planRes.data.data.items || [];
            if (items.length > 0) {
                setNextMeal(items[0]);
            }

            // Fetch recent recipes
            const recipesRes = await api.get('/api/v1/recipes');
            setRecentRecipes(recipesRes.data.data.slice(0, 4));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    const quickLinks = [
        { path: '/recipes', icon: BookOpen, label: 'Recipes', color: 'from-purple-500 to-pink-500' },
        { path: '/pantry', icon: Package, label: 'Pantry', color: 'from-green-500 to-teal-500' },
        { path: '/meal-planner', icon: Calendar, label: 'Meal Planner', color: 'from-blue-500 to-cyan-500' },
        { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping List', color: 'from-orange-500 to-yellow-500' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {user?.username || 'Chef'}! 👋
                </h1>
                <p className="text-gray-400">What's cooking today?</p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`bg-gradient-to-br ${link.color} p-4 rounded-xl text-white hover:scale-105 transition transform`}
                        >
                            <Icon className="w-8 h-8 mb-2" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Next Meal */}
            {nextMeal && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        Up Next: {nextMeal.meal_type.charAt(0).toUpperCase() + nextMeal.meal_type.slice(1)}
                    </h2>
                    <Link
                        to={`/recipes/${nextMeal.recipe_id}`}
                        className="flex items-center gap-4 group"
                    >
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center overflow-hidden">
                            {nextMeal.recipe_image_url ? (
                                <img src={nextMeal.recipe_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <ChefHat className="w-8 h-8 text-white/50" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-white group-hover:text-purple-400 transition">
                                {nextMeal.recipe_title}
                            </h3>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
                    </Link>
                </div>
            )}

            {/* Recent Recipes */}
            {recentRecipes.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Recent Recipes</h2>
                        <Link to="/recipes" className="text-purple-400 hover:text-purple-300 text-sm">
                            View all →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {recentRecipes.map((recipe) => (
                            <Link
                                key={recipe.id}
                                to={`/recipes/${recipe.id}`}
                                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden hover:border-purple-500/50 transition group"
                            >
                                <div className="h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                                    {recipe.image_url ? (
                                        <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ChefHat className="w-8 h-8 text-white/30" />
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition">
                                        {recipe.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
