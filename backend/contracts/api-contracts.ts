/**
 * MedSage API Contracts - Version 1.0.0
 * Single source of truth for all API endpoints
 */

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// ============================================================================
// AUTHENTICATION CONTRACTS
// ============================================================================

export const AuthContracts = {
  register: {
    method: 'POST',
    path: `${API_BASE_PATH}/auth/register`,
    description: 'Register new user account',
    request: {
      body: {
        email: 'string (required, valid email)',
        password: 'string (required, min 8 chars, 1 uppercase, 1 number)',
        fullName: 'string (required, min 2 chars)',
        dateOfBirth: 'string (ISO date, optional)',
        gender: 'enum: male|female|other|prefer-not-to-say (optional)'
      }
    },
    response: {
      201: {
        success: true,
        data: {
          user: 'User object (without password)',
          token: 'JWT access token',
          refreshToken: 'JWT refresh token'
        }
      },
      400: { error: 'Validation error details' },
      409: { error: 'Email already exists' }
    }
  },

  login: {
    method: 'POST',
    path: `${API_BASE_PATH}/auth/login`,
    description: 'Authenticate user and return tokens',
    request: {
      body: {
        email: 'string (required)',
        password: 'string (required)'
      }
    },
    response: {
      200: {
        success: true,
        data: {
          user: 'User object',
          token: 'JWT access token',
          refreshToken: 'JWT refresh token'
        }
      },
      401: { error: 'Invalid credentials' }
    }
  },

  refresh: {
    method: 'POST',
    path: `${API_BASE_PATH}/auth/refresh`,
    description: 'Refresh access token using refresh token',
    request: {
      body: {
        refreshToken: 'string (required)'
      }
    },
    response: {
      200: {
        success: true,
        data: {
          token: 'New JWT access token',
          refreshToken: 'New JWT refresh token'
        }
      },
      401: { error: 'Invalid or expired refresh token' }
    }
  },

  logout: {
    method: 'POST',
    path: `${API_BASE_PATH}/auth/logout`,
    description: 'Invalidate user session',
    auth: true,
    response: {
      200: { success: true, message: 'Logged out successfully' }
    }
  },

  me: {
    method: 'GET',
    path: `${API_BASE_PATH}/auth/me`,
    description: 'Get current authenticated user',
    auth: true,
    response: {
      200: {
        success: true,
        data: 'User object'
      }
    }
  }
};

// ============================================================================
// USER PROFILE CONTRACTS
// ============================================================================

export const UserContracts = {
  getProfile: {
    method: 'GET',
    path: `${API_BASE_PATH}/users/profile`,
    description: 'Get complete user profile',
    auth: true,
    response: {
      200: {
        success: true,
        data: {
          id: 'string',
          email: 'string',
          fullName: 'string',
          dateOfBirth: 'date',
          gender: 'string',
          height: 'number (cm)',
          weight: 'number (kg)',
          bodyType: 'string',
          goals: 'string[]',
          medicalConditions: 'string[]',
          allergies: 'string[]',
          medications: 'string[]',
          activityLevel: 'enum: sedentary|light|moderate|active|very-active',
          sleepPatterns: {
            averageHours: 'number',
            quality: 'enum: poor|fair|good|excellent',
            bedtime: 'string (HH:mm)',
            wakeTime: 'string (HH:mm)'
          },
          createdAt: 'date',
          updatedAt: 'date'
        }
      }
    }
  },

  updateProfile: {
    method: 'PUT',
    path: `${API_BASE_PATH}/users/profile`,
    description: 'Update user profile information',
    auth: true,
    request: {
      body: {
        fullName: 'string (optional)',
        dateOfBirth: 'string (optional)',
        gender: 'string (optional)',
        height: 'number (optional)',
        weight: 'number (optional)',
        bodyType: 'string (optional)',
        goals: 'string[] (optional)',
        medicalConditions: 'string[] (optional)',
        allergies: 'string[] (optional)',
        medications: 'string[] (optional)',
        activityLevel: 'string (optional)',
        sleepPatterns: 'object (optional)'
      }
    },
    response: {
      200: {
        success: true,
        data: 'Updated user profile'
      },
      400: { error: 'Validation error' }
    }
  }
};

