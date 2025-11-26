import { Request, Response } from 'express';
import InterviewSession from '../models/InterviewSession';

export const createSession = async (req: any, res: Response) => {
  try {
    const { jobRoleId, customJobId } = req.body;
    const session = await InterviewSession.create({
      userId: req.user._id,
      jobRoleId,
      customJobId,
      status: 'pending'
    });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create interview session' });
  }
};

export const updateSession = async (req: any, res: Response) => {
  try {
    const session = await InterviewSession.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update session' });
  }
};

export const getSession = async (req: any, res: Response) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('jobRoleId')
      .populate('customJobId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get session' });
  }
};

export default { createSession, updateSession, getSession };
