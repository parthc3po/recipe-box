import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import api from '../services/api';
import { Calendar, GripVertical, X, Wand2 } from 'lucide-react';

interface Recipe {
    id: number;
    title: string;
    image_url: string | null;
}

interface MealPlanItem {
    id: number;
    recipe_id: number;
    recipe_title: string;
    recipe_image_url: string | null;
    date: string;
    meal_type: string;
    servings: number | null;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
}

export default function MealPlannerPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [items, setItems] = useState<MealPlanItem[]>([]);
    const [pastItems, setPastItems] = useState<MealPlanItem[]>([]);
    const [sidebarTab, setSidebarTab] = useState<'recipes' | 'recent'>('recipes');
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genPreferences, setGenPreferences] = useState({
        days: 7,
        max_time: '',
        diet: ''
    });

    const weekDates = getWeekDates(weekStart);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const pastStart = new Date(weekStart);
            pastStart.setDate(pastStart.getDate() - 7);
            const pastEnd = new Date(weekStart);
            pastEnd.setDate(pastEnd.getDate() - 1);

            const [recipesRes, planRes, pastRes] = await Promise.all([
                api.get('/api/v1/recipes'),
                api.get('/api/v1/meal_plans', {
                    params: {
                        start_date: formatDate(weekStart),
                        end_date: formatDate(weekDates[6]),
                    },
                }),
                api.get('/api/v1/meal_plans', {
                    params: {
                        start_date: formatDate(pastStart),
                        end_date: formatDate(pastEnd),
                    },
                }),
            ]);
            setRecipes(recipesRes.data.data);
            setItems(planRes.data.data.items || []);
            setPastItems(pastRes.data.data.items || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [weekStart]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        // Dragging from recipe list to a slot
        if (source.droppableId === 'recipes' && destination.droppableId !== 'recipes') {
            const [date, mealType] = destination.droppableId.split('|');
            const recipeId = parseInt(draggableId.replace('recipe-', ''));

            try {
                const response = await api.post('/api/v1/meal_plans/add_item', {
                    recipe_id: recipeId,
                    date,
                    meal_type: mealType,
                });
                setItems([...items, response.data.data]);
            } catch (error) {
                console.error('Failed to add item:', error);
            }
        }

        // Dragging from recent meals (Leftovers)
        if (source.droppableId === 'recent' && destination.droppableId !== 'recent') {
            const [date] = destination.droppableId.split('|');
            const sourceItemId = parseInt(draggableId.replace('recent-', ''));
            const sourceItem = pastItems.find(i => i.id === sourceItemId);

            if (!sourceItem) return;

            try {
                const response = await api.post('/api/v1/meal_plans/add_item', {
                    recipe_id: sourceItem.recipe_id,
                    date,
                    meal_type: 'leftover', // Force leftover type
                    source_meal_plan_item_id: sourceItemId,
                    servings: sourceItem.servings
                });
                setItems([...items, response.data.data]);
            } catch (error) {
                console.error('Failed to add leftover:', error);
            }
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        try {
            await api.delete(`/api/v1/meal_plans/items/${itemId}`);
            setItems(items.filter((i) => i.id !== itemId));
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    };

    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };

    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };

    const handleGeneratePlan = async () => {
        if (!confirm('This will replace any existing meals for this week. Continue?')) return;

        setIsGenerating(true);
        try {
            const response = await api.post('/api/v1/meal_plans/generate', {
                start_date: formatDate(weekStart),
                days: genPreferences.days,
                preferences: {
                    max_time: genPreferences.max_time,
                    diet: genPreferences.diet
                }
            });

            setItems(response.data.data.items || []);
            setShowGenModal(false);
        } catch (error) {
            console.error('Failed to generate plan:', error);
            alert('Failed to generate plan. Please try again.');
        } finally {
            setIsGenerating(false);
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
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 h-[calc(100vh-10rem)]">
                    {/* Recipe Sidebar */}
                    <div className="w-64 flex-shrink-0 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 overflow-hidden flex flex-col">
                        <div className="flex gap-2 mb-4 border-b border-white/10 pb-2 overflow-x-auto">
                            <button
                                onClick={() => setSidebarTab('recipes')}
                                className={`flex-1 pb-2 text-sm font-medium transition ${sidebarTab === 'recipes' ? 'text-purple-400 border-b-2 border-purple-400 -mb-2.5' : 'text-gray-400 hover:text-white'}`}
                            >
                                Recipes
                            </button>
                            <button
                                onClick={() => setSidebarTab('recent')}
                                className={`flex-1 pb-2 text-sm font-medium transition ${sidebarTab === 'recent' ? 'text-purple-400 border-b-2 border-purple-400 -mb-2.5' : 'text-gray-400 hover:text-white'}`}
                            >
                                Leftovers
                            </button>
                        </div>

                        {sidebarTab === 'recipes' ? (
                            <Droppable droppableId="recipes" isDropDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="flex-1 overflow-y-auto space-y-2"
                                    >
                                        {recipes.map((recipe, index) => (
                                            <Draggable key={recipe.id} draggableId={`recipe-${recipe.id}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center gap-2 p-2 bg-white/10 rounded-lg cursor-grab ${snapshot.isDragging ? 'ring-2 ring-purple-500' : ''
                                                            }`}
                                                    >
                                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                                        <span className="text-white text-sm truncate">{recipe.title}</span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ) : (
                            <Droppable droppableId="recent" isDropDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="flex-1 overflow-y-auto space-y-2"
                                    >
                                        {pastItems.length === 0 ? (
                                            <div className="text-gray-400 text-sm text-center py-4">No recent meals found</div>
                                        ) : (
                                            pastItems.map((item, index) => (
                                                <Draggable key={item.id} draggableId={`recent-${item.id}`} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`flex flex-col p-2 bg-white/10 rounded-lg cursor-grab ${snapshot.isDragging ? 'ring-2 ring-purple-500' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                                <span className="text-white text-sm font-medium truncate">{item.recipe_title}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 ml-6">
                                                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })} • {item.meal_type}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-7 h-7" /> Meal Planner
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={prevWeek} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                    ← Prev
                                </button>
                                <span className="text-gray-300">
                                    {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
                                </span>
                                <button onClick={nextWeek} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                    Next →
                                </button>
                                <button
                                    onClick={() => setShowGenModal(true)}
                                    className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg flex items-center gap-2"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Generate Plan
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto">
                            {weekDates.map((date) => (
                                <div key={formatDate(date)} className="bg-white/5 rounded-xl p-2 flex flex-col">
                                    <div className="text-center text-gray-300 text-sm font-medium mb-2 border-b border-white/10 pb-1">
                                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    {MEAL_TYPES.map((mealType) => {
                                        const slotId = `${formatDate(date)}|${mealType}`;
                                        const slotItems = items.filter(
                                            (i) => i.date === formatDate(date) && i.meal_type === mealType
                                        );

                                        return (
                                            <Droppable key={slotId} droppableId={slotId}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`flex-1 min-h-[60px] mb-1 p-1 rounded-lg border border-dashed transition ${snapshot.isDraggingOver
                                                            ? 'border-purple-500 bg-purple-500/20'
                                                            : 'border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-xs text-gray-500 capitalize mb-1">{mealType}</div>
                                                        {slotItems.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded p-1 text-xs text-white flex items-center justify-between mb-1"
                                                            >
                                                                <span className="truncate">{item.recipe_title}</span>
                                                                <button
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="ml-1 text-red-400 hover:text-red-300"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {/* Generate Plan Modal */}
            {
                showGenModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-400" />
                                Generate Meal Plan
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Days to plan</label>
                                    <select
                                        value={genPreferences.days}
                                        onChange={(e) => setGenPreferences(p => ({ ...p, days: parseInt(e.target.value) }))}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                                    >
                                        <option value={3}>3 days</option>
                                        <option value={5}>5 days</option>
                                        <option value={7}>7 days (Full week)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Max cooking time (optional)</label>
                                    <select
                                        value={genPreferences.max_time}
                                        onChange={(e) => setGenPreferences(p => ({ ...p, max_time: e.target.value }))}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                                    >
                                        <option value="">Any time</option>
                                        <option value="30">Under 30 minutes</option>
                                        <option value="60">Under 1 hour</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Dietary preference (optional)</label>
                                    <input
                                        type="text"
                                        value={genPreferences.diet}
                                        onChange={(e) => setGenPreferences(p => ({ ...p, diet: e.target.value }))}
                                        placeholder="e.g., vegetarian, chicken"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowGenModal(false)}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={isGenerating}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
