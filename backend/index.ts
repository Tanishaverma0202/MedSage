/**
 * MedSage Backend Module
 * 
 * A comprehensive, production-grade backend architecture for the MedSage health companion app.
 * 
 * @module backend
 */

import * as ApiContracts from './contracts/api-contracts';
import * as UserModels from './models/user.model';
import * as NutritionModels from './models/nutrition.model';
import * as WorkoutModels from './models/workout.model';
import * as MentalHealthModels from './models/mental-health.model';
import * as HormoneModels from './models/hormone.model';
import * as ChatModels from './models/chat.model';
import * as TaskModels from './models/task.model';

import * as DatabaseService from './services/database.service';
import * as AuthService from './services/auth.service';
import * as NutritionService from './services/nutrition.service';
import * as WorkoutService from './services/workout.service';
import * as MentalHealthService from './services/mental-health.service';
import * as HormoneService from './services/hormone.service';
import * as ChatService from './services/chat.service';
import * as TaskService from './services/task.service';
import * as AIService from './services/ai.service';

import * as AuthController from './controllers/auth.controller';
import * as NutritionController from './controllers/nutrition.controller';
import * as WorkoutController from './controllers/workout.controller';
import * as MentalHealthController from './controllers/mental-health.controller';
import * as HormoneController from './controllers/hormone.controller';
import * as ChatController from './controllers/chat.controller';
import * as TaskController from './controllers/task.controller';

import * as CommonMiddleware from './middleware/common.middleware';

// ============================================================================
// EXPORTS - API Contracts
// ============================================================================



// ============================================================================
// EXPORTS - Models
// ============================================================================

export { User, UserProfile, RefreshToken } from './models/user.model';
export type { IUser, IUserProfile, IRefreshToken } from './models/user.model';

export { Meal, WaterIntake, NutritionGoals, FoodDatabase } from './models/nutrition.model';
export type { IMeal, IFoodItem, IWaterIntake, INutritionGoals, IFoodDatabase } from './models/nutrition.model';

export { Workout, WorkoutPlan, ExerciseDatabase } from './models/workout.model';
export type { IWorkout, IExercise, IWorkoutPlan, IExerciseDatabase } from './models/workout.model';

export { MentalHealthCheckIn, MeditationSession, MeditationLibrary, JournalEntry } from './models/mental-health.model';
export type { IMentalHealthCheckIn, IMeditationSession, IMeditationLibrary, IJournalEntry } from './models/mental-health.model';

export { MenstrualCycle, HormoneProfile, HormoneCorrelation } from './models/hormone.model';
export type { IMenstrualCycle, ICycleEvent, IHormoneProfile, IHormoneCorrelation } from './models/hormone.model';

export { Conversation, Message, AIContextCache } from './models/chat.model';
export type { IConversation, IMessage, IMessageSource, ISuggestedAction, IAIContextCache } from './models/chat.model';

export { Task, Achievement, Notification } from './models/task.model';
export type { ITask, IAchievement, INotification } from './models/task.model';

// ============================================================================
// EXPORTS - Services
// ============================================================================

export { connectDB, checkDatabaseHealth, logger, cacheService, BaseService } from './services/database.service';
export { authService, userService } from './services/auth.service';
export type { AuthTokens, UserPayload } from './services/auth.service';
export { nutritionService, NutritionService } from './services/nutrition.service';
export { workoutService, WorkoutService } from './services/workout.service';
export { mentalHealthService, MentalHealthService } from './services/mental-health.service';
export { hormoneService, HormoneService } from './services/hormone.service';
export { chatService, ChatService } from './services/chat.service';
export { taskService, TaskService } from './services/task.service';
export { aiService, AIService } from './services/ai.service';

// ============================================================================
// EXPORTS - Controllers
// ============================================================================

export { authController, userController } from './controllers/auth.controller';
export { nutritionController } from './controllers/nutrition.controller';
export { workoutController } from './controllers/workout.controller';
export { mentalHealthController } from './controllers/mental-health.controller';
export { hormoneController } from './controllers/hormone.controller';
export { chatController } from './controllers/chat.controller';
export { taskController } from './controllers/task.controller';

// ============================================================================
// EXPORTS - Middleware
// ============================================================================

export { ApiError, errorHandler, notFoundHandler, authenticate, validateRequest, rateLimiter, authRateLimiter, securityMiddleware, requestIdMiddleware, requestLogger, getPaginationParams, createPaginationResponse } from './middleware/common.middleware';
export type { AuthRequest, PaginationParams as PaginationParamsType } from './middleware/common.middleware';

// ============================================================================
// VERSION
// ============================================================================

export const BACKEND_VERSION = '1.0.0';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  version: BACKEND_VERSION,
  models: {
    User: UserModels.User,
    UserProfile: UserModels.UserProfile,
    RefreshToken: UserModels.RefreshToken,
    Meal: NutritionModels.Meal,
    WaterIntake: NutritionModels.WaterIntake,
    NutritionGoals: NutritionModels.NutritionGoals,
    FoodDatabase: NutritionModels.FoodDatabase,
    Workout: WorkoutModels.Workout,
    WorkoutPlan: WorkoutModels.WorkoutPlan,
    ExerciseDatabase: WorkoutModels.ExerciseDatabase,
    MentalHealthCheckIn: MentalHealthModels.MentalHealthCheckIn,
    MeditationSession: MentalHealthModels.MeditationSession,
    MeditationLibrary: MentalHealthModels.MeditationLibrary,
    JournalEntry: MentalHealthModels.JournalEntry,
    MenstrualCycle: HormoneModels.MenstrualCycle,
    HormoneProfile: HormoneModels.HormoneProfile,
    HormoneCorrelation: HormoneModels.HormoneCorrelation,
    Conversation: ChatModels.Conversation,
    Message: ChatModels.Message,
    AIContextCache: ChatModels.AIContextCache,
    Task: TaskModels.Task,
    Achievement: TaskModels.Achievement,
    Notification: TaskModels.Notification
  },
  services: {
    authService: AuthService.authService,
    userService: AuthService.userService,
    nutritionService: NutritionService.nutritionService,
    workoutService: WorkoutService.workoutService,
    mentalHealthService: MentalHealthService.mentalHealthService,
    hormoneService: HormoneService.hormoneService,
    chatService: ChatService.chatService,
    taskService: TaskService.taskService,
    aiService: AIService.aiService
  },
  controllers: {
    authController: AuthController.authController,
    userController: AuthController.userController,
    nutritionController: NutritionController.nutritionController,
    workoutController: WorkoutController.workoutController,
    mentalHealthController: MentalHealthController.mentalHealthController,
    hormoneController: HormoneController.hormoneController,
    chatController: ChatController.chatController,
    taskController: TaskController.taskController
  },
  middleware: {
    authenticate: CommonMiddleware.authenticate,
    validateRequest: CommonMiddleware.validateRequest,
    rateLimiter: CommonMiddleware.rateLimiter,
    errorHandler: CommonMiddleware.errorHandler,
    notFoundHandler: CommonMiddleware.notFoundHandler
  }
};
