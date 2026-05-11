/**
 * routes/submission.js
 *
 * REST API routes for the plagiarism detection system.
 *
 * Endpoints:
 *   POST   /api/submissions          → submit text or file for checking
 *   GET    /api/submissions          → list all submissions (paginated)
 *   GET    /api/submissions/stats    → dashboard statistics
 *   GET    /api/submissions/:id      → get a single submission
 *   DELETE /api/submissions/:id      → delete a submission
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  deleteSubmission,
  getStats,
} from '../controllers/submissionController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Multer configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Use timestamp + original name to avoid collisions
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${uniquePrefix}-${file.originalname}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and TXT files are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.`,
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// ─── Route definitions ────────────────────────────────────────────────────────

// Statistics (must be before :id to avoid collision)
router.get('/stats', getStats);

// Submit text or file
router.post(
  '/',
  upload.single('file'),
  handleMulterError,
  createSubmission
);

// List all submissions
router.get('/', getAllSubmissions);

// Get single submission
router.get('/:id', getSubmissionById);

// Delete submission
router.delete('/:id', deleteSubmission);

export default router;
