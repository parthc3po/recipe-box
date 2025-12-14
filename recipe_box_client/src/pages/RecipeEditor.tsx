import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, Plus, X, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';

interface IngredientInput {
    id?: number;
    ingredient_name: string;
    quantity: string;
    unit: string;
    notes: string;
    _destroy?: boolean;
}

export default function RecipeEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [prepTime, setPrepTime] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [servings, setServings] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [nutrition, setNutrition] = useState({ calories: '', protein: '', carbohydrates: '', fat: '' });
    const [ingredients, setIngredients] = useState<IngredientInput[]>([]);
    const [importUrl, setImportUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [isParsingBulk, setIsParsingBulk] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchRecipe();
        }
    }, [id]);

    const fetchRecipe = async () => {
        try {
            const response = await api.get(`/api/v1/recipes/${id}`);
            const recipe = response.data.data;
            setTitle(recipe.title || '');
            setDescription(recipe.description || '');
            setInstructions(recipe.instructions || '');
            setPrepTime(recipe.prep_time_minutes?.toString() || '');
            setCookTime(recipe.cook_time_minutes?.toString() || '');
            setServings(recipe.servings?.toString() || '');
            setImageUrl(recipe.image_url || '');
            setNutrition({
                calories: recipe.nutritional_info?.calories?.toString() || '',
                protein: recipe.nutritional_info?.protein?.toString() || '',
                carbohydrates: recipe.nutritional_info?.carbohydrates?.toString() || '',
                fat: recipe.nutritional_info?.fat?.toString() || '',
            });
            setIngredients(
                recipe.recipe_ingredients.map((ri: { id: number; quantity: number | null; unit: string | null; notes: string | null; ingredient: { name: string } }) => ({
                    id: ri.id,
                    ingredient_name: ri.ingredient.name,
                    quantity: ri.quantity?.toString() || '',
                    unit: ri.unit || '',
                    notes: ri.notes || '',
                }))
            );
        } catch (error) {
            console.error('Failed to fetch recipe:', error);
            navigate('/recipes');
        }
    };

    const handleImport = async () => {
        if (!importUrl) return;
        setIsImporting(true);
        setError('');

        try {
            const response = await api.post('/api/v1/recipe_imports', { url: importUrl });
            const recipe = response.data.data;
            setTitle(recipe.title || '');
            setDescription(recipe.description || '');
            setInstructions(recipe.instructions || '');
            setPrepTime(recipe.prep_time_minutes?.toString() || '');
            setCookTime(recipe.cook_time_minutes?.toString() || '');
            setServings(recipe.servings?.toString() || '');
            setImageUrl(recipe.image_url || '');
            setNutrition(recipe.nutritional_info ? {
                calories: recipe.nutritional_info.calories?.toString() || '',
                protein: recipe.nutritional_info.protein?.toString() || '',
                carbohydrates: recipe.nutritional_info.carbohydrates?.toString() || '',
                fat: recipe.nutritional_info.fat?.toString() || '',
            } : { calories: '', protein: '', carbohydrates: '', fat: '' });
            // Recipe was already saved, redirect to edit
            navigate(`/recipes/${recipe.id}/edit`);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { status?: { message?: string } } } };
            setError(error.response?.data?.status?.message || 'Failed to import recipe');
        } finally {
            setIsImporting(false);
        }
    };

    const handleBulkParse = async () => {
        if (!bulkText.trim()) return;
        setIsParsingBulk(true);
        try {
            const response = await api.post('/api/v1/recipe_imports/parse_text', { text: bulkText });
            const parsedIngredients = response.data.data.map((item: any) => ({
                ingredient_name: item.name || '',
                quantity: item.quantity?.toString() || '',
                unit: item.unit || '',
                notes: '',
            }));
            setIngredients([...ingredients, ...parsedIngredients]);
            setBulkText('');
            setIsBulkOpen(false);
        } catch (error) {
            console.error('Failed to parse text:', error);
            setError('Failed to parse ingredients text.');
        } finally {
            setIsParsingBulk(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const payload = {
                recipe: {
                    title,
                    description,
                    instructions,
                    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                    servings: servings ? parseInt(servings) : null,
                    image_url: imageUrl || null,
                    nutritional_info: {
                        calories: nutrition.calories ? parseInt(nutrition.calories) : null,
                        protein: nutrition.protein ? parseFloat(nutrition.protein) : null,
                        carbohydrates: nutrition.carbohydrates ? parseFloat(nutrition.carbohydrates) : null,
                        fat: nutrition.fat ? parseFloat(nutrition.fat) : null,
                    }
                },
            };

            if (isEditing) {
                await api.patch(`/api/v1/recipes/${id}`, payload);
            } else {
                await api.post('/api/v1/recipes', payload);
            }
            navigate('/recipes');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { status?: { message?: string } } } };
            setError(error.response?.data?.status?.message || 'Failed to save recipe');
        } finally {
            setIsLoading(false);
        }
    };

    const estimateNutrition = () => {
        // Mock estimate for demo purposes
        setNutrition({
            calories: (Math.floor(Math.random() * 500) + 200).toString(),
            protein: (Math.floor(Math.random() * 30) + 5).toString(),
            carbohydrates: (Math.floor(Math.random() * 60) + 10).toString(),
            fat: (Math.floor(Math.random() * 20) + 5).toString(),
        });
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { ingredient_name: '', quantity: '', unit: '', notes: '' }]);
    };

    const updateIngredient = (index: number, field: keyof IngredientInput, value: string) => {
        const updated = [...ingredients];
        updated[index] = { ...updated[index], [field]: value };
        setIngredients(updated);
    };

    const removeIngredient = (index: number) => {
        const updated = [...ingredients];
        if (updated[index].id) {
            updated[index]._destroy = true;
        } else {
            updated.splice(index, 1);
        }
        setIngredients(updated);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/recipes')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Recipes
                </button>
                <h1 className="text-2xl font-bold text-white">
                    {isEditing ? 'Edit Recipe' : 'New Recipe'}
                </h1>
            </div>

            {!isEditing && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Import from URL
                    </h2>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="https://example.com/recipe"
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={isImporting || !importUrl}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isImporting ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="prepTime" className="block text-sm font-medium text-gray-300 mb-2">Prep Time (min)</label>
                            <input
                                id="prepTime"
                                type="number"
                                value={prepTime}
                                onChange={(e) => setPrepTime(e.target.value)}
                                min="0"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="cookTime" className="block text-sm font-medium text-gray-300 mb-2">Cook Time (min)</label>
                            <input
                                id="cookTime"
                                type="number"
                                value={cookTime}
                                onChange={(e) => setCookTime(e.target.value)}
                                min="0"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="servings" className="block text-sm font-medium text-gray-300 mb-2">Servings</label>
                            <input
                                id="servings"
                                type="number"
                                value={servings}
                                onChange={(e) => setServings(e.target.value)}
                                min="1"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                        <input
                            id="imageUrl"
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Nutrition Section */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/10">
                        <div className="col-span-4 flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-300">Nutrition (per serving)</label>
                            <button
                                type="button"
                                onClick={estimateNutrition}
                                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                            >
                                <Sparkles className="w-3 h-3" />
                                Auto-Estimate
                            </button>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={nutrition.calories}
                                onChange={(e) => setNutrition({ ...nutrition, calories: e.target.value })}
                                placeholder="Cals"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-500 block mt-1 text-center">Calories</span>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={nutrition.protein}
                                onChange={(e) => setNutrition({ ...nutrition, protein: e.target.value })}
                                placeholder="Prot"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-500 block mt-1 text-center">Protein (g)</span>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={nutrition.carbohydrates}
                                onChange={(e) => setNutrition({ ...nutrition, carbohydrates: e.target.value })}
                                placeholder="Carbs"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-500 block mt-1 text-center">Carbs (g)</span>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={nutrition.fat}
                                onChange={(e) => setNutrition({ ...nutrition, fat: e.target.value })}
                                placeholder="Fat"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-500 block mt-1 text-center">Fat (g)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Ingredients</h2>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>

                    {isBulkOpen ? (
                        <div className="mb-4 bg-white/5 p-4 rounded-lg border border-white/10">
                            <label className="block text-sm text-gray-400 mb-2">Paste ingredients (one per line):</label>
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white mb-2"
                                placeholder={"1 cup flour\n2 eggs\n1/2 tsp salt"}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkOpen(false)}
                                    className="px-3 py-1 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkParse}
                                    disabled={isParsingBulk || !bulkText.trim()}
                                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                                >
                                    {isParsingBulk ? 'Parsing...' : 'Add Ingredients'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end mb-4">
                            <button
                                type="button"
                                onClick={() => setIsBulkOpen(true)}
                                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                            >
                                <FileText className="w-3 h-3" />
                                Paste from Clipboard
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        {ingredients.map((ing, idx) => {
                            if (ing._destroy) return null;
                            return (
                                <div key={ing.id || `new-${idx}`} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ing.quantity}
                                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                                        placeholder="Qty"
                                        className="w-20 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={ing.unit}
                                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                                        placeholder="Unit"
                                        className="w-20 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={ing.ingredient_name}
                                        onChange={(e) => updateIngredient(idx, 'ingredient_name', e.target.value)}
                                        placeholder="Ingredient name"
                                        className="flex-1 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(idx)}
                                        className="p-2 text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={8}
                        placeholder="Enter step-by-step instructions..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Saving...' : 'Save Recipe'}
                </button>
            </form>
        </div>
    );
}
