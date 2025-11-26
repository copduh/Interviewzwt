import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomJobDescription extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  createdAt: Date;
}

const CustomJobSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomJobDescription>('CustomJobDescription', CustomJobSchema);