// ============================================================================
// NUTRITION CONTRACTS
// ============================================================================

export const NutritionContracts = {
  getDailyLog: {
    method: 'GET',
    path: `${API_BASE_PATH}/nutrition/daily`,
    description: 'Get nutrition log for specific date',
    auth: true,
    query: {
      date: 'string (YYYY-MM-DD, default: today)'
    },
    response: {
      200: {
        success: true,
        data: {
          date: 'string',
          meals: [
            {
              id: 'string',
              type: 'enum: breakfast|lunch|dinner|snack',
              foods: [
                {
                  name: 'string',
                  quantity: 'number',
                  unit: 'string',
                  calories: 'number',
                  protein: 'number (g)',
                  carbs: 'number (g)',
                  fats: 'number (g)',
                  fiber: 'number (g)',
                  micronutrients: 'object'
                }
              ],
              totalCalories: 'number',
              timestamp: 'date'
            }
          ],
          dailyTotals: {
            calories: 'number',
            protein: 'number',
            carbs: 'number',
            fats: 'number',
            fiber: 'number'
          },
          goals: {
            targetCalories: 'number',
            targetProtein: 'number',
            targetCarbs: 'number',
            targetFats: 'number'
          },
          water: {
            consumed: 'number (ml)',
            target: 'number (ml)'
          }
        }
      }
    }
  },

  addMeal: {
    method: 'POST',
    path: `${API_BASE_PATH}/nutrition/meals`,
    description: 'Add a meal entry',
    auth: true,
    request: {
      body: {
        date: 'string (YYYY-MM-DD, default: today)',
        type: 'enum: breakfast|lunch|dinner|snack (required)',
        foods: [
          {
            name: 'string (required)',
            quantity: 'number (required)',
            unit: 'string (required)',
            calories: 'number (optional - AI will calculate if not provided)',
            protein: 'number (optional)',
            carbs: 'number (optional)',
            fats: 'number (optional)',
            fiber: 'number (optional)'
          }
        ],
        timestamp: 'string (ISO date, optional)'
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created meal object'
      }
    }
  },

  updateWater: {
    method: 'PUT',
    path: `${API_BASE_PATH}/nutrition/water`,
    description: 'Update water intake for the day',
    auth: true,
    request: {
      body: {
        date: 'string (YYYY-MM-DD, default: today)',
        amount: 'number (ml, required)',
        action: 'enum: add|set (default: add)'
      }
    },
    response: {
      200: {
        success: true,
        data: {
          consumed: 'number',
          target: 'number',
          percentage: 'number'
        }
      }
    }
  },

  getFoodSuggestions: {
    method: 'GET',
    path: `${API_BASE_PATH}/nutrition/suggestions`,
    description: 'Get AI-powered food suggestions based on goals',
    auth: true,
    query: {
      mealType: 'enum: breakfast|lunch|dinner|snack',
      calorieTarget: 'number',
      dietaryRestrictions: 'string[]'
    },
    response: {
      200: {
        success: true,
        data: [
          {
            name: 'string',
            description: 'string',
            calories: 'number',
            protein: 'number',
            preparationTime: 'number (minutes)',
            ingredients: 'string[]',
            aiReasoning: 'string'
          }
        ]
      }
    }
  }
};

// ============================================================================
// WORKOUT CONTRACTS
// ============================================================================

