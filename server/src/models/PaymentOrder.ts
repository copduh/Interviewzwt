import mongoose from 'mongoose';

const PaymentOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  credits: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PaymentOrder', PaymentOrderSchema);
