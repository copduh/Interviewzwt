import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, fullName, passwordHash: hash });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, credits: user.credits } });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ message: 'Error registering' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, credits: user.credits } });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const me = async (req: any, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Not authorized' });
  res.json({ user: { id: user._id, email: user.email, fullName: user.fullName, credits: user.credits } });
};

export default { register, login, me };