export const WorkoutContracts = {
  getWorkouts: {
    method: 'GET',
    path: `${API_BASE_PATH}/workouts`,
    description: 'Get user workouts with filters',
    auth: true,
    query: {
      startDate: 'string (YYYY-MM-DD, optional)',
      endDate: 'string (YYYY-MM-DD, optional)',
      type: 'enum: cardio|strength|flexibility|hiit|sports|other (optional)',
      limit: 'number (default: 20)',
      offset: 'number (default: 0)'
    },
    response: {
      200: {
        success: true,
        data: {
          workouts: [
            {
              id: 'string',
              type: 'string',
              name: 'string',
              duration: 'number (minutes)',
              caloriesBurned: 'number',
              intensity: 'enum: low|moderate|high',
              exercises: [
                {
                  name: 'string',
                  sets: 'number',
                  reps: 'number',
                  weight: 'number (kg)',
                  duration: 'number (minutes)',
                  restTime: 'number (seconds)'
                }
              ],
              notes: 'string',
              date: 'date',
              createdAt: 'date'
            }
          ],
          pagination: {
            total: 'number',
            limit: 'number',
            offset: 'number'
          }
        }
      }
    }
  },

  createWorkout: {
    method: 'POST',
    path: `${API_BASE_PATH}/workouts`,
    description: 'Log a new workout',
    auth: true,
    request: {
      body: {
        type: 'enum: cardio|strength|flexibility|hiit|sports|other (required)',
        name: 'string (required)',
        duration: 'number (minutes, required)',
        caloriesBurned: 'number (optional)',
        intensity: 'enum: low|moderate|high (required)',
        exercises: [
          {
            name: 'string (required)',
            sets: 'number (optional)',
            reps: 'number (optional)',
            weight: 'number (optional)',
            duration: 'number (optional)',
            restTime: 'number (optional)'
          }
        ],
        notes: 'string (optional)',
        date: 'string (YYYY-MM-DD, default: today)'
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created workout object'
      }
    }
  },

  getRecommendedWorkouts: {
    method: 'GET',
    path: `${API_BASE_PATH}/workouts/recommendations`,
    description: 'Get AI-powered workout recommendations',
    auth: true,
    query: {
      fitnessLevel: 'enum: beginner|intermediate|advanced',
      availableTime: 'number (minutes)',
      goal: 'enum: weight-loss|muscle-gain|endurance|flexibility|maintenance',
      equipment: 'string[]'
    },
    response: {
      200: {
        success: true,
        data: [
          {
            name: 'string',
            type: 'string',
            duration: 'number',
            intensity: 'string',
            exercises: 'array',
            estimatedCaloriesBurn: 'number',
            aiReasoning: 'string'
          }
        ]
      }
    }
    },

  getWorkoutStats: {
    method: 'GET',
    path: `${API_BASE_PATH}/workouts/stats`,
    description: 'Get workout statistics and progress',
    auth: true,
    query: {
      period: 'enum: week|month|year (default: month)'
    },
    response: {
      200: {
        success: true,
        data: {
          totalWorkouts: 'number',
          totalDuration: 'number (minutes)',
          totalCaloriesBurned: 'number',
          averageIntensity: 'string',
          weeklyStreak: 'number',
          byType: 'object (breakdown by workout type)',
          trends: 'array (historical data)'
        }
      }
    }
  }
};

// ============================================================================
// MENTAL HEALTH CONTRACTS
// ============================================================================

