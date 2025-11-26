require('dotenv').config();
const mongoose = require('mongoose');
const PaymentOrder = require('../server/src/models/PaymentOrder').default || require('../server/src/models/PaymentOrder');
const User = require('../server/src/models/User').default || require('../server/src/models/User');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewzwt';

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const orders = await PaymentOrder.find().limit(20).lean();
    console.log('PaymentOrder entries:', orders.length);
    console.dir(orders, { depth: 2 });

    const userId = '692737bf89cc7d95a2ec75a3';
    const user = await User.findById(userId).lean();
    console.log('User:', userId, user ? `credits=${user.credits}` : 'not found');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
