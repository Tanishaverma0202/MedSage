import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// MENSTRUAL CYCLE SCHEMA
// ============================================================================

export interface ICycleEvent {
  type: 'period-start' | 'period-end' | 'symptom' | 'mood' | 'energy' | 'spotting' | 'ovulation-pain';
  date: Date;
  details: {
    flowIntensity?: 'light' | 'moderate' | 'heavy';
    symptomType?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
  };
}

export interface IMenstrualCycle extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate?: Date;
  periodLength: number; // days
  cycleLength: number; // days
  flowIntensity: 'light' | 'moderate' | 'heavy';
  symptoms: {
    date: Date;
    type: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }[];
  events: ICycleEvent[];
  aiPredictions?: {
    nextPeriodDate: Date;
    ovulationDate: Date;
    fertileWindow: {
      start: Date;
      end: Date;
    };
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CycleEventSchema = new Schema<ICycleEvent>({
  type: {
    type: String,
    enum: ['period-start', 'period-end', 'symptom', 'mood', 'energy', 'spotting', 'ovulation-pain'],
    required: true
  },
  date: { type: Date, required: true },
  details: {
    flowIntensity: { type: String, enum: ['light', 'moderate', 'heavy'] },
    symptomType: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    notes: { type: String }
  }
});

const MenstrualCycleSchema = new Schema<IMenstrualCycle>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cycleStartDate: {
      type: Date,
      required: true
    },
    cycleEndDate: {
      type: Date
    },
    periodLength: {
      type: Number,
      min: 1,
      max: 10
    },
    cycleLength: {
      type: Number,
      min: 21,
      max: 35
    },
    flowIntensity: {
      type: String,
      enum: ['light', 'moderate', 'heavy']
    },
    symptoms: [{
      date: { type: Date, required: true },
      type: { type: String, required: true },
      severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
      notes: { type: String }
    }],
    events: [CycleEventSchema],
    aiPredictions: {
      nextPeriodDate: { type: Date },
      ovulationDate: { type: Date },
      fertileWindow: {
        start: { type: Date },
        end: { type: Date }
      },
      confidence: { type: Number, min: 0, max: 1 }
    }
  },
  {
    timestamps: true
  }
);

MenstrualCycleSchema.index({ userId: 1, cycleStartDate: -1 });

export const MenstrualCycle = mongoose.model<IMenstrualCycle>('MenstrualCycle', MenstrualCycleSchema);

// ============================================================================
// HORMONE PROFILE SCHEMA
// ============================================================================

export interface IHormoneProfile extends Document {
  userId: Types.ObjectId;
  averageCycleLength: number; // days
  averagePeriodLength: number; // days
  typicalFlowIntensity: 'light' | 'moderate' | 'heavy';
  commonSymptoms: string[];
  pmsSymptoms: string[];
  cycleIrregularity: 'regular' | 'somewhat-irregular' | 'irregular';
  birthControlMethod?: string;
  lastUpdated: Date;
  aiInsights?: {
    patterns: string[];
    recommendations: string[];
    healthFlags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const HormoneProfileSchema = new Schema<IHormoneProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    averageCycleLength: {
      type: Number,
      default: 28,
      min: 21,
      max: 35
    },
    averagePeriodLength: {
      type: Number,
      default: 5,
      min: 2,
      max: 10
    },
    typicalFlowIntensity: {
      type: String,
      enum: ['light', 'moderate', 'heavy'],
      default: 'moderate'
    },
    commonSymptoms: [{
      type: String
    }],
    pmsSymptoms: [{
      type: String
    }],
    cycleIrregularity: {
      type: String,
      enum: ['regular', 'somewhat-irregular', 'irregular'],
      default: 'regular'
    },
    birthControlMethod: {
      type: String
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    aiInsights: {
      patterns: [{ type: String }],
      recommendations: [{ type: String }],
      healthFlags: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

export const HormoneProfile = mongoose.model<IHormoneProfile>('HormoneProfile', HormoneProfileSchema);

// ============================================================================
// HORMONE CORRELATION SCHEMA
// ============================================================================

export interface IHormoneCorrelation extends Document {
  userId: Types.ObjectId;
  cyclePhase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
  date: Date;
  correlations: {
    nutrition: {
      calorieIntake: number;
      cravings: string[];
      appetiteLevel: number; // 0-10
    };
    workout: {
      energyLevel: number; // 0-10
      performance: number; // 0-10
      recommendedIntensity: 'low' | 'moderate' | 'high';
    };
    mentalHealth: {
      mood: number; // 0-10
      anxiety: number; // 0-10
      irritability: number; // 0-10
    };
    sleep: {
      quality: number; // 0-10
      duration: number;
      disturbances: boolean;
    };
  };
  aiInsights: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HormoneCorrelationSchema = new Schema<IHormoneCorrelation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    cyclePhase: {
      type: String,
      enum: ['menstruation', 'follicular', 'ovulation', 'luteal'],
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    correlations: {
      nutrition: {
        calorieIntake: { type: Number },
        cravings: [{ type: String }],
        appetiteLevel: { type: Number, min: 0, max: 10 }
      },
      workout: {
        energyLevel: { type: Number, min: 0, max: 10 },
        performance: { type: Number, min: 0, max: 10 },
        recommendedIntensity: { type: String, enum: ['low', 'moderate', 'high'] }
      },
      mentalHealth: {
        mood: { type: Number, min: 0, max: 10 },
        anxiety: { type: Number, min: 0, max: 10 },
        irritability: { type: Number, min: 0, max: 10 }
      },
      sleep: {
        quality: { type: Number, min: 0, max: 10 },
        duration: { type: Number },
        disturbances: { type: Boolean }
      }
    },
    aiInsights: [{ type: String }]
  },
  {
    timestamps: true
  }
);

HormoneCorrelationSchema.index({ userId: 1, date: -1 });
HormoneCorrelationSchema.index({ userId: 1, cyclePhase: 1 });

export const HormoneCorrelation = mongoose.model<IHormoneCorrelation>('HormoneCorrelation', HormoneCorrelationSchema);

export default {
  MenstrualCycle,
  HormoneProfile,
  HormoneCorrelation
};