export const MentalHealthContracts = {
  getDailyCheckIn: {
    method: 'GET',
    path: `${API_BASE_PATH}/mental-health/daily`,
    description: 'Get daily mental health check-in data',
    auth: true,
    query: {
      date: 'string (YYYY-MM-DD, default: today)'
    },
    response: {
      200: {
        success: true,
        data: {
          date: 'string',
          mood: 'enum: terrible|bad|neutral|good|excellent',
          moodScore: 'number (1-10)',
          stressLevel: 'number (0-10)',
          anxietyLevel: 'number (0-10)',
          energyLevel: 'number (0-10)',
          sleepQuality: 'number (0-10)',
          notes: 'string',
          triggers: 'string[]',
          copingStrategies: 'string[]',
          timestamp: 'date'
        }
      }
    }
  },

  createCheckIn: {
    method: 'POST',
    path: `${API_BASE_PATH}/mental-health/check-in`,
    description: 'Submit daily mental health check-in',
    auth: true,
    request: {
      body: {
        date: 'string (YYYY-MM-DD, optional)',
        mood: 'enum: terrible|bad|neutral|good|excellent (required)',
        moodScore: 'number (1-10, required)',
        stressLevel: 'number (0-10, optional)',
        anxietyLevel: 'number (0-10, optional)',
        energyLevel: 'number (0-10, optional)',
        sleepQuality: 'number (0-10, optional)',
        notes: 'string (optional)',
        triggers: 'string[] (optional)',
        copingStrategies: 'string[] (optional)'
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created check-in object',
        insights: {
          aiAnalysis: 'string',
          recommendations: 'string[]',
          trend: 'string'
        }
      }
    }
  },

  getMeditations: {
    method: 'GET',
    path: `${API_BASE_PATH}/mental-health/meditations`,
    description: 'Get guided meditation sessions',
    auth: true,
    query: {
      category: 'enum: anxiety|sleep|focus|stress|general (optional)',
      duration: 'enum: short|medium|long (optional)',
      limit: 'number (default: 10)'
    },
    response: {
      200: {
        success: true,
        data: [
          {
            id: 'string',
            title: 'string',
            description: 'string',
            category: 'string',
            duration: 'number (minutes)',
            audioUrl: 'string',
            transcript: 'string',
            tags: 'string[]'
          }
        ]
      }
    }
  },

  getMentalHealthStats: {
    method: 'GET',
    path: `${API_BASE_PATH}/mental-health/stats`,
    description: 'Get mental health trends and insights',
    auth: true,
    query: {
      period: 'enum: week|month|3months|year (default: month)'
    },
    response: {
      200: {
        success: true,
        data: {
          averageMoodScore: 'number',
          averageStressLevel: 'number',
          checkInStreak: 'number',
          moodTrends: 'array',
          correlations: {
            sleepVsMood: 'number',
            exerciseVsMood: 'number',
            workVsStress: 'number'
          },
          aiInsights: {
            summary: 'string',
            patterns: 'string[]',
            recommendations: 'string[]'
          }
        }
      }
    }
  },

  submitAssessment: {
    method: 'POST',
    path: `${API_BASE_PATH}/mental-health/assessments`,
    description: 'Submit mental health assessment and receive AI analysis',
    auth: true,
    request: {
      body: {
        assessmentType: 'enum: phq9|gad7|mmpi2|dass21|bdi|anxiety|personality|stress|focus|bigfive|mbti|disc|enneagram|strengths (required)',
        responses: [
          {
            questionId: 'string (required)',
            questionText: 'string (required)',
            selectedOption: 'string (required)',
            points: 'number (required)'
          }
        ]
      }
    },
    response: {
      201: {
        success: true,
        data: {
          _id: 'ObjectId',
          userId: 'ObjectId',
          assessmentType: 'string',
          totalScore: 'number',
          subScores: 'object (optional, contains scale-specific scores)',
          aiInterpretation: {
            summary: 'string',
            detailedAnalysis: 'string',
            personalityTraits: 'string[]',
            riskIndicators: 'string[]',
            nextSteps: 'string[]'
          },
          date: 'ISO date',
          createdAt: 'ISO date'
        }
      },
      400: { error: 'Invalid assessment type or missing required fields' },
      401: { error: 'Unauthorized - authentication required' },
      500: { error: 'Failed to process assessment with AI engine' }
    }
  },

  getAssessmentHistory: {
    method: 'GET',
    path: `${API_BASE_PATH}/mental-health/assessments`,
    description: 'Retrieve assessment history for the user',
    auth: true,
    query: {
      type: 'enum: phq9|gad7|mmpi2|dass21|bdi|anxiety|personality|stress|focus|bigfive|mbti|disc|enneagram|strengths (optional - filter by type)'
    },
    response: {
      200: {
        success: true,
        data: [
          {
            _id: 'ObjectId',
            userId: 'ObjectId',
            assessmentType: 'string',
            totalScore: 'number',
            subScores: 'object',
            aiInterpretation: {
              summary: 'string',
              detailedAnalysis: 'string',
              personalityTraits: 'string[]',
              riskIndicators: 'string[]',
              nextSteps: 'string[]'
            },
            date: 'ISO date',
            createdAt: 'ISO date'
          }
        ]
      },
      401: { error: 'Unauthorized - authentication required' }
    }
  }
};

