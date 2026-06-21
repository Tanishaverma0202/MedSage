import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// NUTRITION LOG SCHEMA
// ============================================================================

export interface IFoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fats: number; // g
  fiber: number; // g
  sugar?: number; // g
  sodium?: number; // mg
  cholesterol?: number; // mg
  micronutrients?: Map<string, number>;
  aiCalculated?: boolean;
}

export interface IMeal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  status: 'logged' | 'scheduled' | 'generated';
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalFiber: number;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fats: { type: Number, default: 0, min: 0 },
  fiber: { type: Number, default: 0, min: 0 },
  sugar: { type: Number, min: 0 },
  sodium: { type: Number, min: 0 },
  cholesterol: { type: Number, min: 0 },
  micronutrients: { type: Map, of: Number },
  aiCalculated: { type: Boolean, default: false }
});

const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    },
    status: {
      type: String,
      enum: ['logged', 'scheduled', 'generated'],
      default: 'logged'
    },
    foods: [FoodItemSchema],
    totalCalories: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProtein: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCarbs: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFats: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFiber: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient querying
MealSchema.index({ userId: 1, date: -1 });
MealSchema.index({ userId: 1, date: -1, type: 1 });

// Pre-save middleware to calculate totals
MealSchema.pre('save', function (this: IMeal, next) {
  this.totalCalories = Math.round(this.foods.reduce((sum, food) => sum + (food.calories || 0), 0) * 100) / 100;
  this.totalProtein = Math.round(this.foods.reduce((sum, food) => sum + (food.protein || 0), 0) * 100) / 100;
  this.totalCarbs = Math.round(this.foods.reduce((sum, food) => sum + (food.carbs || 0), 0) * 100) / 100;
  this.totalFats = Math.round(this.foods.reduce((sum, food) => sum + (food.fats || 0), 0) * 100) / 100;
  this.totalFiber = Math.round(this.foods.reduce((sum, food) => sum + (food.fiber || 0), 0) * 100) / 100;
  next();
});

export const Meal = mongoose.model<IMeal>('Meal', MealSchema);

// ============================================================================
// WATER INTAKE SCHEMA
// ============================================================================

export interface IWaterIntake extends Document {
  userId: Types.ObjectId;
  date: Date;
  consumed: number; // ml
  target: number; // ml
  entries: {
    amount: number;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const WaterIntakeSchema = new Schema<IWaterIntake>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    consumed: {
      type: Number,
      default: 0,
      min: 0
    },
    target: {
      type: Number,
      default: 2500, // ml
      min: 0
    },
    entries: [{
      amount: { type: Number, required: true, min: 0 },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true
  }
);

WaterIntakeSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WaterIntake = mongoose.model<IWaterIntake>('WaterIntake', WaterIntakeSchema);

// ============================================================================
// NUTRITION GOALS SCHEMA
// ============================================================================

export interface INutritionGoals extends Document {
  userId: Types.ObjectId;
  calorieTarget: number;
  macroSplit: {
    protein: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  proteinTarget: number; // g
  carbsTarget: number; // g
  fatsTarget: number; // g
  fiberTarget: number; // g
  waterTarget: number; // ml
  mealSchedule: {
    breakfast: { target: number; time: string };
    lunch: { target: number; time: string };
    dinner: { target: number; time: string };
    snacks: { target: number };
  };
  dietaryRestrictions: string[];
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionGoalsSchema = new Schema<INutritionGoals>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    calorieTarget: {
      type: Number,
      min: 500,
      max: 10000
    },
    macroSplit: {
      protein: { type: Number, min: 0, max: 100 },
      carbs: { type: Number, min: 0, max: 100 },
      fats: { type: Number, min: 0, max: 100 }
    },
    proteinTarget: { type: Number, min: 0 },
    carbsTarget: { type: Number, min: 0 },
    fatsTarget: { type: Number, min: 0 },
    fiberTarget: { type: Number, min: 0, default: 25 },
    waterTarget: { type: Number, min: 0, default: 2500 },
    mealSchedule: {
      breakfast: {
        target: { type: Number, default: 400 },
        time: { type: String, default: '08:00' }
      },
      lunch: {
        target: { type: Number, default: 600 },
        time: { type: String, default: '13:00' }
      },
      dinner: {
        target: { type: Number, default: 700 },
        time: { type: String, default: '19:00' }
      },
      snacks: {
        target: { type: Number, default: 300 }
      }
    },
    dietaryRestrictions: [{ type: String }],
    aiGenerated: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const NutritionGoals = mongoose.model<INutritionGoals>('NutritionGoals', NutritionGoalsSchema);

// ============================================================================
// FOOD DATABASE SCHEMA (for AI suggestions and logging)
// ============================================================================

export interface IFoodDatabase extends Document {
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  tags: string[];
  isVerified: boolean;
  source: 'usda' | 'user' | 'ai';
  createdAt: Date;
  updatedAt: Date;
}

const FoodDatabaseSchema = new Schema<IFoodDatabase>(
  {
    name: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    servingSize: { type: Number, required: true },
    servingUnit: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    tags: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['usda', 'user', 'ai'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

FoodDatabaseSchema.index({ name: 'text', tags: 'text' });
FoodDatabaseSchema.index({ category: 1, isVerified: 1 });

export const FoodDatabase = mongoose.model<IFoodDatabase>('FoodDatabase', FoodDatabaseSchema);

export default {
  Meal,
  WaterIntake,
  NutritionGoals,
  FoodDatabase
};
