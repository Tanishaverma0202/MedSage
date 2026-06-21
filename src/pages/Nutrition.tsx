import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Plus, Camera, Droplet, Flame, Target, Loader2, X, Sparkles, Image as ImageIcon, RotateCcw, Edit, AlertCircle, CheckCircle, Eye, ClipboardList, ChefHat, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';
import { MedSageLogo } from '@/components/MedSageLogo';
import { format, addDays, isToday, isBefore, startOfDay, parseISO } from 'date-fns';

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients?: string[];
  recipeSteps?: string[];
  preparationTime: number;
  aiReasoning: string;
}

export function Nutrition() {
  const [waterMl, setWaterMl] = useState(0); // ml
  const dailyGoalMl = 2000;
  
  // Tier 1: Instant Frontend Dataset for 100% Reliable & Fast Results
  const FRONTEND_FOOD_DATASET: Record<string, any> = {
    'poha': { calories: 180, protein: 3, carbs: 30, fats: 5, fiber: 2 },
    'upma': { calories: 200, protein: 5, carbs: 30, fats: 7, fiber: 3 },
    'idli': { calories: 150, protein: 5, carbs: 28, fats: 1, fiber: 2 },
    'dosa': { calories: 180, protein: 4, carbs: 30, fats: 6, fiber: 2 },
    'masala dosa': { calories: 300, protein: 6, carbs: 45, fats: 10, fiber: 3 },
    'uttapam': { calories: 220, protein: 6, carbs: 35, fats: 8, fiber: 3 },
    'paratha': { calories: 250, protein: 5, carbs: 35, fats: 10, fiber: 2 },
    'aloo paratha': { calories: 320, protein: 7, carbs: 45, fats: 12, fiber: 4 },
    'steamed rice': { calories: 130, protein: 2, carbs: 28, fats: 0, fiber: 1 },
    'jeera rice': { calories: 180, protein: 3, carbs: 30, fats: 5, fiber: 1 },
    'veg pulao': { calories: 220, protein: 5, carbs: 35, fats: 7, fiber: 3 },
    'biryani': { calories: 300, protein: 12, carbs: 35, fats: 12, fiber: 2 },
    'chicken biryani': { calories: 350, protein: 18, carbs: 35, fats: 15, fiber: 2 },
    'khichdi': { calories: 180, protein: 6, carbs: 30, fats: 4, fiber: 2 },
    'roti': { calories: 100, protein: 3, carbs: 20, fats: 1, fiber: 2 },
    'chapati': { calories: 100, protein: 3, carbs: 20, fats: 1, fiber: 2 },
    'butter roti': { calories: 150, protein: 4, carbs: 20, fats: 6, fiber: 2 },
    'naan': { calories: 260, protein: 6, carbs: 40, fats: 8, fiber: 2 },
    'paneer tikka': { calories: 250, protein: 15, carbs: 8, fats: 18, fiber: 1 },
    'dal tadka': { calories: 220, protein: 10, carbs: 25, fats: 8, fiber: 5 },
    'dal makhani': { calories: 300, protein: 12, carbs: 28, fats: 15, fiber: 6 },
    'samosa': { calories: 150, protein: 3, carbs: 18, fats: 8, fiber: 1 },
    'omelette': { calories: 150, protein: 12, carbs: 2, fats: 10, fiber: 0 },
    'boiled egg': { calories: 75, protein: 6, carbs: 1, fats: 5, fiber: 0 },
    'curd': { calories: 100, protein: 4, carbs: 5, fats: 4, fiber: 0 },
    'oats': { calories: 150, protein: 5, carbs: 27, fats: 3, fiber: 4 },
    'oatmeal': { calories: 150, protein: 5, carbs: 27, fats: 3, fiber: 4 },
    'salad': { calories: 50, protein: 2, carbs: 8, fats: 1, fiber: 3 },
    'sandwich': { calories: 250, protein: 8, carbs: 30, fats: 10, fiber: 3 },
    'coffee': { calories: 5, protein: 0, carbs: 1, fats: 0, fiber: 0 },
    'tea': { calories: 5, protein: 0, carbs: 1, fats: 0, fiber: 0 },
    'biscuits': { calories: 100, protein: 2, carbs: 15, fats: 4, fiber: 1 },
    'eggs': { calories: 150, protein: 12, carbs: 2, fats: 10, fiber: 0 },
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 4, fiber: 0 },
    'bread': { calories: 80, protein: 3, carbs: 15, fats: 1, fiber: 1 },
    'brown bread': { calories: 70, protein: 4, carbs: 12, fats: 1, fiber: 2 },
    'pasta': { calories: 200, protein: 7, carbs: 40, fats: 1, fiber: 2 },
    'pizza': { calories: 280, protein: 12, carbs: 35, fats: 10, fiber: 2 },
    'burger': { calories: 350, protein: 15, carbs: 40, fats: 15, fiber: 2 },
    'fries': { calories: 300, protein: 3, carbs: 40, fats: 15, fiber: 3 },
    'apple': { calories: 95, protein: 0, carbs: 25, fats: 0, fiber: 4 },
    'apples': { calories: 190, protein: 0, carbs: 50, fats: 0, fiber: 8 },
    'banana': { calories: 105, protein: 1, carbs: 27, fats: 0, fiber: 3 },
    'bananas': { calories: 210, protein: 2, carbs: 54, fats: 0, fiber: 6 },
    'milk': { calories: 150, protein: 8, carbs: 12, fats: 8, fiber: 0 },
    'orange': { calories: 60, protein: 1, carbs: 15, fats: 0, fiber: 3 },
    'papaya': { calories: 120, protein: 1, carbs: 30, fats: 0, fiber: 5 },
    'mango': { calories: 150, protein: 1, carbs: 40, fats: 0, fiber: 3 },
    'watermelon': { calories: 80, protein: 1, carbs: 20, fats: 0, fiber: 1 },
    'almonds': { calories: 160, protein: 6, carbs: 6, fats: 14, fiber: 4 },
    'walnuts': { calories: 185, protein: 4, carbs: 4, fats: 18, fiber: 2 },
    'peanut butter': { calories: 190, protein: 8, carbs: 6, fats: 16, fiber: 2 },
    'whey protein': { calories: 120, protein: 25, carbs: 2, fats: 1, fiber: 0 }
  };

  const [recipeInput, setRecipeInput] = useState('');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MealSuggestion | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealProtein, setNewMealProtein] = useState('');
  const [newMealCarbs, setNewMealCarbs] = useState('');
  const [newMealFats, setNewMealFats] = useState('');
  const [newMealFiber, setNewMealFiber] = useState('');
  const [newMealItems, setNewMealItems] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('Snacks');
  const [isEstimatingCalories, setIsEstimatingCalories] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFetchingMeals, setIsFetchingMeals] = useState(false);
  const [meals, setMeals] = useState<Record<string, any>>({});
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [historyMeals, setHistoryMeals] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ⚡ Quick Log state
  const [quickSearch, setQuickSearch] = useState('');
  const [quickResults, setQuickResults] = useState<Array<{name: string; data: any}>>([]);
  const [quickLogPending, setQuickLogPending] = useState<{name: string; data: any} | null>(null);
  const [isQuickLogging, setIsQuickLogging] = useState(false);
  const [quickLogSuccess, setQuickLogSuccess] = useState('');
  // Modal food autocomplete
  const [modalSuggestions, setModalSuggestions] = useState<Array<{name: string; data: any}>>([]);

  useEffect(() => {
    const fetchMeals = async () => {
      setIsFetchingMeals(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/v1/nutrition/daily?date=${dateStr}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          const newMeals: Record<string, any> = {};
          result.data?.meals?.forEach((m: any) => {
            const type = m.type.toLowerCase() === 'snack' ? 'Snacks' : m.type.charAt(0).toUpperCase() + m.type.slice(1);
            if (!newMeals[type] || newMeals[type].status === 'generated' || (newMeals[type].status === 'scheduled' && m.status === 'logged')) {
              newMeals[type] = {
                id: m._id,
                time: new Date(m.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                items: m.foods.map((f: any) => f.name),
                calories: m.totalCalories || 0,
                protein: m.totalProtein || 0,
                carbs: m.totalCarbs || 0,
                fats: m.totalFats || 0,
                fiber: m.totalFiber || 0,
                status: m.status || 'logged'
              };
            }
          });
          if (result.data?.water?.consumed !== undefined) setWaterMl(result.data.water.consumed);
          setMeals(newMeals);
        }
      } catch (err) {
        console.error("Failed to fetch meals", err);
      } finally {
        setIsFetchingMeals(false);
      }
    };
    fetchMeals();
  }, [selectedDate, refreshTrigger]);

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const response = await fetch('/api/v1/nutrition/history?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setHistoryMeals(result.data?.meals || []);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!recipeInput.trim()) return;
    setIsGenerating(true);
    setSuggestions([]);
    try {
      const response = await fetch('/api/v1/nutrition/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ input: recipeInput })
      });

      if (response.ok) {
        const result = await response.json();
        const fetchedSuggestions = result.data?.suggestions || [];
        setSuggestions(fetchedSuggestions);
        if (fetchedSuggestions.length === 0) {
          alert('AI could not generate suggestions for that input. Try a different search like "healthy breakfast" or "high protein lunch".');
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error?.message || 'Failed to generate suggestions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Network error while generating suggestions. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogSuggestion = (suggestion: MealSuggestion, mealType: string) => {
    // Also save it to backend as logged
    const saveToBackend = async () => {
      try {
        const response = await fetch('/api/v1/nutrition/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            type: mealType.toLowerCase() === 'snacks' ? 'snack' : mealType.toLowerCase(),
            date: selectedDate.toISOString(),
            status: 'logged',
            foods: [{
              name: suggestion.name,
              quantity: 1,
              unit: 'serving',
              calories: suggestion.calories || 0,
              protein: suggestion.protein || 0,
              carbs: suggestion.carbs || 0,
              fats: suggestion.fats || 0
            }]
          })
        });
        if (!response.ok) {
          const err = await response.json();
          console.error("Failed to log suggestion:", err);
          return;
        }
        // Trigger a re-fetch with a fresh reference
        setSelectedDate(new Date(selectedDate.getTime() + 1));
      } catch (e) {
        console.error("Error logging suggestion", e);
      }
    };
    saveToBackend();
  };

  const handleViewRecipe = async (suggestion: MealSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowRecipeModal(true);

    // If we don't have ingredients/steps, fetch them lazily
    if (!suggestion.ingredients || !suggestion.recipeSteps) {
      setIsFetchingDetails(true);
      try {
        const response = await fetch('/api/v1/nutrition/recipe-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            mealName: suggestion.name,
            description: suggestion.description
          })
        });

        if (response.ok) {
          const result = await response.json();
          const details = result.data;

          // Update the suggestion in the list
          setSuggestions(prev => prev.map(s =>
            s.name === suggestion.name
              ? { ...s, ingredients: details.ingredients, recipeSteps: details.recipeSteps }
              : s
          ));

          // Also update selected suggestion for the modal
          setSelectedSuggestion(prev => prev ? {
            ...prev,
            ingredients: details.ingredients,
            recipeSteps: details.recipeSteps
          } : null);
        }
      } catch (error) {
        console.error('Error fetching recipe details:', error);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };

  const handleAddMeal = async () => {
    if (!newMealTitle.trim() || !newMealCalories) return;

    const itemsList = newMealItems.split(',').map(item => item.trim()).filter(Boolean);

    try {
      if (editingMealId) {
        // Update existing meal
        await fetch(`/api/v1/nutrition/meals/${editingMealId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            foods: [
              {
                name: newMealTitle,
                quantity: 1,
                unit: 'serving',
                calories: parseInt(newMealCalories) || 0,
                protein: parseFloat(newMealProtein) || 0,
                carbs: parseFloat(newMealCarbs) || 0,
                fats: parseFloat(newMealFats) || 0,
                fiber: parseFloat(newMealFiber) || 0
              },
              ...itemsList.map(item => ({
                name: item,
                quantity: 1,
                unit: 'serving'
              }))
            ]
          })
        });
      } else {
        // Create new meal
        await fetch('/api/v1/nutrition/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            type: selectedMealType.toLowerCase() === 'snacks' ? 'snack' : selectedMealType.toLowerCase(),
            date: selectedDate.toISOString(),
            status: 'logged',
            foods: [
              {
                name: newMealTitle,
                quantity: 1,
                unit: 'serving',
                calories: parseInt(newMealCalories) || 0,
                protein: parseFloat(newMealProtein) || 0,
                carbs: parseFloat(newMealCarbs) || 0,
                fats: parseFloat(newMealFats) || 0,
                fiber: parseFloat(newMealFiber) || 0
              },
              ...itemsList.map(item => ({
                name: item,
                quantity: 1,
                unit: 'serving'
              }))
            ]
          })
        });

        // Dish Learning Feedback Loop: Let the AI learn from the corrected image scan
        if (scannedImagePreview && newMealTitle) {
          try {
            await fetch('/api/v1/nutrition/learn', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify({
                title: newMealTitle,
                items: newMealItems,
                calories: parseInt(newMealCalories) || 0
              })
            });
          } catch (learnError) {
            console.error("Error teaching AI the customized dish", learnError);
          }
        }
      }

      // Trigger a re-fetch immediately
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error saving meal", e);
    }

    // Reset form and editing state
    setNewMealTitle('');
    setNewMealCalories('');
    setNewMealProtein('');
    setNewMealCarbs('');
    setNewMealFats('');
    setNewMealFiber('');
    setNewMealItems('');
    setIsMealModalOpen(false);
    setScannedImagePreview(null);
    setEditingMealId(null);
  };

  const handleEstimateCalories = async () => {
    if (!newMealTitle.trim() && !newMealItems.trim()) return;
    setIsEstimatingCalories(true);

    const itemsList = newMealItems.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
    const searchTerms = [newMealTitle.toLowerCase().trim(), ...itemsList];

    // 🚀 STEP 1: Quick Local Lookup (Multiple Terms)
    let totalCals = 0, totalP = 0, totalC = 0, totalF = 0, totalFib = 0;
    let matchesFound = 0;

    searchTerms.forEach(term => {
      if (term.length < 2) return;
      const match = Object.keys(FRONTEND_FOOD_DATASET).find(key => 
        term.includes(key) || key.includes(term)
      );
      if (match) {
        console.log(`🔍 Instant Match Found: ${match} for term "${term}"`);
        const data = FRONTEND_FOOD_DATASET[match];
        totalCals += data.calories;
        totalP += data.protein;
        totalC += data.carbs;
        totalF += data.fats;
        totalFib += data.fiber;
        matchesFound++;
      } else {
        console.log(`⚠️ No Instant Match for: "${term}"`);
      }
    });

    if (matchesFound > 0) {
      console.log(`✨ ${matchesFound} Instant Matches Found!`);
      setNewMealCalories(totalCals.toString());
      setNewMealProtein(totalP.toString());
      setNewMealCarbs(totalC.toString());
      setNewMealFats(totalF.toString());
      setNewMealFiber(totalFib.toString());
      setIsEstimatingCalories(false);
      
      // If we found a match for everything, skip AI
      if (matchesFound >= searchTerms.filter(t => t.length > 2).length) {
        return;
      }
    }

    // 🤖 STEP 2: AI Fallback (Network Request)
    try {
      const response = await fetch('/api/v1/nutrition/estimate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ mealName: newMealTitle, items: itemsList })
      });
      if (response.ok) {
        const result = await response.json();
        // ONLY update if AI actually returned a valid estimation (non-zero)
        if (result.data?.calories && result.data.calories > 0) {
          setNewMealCalories(result.data.calories.toString());
          setNewMealProtein(result.data.protein?.toString() || '0');
          setNewMealCarbs(result.data.carbs?.toString() || '0');
          setNewMealFats(result.data.fats?.toString() || '0');
          setNewMealFiber(result.data.fiber?.toString() || '0');
        } else {
          // If match found locally, we keep it, otherwise alert
          if (matchesFound === 0) {
            alert("AI service is currently busy. Please enter calories manually.");
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (matchesFound === 0) {
          alert(errorData.message || "Failed to connect to estimation service. Please check your network.");
        }
      }
    } catch (error) {
      console.error("Error estimating calories:", error);
      if (matchesFound === 0) {
        alert("An error occurred while connecting to the AI service. Please try again or enter macros manually.");
      }
    } finally {
      setIsEstimatingCalories(false);
    }
  };

  // ⚡ Quick search — filters FRONTEND_FOOD_DATASET instantly, no API call
  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    setQuickLogPending(null);
    if (value.length < 2) { setQuickResults([]); return; }
    const lower = value.toLowerCase();
    const results = Object.entries(FRONTEND_FOOD_DATASET)
      .filter(([key]) => key.includes(lower) || lower.includes(key))
      .slice(0, 8)
      .map(([name, data]) => ({ name, data }));
    setQuickResults(results);
  };

  // ⚡ Quick log — saves directly to backend from dataset data, no modal
  const handleQuickLog = async (foodName: string, foodData: any, mealType: string) => {
    setIsQuickLogging(true);
    setQuickLogPending(null);
    setQuickSearch('');
    setQuickResults([]);
    try {
      await fetch('/api/v1/nutrition/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({
          type: mealType.toLowerCase() === 'snacks' ? 'snack' : mealType.toLowerCase(),
          date: selectedDate.toISOString(),
          status: 'logged',
          foods: [{ name: foodName, quantity: 1, unit: 'serving', calories: foodData.calories || 0, protein: foodData.protein || 0, carbs: foodData.carbs || 0, fats: foodData.fats || 0, fiber: foodData.fiber || 0 }]
        })
      });
      setQuickLogSuccess(`${foodName} → ${mealType}!`);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setQuickLogSuccess(''), 2500);
    } catch(e) { console.error('Quick log error', e); }
    finally { setIsQuickLogging(false); }
  };

  const handleLogExistingMeal = async (mealId: string, mealType: string, isGenerated: boolean, generatedData: any) => {
    if (isGenerated) {
      // Since it's generated, we create a new logged meal
      try {
        const response = await fetch('/api/v1/nutrition/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            type: mealType.toLowerCase() === 'snacks' ? 'snack' : mealType.toLowerCase(),
            date: selectedDate.toISOString(),
            status: 'logged',
            foods: generatedData.items.map((i: string) => ({
              name: i,
              quantity: 1,
              unit: 'serving',
              // Pass through the original estimated macros from the suggestion
              calories: generatedData.calories || 0,
              protein: generatedData.protein || 0,
              carbs: generatedData.carbs || 0,
              fats: generatedData.fats || 0
            }))
          })
        });

        if (!response.ok) {
          const err = await response.json();
          console.error("Failed to log generated meal:", err);
          return;
        }

        setSelectedDate(new Date(selectedDate.getTime() + 1));
      } catch (e) {
        console.error("Error logging generated meal", e);
      }
    } else {
      // Just update the status to 'logged'
      try {
        const response = await fetch(`/api/v1/nutrition/meals/${mealId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ status: 'logged' })
        });

        if (!response.ok) {
          const err = await response.json();
          console.error("Failed to update meal status:", err);
          return;
        }

        setSelectedDate(new Date(selectedDate.getTime() + 1));
      } catch (e) {
        console.error("Error updating meal status", e);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setScanError(null);
    setScanSuccess(false);
    setScannedImagePreview(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setScanError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScanError('Image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileData = reader.result as string;
      const base64String = fileData.split(',')[1];

      // Set image preview
      setScannedImagePreview(fileData);

      setIsScanning(true);
      try {
        const response = await fetch('/api/v1/nutrition/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            fileData: base64String,
            mimeType: file.type
          })
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data;
          setNewMealTitle(data?.title || '');
          setNewMealItems(data?.items || '');
          setNewMealCalories(data?.calories?.toString() || '');
          setScanSuccess(true);

          // Clear success message after 3 seconds
          setTimeout(() => setScanSuccess(false), 3000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setScanError(errorData.error?.message || 'Failed to analyze image. Please try again.');
        }
      } catch (error) {
        console.error("Error scanning image", error);
        setScanError('Network error. Please check your connection and try again.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => {
      setScanError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const addWater = async (amount: number) => {
    // Optimistic update
    setWaterMl(prev => prev + amount);

    try {
      const response = await fetch('/api/v1/nutrition/water', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          amount,
          action: 'add',
          date: format(selectedDate, 'yyyy-MM-dd')
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to sync water intake:", err);
      } else {
        // Force refresh to pull from DB to confirm persistence
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error updating water intake", error);
    }
  };

  const resetWater = async () => {
    setWaterMl(0);
    try {
      const response = await fetch('/api/v1/nutrition/water', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          amount: 0,
          action: 'set',
          date: format(selectedDate, 'yyyy-MM-dd')
        })
      });
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error resetting water intake", error);
    }
  };

  const handleEditMeal = (mealType: string) => {
    setSelectedMealType(mealType);
    const meal = meals[mealType];
    if (meal) {
      setNewMealTitle(meal.items?.join(', ') || '');
      setNewMealItems('');
      setNewMealCalories(meal.calories?.toString() || '');
      setNewMealProtein(meal.protein?.toString() || '');
      setNewMealCarbs(meal.carbs?.toString() || '');
      setNewMealFats(meal.fats?.toString() || '');
      setNewMealFiber(meal.fiber?.toString() || '');
      setEditingMealId(meal.id || null);
    }
    setIsMealModalOpen(true);
  };

  const handleAddItems = (mealType: string) => {
    setSelectedMealType(mealType);
    setNewMealTitle('');
    setNewMealItems('');
    setNewMealCalories('');
    setNewMealProtein('');
    setNewMealCarbs('');
    setNewMealFats('');
    setNewMealFiber('');
    setEditingMealId(null);
    setIsMealModalOpen(true);
  };

  const handleUploadImage = async (file: File, mealType: string) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileData = reader.result as string;
      const base64String = fileData.split(',')[1];

      setIsScanning(true);
      try {
        const response = await fetch('/api/v1/nutrition/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            fileData: base64String,
            mimeType: file.type
          })
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data;
          setSelectedMealType(mealType);
          setNewMealTitle(data?.title || '');
          setNewMealItems(data?.items || '');
          setNewMealCalories(data?.calories?.toString() || '');
          setNewMealProtein(data?.protein?.toString() || '');
          setNewMealCarbs(data?.carbs?.toString() || '');
          setNewMealFats(data?.fats?.toString() || '');
          setNewMealFiber(data?.fiber?.toString() || '');
          setIsMealModalOpen(true);
        }
      } catch (error) {
        console.error("Error scanning image", error);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteSavedPlan = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/nutrition/meals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to delete meal", err);
    }
  };

  const totalCalories = Math.round(Object.values(meals).filter((meal: any) => meal?.status === 'logged').reduce((sum, meal: any) => sum + (meal?.calories || 0), 0) * 100) / 100;
  const totalProtein = Math.round(Object.values(meals).filter((meal: any) => meal?.status === 'logged').reduce((sum, meal: any) => sum + (meal?.protein || 0), 0) * 100) / 100;
  const totalCarbs = Math.round(Object.values(meals).filter((meal: any) => meal?.status === 'logged').reduce((sum, meal: any) => sum + (meal?.carbs || 0), 0) * 100) / 100;
  const totalFats = Math.round(Object.values(meals).filter((meal: any) => meal?.status === 'logged').reduce((sum, meal: any) => sum + (meal?.fats || 0), 0) * 100) / 100;
  const totalFiber = Math.round(Object.values(meals).filter((meal: any) => meal?.status === 'logged').reduce((sum, meal: any) => sum + (meal?.fiber || 0), 0) * 100) / 100;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 tracking-tight">Nutrition</h1>
        <p className="text-slate-500 mt-2 font-medium">Track your meals and get AI-powered dietary insights.</p>
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => setShowHistory(false)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              !showHistory ? "bg-emerald-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-emerald-50"
            )}
          >
            Today's Log
          </button>
          <button 
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              showHistory ? "bg-emerald-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-emerald-50"
            )}
          >
            Meal History
          </button>
        </div>
      </header>

      {/* ⚡ QUICK LOG BAR */}
      {!showHistory && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-xl rounded-[2rem] p-4 sm:p-5 border border-emerald-100/60 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="p-1.5 bg-emerald-500 rounded-lg flex-shrink-0">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Quick Log</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">No modal needed</span>
            {quickLogSuccess && (
              <span className="ml-auto text-[11px] text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5" /> {quickLogSuccess}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={quickSearch}
              onChange={e => handleQuickSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setQuickSearch(''); setQuickResults([]); setQuickLogPending(null); } }}
              placeholder="Search food instantly (e.g. oats, roti, banana, eggs)…"
              className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-10 shadow-sm placeholder:text-slate-400"
            />
            {quickSearch && (
              <button
                onClick={() => { setQuickSearch(''); setQuickResults([]); setQuickLogPending(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search results as chips */}
          {quickResults.length > 0 && !quickLogPending && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickResults.map(({ name, data }) => (
                <button
                  key={name}
                  onClick={() => setQuickLogPending({ name, data })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm capitalize"
                >
                  {name}
                  <span className="text-emerald-600 font-black">{data.calories} kcal</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected food → pick meal type to log */}
          {quickLogPending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-3 sm:p-4 bg-white rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 capitalize">{quickLogPending.name}</p>
                <div className="flex gap-2 mt-1 text-[11px] font-bold flex-wrap">
                  <span className="text-orange-500">{quickLogPending.data.calories} kcal</span>
                  <span className="text-blue-500">P: {quickLogPending.data.protein}g</span>
                  <span className="text-purple-500">C: {quickLogPending.data.carbs}g</span>
                  <span className="text-amber-500">F: {quickLogPending.data.fats}g</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log to →</span>
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleQuickLog(quickLogPending.name, quickLogPending.data, type)}
                    disabled={isQuickLogging}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-sm"
                  >
                    {isQuickLogging ? '…' : type.slice(0, 3)}
                  </button>
                ))}
                <button
                  onClick={() => { setQuickLogPending(null); setQuickSearch(''); setQuickResults([]); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Popular foods strip */}
          {!quickSearch && !quickLogPending && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['oats','banana','roti','dal tadka','curd','boiled egg','milk','apple','chicken breast','poha','idli','samosa'].map(food =>
                FRONTEND_FOOD_DATASET[food] ? (
                  <button
                    key={food}
                    onClick={() => setQuickLogPending({ name: food, data: FRONTEND_FOOD_DATASET[food] })}
                    className="px-2.5 py-1 bg-white/80 border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all capitalize"
                  >
                    {food}
                  </button>
                ) : null
              )}
            </div>
          )}
        </motion.div>
      )}

      {showHistory ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isFetchingHistory ? (
              [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)
            ) : historyMeals.length > 0 ? (
              historyMeals.map((meal) => (
                <motion.div
                  key={meal._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-2 inline-block">
                        {meal.type}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800">{format(new Date(meal.date), 'PPP')}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-800">{Math.round(meal.totalCalories)}</span>
                      <span className="text-xs font-bold text-slate-400 block uppercase">kcal</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {meal.foods.map((food: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium">{food.name}</span>
                        <span className="text-slate-400">{food.quantity} {food.unit}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No previous logs found.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: AI Suggestions & Recipe Gen */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-emerald-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col min-h-[600px] sticky top-8"
          >
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="p-2.5 bg-white rounded-xl text-emerald-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">AI Nutrition Assistant</h2>
            </div>
            <p className="text-slate-600 text-sm mb-6 font-medium shrink-0">Get personalized meal suggestions or generate recipes from ingredients you have.</p>

            <div className="flex gap-2 mb-6 shrink-0">
              <input
                type="text"
                placeholder="e.g., Healthy lunch with chicken..."
                value={recipeInput}
                onChange={(e) => setRecipeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
                className="flex-1 bg-white border border-emerald-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all shadow-sm"
              />
              <button
                onClick={handleGenerateRecipe}
                disabled={isGenerating || !recipeInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {isGenerating ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/50 border border-emerald-100/50 rounded-2xl p-4 animate-pulse">
                      <div className="h-4 bg-emerald-100 rounded-full w-3/4 mb-3" />
                      <div className="h-3 bg-slate-100 rounded-full w-full mb-2" />
                      <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-4" />
                      <div className="flex gap-4">
                        <div className="h-4 bg-emerald-50 rounded-md w-16" />
                        <div className="h-4 bg-slate-50 rounded-md w-16" />
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest text-center animate-pulse mt-4">Analyzing & crafting your meal plan...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((suggestion, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-2xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm group relative"
                    >
                      <button
                        onClick={() => handleViewRecipe(suggestion)}
                        className="absolute top-4 right-4 p-2 bg-emerald-50 text-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100 shadow-sm"
                        title="View Recipe"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <h3 className="font-bold text-slate-800 pr-8">{suggestion?.name || 'Healthy Meal Option'}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{suggestion?.description || 'Personalized suggestion for your goals.'}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <Flame className="w-3 h-3" />
                          {suggestion?.calories || 0} kcal
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" />
                          {suggestion?.preparationTime || 15}m
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex gap-1">
                          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((m) => (
                            <button
                              key={m}
                              onClick={() => handleLogSuggestion(suggestion, m)}
                              className="text-[10px] font-bold px-2 py-1 bg-slate-50 hover:bg-emerald-500 hover:text-white text-slate-400 rounded-md transition-all uppercase tracking-tighter"
                            >
                              {m[0]}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] items-center flex gap-1 font-bold text-slate-400 uppercase tracking-widest leading-none">
                          <ClipboardList className="w-3 h-3" />
                          Log To
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={handleGenerateRecipe}
                    className="w-full mt-4 py-3 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-600 text-xs font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Regenerate Meals
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 overflow-hidden border border-emerald-50">
                    <MedSageLogo variant="icon" className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-slate-800">Your AI Dietitian Ready</h3>
                  <p className="text-xs text-slate-500 mt-2">Enter your cravings or available ingredients to get personalized meal plans from MedSage.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Middle Column: Meal Planner */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          >
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Meals Planner</h2>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> {/* Or Left Arrow */}
                </button>
                <div className="px-3 text-sm font-bold text-slate-700 flex flex-col items-center leading-tight">
                  <span>{isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}</span>
                </div>
                <button
                  onClick={() => {
                    const next = addDays(selectedDate, 1);
                    if (isBefore(next, addDays(new Date(), 15))) setSelectedDate(next);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {/* Or Right Arrow */}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((type) => {
                const meal = meals[type];
                return (
                  <MealCard
                    key={type}
                    title={type}
                    time={meal?.time || '--:--'}
                    items={meal?.items || []}
                    calories={Math.round((meal?.calories || 0) * 100) / 100}
                    protein={Math.round((meal?.protein || 0) * 100) / 100}
                    carbs={Math.round((meal?.carbs || 0) * 100) / 100}
                    fats={Math.round((meal?.fats || 0) * 100) / 100}
                    status={meal?.status}
                    mealId={meal?.id}
                    mealType={type}
                    onEditMeal={handleEditMeal}
                    onDeleteMeal={deleteSavedPlan}
                    onAddItems={handleAddItems}
                    onUploadImage={handleUploadImage}
                    onLogMeal={() => handleLogExistingMeal(meal?.id, type, meal?.status === 'generated', meal)}
                  />
                );
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Nutrients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
            >
              {/* Header */}
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                Daily Nutrients
              </h2>

              {/* Calorie Donut + Summary */}
              <div className="flex items-center gap-5 mb-6 p-4 bg-gradient-to-r from-orange-50/60 to-amber-50/60 rounded-2xl border border-orange-100/60">
                {/* Mini donut ring */}
                <div className="relative shrink-0 w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r="32" fill="none"
                      stroke={totalCalories >= 2000 ? '#ef4444' : totalCalories >= 1500 ? '#f59e0b' : '#10b981'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(1, totalCalories / 2000))}`}
                      style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-sm font-black leading-none ${totalCalories >= 2000 ? 'text-red-500' : 'text-slate-800'}`}>
                      {Math.round(totalCalories)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">kcal</span>
                  </div>
                </div>

                {/* Calorie text breakdown */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 mb-1">Daily Calorie Goal</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {Math.round(totalCalories)}
                    <span className="text-sm font-medium text-slate-400 ml-1">/ 2000 kcal</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (totalCalories / 2000) * 100)}%`,
                        backgroundColor: totalCalories >= 2000 ? '#ef4444' : totalCalories >= 1500 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {totalCalories >= 2000 ? '⚠ Limit reached' : `${Math.round(2000 - totalCalories)} kcal remaining`}
                  </p>
                </div>
              </div>

              {/* Macro pills quick summary */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { label: 'Protein', value: Math.round(totalProtein), unit: 'g', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                  { label: 'Carbs', value: Math.round(totalCarbs), unit: 'g', color: 'bg-purple-50 border-purple-100 text-purple-700' },
                  { label: 'Fats', value: Math.round(totalFats), unit: 'g', color: 'bg-amber-50 border-amber-100 text-amber-700' },
                  { label: 'Fiber', value: Math.round(totalFiber), unit: 'g', color: 'bg-green-50 border-green-100 text-green-700' },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl border p-2 text-center ${m.color}`}>
                    <p className="text-xs font-black">{m.value}<span className="text-[9px] font-bold opacity-70">{m.unit}</span></p>
                    <p className="text-[9px] font-bold uppercase tracking-tighter opacity-60">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Macro progress bars */}
              <div className="space-y-4">
                <MacroBar label="Protein" current={Math.round(totalProtein * 10) / 10} target={80} color="bg-blue-500" accentColor="#3b82f6" />
                <MacroBar label="Carbs" current={Math.round(totalCarbs * 10) / 10} target={200} color="bg-purple-500" accentColor="#a855f7" />
                <MacroBar label="Fats" current={Math.round(totalFats * 10) / 10} target={70} color="bg-amber-500" accentColor="#f59e0b" />
                <MacroBar label="Fiber" current={Math.round(totalFiber * 10) / 10} target={30} color="bg-emerald-500" accentColor="#10b981" />
              </div>
            </motion.div>

            {/* Water Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-b from-blue-50/80 to-white/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-blue-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center relative overflow-hidden group h-full max-h-[800px]"
            >
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400/30 to-blue-300/10 transition-all duration-1000 ease-in-out" style={{ height: `${(waterMl / dailyGoalMl) * 100}%` }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center w-full">
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 tracking-tight">
                  <Droplet className="w-5 h-5 text-blue-500" />
                  Hydration
                </h2>
                <p className="text-5xl font-extrabold text-blue-600 mb-1 drop-shadow-sm">
                  {(waterMl / 1000).toFixed(1)}<span className="text-2xl text-blue-400 font-bold">L</span>
                </p>
                <p className="text-[11px] font-bold text-blue-400/80 uppercase tracking-widest mb-8">Daily Goal: {(dailyGoalMl / 1000).toFixed(1)}L</p>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => addWater(250)} className="py-2 px-3 bg-white border border-blue-100 rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors flex flex-col items-center gap-1 shadow-sm">
                    <Droplet className="w-4 h-4" />
                    + Glass (250ml)
                  </button>
                  <button onClick={() => addWater(500)} className="py-2 px-3 bg-white border border-blue-100 rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors flex flex-col items-center gap-1 shadow-sm">
                    <Droplet className="w-4 h-4" />
                    + Bottle (500ml)
                  </button>
                  <button onClick={() => addWater(1000)} className="py-2 px-3 bg-white border border-blue-100 rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors flex flex-col items-center gap-1 shadow-sm">
                    <Droplet className="w-4 h-4" />
                    + 1L
                  </button>
                  <button onClick={resetWater} className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors flex flex-col items-center gap-1 shadow-sm">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )}

      {/* Add Meal Modal */}
      <AnimatePresence>
        {isMealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {meals[selectedMealType] ? 'Edit Meal' : 'Add Meal'} - {selectedMealType}
                </h2>
                <button
                  onClick={() => setIsMealModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Preview */}
                {scannedImagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-100">
                    <img
                      src={scannedImagePreview}
                      alt="Scanned food"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      onClick={() => setScannedImagePreview(null)}
                      className="absolute top-2 right-2 p-1 bg-slate-800/70 hover:bg-slate-800 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {scanError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-rose-700">{scanError}</p>
                      <button
                        onClick={() => setScanError(null)}
                        className="text-xs text-rose-500 hover:text-rose-700 mt-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {scanSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Image analyzed successfully!</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Detected: {newMealTitle || 'Unknown dish'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Meal Details</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {isScanning ? 'Scanning...' : 'Scan Photo'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Meal Type</label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Main Dish</label>
                  <input
                    type="text"
                    value={newMealTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewMealTitle(v);
                      if (v.length >= 2) {
                        const lower = v.toLowerCase();
                        const matches = Object.entries(FRONTEND_FOOD_DATASET)
                          .filter(([key]) => key.includes(lower) || lower.includes(key))
                          .slice(0, 5).map(([name, data]) => ({ name, data }));
                        setModalSuggestions(matches);
                      } else setModalSuggestions([]);
                    }}
                    onBlur={() => setTimeout(() => setModalSuggestions([]), 150)}
                    placeholder="e.g., Grilled Chicken Salad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  {/* Autocomplete dropdown */}
                  {modalSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-emerald-100 rounded-xl shadow-xl z-50 overflow-hidden">
                      {modalSuggestions.map(({ name, data }) => (
                        <button
                          key={name}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setNewMealTitle(name);
                            setNewMealCalories(data.calories.toString());
                            setNewMealProtein(data.protein.toString());
                            setNewMealCarbs(data.carbs.toString());
                            setNewMealFats(data.fats.toString());
                            setNewMealFiber((data.fiber || 0).toString());
                            setModalSuggestions([]);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50 last:border-0"
                        >
                          <span className="text-sm font-bold text-slate-800 capitalize">{name}</span>
                          <div className="flex gap-2 text-[10px] font-bold">
                            <span className="text-orange-500">{data.calories} kcal</span>
                            <span className="text-blue-500">P{data.protein}g</span>
                            <span className="text-purple-500">C{data.carbs}g</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Additional Items (comma separated)</label>
                  <input
                    type="text"
                    value={newMealItems}
                    onChange={(e) => setNewMealItems(e.target.value)}
                    placeholder="e.g., Olive Oil Dressing, Apple"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      Estimated Calories
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Instant AI v2</span>
                    </label>
                    <button
                      onClick={handleEstimateCalories}
                      disabled={isEstimatingCalories || (!newMealTitle.trim() && !newMealItems.trim())}
                      className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:text-orange-700 disabled:opacity-50 transition-colors bg-white px-2 py-1 rounded-lg border border-orange-100 shadow-sm"
                      title="AI will estimate calories based on main dish and items"
                    >
                      {isEstimatingCalories ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      {isEstimatingCalories ? 'Estimating...' : 'Auto-Estimate (Fast)'}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={newMealCalories}
                    onChange={(e) => setNewMealCalories(e.target.value)}
                    placeholder="e.g., 450"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  {/* Status Indicator */}
                  <div className="mt-2 ml-1 min-h-[16px]">
                    {isEstimatingCalories && (
                      <p className="text-[10px] text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing with MedSage AI...
                      </p>
                    )}
                    {!isEstimatingCalories && newMealCalories && newMealCalories !== '0' && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Estimation complete
                      </p>
                    )}
                  </div>
                </div>

                {/* Macro Breakdown Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Protein (g)</label>
                    <input
                      type="number"
                      value={newMealProtein}
                      onChange={(e) => setNewMealProtein(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={newMealCarbs}
                      onChange={(e) => setNewMealCarbs(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fats (g)</label>
                    <input
                      type="number"
                      value={newMealFats}
                      onChange={(e) => setNewMealFats(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fiber (g)</label>
                    <input
                      type="number"
                      value={newMealFiber}
                      onChange={(e) => setNewMealFiber(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsMealModalOpen(false);
                    setEditingMealId(null);
                  }}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeal}
                  disabled={!newMealTitle.trim() || !newMealCalories}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  {editingMealId ? 'Update Meal' : 'Save Meal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipe Details Modal */}
      <AnimatePresence>
        {showRecipeModal && selectedSuggestion && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
            >
              <button
                onClick={() => setShowRecipeModal(false)}
                className="absolute top-6 right-6 p-2.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto pr-4 custom-scrollbar flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest">AI Recommendation</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4">{selectedSuggestion.name}</h2>

                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Calories</p>
                    <p className="text-lg font-bold text-slate-800">{selectedSuggestion.calories}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protein</p>
                    <p className="text-lg font-bold text-slate-800">{selectedSuggestion.protein}g</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carbs</p>
                    <p className="text-lg font-bold text-slate-800">{selectedSuggestion.carbs}g</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-lg font-bold text-slate-800">{selectedSuggestion.preparationTime}m</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {isFetchingDetails ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                      <p className="text-sm font-medium animate-pulse">Generating your custom recipe steps...</p>
                    </div>
                  ) : (
                    <>
                      {(selectedSuggestion.ingredients?.length || 0) > 0 ? (
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            Ingredients
                          </h4>
                          <ul className="grid grid-cols-2 gap-3">
                            {selectedSuggestion.ingredients?.map((ing, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                {ing}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                          <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">Ingredients list unavailable</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Our AI is still learning this recipe</p>
                          <button
                            onClick={() => handleViewRecipe(selectedSuggestion)}
                            className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry Generation
                          </button>
                        </div>
                      )}

                      {(selectedSuggestion.recipeSteps?.length || 0) > 0 ? (
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            Preparation Steps
                          </h4>
                          <div className="space-y-4">
                            {selectedSuggestion.recipeSteps?.map((step, i) => (
                              <div key={i} className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                                <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                          <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">Cooking steps unavailable</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Try refreshing or exploring other options</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Nutrition Insight
                    </p>
                    <p className="text-sm text-emerald-700/80 font-medium leading-relaxed italic">
                      "{selectedSuggestion.aiReasoning}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MealCard({ title, time, items, calories, protein, carbs, fats, fiber, status, mealId, mealType, onEditMeal, onDeleteMeal, onAddItems, onUploadImage, onLogMeal }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUploadImage) {
      onUploadImage(file, mealType);
    }
  };

  const handleEdit = () => {
    if (onEditMeal) {
      onEditMeal(mealType);
    }
  };

  const handleAdd = () => {
    if (onAddItems) {
      onAddItems(mealType);
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`p-5 rounded-2xl border bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 relative overflow-hidden ${(status === 'generated' || status === 'scheduled') ? 'opacity-90' : ''}`}>
      {status === 'scheduled' && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase shadow-sm">Planned</div>
      )}
      {status === 'generated' && (
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase shadow-sm flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> AI Pick
        </div>
      )}
      <div className="flex justify-between items-start mb-4 mt-2">
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{time}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg uppercase tracking-wider tooltip" title={status === 'generated' ? "AI estimated calories" : ""}>
            {calories} kcal
          </span>
          <div className="flex flex-wrap gap-2 justify-end">
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">P: {protein}g</span>
            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-tighter">C: {carbs}g</span>
            <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 uppercase tracking-tighter">F: {fats}g</span>
          </div>
          <div className="flex gap-1.5 ml-2">
            <button
              onClick={handleEdit}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-all duration-300 hover:shadow-sm"
              title="Edit meal"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteMeal && mealId && onDeleteMeal(mealId)}
              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-all duration-300 hover:shadow-sm"
              title="Delete meal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleAdd}
              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-300 shadow-sm"
              title="Add items/image"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-5">
        {items && items.length > 0 ? (
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Dish</h4>
            <div className="flex items-center gap-2 text-sm text-slate-700 font-bold bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl shadow-sm">
              <div className={`w-2 h-2 rounded-full ${status === 'logged' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {items[0]}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-400 font-medium bg-slate-50 px-3 py-6 rounded-xl border border-dashed border-slate-200">
            <ChefHat className="w-6 h-6 text-slate-300" />
            <span>Not logged yet</span>
          </div>
        )}

        {items?.length > 1 && (
          <div className="pl-3 border-l-2 border-slate-100 mt-3 pt-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Items</h4>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(1).map((item: string, i: number) => (
                <span key={i} className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {(status === 'generated' || status === 'scheduled') && (
        <button
          onClick={onLogMeal}
          className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" /> Log This Meal
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
    </div>
  );
}

function MacroBar({ label, current, target, color, accentColor }: any) {
  const percentage = Math.min(100, (current / target) * 100);
  const isOver = current > target;
  const statusColor = isOver ? 'text-red-500' : current >= target * 0.8 ? 'text-amber-600' : 'text-slate-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-bold text-slate-700">{label}</span>
        <span className={cn('font-semibold', statusColor)}>
          {current}g
          <span className="text-slate-400 font-normal"> / {target}g</span>
          {isOver && <span className="ml-1 text-red-400 text-[10px]">▲ over</span>}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={cn('h-full rounded-full', isOver ? 'bg-red-400' : color)}
          style={isOver ? {} : { boxShadow: `0 0 6px ${accentColor ?? ''}44` }}
        />
      </div>
      {/* Track marks at 25% 50% 75% */}
      <div className="relative h-1 mt-0.5">
        {[25, 50, 75].map(p => (
          <div
            key={p}
            className="absolute top-0 w-px h-1 bg-slate-200"
            style={{ left: `${p}%` }}
          />
        ))}
      </div>
    </div>
  );
}