// ============================================================================
// HORMONE TRACKING CONTRACTS
// ============================================================================

export const HormoneContracts = {
  getCycleData: {
    method: 'GET',
    path: `${API_BASE_PATH}/hormones/cycle`,
    description: 'Get menstrual cycle data and predictions',
    auth: true,
    response: {
      200: {
        success: true,
        data: {
          currentCycle: {
            startDate: 'date',
            predictedEndDate: 'date',
            currentDay: 'number',
            phase: 'enum: menstruation|follicular|ovulation|luteal',
            phaseDay: 'number'
          },
          cycleHistory: [
            {
              startDate: 'date',
              endDate: 'date',
              length: 'number (days)',
              symptoms: 'string[]',
              flowIntensity: 'enum: light|moderate|heavy'
            }
          ],
          predictions: {
            nextPeriodDate: 'date',
            ovulationDate: 'date',
            fertileWindow: {
              start: 'date',
              end: 'date'
            }
          },
          symptoms: [
            {
              date: 'date',
              type: 'string',
              severity: 'enum: mild|moderate|severe',
              notes: 'string'
            }
          ]
        }
      }
    }
  },

  logCycleEvent: {
    method: 'POST',
    path: `${API_BASE_PATH}/hormones/cycle/events`,
    description: 'Log menstrual cycle event or symptom',
    auth: true,
    request: {
      body: {
        type: 'enum: period-start|period-end|symptom|mood|energy (required)',
        date: 'string (YYYY-MM-DD, required)',
        details: {
          flowIntensity: 'enum: light|moderate|heavy (if type=period)',
          symptomType: 'string (if type=symptom)',
          severity: 'enum: mild|moderate|severe',
          notes: 'string'
        }
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created event object',
        updatedPredictions: 'object'
      }
    }
  },

  getHormoneInsights: {
    method: 'GET',
    path: `${API_BASE_PATH}/hormones/insights`,
    description: 'Get AI-powered hormone-related insights',
    auth: true,
    response: {
      200: {
        success: true,
        data: {
          currentPhase: 'string',
          phaseDescription: 'string',
          recommendedActivities: 'string[]',
          nutritionTips: 'string[]',
          exerciseRecommendations: 'string[]',
          moodExpectations: 'string',
          correlations: {
            withMentalHealth: 'object',
            withNutrition: 'object',
            withWorkouts: 'object'
          }
        }
      }
    }
  }
};

// ============================================================================
// CHAT/AI ASSISTANT CONTRACTS
// ============================================================================

