// API Configuration for Frontend
const envApiUrl = import.meta.env.VITE_API_URL;
const normalizedApiUrl = envApiUrl ? envApiUrl.replace(/\/+$|^\s+|\s+$/g, '') : '';
const API_BASE_URL = normalizedApiUrl || 'http://localhost:3000';

if (!envApiUrl && typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  console.warn(
    '[MedSage] VITE_API_URL is not defined. The deployed frontend is falling back to http://localhost:3000.\n' +
    'Set VITE_API_URL in Vercel environment variables to your Railway backend URL.'
  );
} else if (envApiUrl?.includes('<your-railway-backend>')) {
  console.error(
    '[MedSage] VITE_API_URL contains a placeholder value. Replace it with the real Railway backend URL.'
  );
}

export const API_BASE_PATH = `${API_BASE_URL}/api/v1`;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_PATH}/auth/login`,
    REGISTER: `${API_BASE_PATH}/auth/register`,
    LOGOUT: `${API_BASE_PATH}/auth/logout`,
    ME: `${API_BASE_PATH}/auth/me`,
    GOOGLE_AUTH: `${API_BASE_PATH}/auth/google`,
    GOOGLE_CALLBACK: `${API_BASE_PATH}/auth/google/callback`,
    SEND_VERIFICATION: `${API_BASE_PATH}/auth/send-verification`,
    VERIFY_EMAIL: `${API_BASE_PATH}/auth/verify-email`,
    FORGOT_PASSWORD: `${API_BASE_PATH}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_PATH}/auth/reset-password`,
  },
  
  // Chat
  CHAT: {
    CONVERSATIONS: `${API_BASE_PATH}/chat/conversations`,
    MESSAGES: (conversationId: string) => `${API_BASE_PATH}/chat/conversations/${conversationId}/messages`,
  },
  
  // Nutrition
  NUTRITION: {
    DAILY_LOG: `${API_BASE_PATH}/nutrition/daily`,
    MEALS: `${API_BASE_PATH}/nutrition/meals`,
    WATER: `${API_BASE_PATH}/nutrition/water`,
  },
  
  // Workout
  WORKOUT: {
    PLANS: `${API_BASE_PATH}/workouts/plans`,
    EXERCISES: `${API_BASE_PATH}/workouts/exercises`,
  },
  
  // Mental Health
  MENTAL_HEALTH: {
    CHECKINS: `${API_BASE_PATH}/mental-health/checkins`,
    MEDITATIONS: `${API_BASE_PATH}/mental-health/meditations`,
    ASSESSMENTS: `${API_BASE_PATH}/mental-health/assessments`,
    DAILY: `${API_BASE_PATH}/mental-health/daily`,
  },
  
  // Hormones
  HORMONES: {
    PROFILE: `${API_BASE_PATH}/hormones/profile`,
    INSIGHTS: `${API_BASE_PATH}/hormones/insights`,
    CYCLE: `${API_BASE_PATH}/hormones/cycle`,
    LOG_SYMPTOMS: `${API_BASE_PATH}/hormones/symptoms`,
  },
  
  // Reports
  REPORTS: {
    ANALYZE: `${API_BASE_PATH}/reports/analyze`,
  },
  
  // AI
  AI: {
    CHAT: `${API_BASE_PATH}/ai/chat`,
    INSIGHTS: `${API_BASE_PATH}/ai/insights`,
  },
  
  // Tasks
  TASKS: {
    TASKS: `${API_BASE_PATH}/tasks`,
  },
  
  // User Profile
  USER: {
    PROFILE: `${API_BASE_PATH}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_PATH}/users/profile`,
  },
};

// Helper function for API calls
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseText: responseText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        errorData = { message: responseText || 'Unknown error' };
      }
      
      // Auto-logout on token expiration
      if (response.status === 401 || errorData.message?.includes('token') || errorData.error?.message?.includes('token')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      const errorMessage = typeof errorData.error === 'string' 
        ? errorData.error 
        : (errorData.error?.message || errorData.message || 'API call failed');
      throw new Error(errorMessage);
    }

    // Try to parse successful response as JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse successful response as JSON:', parseError);
      console.error('Response text was:', responseText);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};
