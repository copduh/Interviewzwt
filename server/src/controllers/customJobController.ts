import { Request, Response } from 'express';
import CustomJobDescription from '../models/CustomJobDescription';

export const createCustomJob = async (req: any, res: Response) => {
  try {
    const { title, description, requirements } = req.body;
    const job = await CustomJobDescription.create({ userId: req.user._id, title, description, requirements });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error creating custom job' });
  }
};

export const listCustomJobs = async (req: any, res: Response) => {
  try {
    const jobs = await CustomJobDescription.find({ userId: req.user._id });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom jobs' });
  }
};

export default { createCustomJob, listCustomJobs };
