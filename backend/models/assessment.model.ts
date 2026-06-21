import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// MENTAL HEALTH ASSESSMENT SCHEMA
// ============================================================================

export interface IAssessmentResponse {
  questionId: string;
  questionText: string;
  selectedOption: string;
  points: number;
}

export interface IMentalHealthAssessment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  assessmentType: 'phq9' | 'gad7' | 'mmpi2' | 'dass21' | 'bdi' | 'anxiety' | 'personality' | 'stress' | 'focus' | 'bigfive' | 'mbti' | 'disc' | 'enneagram' | 'strengths';
  responses: IAssessmentResponse[];
  totalScore: number;
  aiInterpretation: {
    summary: string;
    detailedAnalysis: string;
    personalityTraits: string[];
    riskIndicators: string[];
    nextSteps: string[];
  };
  subScores?: Record<string, number>;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentResponseSchema = new Schema<IAssessmentResponse>({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  selectedOption: { type: String, required: true },
  points: { type: Number, required: true }
});

const MentalHealthAssessmentSchema = new Schema<IMentalHealthAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assessmentType: {
      type: String,
      enum: ['phq9', 'gad7', 'mmpi2', 'dass21', 'bdi', 'anxiety', 'personality', 'stress', 'focus', 'bigfive', 'mbti', 'disc', 'enneagram', 'strengths'],
      required: true,
      index: true
    },
    responses: [AssessmentResponseSchema],
    totalScore: {
      type: Number,
      required: true
    },
    aiInterpretation: {
      summary: { type: String, required: true },
      detailedAnalysis: { type: String, required: true },
      personalityTraits: [{ type: String }],
      riskIndicators: [{ type: String }],
      nextSteps: [{ type: String }]
    },
    subScores: {
      type: Schema.Types.Mixed,
      default: {}
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
MentalHealthAssessmentSchema.index({ userId: 1, assessmentType: 1, date: -1 });

export const MentalHealthAssessment = mongoose.model<IMentalHealthAssessment>('MentalHealthAssessment', MentalHealthAssessmentSchema);

export default MentalHealthAssessment;
