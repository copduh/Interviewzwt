import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req: any, file, cb) {
    const userId = req.user._id.toString();
    const sessionId = req.body.sessionId || 'misc';
    const dir = path.join(__dirname, '../../uploads', userId, sessionId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post('/', authMiddleware, upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const filePath = req.file.path;
  res.json({ filePath });
});

export default router;
