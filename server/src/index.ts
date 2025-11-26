import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDb } from './config/db';
import { seedJobRoles } from './utils/seed';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobRoles';
import interviewRoutes from './routes/interviewSessions';
import profileRoutes from './routes/profile';
import functionsRoutes from './routes/functions';
import uploadRoutes from './routes/upload';
import customJobRoutes from './routes/customJobs';
import paymentsRoutes from './routes/payments';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// connect to DB
connectDb();
// seed defaults
seedJobRoles();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/job-roles', jobRoutes);
app.use('/api/interview-sessions', interviewRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/custom-job', customJobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'InterviewPrep API (MERN) is running' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
