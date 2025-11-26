import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName?: string;
  passwordHash?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String },
    passwordHash: { type: String },
    credits: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