export const ChatContracts = {
  getConversations: {
    method: 'GET',
    path: `${API_BASE_PATH}/chat/conversations`,
    description: 'Get user chat conversations',
    auth: true,
    query: {
      limit: 'number (default: 20)',
      offset: 'number (default: 0)'
    },
    response: {
      200: {
        success: true,
        data: {
          conversations: [
            {
              id: 'string',
              title: 'string',
              lastMessage: 'string',
              lastMessageAt: 'date',
              messageCount: 'number',
              context: 'object'
            }
          ]
        }
      }
    }
  },

  getMessages: {
    method: 'GET',
    path: `${API_BASE_PATH}/chat/conversations/:conversationId/messages`,
    description: 'Get messages for a conversation',
    auth: true,
    response: {
      200: {
        success: true,
        data: {
          conversationId: 'string',
          messages: [
            {
              id: 'string',
              role: 'enum: user|assistant|system',
              content: 'string',
              timestamp: 'date',
              metadata: 'object (sources, confidence, etc.)'
            }
          ]
        }
      }
    }
  },

  sendMessage: {
    method: 'POST',
    path: `${API_BASE_PATH}/chat/conversations/:conversationId/messages`,
    description: 'Send message to AI assistant',
    auth: true,
    request: {
      body: {
        content: 'string (required)',
        context: {
          currentPage: 'string (optional)',
          dateRange: 'object (optional)',
          focusArea: 'enum: nutrition|workout|mental-health|hormones|general (optional)'
        }
      }
    },
    response: {
      201: {
        success: true,
        data: {
          userMessage: 'Message object',
          assistantMessage: {
            id: 'string',
            role: 'assistant',
            content: 'string',
            timestamp: 'date',
            sources: [
              {
                type: 'enum: user-data|medical-knowledge|general',
                reference: 'string',
                confidence: 'number'
              }
            ],
            suggestedActions: [
              {
                type: 'string',
                label: 'string',
                payload: 'object'
              }
            ],
            insights: {
              patterns: 'string[]',
              recommendations: 'string[]',
              alerts: 'string[]'
            }
          }
        }
      }
    }
  },

  createConversation: {
    method: 'POST',
    path: `${API_BASE_PATH}/chat/conversations`,
    description: 'Start new conversation with AI',
    auth: true,
    request: {
      body: {
        title: 'string (optional)',
        initialContext: 'object (optional)',
        focusArea: 'string (optional)'
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created conversation object'
      }
    }
  }
};

// ============================================================================
// REPORTS & INSIGHTS CONTRACTS
// ============================================================================

export const ReportsContracts = {
  getDashboard: {
    method: 'GET',
    path: `${API_BASE_PATH}/reports/dashboard`,
    description: 'Get comprehensive dashboard data',
    auth: true,
    response: {
      200: {
        success: true,
        data: {
          overview: {
            healthScore: 'number (0-100)',
            trend: 'enum: improving|stable|declining',
            lastUpdated: 'date'
          },
          nutrition: {
            todayCalories: 'number',
            calorieGoal: 'number',
            macroSplit: 'object',
            waterIntake: 'number'
          },
          workouts: {
            thisWeekCount: 'number',
            thisWeekDuration: 'number',
            lastWorkout: 'date'
          },
          mentalHealth: {
            todayMood: 'string',
            checkInStreak: 'number',
            averageStress: 'number'
          },
          hormones: {
            currentPhase: 'string',
            nextPeriod: 'date',
            symptomCount: 'number'
          },
          insights: [
            {
              type: 'enum: achievement|alert|tip|pattern',
              title: 'string',
              description: 'string',
              priority: 'enum: low|medium|high',
              actionLink: 'string'
            }
          ]
        }
      }
    }
  },

  getWeeklyReport: {
    method: 'GET',
    path: `${API_BASE_PATH}/reports/weekly`,
    description: 'Generate weekly health report',
    auth: true,
    query: {
      week: 'string (YYYY-W##, default: current week)'
    },
    response: {
      200: {
        success: true,
        data: {
          week: 'string',
          summary: 'string',
          nutrition: {
            averageDailyCalories: 'number',
            macroAdherence: 'number (%)',
            waterAverage: 'number',
            achievements: 'string[]'
          },
          fitness: {
            totalWorkouts: 'number',
            totalMinutes: 'number',
            caloriesBurned: 'number',
            consistency: 'number (%)'
          },
          mentalHealth: {
            averageMood: 'number',
            stressTrend: 'string',
            meditationMinutes: 'number'
          },
          achievements: [
            {
              icon: 'string',
              title: 'string',
              description: 'string',
              earnedAt: 'date'
            }
          ],
          goalsProgress: [
            {
              goal: 'string',
              target: 'string',
              current: 'string',
              progress: 'number (%)',
              status: 'enum: on-track|at-risk|behind'
            }
          ],
          aiAnalysis: {
            summary: 'string',
            patterns: 'string[]',
            recommendations: 'string[]',
            focusForNextWeek: 'string[]'
          }
        }
      }
    }
  },

  getCorrelations: {
    method: 'GET',
    path: `${API_BASE_PATH}/reports/correlations`,
    description: 'Get AI-discovered correlations across health data',
    auth: true,
    query: {
      factors: 'string[] (e.g., sleep,exercise,mood)',
      period: 'enum: month|3months|6months|year (default: 3months)'
    },
    response: {
      200: {
        success: true,
        data: {
          correlations: [
            {
              factor1: 'string',
              factor2: 'string',
              correlation: 'number (-1 to 1)',
              strength: 'enum: weak|moderate|strong',
              direction: 'enum: positive|negative',
              description: 'string',
              confidence: 'number (%)'
            }
          ],
          insights: 'string[]',
          recommendations: 'string[]'
        }
      }
    }
  }
};

