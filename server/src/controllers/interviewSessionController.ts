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
    // Normalize _id to id for frontend convenience
    const sessionData = session.toObject ? session.toObject() : session;
    (sessionData as any).id = (sessionData as any)._id;
    res.json({ session: sessionData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create interview session' });
  }
};

export const updateSession = async (req: any, res: Response) => {
  try {
    console.log('updateSession called with:');
    console.log('  req.params:', req.params);
    console.log('  req.baseUrl:', req.baseUrl);
    console.log('  req.path:', req.path);
    console.log('  req.url:', req.url);
    
    const sessionId = req.params.id;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required', debug: { params: req.params, url: req.url } });
    }
    
    // Normalize snake_case fields to camelCase for the model
    const updateData = { ...req.body };
    if (updateData.interview_score) updateData.interviewScore = updateData.interview_score;
    if (updateData.interview_feedback) updateData.interviewFeedback = updateData.interview_feedback;
    if (updateData.resume_score) updateData.resumeScore = updateData.resume_score;
    if (updateData.resume_feedback) updateData.resumeFeedback = updateData.resume_feedback;
    if (updateData.completed_at) updateData.completedAt = updateData.completed_at;
    
    console.log('Updating session:', sessionId, 'with data:', updateData);
    
    const session = await InterviewSession.findOneAndUpdate({ _id: sessionId, userId: req.user._id }, updateData, { new: true }).lean();
    if (!session) return res.status(404).json({ message: 'Session not found' });
    // Normalize _id to id for frontend convenience
    (session as any).id = (session as any)._id;
    res.json({ session });
  } catch (error: any) {
    console.error('Error updating session:', error.message || error);
    res.status(500).json({ message: 'Failed to update session', error: error.message || 'Unknown error' });
  }
};

export const getSession = async (req: any, res: Response) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('jobRoleId')
      .populate('customJobId')
      .lean();
    if (!session) return res.status(404).json({ message: 'Session not found' });
    // Normalize _id to id for frontend convenience
    (session as any).id = (session as any)._id;
    res.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Failed to get session' });
  }
};

export default { createSession, updateSession, getSession };
