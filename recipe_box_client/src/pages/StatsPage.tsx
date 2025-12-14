import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, Clock, ChefHat, TrendingUp, Repeat } from 'lucide-react';

interface StatsData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_meals: number;
    unique_recipes: number;
    total_cooking_time_minutes: number;
    leftovers_count: number;
  };
  top_recipes: Array<{
    id: number;
    title: string;
    image_url: string | null;
    count: number;
  }>;
  meals_by_type: Record<string, number>;
  meals_by_weekday: Record<string, number>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await api.get('/api/v1/stats', {
        params: { start_date: startDate.toISOString().split('T')[0] }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Unable to load statistics.</p>
      </div>
    );
  }

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const maxWeekdayCount = Math.max(...weekdays.map(d => stats.meals_by_weekday[d] || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Cooking Analytics
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-purple-300 mb-2">
            <ChefHat className="w-5 h-5" />
            <span className="text-sm">Meals Planned</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.summary.total_meals}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-blue-300 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Unique Recipes</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.summary.unique_recipes}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-300 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Time Cooking</span>
          </div>
          <div className="text-3xl font-bold text-white">{formatTime(stats.summary.total_cooking_time_minutes)}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-orange-300 mb-2">
            <Repeat className="w-5 h-5" />
            <span className="text-sm">Leftovers Used</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.summary.leftovers_count}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Recipes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Top Recipes</h3>
          {stats.top_recipes.length === 0 ? (
            <p className="text-gray-400 text-sm">No meals planned yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_recipes.map((recipe, index) => (
                <div key={recipe.id} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-purple-400 w-8">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{recipe.title}</div>
                    <div className="text-sm text-gray-400">{recipe.count} times</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meals by Weekday */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Activity by Day</h3>
          <div className="space-y-2">
            {weekdays.map(day => {
              const count = stats.meals_by_weekday[day] || 0;
              const percent = (count / maxWeekdayCount) * 100;
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-24">{day}</span>
                  <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-white text-sm w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meals by Type */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Meals by Type</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(stats.meals_by_type).map(([type, count]) => (
            <div key={type} className="flex-1 min-w-[120px] bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white mb-1">{count}</div>
              <div className="text-sm text-gray-400 capitalize">{type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
