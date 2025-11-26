import { Request, Response } from 'express';
import User from '../models/User';

export const getProfile = async (req: any, res: Response) => {
  res.json({ user: { id: req.user._id, email: req.user.email, fullName: req.user.fullName, credits: req.user.credits } });
};

export const updateCredits = async (req: any, res: Response) => {
  try {
    const { credits } = req.body;
    if (typeof credits !== 'number') return res.status(400).json({ message: 'Invalid credits' });
    const user = await User.findByIdAndUpdate(req.user._id, { credits }, { new: true });
    res.json({ user: { id: user._id, email: user.email, fullName: user.fullName, credits: user.credits } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating credits' });
  }
};

export default { getProfile, updateCredits };
