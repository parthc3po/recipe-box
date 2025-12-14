import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Package, AlertTriangle } from 'lucide-react';

interface PantryItem {
    id: number;
    ingredient_id: number;
    ingredient_name: string;
    quantity: number | null;
    unit: string | null;
    expiration_date: string | null;
}

// Helper to check if item is expired or expiring soon
function getExpirationStatus(dateStr: string | null): 'expired' | 'expiring_soon' | 'ok' | null {
    if (!dateStr) return null;
    const expDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (expDate < today) return 'expired';
    if (expDate <= threeDaysFromNow) return 'expiring_soon';
    return 'ok';
}

export default function PantryPage() {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newIngredient, setNewIngredient] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newExpDate, setNewExpDate] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchPantryItems();
    }, []);

    const fetchPantryItems = async () => {
        try {
            const response = await api.get('/api/v1/pantry_items');
            setItems(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pantry items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIngredient.trim()) return;

        setIsAdding(true);
        try {
            await api.post('/api/v1/pantry_items', {
                ingredient_name: newIngredient,
                quantity: newQuantity ? parseFloat(newQuantity) : null,
                unit: newUnit || null,
                expiration_date: newExpDate || null,
            });
            setNewIngredient('');
            setNewQuantity('');
            setNewUnit('');
            setNewExpDate('');
            fetchPantryItems();
        } catch (error) {
            console.error('Failed to add item:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/api/v1/pantry_items/${id}`);
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete item:', error);
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Package className="w-7 h-7" />
                    My Pantry
                </h2>
            </div>

            <form onSubmit={handleAdd} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        placeholder="Ingredient name"
                        className="flex-1 min-w-[200px] px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Qty"
                        className="w-24 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="Unit"
                        className="w-24 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="date"
                        value={newExpDate}
                        onChange={(e) => setNewExpDate(e.target.value)}
                        placeholder="Expires"
                        className="w-36 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={isAdding || !newIngredient.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Plus className="w-5 h-5" />
                        Add
                    </button>
                </div>
            </form>

            {items.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Your pantry is empty</h3>
                    <p className="text-gray-400">Add ingredients you have at home!</p>
                </div>
            ) : (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                    <div className="divide-y divide-white/10">
                        {items.map((item) => {
                            const expStatus = getExpirationStatus(item.expiration_date);
                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-4 hover:bg-white/5 transition ${expStatus === 'expired' ? 'bg-red-500/10' :
                                            expStatus === 'expiring_soon' ? 'bg-yellow-500/10' : ''
                                        }`}
                                >
                                    <div className="flex-1">
                                        <span className="text-white font-medium capitalize">{item.ingredient_name}</span>
                                        {item.quantity && (
                                            <span className="text-gray-400 ml-2">
                                                {item.quantity} {item.unit || ''}
                                            </span>
                                        )}
                                        {item.expiration_date && (
                                            <span className={`ml-3 text-sm ${expStatus === 'expired' ? 'text-red-400' :
                                                    expStatus === 'expiring_soon' ? 'text-yellow-400' : 'text-gray-500'
                                                }`}>
                                                {expStatus === 'expired' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                                                {expStatus === 'expiring_soon' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                                                Exp: {new Date(item.expiration_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
