// MedSage Server v1.0.1 - Force Reload Trigger
import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import mongoose from 'mongoose';
import { createServer as createViteServer } from "vite";
import path from "path";
// Backend imports
import { connectDB, logger } from "./services/database.service";
import {
  securityMiddleware,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  requestLogger,
  rateLimiter,
  authRateLimiter,
  authenticate
} from "./middleware/common.middleware";

// Controllers
import { authController, userController } from './controllers/auth.controller';
import { insightsController } from './controllers/insights.controller';
import { nutritionController } from "./controllers/nutrition.controller";
import { workoutController } from "./controllers/workout.controller";
import { mentalHealthController } from "./controllers/mental-health.controller";
import { hormoneController } from "./controllers/hormone.controller";
import { chatController } from "./controllers/chat.controller";
import { taskController } from "./controllers/task.controller";
import { reportsController } from "./controllers/reports.controller";
import { mentalHealthAiController } from "./controllers/mentalhealth.ai.controller";
import { healthController } from "./controllers/health.controller";
import { nutritionAiController } from "./controllers/nutrition.ai.controller";
import { discussionController } from "./controllers/discussion.controller";

const API_VERSION = "v1";
const API_BASE_PATH = `/api/${API_VERSION}`;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Connect to MongoDB
  const isDbConnected = await connectDB();

  // Middleware to check database connection for critical API routes
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();

    // Dynamically check connection state instead of relying on startup status variable
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_OFFLINE",
          message: "Database is currently offline. If you are the developer, please ensure MongoDB is running: & 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe'",
        },
        retryAfter: 30
      });
    }
    next();
  });

  // Apply security middleware
  app.use(...securityMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request ID and logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ============================================================================
  // API ROUTES (Must be before Vite middleware)
  // ============================================================================

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: API_VERSION
    });
  });

  // Auth routes (public)
  app.post(`${API_BASE_PATH}/auth/register`, (req, res, next) => {
    console.log('🌐 ROUTE HIT: /api/v1/auth/register', req.body);
    next();
  }, authController.register);
  app.post(`${API_BASE_PATH}/auth/login`, (req, res, next) => {
    console.log('🌐 ROUTE HIT: /api/v1/auth/login', { email: req.body.email });
    next();
  }, authRateLimiter, authController.login);
  app.post(`${API_BASE_PATH}/auth/refresh`, authController.refresh);
  app.post(`${API_BASE_PATH}/auth/forgot-password`, authController.forgotPassword);
  app.post(`${API_BASE_PATH}/auth/reset-password`, authController.resetPassword);
  app.get(`${API_BASE_PATH}/auth/google`, authController.googleAuth);
  app.get(`${API_BASE_PATH}/auth/google/callback`, authController.googleCallback);

  // Fallback routes at /v1 for compatibility (some proxies strip /api)
  app.post(`/${API_VERSION}/auth/register`, authController.register);
  app.post(`/${API_VERSION}/auth/login`, (req, res, next) => {
    console.log('🌐 ROUTE HIT: /v1/auth/login (fallback)', { email: req.body.email });
    next();
  }, authRateLimiter, authController.login);
  app.post(`/${API_VERSION}/auth/refresh`, authController.refresh);
  app.post(`/${API_VERSION}/auth/forgot-password`, authController.forgotPassword);
  app.post(`/${API_VERSION}/auth/reset-password`, authController.resetPassword);
  app.get(`/${API_VERSION}/auth/google`, authController.googleAuth);
  app.get(`/${API_VERSION}/auth/google/callback`, authController.googleCallback);

  // Protected routes
  app.get(`${API_BASE_PATH}/auth/me`, authenticate, authController.me);
  app.post(`${API_BASE_PATH}/auth/logout`, authenticate, authController.logout);

  // Email verification routes
  app.post(`${API_BASE_PATH}/auth/send-verification`, authController.sendEmailVerification);
  app.post(`${API_BASE_PATH}/auth/verify-email`, authController.verifyEmail);

  // User routes
  app.get(`${API_BASE_PATH}/users/profile`, authenticate, userController.getProfile);
  app.put(`${API_BASE_PATH}/users/profile`, authenticate, userController.updateProfile);
  app.post(`${API_BASE_PATH}/users/change-password`, authenticate, userController.changePassword);
  app.post(`${API_BASE_PATH}/users/deactivate`, authenticate, userController.deactivateAccount);

  // Nutrition routes
  app.get(`${API_BASE_PATH}/nutrition/daily`, authenticate, nutritionController.getDailyLog);
  app.post(`${API_BASE_PATH}/nutrition/meals`, authenticate, nutritionController.addMeal);
  app.put(`${API_BASE_PATH}/nutrition/meals/:id`, authenticate, nutritionController.updateMeal);
  app.patch(`${API_BASE_PATH}/nutrition/meals/:id/status`, authenticate, nutritionController.updateMealStatus);
  app.put(`${API_BASE_PATH}/nutrition/water`, authenticate, nutritionController.updateWater);
  app.get(`${API_BASE_PATH}/nutrition/suggestions`, authenticate, nutritionController.getFoodSuggestions);
  app.get(`${API_BASE_PATH}/nutrition/stats`, authenticate, nutritionController.getNutritionStats);
  app.get(`${API_BASE_PATH}/nutrition/history`, authenticate, nutritionController.getMealHistory);

  // Workout routes - protected for authenticated users
  app.get(`${API_BASE_PATH}/workouts`, authenticate, workoutController.getWorkouts);
  app.post(`${API_BASE_PATH}/workouts`, authenticate, workoutController.createWorkout);
  app.patch(`${API_BASE_PATH}/workouts/:id`, authenticate, workoutController.updateWorkout);
  app.delete(`${API_BASE_PATH}/workouts/:id`, authenticate, workoutController.deleteWorkout);
  app.get(`${API_BASE_PATH}/workouts/stats`, authenticate, workoutController.getWorkoutStats);
  app.get(`${API_BASE_PATH}/workouts/recommendations`, authenticate, workoutController.getRecommendedWorkouts);
  app.get(`${API_BASE_PATH}/workouts/plans`, authenticate, workoutController.getWorkoutPlans);
  app.post(`${API_BASE_PATH}/workouts/plans`, authenticate, workoutController.createWorkoutPlan);
  app.delete(`${API_BASE_PATH}/workouts/plans/:id`, authenticate, workoutController.deleteWorkoutPlan);
  app.get(`${API_BASE_PATH}/workouts/exercises`, authenticate, workoutController.getExerciseDatabase);

  // Mental Health routes
  app.get(`${API_BASE_PATH}/mental-health/daily`, authenticate, mentalHealthController.getDailyCheckIn);
  app.post(`${API_BASE_PATH}/mental-health/check-in`, authenticate, mentalHealthController.createCheckIn);
  app.get(`${API_BASE_PATH}/mental-health/stats`, authenticate, mentalHealthController.getMentalHealthStats);
  app.get(`${API_BASE_PATH}/mental-health/meditations`, authenticate, mentalHealthController.getMeditationLibrary);
  app.post(`${API_BASE_PATH}/mental-health/meditations`, authenticate, mentalHealthController.logMeditationSession);
  app.get(`${API_BASE_PATH}/mental-health/journal`, authenticate, mentalHealthController.getJournalEntries);
  app.post(`${API_BASE_PATH}/mental-health/journal`, authenticate, mentalHealthController.createJournalEntry);
  app.post(`${API_BASE_PATH}/mental-health/assessments`, authenticate, mentalHealthController.submitAssessment);
  app.get(`${API_BASE_PATH}/mental-health/assessments`, authenticate, mentalHealthController.getAssessmentHistory);

  // Hormone routes - protected for authenticated users
  app.get(`${API_BASE_PATH}/hormones/cycle`, authenticate, hormoneController.getCurrentCycle);
  app.post(`${API_BASE_PATH}/hormones/events`, authenticate, hormoneController.logCycleEvent);
  app.post(`${API_BASE_PATH}/hormones/symptoms`, authenticate, hormoneController.logSymptomsBatch);
  app.delete(`${API_BASE_PATH}/hormones/last-cycle`, authenticate, hormoneController.unlogLastCycle);
  app.get(`${API_BASE_PATH}/hormones/insights`, authenticate, hormoneController.getHormoneInsights);
  app.put(`${API_BASE_PATH}/hormones/profile`, authenticate, hormoneController.updateHormoneProfile);

  // Chat routes - protected for authenticated users
  app.get(`${API_BASE_PATH}/chat/conversations`, authenticate, chatController.getConversations);
  app.post(`${API_BASE_PATH}/chat/conversations`, authenticate, chatController.createConversation);
  app.get(`${API_BASE_PATH}/chat/messages`, authenticate, chatController.getMessages);
  app.post(`${API_BASE_PATH}/chat/conversations/:conversationId/messages`, authenticate, chatController.sendMessage);
  app.post(`${API_BASE_PATH}/chat/conversations/:conversationId/archive`, authenticate, chatController.archiveConversation);
  app.put(`${API_BASE_PATH}/chat/conversations/:conversationId`, authenticate, chatController.renameConversation);
  app.delete(`${API_BASE_PATH}/chat/conversations/:conversationId`, authenticate, chatController.deleteConversation);

  // Reports routes - protected for authenticated users
  app.get(`${API_BASE_PATH}/reports`, authenticate, reportsController.getReports);
  app.post(`${API_BASE_PATH}/reports/upload`, authenticate, reportsController.uploadReport);
  app.post(`${API_BASE_PATH}/reports/:id/analyze`, authenticate, reportsController.analyzeReport);
  app.delete(`${API_BASE_PATH}/reports/:id`, authenticate, reportsController.deleteReport);
  app.get(`${API_BASE_PATH}/reports/:id/pdf`, authenticate, reportsController.downloadReportPDF);

  // Mental Health AI routes - protected for authenticated users
  app.post(`${API_BASE_PATH}/mental-health/assessment`, authenticate, mentalHealthAiController.assessment);

  // Assessment submission and history endpoints
  app.post(`${API_BASE_PATH}/mental-health/assessments`, authenticate, mentalHealthController.submitAssessment);
  app.get(`${API_BASE_PATH}/mental-health/assessments`, authenticate, mentalHealthController.getAssessmentHistory);

  // Nutrition AI routes - protected for authenticated users
  app.post(`${API_BASE_PATH}/nutrition/recipe`, authenticate, nutritionAiController.generateRecipe);
  app.post(`${API_BASE_PATH}/nutrition/recipe-details`, authenticate, nutritionAiController.getRecipeDetails);
  app.post(`${API_BASE_PATH}/nutrition/analyze-image`, authenticate, nutritionAiController.analyzeImage);
  app.post(`${API_BASE_PATH}/nutrition/estimate-calories`, authenticate, nutritionAiController.estimateCalories);
  app.post(`${API_BASE_PATH}/nutrition/learn`, authenticate, nutritionAiController.learnDish);

  // Health Dashboard route - protected for authenticated users
  app.get(`${API_BASE_PATH}/health/dashboard`, authenticate, healthController.getDashboardData);
  app.get(`${API_BASE_PATH}/health/ai-status`, authenticate, healthController.getAIStatus);
  app.post(`${API_BASE_PATH}/health/sleep`, authenticate, healthController.logSleep);

  // AI Insights route - protected for authenticated users
  app.post(`${API_BASE_PATH}/insights/generate`, authenticate, insightsController.generateInsights);

  // Test AI route - for debugging (no auth required)
  app.post(`${API_BASE_PATH}/test-ai`, insightsController.testAI);

  // Task routes
  app.get(`${API_BASE_PATH}/tasks`, authenticate, taskController.getTasks);
  app.post(`${API_BASE_PATH}/tasks`, authenticate, taskController.createTask);
  app.patch(`${API_BASE_PATH}/tasks/:taskId/status`, authenticate, taskController.updateTaskStatus);
  app.patch(`${API_BASE_PATH}/tasks/:taskId/subtasks/:subtaskId`, authenticate, taskController.updateSubtaskStatus);
  app.delete(`${API_BASE_PATH}/tasks/:taskId`, authenticate, taskController.deleteTask);
  app.get(`${API_BASE_PATH}/achievements`, authenticate, taskController.getAchievements);
  app.patch(`${API_BASE_PATH}/achievements/:achievementId/view`, authenticate, taskController.markAchievementViewed);

  // Anonymous Discussion routes
  app.get(`${API_BASE_PATH}/discussions`, authenticate, discussionController.getDiscussions);
  app.post(`${API_BASE_PATH}/discussions`, authenticate, discussionController.createDiscussion);
  app.post(`${API_BASE_PATH}/discussions/:id/like`, authenticate, discussionController.likeDiscussion);
  app.post(`${API_BASE_PATH}/discussions/:id/replies`, authenticate, discussionController.addReply);

  // 404 handler for API routes only
  app.use("/api", notFoundHandler);

  // ============================================================================
  // VITE DEV SERVER (Development only) - After API routes
  // ============================================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Global rate limiting (skip for Vite HMR)
  app.use(rateLimiter);

  // ============================================================================
  // ERROR HANDLING (for API routes only - Vite handles frontend routes)
  // ============================================================================

  // Global error handler
  app.use(errorHandler);

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📚 API available at http://localhost:${PORT}${API_BASE_PATH}`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
