import mongoose, { Schema, Document } from 'mongoose';

export interface IJobRole extends Document {
  title: string;
  description: string;
  category: string;
  requirements: string[];
  skills: string[];
  icon?: string;
  createdAt: Date;
}

const JobRoleSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    requirements: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    icon: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IJobRole>('JobRole', JobRoleSchema);
