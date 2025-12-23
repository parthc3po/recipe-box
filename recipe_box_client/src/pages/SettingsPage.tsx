import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Settings, Save, AlertTriangle, Check, ChefHat, Users, Copy, RefreshCw } from 'lucide-react';

interface Household {
  id: number;
  name: string;
  invite_code: string;
  dietary_preferences: string[];
}

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Nut-Free'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isHeadChef = user?.household?.role === 'head_chef';

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

  const copyInviteCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regenerateInviteCode = async () => {
    if (!household) return;
    try {
      const response = await api.post(`/api/v1/households/${household.id}/regenerate_invite_code`);
      setHousehold({ ...household, invite_code: response.data.invite_code });
      setMessage({ type: 'success', text: 'Invite code regenerated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      setMessage({ type: 'error', text: 'Failed to regenerate invite code.' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 sm:w-7 sm:h-7" />
          Kitchen Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition text-sm sm:text-base"
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

      {/* Invite Code Section - Only for Head Chef */}
      {isHeadChef && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-lg rounded-xl border border-yellow-500/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-400" />
            Invite Members
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Share this code with family members so they can join your kitchen.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex-1 bg-white/10 rounded-lg px-4 py-3 font-mono text-lg sm:text-xl tracking-widest text-white text-center border border-white/20">
              {household.invite_code}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyInviteCode}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={regenerateInviteCode}
                className="px-4 py-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition"
                title="Generate new code"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dietary Preferences */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          Dietary Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Select any dietary restrictions for your household. We'll warn you if a recipe conflicts.
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
    </div>
  );
}
