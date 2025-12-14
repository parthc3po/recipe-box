import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Clock, Users, Search, ChefHat, Package } from 'lucide-react';

interface Recipe {
    id: number;
    title: string;
    description: string | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    servings: number | null;
    image_url: string | null;
    missing_count?: number;
    cookable?: boolean;
}

export default function RecipeList() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pantryMode, setPantryMode] = useState(false);

    useEffect(() => {
        fetchRecipes();
    }, [pantryMode]);

    const fetchRecipes = async (query = '') => {
        setIsLoading(true);
        try {
            if (pantryMode) {
                const response = await api.get('/api/v1/recipes?filter=cookable');
                setRecipes(response.data.data);
            } else {
                const params = query ? `?query=${encodeURIComponent(query)}` : '';
                const response = await api.get(`/api/v1/recipes${params}`);
                setRecipes(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pantryMode) {
            fetchRecipes(searchQuery);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">My Recipes</h2>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <button
                        onClick={() => setPantryMode(!pantryMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${pantryMode
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="hidden sm:inline">What can I cook?</span>
                    </button>
                    {!pantryMode && (
                        <form onSubmit={handleSearch} className="flex-1 sm:flex-initial">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search recipes..."
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </form>
                    )}
                    <Link
                        to="/recipes/new"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Recipe</span>
                    </Link>
                </div>
            </div>

            {recipes.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <ChefHat className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No recipes yet</h3>
                    <p className="text-gray-400 mb-6">Start building your recipe collection!</p>
                    <Link
                        to="/recipes/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Recipe
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe) => (
                        <Link
                            key={recipe.id}
                            to={`/recipes/${recipe.id}`}
                            className="group bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden hover:border-purple-500/50 transition"
                        >
                            <div className="h-48 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                                {recipe.image_url ? (
                                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                                ) : (
                                    <ChefHat className="w-16 h-16 text-white/30" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition">
                                    {recipe.title}
                                </h3>
                                {recipe.description && (
                                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{recipe.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                                        </span>
                                    )}
                                    {recipe.servings && (
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {recipe.servings} servings
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
