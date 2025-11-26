import { Request, Response } from 'express';
import CustomJobDescription from '../models/CustomJobDescription';

export const createCustomJob = async (req: any, res: Response) => {
  try {
    const { title, description, requirements } = req.body;
    const job = await CustomJobDescription.create({ userId: req.user._id, title, description, requirements });
    const jobData = job.toObject ? job.toObject() : job;
    (jobData as any).id = (jobData as any)._id;
    res.json({ job: jobData });
  } catch (error) {
    res.status(500).json({ message: 'Error creating custom job' });
  }
};

export const listCustomJobs = async (req: any, res: Response) => {
  try {
    const jobs = await CustomJobDescription.find({ userId: req.user._id }).lean();
    const normalized = jobs.map((j: any) => ({ ...j, id: j._id }));
    res.json({ jobs: normalized });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom jobs' });
  }
};

export const getCustomJob = async (req: any, res: Response) => {
  try {
    const job = await CustomJobDescription.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ message: 'Custom job not found' });
    (job as any).id = (job as any)._id;
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom job' });
  }
};

export default { createCustomJob, listCustomJobs };
