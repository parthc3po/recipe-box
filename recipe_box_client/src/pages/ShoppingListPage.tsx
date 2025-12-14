import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, RefreshCw, Check, Trash2, ExternalLink } from 'lucide-react';

interface ShoppingItem {
    id: number;
    ingredient_id: number;
    ingredient_name: string;
    ingredient_category: string | null;
    quantity: number | null;
    unit: string | null;
    bought: boolean;
}

export default function ShoppingListPage() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchItems(true);

        const interval = setInterval(() => {
            fetchItems(false);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchItems = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await api.get('/api/v1/shopping_lists');
            setItems(response.data.data);
        } catch (error) {
            console.error('Failed to fetch shopping list:', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await api.post('/api/v1/shopping_lists/generate');
            setItems(response.data.data);
        } catch (error) {
            console.error('Failed to generate list:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggle = async (item: ShoppingItem) => {
        try {
            const response = await api.patch(`/api/v1/shopping_lists/${item.id}`, {
                bought: !item.bought,
            });
            setItems(items.map((i) => (i.id === item.id ? response.data.data : i)));
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/api/v1/shopping_lists/${id}`);
            setItems(items.filter((i) => i.id !== id));
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    // Group by category
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.ingredient_category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-7 h-7" />
                    Shopping List
                </h2>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 transition"
                >
                    <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Generate from Meal Plan
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <ShoppingCart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Shopping list is empty</h3>
                    <p className="text-gray-400 mb-4">
                        Add meals to your planner and click "Generate from Meal Plan"
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedItems)
                        .sort(([a], [b]) => {
                            const order = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Spices', 'Beverages', 'Household', 'Other'];
                            const idxA = order.indexOf(a);
                            const idxB = order.indexOf(b);
                            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                            if (idxA === -1) return 1;
                            if (idxB === -1) return -1;
                            return idxA - idxB;
                        })
                        .map(([category, categoryItems]) => (
                            <div key={category} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                                <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                                    <h3 className="text-white font-semibold capitalize">{category}</h3>
                                </div>
                                <div className="divide-y divide-white/10">
                                    {categoryItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between p-4 transition ${item.bought ? 'bg-green-500/10' : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(item)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${item.bought
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-400 hover:border-green-500'
                                                        }`}
                                                >
                                                    {item.bought && <Check className="w-4 h-4" />}
                                                </button>
                                                <span className={`text-white capitalize ${item.bought ? 'line-through opacity-60' : ''}`}>
                                                    {item.ingredient_name}
                                                </span>
                                                {item.quantity && (
                                                    <span className="text-gray-400 text-sm">
                                                        {item.quantity} {item.unit || ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(item.ingredient_name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition"
                                                    title="Search on Amazon"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            )
            }
        </div >
    );
}
