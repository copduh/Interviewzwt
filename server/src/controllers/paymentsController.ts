import { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';

const getPayPalBase = () => {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  return mode === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
};

const getPayPalToken = async () => {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!client || !secret) throw new Error('PayPal credentials not configured');
  const tokenUrl = `${getPayPalBase()}/v1/oauth2/token`;
  const resp = await axios.post(tokenUrl, 'grant_type=client_credentials', {
    auth: { username: client, password: secret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return resp.data.access_token;
};

export const createOrder = async (req: any, res: Response) => {
  try {
    const { amount, credits, planName } = req.body;
    if (!amount || !credits) return res.status(400).json({ message: 'Missing amount or credits' });
    const token = await getPayPalToken();
    const url = `${getPayPalBase()}/v2/checkout/orders`;

    // Use frontend origin for return/cancel URLs
    const frontend = process.env.FRONTEND_URL || (req.headers.origin || `http://localhost:5173`);

    const resp = await axios.post(url, {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: amount.toFixed ? amount.toFixed(2) : String(amount) },
          custom_id: String(credits),
          description: `Purchase ${credits} interview credits (${planName})`
        }
      ],
      application_context: {
        return_url: `${frontend}/payments/return`,
        cancel_url: `${frontend}/pricing`
      }
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    const data = resp.data;
    const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href;
    res.json({ orderID: data.id, approveUrl: approveLink });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error.message || error.response?.data || error);
    res.status(500).json({ message: 'Failed to create PayPal order' });
  }
};

export const captureOrder = async (req: any, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });
    const token = await getPayPalToken();
    const url = `${getPayPalBase()}/v2/checkout/orders/${orderId}/capture`;
    const resp = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });

    const data = resp.data;
    // Determine credits from purchase_units[0].custom_id if present
    const pu = data.purchase_units && data.purchase_units[0];
    const credits = pu?.custom_id ? Number(pu.custom_id) : 0;

    if (credits > 0 && req.user) {
      const user = await User.findByIdAndUpdate(req.user._id, { $inc: { credits } }, { new: true });
      return res.json({ captured: true, order: data, user: { id: user._id, credits: user.credits } });
    }

    res.json({ captured: true, order: data });
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error.message || error.response?.data || error);
    res.status(500).json({ message: 'Failed to capture PayPal order' });
  }
};

export default { createOrder, captureOrder };
