import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Clock, Users, Edit, Trash2, ExternalLink, ChefHat, RefreshCw, AlertTriangle } from 'lucide-react';

interface RecipeIngredient {
    id: number;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    ingredient: {
        id: number;
        name: string;
    };
}

interface Substitution {
    id: number;
    ingredient: { id: number; name: string };
    substitute: { id: number; name: string };
    ratio: number;
    notes: string;
}

interface Recipe {
    id: number;
    title: string;
    description: string | null;
    instructions: string | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    servings: number | null;
    image_url: string | null;
    source_url: string | null;
    nutritional_info: {
        calories?: number;
        protein?: number;
        carbohydrates?: number;
        fat?: number;
    } | null;
    recipe_ingredients: RecipeIngredient[];
    tags: string[];
}

interface Household {
    id: number;
    dietary_preferences: string[];
}

export default function RecipeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [servingMultiplier, setServingMultiplier] = useState(1);
    const [substitutions, setSubstitutions] = useState<Map<number, Substitution[]>>(new Map());

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [recipeRes, householdRes] = await Promise.all([
                api.get(`/api/v1/recipes/${id}`),
                api.get('/api/v1/households/current')
            ]);

            const recipeData = recipeRes.data.data;
            setRecipe(recipeData);
            setHousehold(householdRes.data.data);

            // Fetch substitutions for all ingredients
            if (recipeData.recipe_ingredients?.length > 0) {
                const ingredientIds = recipeData.recipe_ingredients.map((ri: RecipeIngredient) => ri.ingredient.id);
                const subsResponse = await api.get('/api/v1/substitutions', {
                    params: { ingredient_ids: ingredientIds }
                });

                // Group substitutions by ingredient_id
                const subsMap = new Map<number, Substitution[]>();
                subsResponse.data.data.forEach((sub: Substitution) => {
                    const existing = subsMap.get(sub.ingredient.id) || [];
                    subsMap.set(sub.ingredient.id, [...existing, sub]);
                });
                setSubstitutions(subsMap);
            }
        } catch (error) {
            console.error('Failed to fetch recipe:', error);
            navigate('/recipes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this recipe?')) return;

        try {
            await api.delete(`/api/v1/recipes/${id}`);
            navigate('/recipes');
        } catch (error) {
            console.error('Failed to delete recipe:', error);
        }
    };

    const scaleQuantity = (quantity: number | null) => {
        if (!quantity) return null;
        return Math.round(quantity * servingMultiplier * 100) / 100;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!recipe) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/recipes')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Recipes
                </button>
                <div className="flex gap-2">
                    <Link
                        to={`/recipes/${id}/cook`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition"
                    >
                        <ChefHat className="w-4 h-4" />
                        Start Cooking
                    </Link>
                    <Link
                        to={`/recipes/${id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                {recipe.image_url && (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-64 object-cover" />
                )}
                <div className="p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{recipe.title}</h1>
                    {recipe.description && <p className="text-gray-300 mb-4">{recipe.description}</p>}

                    {/* Dietary Warnings */}
                    {household?.dietary_preferences?.map(pref => {
                        if (!recipe.tags?.includes(pref)) {
                            return (
                                <div key={pref} className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Warning: This recipe does not match your <strong>{pref}</strong> preference.</span>
                                </div>
                            );
                        }
                        return null;
                    })}

                    {recipe.tags && recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {recipe.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-gray-400">
                        {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                            <span className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                {recipe.prep_time_minutes && <span>Prep: {recipe.prep_time_minutes} min</span>}
                                {recipe.cook_time_minutes && <span>Cook: {recipe.cook_time_minutes} min</span>}
                            </span>
                        )}
                        {recipe.servings && (
                            <span className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {recipe.servings} servings
                            </span>
                        )}
                        {recipe.source_url && (
                            <a
                                href={recipe.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Source
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Ingredients</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white hover:bg-white/20"
                            >
                                -
                            </button>
                            <span className="text-white font-medium">{servingMultiplier}x</span>
                            <button
                                onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white hover:bg-white/20"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <ul className="space-y-3">
                        {recipe.recipe_ingredients.map((ri) => {
                            const subs = substitutions.get(ri.ingredient.id) || [];
                            return (
                                <li key={ri.id} className="text-gray-300">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            {scaleQuantity(ri.quantity) && (
                                                <span className="font-medium text-white">{scaleQuantity(ri.quantity)} </span>
                                            )}
                                            {ri.unit && <span>{ri.unit} </span>}
                                            <span>{ri.notes || ri.ingredient.name}</span>
                                        </div>
                                        {subs.length > 0 && (
                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                <RefreshCw className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>
                                    {subs.length > 0 && (
                                        <div className="mt-1 ml-4 text-xs text-gray-500 space-y-1">
                                            {subs.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-1">
                                                    <span className="text-green-500">↳</span>
                                                    <span className="text-green-400">{sub.substitute.name}</span>
                                                    {sub.notes && <span className="text-gray-500">({sub.notes})</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="md:col-span-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
                    <div className="prose prose-invert max-w-none">
                        {recipe.instructions?.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="text-gray-300 mb-4">{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>

            {recipe.nutritional_info && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Nutrition (per serving)</h2>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-purple-400">{recipe.nutritional_info.calories || '-'}</div>
                            <div className="text-gray-400 text-sm">Calories</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{recipe.nutritional_info.protein || '-'}g</div>
                            <div className="text-gray-400 text-sm">Protein</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">{recipe.nutritional_info.carbohydrates || '-'}g</div>
                            <div className="text-gray-400 text-sm">Carbs</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-400">{recipe.nutritional_info.fat || '-'}g</div>
                            <div className="text-gray-400 text-sm">Fat</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