// ============================================================================
// TASKS & REMINDERS CONTRACTS
// ============================================================================

export const TasksContracts = {
  getTasks: {
    method: 'GET',
    path: `${API_BASE_PATH}/tasks`,
    description: 'Get user tasks and reminders',
    auth: true,
    query: {
      date: 'string (YYYY-MM-DD, default: today)',
      type: 'enum: daily|workout|medicine|appointment|other (optional)',
      status: 'enum: pending|completed|overdue (optional)',
      limit: 'number (default: 50)'
    },
    response: {
      200: {
        success: true,
        data: {
          date: 'string',
          tasks: [
            {
              id: 'string',
              title: 'string',
              type: 'string',
              status: 'string',
              scheduledTime: 'string (HH:mm)',
              completedAt: 'date',
              notes: 'string',
              isRecurring: 'boolean',
              recurrencePattern: 'string',
              source: 'enum: user|ai-suggested|system'
            }
          ],
          summary: {
            total: 'number',
            completed: 'number',
            pending: 'number',
            overdue: 'number'
          }
        }
      }
    }
  },

  createTask: {
    method: 'POST',
    path: `${API_BASE_PATH}/tasks`,
    description: 'Create new task or reminder',
    auth: true,
    request: {
      body: {
        title: 'string (required)',
        type: 'enum: daily|workout|medicine|appointment|other (required)',
        date: 'string (YYYY-MM-DD, required)',
        scheduledTime: 'string (HH:mm, optional)',
        notes: 'string (optional)',
        isRecurring: 'boolean (default: false)',
        recurrencePattern: 'string (optional)',
        reminderMinutes: 'number (optional)'
      }
    },
    response: {
      201: {
        success: true,
        data: 'Created task object'
      }
    }
  },

  updateTaskStatus: {
    method: 'PUT',
    path: `${API_BASE_PATH}/tasks/:taskId`,
    description: 'Update task status or details',
    auth: true,
    request: {
      body: {
        status: 'enum: pending|completed|overdue (optional)',
        completedAt: 'date (optional)',
        notes: 'string (optional)'
      }
    },
    response: {
      200: {
        success: true,
        data: 'Updated task object'
      }
    }
  }
};

// ============================================================================
// ERROR RESPONSE SCHEMA
// ============================================================================

export const ErrorSchemas = {
  400: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: [
        {
          field: 'string',
          message: 'string',
          value: 'any'
        }
      ]
    }
  },

  401: {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      details: 'Token missing or invalid'
    }
  },

  403: {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied',
      details: 'Insufficient permissions'
    }
  },

  404: {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      details: 'The requested resource does not exist'
    }
  },

  429: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      details: 'Rate limit exceeded, retry after X seconds',
      retryAfter: 'number (seconds)'
    }
  },

  500: {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: 'An unexpected error occurred',
      referenceId: 'string (error tracking ID)'
    }
  }
};

// Export all contracts
export const ApiContracts = {
  version: API_VERSION,
  basePath: API_BASE_PATH,
  auth: AuthContracts,
  users: UserContracts,
  nutrition: NutritionContracts,
  workouts: WorkoutContracts,
  mentalHealth: MentalHealthContracts,
  hormones: HormoneContracts,
  chat: ChatContracts,
  reports: ReportsContracts,
  tasks: TasksContracts,
  errors: ErrorSchemas
};

export default ApiContracts;
