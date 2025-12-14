import { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Save, AlertTriangle, Check, ChefHat } from 'lucide-react';

interface Household {
  id: number;
  name: string;
  dietary_preferences: string[];
}

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Nut-Free'];

export default function SettingsPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/v1/households/current');
      setHousehold(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!household) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await api.patch(`/api/v1/households/${household.id}`, {
        household: {
          dietary_preferences: household.dietary_preferences
        }
      });
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const togglePreference = (pref: string) => {
    if (!household) return;
    const current = household.dietary_preferences || [];
    const updated = current.includes(pref)
      ? current.filter(p => p !== pref)
      : [...current, pref];

    setHousehold({ ...household, dietary_preferences: updated });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Unable to load settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-7 h-7" />
          Kitchen Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          Dietary Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Select any dietary restrictions for your household. Example: If you select "Vegetarian", we'll warn you if a recipe contains meat.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DIETARY_OPTIONS.map(option => (
            <label key={option} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${household.dietary_preferences?.includes(option)
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-gray-500 bg-transparent'
                }`}>
                {household.dietary_preferences?.includes(option) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={household.dietary_preferences?.includes(option) || false}
                onChange={() => togglePreference(option)}
              />
              <span className="text-white">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Future: Allergens section */}
    </div>
  );
}
