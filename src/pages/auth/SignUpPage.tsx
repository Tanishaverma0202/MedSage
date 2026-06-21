import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, HelpCircle, User, Target, Apple, Dumbbell, Brain, Settings, Sparkles } from 'lucide-react';
import { MedSageLogo } from '../../components/MedSageLogo';
import { calculateHealthScore, HealthProfileData } from '../../utils/healthScoreCalculator';
import { API_ENDPOINTS, apiCall } from '../../api';
import { useAppContext } from '../../App';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { user: guestUser } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: General Profile
    fullName: '',
    age: 25,
    gender: '',
    height: { value: 170, unit: 'cm' },
    weight: 70,
    bodyType: '',
    medicalConditions: [],
    medications: '',
    allergies: [],
    occupation: '',
    activityLevel: '',
    
    // Step 2: Goals & Fitness
    primaryGoal: '',
    timeline: '',
    problemAreas: [],
    
    // Step 3: Nutrition Profile
    dietType: '',
    meals: { breakfast: [], lunch: [], dinner: [] },
    hydration: 8,
    emotionalEating: 3,
    cravings: [],
    
    // Step 4: Workout & Fitness
    fitnessLevel: '',
    frequency: '',
    workoutTypes: [],
    equipment: [],
    limitations: '',
    
    // Step 5: Mental Health
    stressLevel: 3,
    moodStability: '',
    personality: '',
    behaviorPatterns: [],
    
    // Step 6: Preferences
    workoutTime: '',
    dietStyle: '',
    timeAvailable: 30,
    budget: 'medium',
    
    // Step 7: Advanced (Optional)
    cycleTracking: false,
    hormonalIssues: '',
    digestiveIssues: '',
    skinHairConcerns: '',
    
    // Authentication fields
    email: '',
    password: '',
    confirmPassword: '',
    
    // New Baseline Metrics
    dietQuality: 5,
    dailyStepsGoal: 5000,
    stressPrevalence: 'medium',
    sleepConsistency: 7,
    chronicPain: false
  });

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const handleSignUp = async () => {
    // Validate required fields
    if (!formData.email || !formData.password || !formData.fullName) {
      alert('Please fill in all required fields: Email, Password, and Full Name');
      setCurrentStep(1);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      setCurrentStep(1);
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      setCurrentStep(1);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setCurrentStep(1);
      return;
    }

    try {
      console.log('🔍 Starting signup process...');
      console.log('📤 Form data:', {
        email: formData.email,
        password: formData.password ? '***' : null,
        fullName: formData.fullName,
        dateOfBirth: formData.age ? new Date().toISOString() : undefined,
        gender: formData.gender?.toLowerCase()
      });
      
      const result = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          dateOfBirth: formData.age ? new Date().toISOString() : undefined,
          gender: formData.gender?.toLowerCase(),
          previousGuestId: guestUser?.id,
          // Include new baseline metrics for Health Service
          dietQuality: (formData as any).dietQuality,
          dailyStepsGoal: (formData as any).dailyStepsGoal,
          stressPrevalence: (formData as any).stressPrevalence,
          sleepConsistency: (formData as any).sleepConsistency,
          chronicPain: (formData as any).chronicPain
        }),
      });

      console.log('✅ Signup successful:', result);
      console.log('👤 User created:', result.data.user.email);

      // Send OTP for email verification
      try {
        await apiCall(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
          method: 'POST',
          body: JSON.stringify({ email: formData.email }),
        });
        
        // Redirect to OTP verification page
        navigate('/verify-otp?email=' + encodeURIComponent(result.data.user.email));
      } catch (otpError) {
        console.error('Failed to send OTP:', otpError);
        // Still redirect to OTP page, user can resend
        navigate('/verify-otp?email=' + encodeURIComponent(result.data.user.email));
      }
    } catch (error: any) {
      console.error('❌ Signup error details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        type: typeof error
      });
      
      // Provide more specific error messages
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.details && Array.isArray(error.details)) {
        errorMessage = `Validation failed: ${error.details.map((d: any) => d.message).join(', ')}`;
      } else if (error.message.includes('Email already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and number.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { num: 1, label: 'Profile', icon: User },
      { num: 2, label: 'Goals', icon: Target },
      { num: 3, label: 'Nutrition', icon: Apple },
      { num: 4, label: 'Fitness', icon: Dumbbell },
      { num: 5, label: 'Mental', icon: Brain },
      { num: 6, label: 'Preferences', icon: Settings },
      { num: 7, label: 'Complete', icon: Sparkles },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            const isUpcoming = currentStep < step.num;

            return (
              <div key={step.num} className="flex items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted || isActive ? '#0d9488' : '#f1f5f9',
                    borderColor: isCompleted || isActive ? '#0d9488' : '#e2e8f0',
                  }}
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border-2 transition-colors ${
                    isUpcoming ? 'bg-slate-50 border-slate-200' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isCompleted || isActive ? 'text-white' : 'text-slate-400'}`} />
                </motion.div>
                
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {steps.map((step) => (
            <span
              key={step.num}
              className={`text-xs font-medium ${
                currentStep >= step.num ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Let's Get to Know You</h2>
        <p className="text-gray-600">This helps us personalize your health journey</p>
      </div>

      {/* Right Side - Form */}
      <div className="space-y-6">
        {/* Basic Identity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            Basic Identity
            <HelpCircle className="w-4 h-4 text-teal-700 cursor-help" />
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Create a password (min 8 characters)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age: {formData.age}</label>
            <input
              type="range"
              min="18"
              max="80"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex gap-3">
              {['Male', 'Female', 'Other'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setFormData({...formData, gender})}
                  className={`px-4 py-2 rounded-xl transition-all font-medium ${
                    formData.gender === gender
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.height.value}
                  onChange={(e) => setFormData({...formData, height: {...formData.height, value: parseInt(e.target.value)}})}
                  className="flex-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, height: {...formData.height, unit: formData.height.unit === 'cm' ? 'ft' : 'cm'}})}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  {formData.height.unit}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
            <div className="grid grid-cols-3 gap-3">
              {['Ectomorph', 'Mesomorph', 'Endomorph'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, bodyType: type})}
                  className={`px-3 py-2 text-sm rounded-xl transition-all font-medium ${
                    formData.bodyType === type
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Health Context */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            Health Context
            <HelpCircle className="w-4 h-4 text-teal-700 cursor-help" />
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
            <div className="flex flex-wrap gap-2">
              {['Diabetes', 'Hypertension', 'Thyroid', 'Asthma', 'Arthritis'].map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => {
                    const conditions = formData.medicalConditions.includes(condition)
                      ? formData.medicalConditions.filter(c => c !== condition)
                      : [...formData.medicalConditions, condition];
                    setFormData({...formData, medicalConditions: conditions});
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-all font-medium ${
                    formData.medicalConditions.includes(condition)
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
            <input
              type="text"
              value={formData.medications}
              onChange={(e) => setFormData({...formData, medications: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="List any medications you're taking"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <input
              type="text"
              value={formData.allergies.join(', ')}
              onChange={(e) => setFormData({...formData, allergies: e.target.value.split(', ').filter(a => a.trim())})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., nuts, dairy, pollen"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="chronicPain"
              checked={formData.chronicPain}
              onChange={(e) => setFormData({...formData, chronicPain: e.target.checked})}
              className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="chronicPain" className="text-sm font-medium text-gray-700">
              I experience recurring or chronic physical pain
            </label>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            Lifestyle
            <HelpCircle className="w-4 h-4 text-teal-700 cursor-help" />
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select occupation</option>
              <option value="sedentary">Desk Job</option>
              <option value="active">Active Work</option>
              <option value="manual">Manual Labor</option>
              <option value="student">Student</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
            <div className="grid grid-cols-3 gap-3">
              {['Sedentary', 'Moderate', 'Active'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, activityLevel: level})}
                  className={`px-3 py-2 text-sm rounded-xl transition-all font-medium ${
                    formData.activityLevel === level
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diet Quality */}
        <div className="space-y-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
          <label className="block text-sm font-medium text-teal-900 mb-1">
            Overall Diet Quality: {formData.dietQuality}/10
          </label>
          <p className="text-xs text-teal-600 mb-3">1 = Mostly processed, 10 = Highly nutritious & balanced</p>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.dietQuality}
            onChange={(e) => setFormData({...formData, dietQuality: parseInt(e.target.value)})}
            className="w-full accent-teal-600"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">What's Your Goal?</h2>
        <p className="text-gray-600">Define your fitness objectives</p>
      </div>

      {/* Primary Goal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Primary Goal</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🏃', label: 'Weight Loss', value: 'weight-loss' },
            { icon: '💪', label: 'Muscle Gain', value: 'muscle-gain' },
            { icon: '🧘', label: 'Flexibility', value: 'flexibility' },
            { icon: '❤️', label: 'Heart Health', value: 'heart-health' },
            { icon: '🎯', label: 'Athletic Performance', value: 'performance' },
            { icon: '😌', label: 'Stress Relief', value: 'stress-relief' }
          ].map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => setFormData({...formData, primaryGoal: goal.value})}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.primaryGoal === goal.value
                  ? 'border-teal-500 bg-teal-50 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="font-medium text-gray-800">{goal.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Timeline</h3>
        <div className="flex gap-3">
          {['1 Month', '3 Months', '6 Months', '1 Year', 'Ongoing'].map((timeline) => (
            <button
              key={timeline}
              type="button"
              onClick={() => setFormData({...formData, timeline})}
              className={`px-4 py-2 rounded-xl transition-all font-medium ${
                formData.timeline === timeline
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {timeline}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Areas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Problem Areas</h3>
        <div className="flex flex-wrap gap-2">
          {['Belly', 'Arms', 'Thighs', 'Buttocks', 'Back', 'Chest'].map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => {
                const areas = formData.problemAreas.includes(area)
                  ? formData.problemAreas.filter(a => a !== area)
                  : [...formData.problemAreas, area];
                setFormData({...formData, problemAreas: areas});
              }}
              className={`px-3 py-1 text-sm rounded-full transition-all font-medium ${
                formData.problemAreas.includes(area)
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Nutrition Profile</h2>
        <p className="text-gray-600">Tell us about your eating habits</p>
      </div>

      {/* Diet Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Diet Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🥗', label: 'Vegetarian', value: 'vegetarian' },
            { icon: '🌱', label: 'Vegan', value: 'vegan' },
            { icon: '🍖', label: 'Non-Vegetarian', value: 'non-veg' },
            { icon: '🐟', label: 'Pescatarian', value: 'pescatarian' },
            { icon: '🥜', label: 'Keto', value: 'keto' },
            { icon: '🌾', label: 'Gluten-Free', value: 'gluten-free' }
          ].map((diet) => (
            <button
              key={diet.value}
              type="button"
              onClick={() => setFormData({...formData, dietType: diet.value})}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.dietType === diet.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{diet.icon}</div>
              <div className="text-sm font-medium text-gray-800">{diet.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Typical Meals</h3>
        {['breakfast', 'lunch', 'dinner'].map((meal) => (
          <div key={meal} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">{meal}</label>
            <div className="flex flex-wrap gap-2">
              {['Roti', 'Sabzi', 'Rice', 'Dal', 'Salad', 'Soup', 'Pasta', 'Sandwich'].map((food) => (
                <button
                  key={food}
                  type="button"
                  onClick={() => {
                    const meals = {...formData.meals};
                    if (meals[meal].includes(food)) {
                      meals[meal] = meals[meal].filter(f => f !== food);
                    } else {
                      meals[meal] = [...meals[meal], food];
                    }
                    setFormData({...formData, meals});
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    formData.meals[meal].includes(food)
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {food}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add your own..."
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        ))}
      </div>

      {/* Hydration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Daily Hydration</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400/20 via-emerald-400/20 to-green-400/20 transition-all"
                style={{ width: `${((formData.hydration || 0) / 16) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0L</span>
              <span>{formData.hydration || 0}L</span>
              <span>16L</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={formData.hydration}
            onChange={(e) => setFormData({...formData, hydration: parseInt(e.target.value)})}
            className="w-32"
          />
        </div>
      </div>

      {/* Behavior */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Eating Behavior</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emotional Eating: {formData.emotionalEating}/5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.emotionalEating}
            onChange={(e) => setFormData({...formData, emotionalEating: parseInt(e.target.value)})}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Rarely</span>
            <span>Often</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cravings</label>
          <div className="flex flex-wrap gap-2">
            {['Sweet', 'Salty', 'Spicy', 'Junk Food', 'Chocolate', 'Coffee'].map((craving) => (
              <button
                key={craving}
                type="button"
                onClick={() => {
                  const cravings = formData.cravings.includes(craving)
                    ? formData.cravings.filter(c => c !== craving)
                    : [...formData.cravings, craving];
                  setFormData({...formData, cravings});
                }}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  formData.cravings.includes(craving)
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {craving}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Workout & Fitness</h2>
        <p className="text-gray-600">Your exercise preferences</p>
      </div>

      {/* Activity Level */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Fitness Level</h3>
        <div className="space-y-2">
          {[
            { level: 'Beginner', desc: 'Just starting out', value: 'beginner' },
            { level: 'Intermediate', desc: 'Regular exercise', value: 'intermediate' },
            { level: 'Advanced', desc: 'Very active', value: 'advanced' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFormData({...formData, fitnessLevel: item.value})}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                formData.fitnessLevel === item.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-gray-800">{item.level}</div>
              <div className="text-sm text-gray-600">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Workout Frequency</h3>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setFormData({...formData, frequency: `${day} days/week`})}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.frequency === `${day} days/week`
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-gray-800">{day}</div>
              <div className="text-xs text-gray-600">day{day > 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Workout Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Preferred Workout Types</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🏃', label: 'Cardio', value: 'cardio' },
            { icon: '💪', label: 'Strength', value: 'strength' },
            { icon: '🧘', label: 'Yoga', value: 'yoga' },
            { icon: '🏊', label: 'Swimming', value: 'swimming' },
            { icon: '🚴', label: 'Cycling', value: 'cycling' },
            { icon: '🤸', label: 'Dance', value: 'dance' }
          ].map((workout) => (
            <button
              key={workout.value}
              type="button"
              onClick={() => {
                const types = formData.workoutTypes.includes(workout.value)
                  ? formData.workoutTypes.filter(t => t !== workout.value)
                  : [...formData.workoutTypes, workout.value];
                setFormData({...formData, workoutTypes: types});
              }}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.workoutTypes.includes(workout.value)
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{workout.icon}</div>
              <div className="text-sm font-medium text-gray-800">{workout.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Available Equipment</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '🏋️', label: 'Weights', value: 'weights' },
            { icon: '🏃', label: 'Treadmill', value: 'treadmill' },
            { icon: '🚴', label: 'Bike', value: 'bike' },
            { icon: '🧘', label: 'Mat', value: 'mat' },
            { icon: '💪', label: 'Bands', value: 'bands' },
            { icon: '🏊', label: 'Pool', value: 'pool' },
            { icon: '🏠', label: 'None', value: 'none' },
            { icon: '🏢', label: 'Gym', value: 'gym' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                const equipment = formData.equipment.includes(item.value)
                  ? formData.equipment.filter(e => e !== item.value)
                  : [...formData.equipment, item.value];
                setFormData({...formData, equipment});
              }}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                formData.equipment.includes(item.value)
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium text-gray-800">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Physical Limitations</h3>
        <textarea
          value={formData.limitations}
          onChange={(e) => setFormData({...formData, limitations: e.target.value})}
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          placeholder="Any injuries, physical limitations, or areas to avoid..."
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Mental Health</h2>
        <p className="text-gray-600">Your mental wellness matters</p>
      </div>

      {/* Stress Prevalence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Stress Frequency</h3>
        <p className="text-sm text-gray-500 mb-3">How often do you feel significantly stressed?</p>
        <div className="grid grid-cols-3 gap-3">
          {['Low', 'Medium', 'High'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({...formData, stressPrevalence: level.toLowerCase() as any})}
              className={`p-4 rounded-xl border-2 transition-all font-medium ${
                formData.stressPrevalence === level.toLowerCase()
                  ? 'bg-teal-600 text-white shadow-md border-teal-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Mood Stability */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Mood Stability</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Very Stable', emoji: '😊', value: 'very-stable' },
            { label: 'Somewhat Stable', emoji: '😐', value: 'somewhat-stable' },
            { label: 'Unstable', emoji: '😔', value: 'unstable' }
          ].map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setFormData({...formData, moodStability: mood.value})}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.moodStability === mood.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{mood.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Personality Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Introvert', emoji: '🤫', value: 'introvert' },
            { label: 'Ambivert', emoji: '🤔', value: 'ambivert' },
            { label: 'Extrovert', emoji: '🗣️', value: 'extrovert' }
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({...formData, personality: type.value})}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.personality === type.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{type.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Behavior Patterns */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Behavior Patterns</h3>
        <div className="space-y-3">
          {[
            { label: 'Overthinking', desc: 'Tend to overanalyze situations' },
            { label: 'Procrastination', desc: 'Delay tasks unnecessarily' },
            { label: 'Perfectionism', desc: 'Need everything to be perfect' },
            { label: 'Motivation Issues', desc: 'Struggle with staying motivated' },
            { label: 'Anxiety', desc: 'Feel anxious often' },
            { label: 'Burnout', desc: 'Easily feel exhausted' }
          ].map((pattern) => (
            <label key={pattern.label} className="flex items-center p-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={formData.behaviorPatterns.includes(pattern.label)}
                onChange={(e) => {
                  const patterns = e.target.checked
                    ? [...formData.behaviorPatterns, pattern.label]
                    : formData.behaviorPatterns.filter(p => p !== pattern.label);
                  setFormData({...formData, behaviorPatterns: patterns});
                }}
                className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-800">{pattern.label}</div>
                <div className="text-sm text-gray-600">{pattern.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Preferences</h2>
        <p className="text-gray-600">Your personal preferences</p>
      </div>

      {/* Workout Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Preferred Workout Time</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { time: 'Early Morning', icon: '🌅', value: 'early-morning' },
            { time: 'Morning', icon: '☀️', value: 'morning' },
            { time: 'Afternoon', icon: '🌤️', value: 'afternoon' },
            { time: 'Evening', icon: '🌆', value: 'evening' },
            { time: 'Night', icon: '🌙', value: 'night' },
            { time: 'Flexible', icon: '🔄', value: 'flexible' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFormData({...formData, workoutTime: item.value})}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                formData.workoutTime === item.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium text-gray-800">{item.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diet Style */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Diet Style Preference</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { style: 'Meal Prep', icon: '📦', value: 'meal-prep' },
            { style: 'Fresh Cooking', icon: '🍳', value: 'fresh-cooking' },
            { style: 'Mixed', icon: '🥗', value: 'mixed' },
            { style: 'Quick & Easy', icon: '⚡', value: 'quick' },
            { style: 'Gourmet', icon: '🍽️', value: 'gourmet' },
            { style: 'Flexible', icon: '🔄', value: 'flexible' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFormData({...formData, dietStyle: item.value})}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.dietStyle === item.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-gray-800">{item.style}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Available */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Daily Time Available</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.timeAvailable} minutes per day
          </label>
          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={formData.timeAvailable}
            onChange={(e) => setFormData({...formData, timeAvailable: parseInt(e.target.value)})}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>15 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Budget Range</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { range: 'Low', desc: '$0-$50/month', value: 'low' },
            { range: 'Medium', desc: '$50-$200/month', value: 'medium' },
            { range: 'High', desc: '$200+/month', value: 'high' }
          ].map((budget) => (
            <button
              key={budget.value}
              type="button"
              onClick={() => setFormData({...formData, budget: budget.value})}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.budget === budget.value
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-gray-800">{budget.range}</div>
              <div className="text-sm text-gray-600">{budget.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Steps Goal */}
      <div className="space-y-4 p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-teal-950">Intended Daily Steps</h3>
          <span className="px-3 py-1 bg-teal-200 text-teal-800 rounded-full text-sm font-bold">
            {(formData as any).dailyStepsGoal.toLocaleString()} steps
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="20000"
          step="1000"
          value={(formData as any).dailyStepsGoal}
          onChange={(e) => setFormData({...formData, dailyStepsGoal: parseInt(e.target.value)})}
          className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />
        <div className="flex justify-between text-xs text-teal-600 mt-1">
          <span>Sedentary (1k)</span>
          <span>Target (10k)</span>
          <span>Athlete (20k)</span>
        </div>
      </div>

      {/* Diet Quality & Chronic Pain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50">
          <label className="block text-sm font-semibold text-orange-900 mb-1">
            Diet Quality (Last 30 Days): {(formData as any).dietQuality}/10
          </label>
          <p className="text-[10px] text-orange-600 mb-3">1 = Mostly processed, 10 = Whole foods & balanced</p>
          <input
            type="range"
            min="1"
            max="10"
            value={(formData as any).dietQuality}
            onChange={(e) => setFormData({...formData, dietQuality: parseInt(e.target.value)})}
            className="w-full accent-orange-600"
          />
        </div>

        <div className="space-y-4 p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-rose-900">Chronic Physical Pain</h3>
              <p className="text-[10px] text-rose-600">Regular physical discomfort?</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, chronicPain: !(formData as any).chronicPain})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(formData as any).chronicPain ? 'bg-rose-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(formData as any).chronicPain ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stress Prevalence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Stress Prevalence</h3>
        <div className="grid grid-cols-3 gap-4">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({...formData, stressPrevalence: level})}
              className={`p-4 rounded-xl border-2 transition-all text-center capitalize ${
                (formData as any).stressPrevalence === level
                  ? 'border-teal-200 bg-teal-50 text-teal-800 font-bold'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Advanced Health Data</h2>
        <p className="text-gray-600">Optional - for more personalized insights</p>
      </div>

      {/* Cycle Tracking */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Cycle Tracking</h3>
        <label className="flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={formData.cycleTracking}
            onChange={(e) => setFormData({...formData, cycleTracking: e.target.checked})}
            className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-500"
          />
          <div className="ml-3">
            <div className="font-medium text-gray-800">Enable cycle tracking</div>
            <div className="text-sm text-gray-600">For hormonal and menstrual health insights</div>
          </div>
        </label>
      </div>

      {/* Hormonal Issues */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Hormonal Issues</h3>
        <textarea
          value={formData.hormonalIssues}
          onChange={(e) => setFormData({...formData, hormonalIssues: e.target.value})}
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          placeholder="Any hormonal concerns, thyroid issues, etc..."
        />
      </div>

      {/* Digestive Issues */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Digestive Issues</h3>
        <textarea
          value={formData.digestiveIssues}
          onChange={(e) => setFormData({...formData, digestiveIssues: e.target.value})}
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          placeholder="IBS, bloating, food intolerances, etc..."
        />
      </div>

      {/* Skin/Hair Concerns */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Skin & Hair Concerns</h3>
        <textarea
          value={formData.skinHairConcerns}
          onChange={(e) => setFormData({...formData, skinHairConcerns: e.target.value})}
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          placeholder="Acne, hair loss, dryness, etc..."
        />
      </div>
    </div>
  );

  const renderComplete = () => {
    // Prepare health profile data from form
    const healthProfile: HealthProfileData = {
      // Physical
      height: formData.height.value,
      weight: formData.weight,
      age: formData.age,
      goalType: formData.timeline.includes('1 month') || formData.timeline.includes('2 weeks') ? 'aggressive' :
                formData.timeline.includes('3 months') ? 'healthy' : 'unrealistic',
      conditions: formData.medicalConditions,
      problemAreas: formData.problemAreas,

      // Nutrition
      dietType: formData.dietType,
      mealRegularity: 'regular',
      hydration: formData.hydration,
      cravings: formData.cravings,
      emotionalEating: formData.emotionalEating,

      // Fitness
      fitnessLevel: formData.fitnessLevel as 'beginner' | 'intermediate' | 'advanced',
      frequency: formData.frequency,
      timeAvailable: 45,
      workoutTypes: formData.workoutTypes,

      // Mental Health
      stressLevel: formData.stressLevel,
      moodStability: formData.moodStability as 'very-stable' | 'somewhat-stable' | 'unstable',
      behaviorPatterns: formData.behaviorPatterns,
      personality: formData.personality,

      // Sleep (defaults)
      sleepDuration: 7,
      sleepQuality: 'fair',

      // Lifestyle
      activityLevel: formData.activityLevel as 'Active' | 'Moderate' | 'Sedentary',
      screenTime: 6,
      outdoorExposure: 'moderate',
      substanceUse: 'none',
      energyLevels: 'moderate'
    };

    // Calculate comprehensive health score
    const result = calculateHealthScore(healthProfile);

    return (
      <div className="space-y-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Health Profile is Ready!</h2>
          <p className="text-gray-600 text-lg">We've analyzed your responses using our comprehensive health assessment model</p>
        </div>

        {/* Health Score */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Health Score</h3>
          <p className="text-sm text-gray-500 mb-4">{result.category}</p>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 mb-4">
            {result.totalScore}/100
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-3 gap-3 mt-6 text-xs">
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Physical</div>
              <div className="font-semibold text-teal-700">{result.subScores.physical}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Nutrition</div>
              <div className="font-semibold text-emerald-700">{result.subScores.nutrition}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Fitness</div>
              <div className="font-semibold text-green-700">{result.subScores.fitness}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Mental</div>
              <div className="font-semibold text-teal-700">{result.subScores.mental}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Sleep</div>
              <div className="font-semibold text-indigo-700">{result.subScores.sleep}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-gray-500">Lifestyle</div>
              <div className="font-semibold text-cyan-700">{result.subScores.lifestyle}</div>
            </div>
          </div>
        </div>

        {/* Fitness Persona */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Fitness Persona</h3>
          <p className="text-purple-700 font-medium">{result.fitnessPersona}</p>
        </div>

        {/* Risk Flags */}
        {result.riskFlags.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">⚠️ Areas for Attention</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {result.riskFlags.map((flag, i) => (
                <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  {flag.replace('-', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Personalized Insights</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {result.insights.map((insight, index) => (
              <div key={index} className={`bg-${insight.color}-50 rounded-xl p-4 text-left`}>
                <div className={`font-medium text-${insight.color}-800 mb-2`}>{insight.icon} {insight.title}</div>
                <div className={`text-sm text-${insight.color}-600`}>{insight.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <button 
            onClick={handleSignUp}
            className="w-full py-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Create Account & Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentStep(1)}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
          >
            Review Profile
          </button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    const variants = {
      enter: { opacity: 0, x: 20 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full"
        >
          {(() => {
            switch (currentStep) {
              case 1: return renderStep1();
              case 2: return renderStep2();
              case 3: return renderStep3();
              case 4: return renderStep4();
              case 5: return renderStep5();
              case 6: return renderStep6();
              case 7: return renderStep7();
              case 8: return renderComplete();
              default: return renderStep1();
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30">
      {/* Subtle Pattern Overlay */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <MedSageLogo className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                MedSage
              </span>
            </div>
            <p className="text-slate-500 text-sm">Your Personal Health Journey Starts Here</p>
          </div>

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Main Content Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="p-8">
              {/* Navigation Bar */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full">
                  <span className="text-sm font-semibold text-teal-700">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
                
                <div className="flex items-center gap-3" />
              </div>

              {/* Step Content */}
              <div className="min-h-[450px]">
                {renderStep()}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-slate-100 gap-3">
                {currentStep > 1 && currentStep < 7 && (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all flex items-center gap-2"
                >
                  {currentStep === 7 ? 'Complete' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
          
          {/* Footer */}
          <div className="text-center mt-6 text-slate-400 text-xs">
            <p>Your data is secure and encrypted. By continuing, you agree to our Terms of Service.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
