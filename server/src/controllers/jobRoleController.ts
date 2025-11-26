import { Request, Response } from 'express';
import JobRole from '../models/JobRole';

export const listJobRoles = async (req: Request, res: Response) => {
  try {
    const jobRoles = await JobRole.find().sort({ createdAt: 1 }).lean();
    res.json({ jobRoles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job roles' });
  }
};

export const getJobRole = async (req: Request, res: Response) => {
  try {
    const jobRole = await JobRole.findById(req.params.id);
    if (!jobRole) return res.status(404).json({ message: 'Job role not found' });
    res.json({ jobRole });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job role' });
  }
};

export default { listJobRoles, getJobRole };