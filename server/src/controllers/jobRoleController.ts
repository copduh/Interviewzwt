import { Request, Response } from 'express';
import JobRole from '../models/JobRole';

export const listJobRoles = async (req: Request, res: Response) => {
  try {
    const jobRoles = await JobRole.find().sort({ createdAt: 1 }).lean();
    // Normalize _id to id for frontend convenience
    const normalized = jobRoles.map((r: any) => ({ ...r, id: r._id }));
    res.json({ jobRoles: normalized });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job roles' });
  }
};

export const getJobRole = async (req: Request, res: Response) => {
  try {
    const jobRole = await JobRole.findById(req.params.id).lean();
    if (!jobRole) return res.status(404).json({ message: 'Job role not found' });
    // include id alias for frontend
    (jobRole as any).id = (jobRole as any)._id;
    res.json({ jobRole });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job role' });
  }
};

export default { listJobRoles, getJobRole };