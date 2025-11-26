import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  jobRoleId?: mongoose.Types.ObjectId;
  customJobId?: mongoose.Types.ObjectId;
  resumeScore?: number;
  resumeFeedback?: string;
  interviewScore?: number;
  interviewFeedback?: string;
  transcript?: string;
  status: string;
  resumePath?: string;
  createdAt: Date;
  completedAt?: Date;
}

const InterviewSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobRoleId: { type: Schema.Types.ObjectId, ref: 'JobRole' },
    customJobId: { type: Schema.Types.ObjectId, ref: 'CustomJobDescription' },
    resumeScore: { type: Number },
    resumeFeedback: { type: String },
    interviewScore: { type: Number },
    interviewFeedback: { type: String },
    transcript: { type: String },
    status: { type: String, enum: ['pending', 'resume_uploaded', 'in_progress', 'completed'], default: 'pending' },
    resumePath: { type: String },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewSession>('InterviewSession', InterviewSchema);
