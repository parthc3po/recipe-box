import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, ArrowRight, X, ChefHat, Maximize, Minimize, Timer, TimerOff } from 'lucide-react';

interface RecipeIngredient {
    id: number;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    ingredient: { id: number; name: string };
}

interface Recipe {
    id: number;
    title: string;
    instructions: string | null;
    servings: number | null;
    recipe_ingredients: RecipeIngredient[];
}

interface ActiveTimer {
    id: number;
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
}

// Extract time mentions from text (e.g., "30 minutes", "1 hour", "45 mins")
function extractTimeMentions(text: string): { minutes: number; label: string }[] {
    const timePattern = /(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi;
    const matches: { minutes: number; label: string }[] = [];
    let match;

    while ((match = timePattern.exec(text)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let minutes = value;

        if (unit.startsWith('hour') || unit.startsWith('hr')) {
            minutes = value * 60;
        } else if (unit.startsWith('sec')) {
            minutes = Math.ceil(value / 60);
        }

        matches.push({ minutes, label: `${value} ${match[2]}` });
    }

    return matches;
}

export default function CookingModePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [timers, setTimers] = useState<ActiveTimer[]>([]);
    const [nextTimerId, setNextTimerId] = useState(1);

    const steps = recipe?.instructions?.split('\n').filter((s) => s.trim()) || [];

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await api.get(`/api/v1/recipes/${id}`);
                setRecipe(response.data.data);
            } catch (error) {
                console.error('Failed to fetch recipe:', error);
                navigate('/recipes');
            }
        };
        fetchRecipe();
    }, [id, navigate]);

    // Wake Lock API
    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLock(lock);
                }
            } catch (err) {
                console.log('Wake Lock not supported or failed:', err);
            }
        };
        requestWakeLock();

        return () => {
            wakeLock?.release();
        };
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (timers.length === 0) return;

        const interval = setInterval(() => {
            setTimers(prev => prev.map(t => ({
                ...t,
                remainingSeconds: Math.max(0, t.remainingSeconds - 1)
            })).filter(t => t.remainingSeconds > 0 || t.remainingSeconds === 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [timers.length]);

    // Play sound when timer reaches 0
    useEffect(() => {
        const finishedTimer = timers.find(t => t.remainingSeconds === 0);
        if (finishedTimer) {
            // Play notification sound (browser beep)
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JhoGQmK+xu7bN0NbS19jT1NXS09XT1NXS09bU1NbT1NXS09bU1NXS09XT1NbT1NXS09XT1NbT1NXS09XT1NbT1NXS09XT1NbT1NXS09XT1NbT1NXS09XT');
            audio.play().catch(() => { });

            // Remove finished timer
            setTimers(prev => prev.filter(t => t.id !== finishedTimer.id));
            alert(`Timer complete: ${finishedTimer.label}`);
        }
    }, [timers]);

    const startTimer = (minutes: number, label: string) => {
        const newTimer: ActiveTimer = {
            id: nextTimerId,
            label,
            totalSeconds: minutes * 60,
            remainingSeconds: minutes * 60
        };
        setTimers(prev => [...prev, newTimer]);
        setNextTimerId(prev => prev + 1);
    };

    const removeTimer = (id: number) => {
        setTimers(prev => prev.filter(t => t.id !== id));
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentStepTimeMentions = steps[currentStep] ? extractTimeMentions(steps[currentStep]) : [];

    const prevStep = () => setCurrentStep((s) => Math.max(0, s - 1));
    const nextStep = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));

    if (!recipe) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-black/30 backdrop-blur-lg p-4 flex items-center justify-between">
                <Link
                    to={`/recipes/${id}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                    <X className="w-6 h-6" />
                    <span>Exit Cooking Mode</span>
                </Link>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-6 h-6 text-purple-400" />
                    {recipe.title}
                </h1>
                <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-300 hover:text-white transition"
                >
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Ingredients Sidebar */}
                <div className="lg:w-80 bg-black/20 p-6 border-r border-white/10 overflow-y-auto">
                    <h2 className="text-lg font-semibold text-purple-300 mb-4">Ingredients</h2>
                    <ul className="space-y-2">
                        {recipe.recipe_ingredients.map((ri) => (
                            <li key={ri.id} className="text-gray-300 text-lg">
                                <span className="text-white font-medium">
                                    {ri.quantity} {ri.unit}
                                </span>{' '}
                                <span className="capitalize">{ri.ingredient.name}</span>
                                {ri.notes && <span className="text-gray-500 ml-2">({ri.notes})</span>}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Step Display */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-gray-400 mb-4">
                        Step {currentStep + 1} of {steps.length}
                    </div>
                    <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
                        <p className="text-2xl md:text-4xl text-white leading-relaxed text-center">
                            {steps[currentStep] || 'No instructions available.'}
                        </p>

                        {/* Timer buttons for detected time mentions */}
                        {currentStepTimeMentions.length > 0 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {currentStepTimeMentions.map((tm, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => startTimer(tm.minutes, tm.label)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition"
                                    >
                                        <Timer className="w-5 h-5" />
                                        Start {tm.label} timer
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Timers Display */}
                    {timers.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            {timers.map(timer => (
                                <div key={timer.id} className="flex items-center gap-3 px-4 py-3 bg-orange-500/20 border border-orange-500/50 rounded-xl">
                                    <Timer className="w-5 h-5 text-orange-400 animate-pulse" />
                                    <div>
                                        <div className="text-orange-400 font-medium">{timer.label}</div>
                                        <div className="text-2xl font-mono text-white">{formatTime(timer.remainingSeconds)}</div>
                                    </div>
                                    <button
                                        onClick={() => removeTimer(timer.id)}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-400 transition"
                                    >
                                        <TimerOff className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center gap-6 mt-12">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition text-lg"
                        >
                            <ArrowLeft className="w-6 h-6" />
                            Previous
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={currentStep === steps.length - 1}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition text-lg"
                        >
                            Next
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
