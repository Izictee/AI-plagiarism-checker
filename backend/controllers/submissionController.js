/**
 * controllers/submissionController.js
 *
 * Contains all business logic for:
 *  - Creating a new submission (text or file)
 *  - Running multi-source plagiarism detection
 *  - Generating an AI analysis report
 *  - Retrieving past submissions
 *  - Deleting submissions
 */

import fs from 'fs/promises';
import Submission from '../models/Submission.js';
import { extractText, cleanText } from '../utils/textExtractor.js';
import { computeTFIDFSimilarity } from '../utils/tfidfSimilarity.js';
import { generateEmbedding, computeEmbeddingSimilarity } from '../utils/embeddingsSimilarity.js';
import { generatePlagiarismReport } from '../utils/claudeAnalysis.js';

// Weights for the combined similarity score
const TFIDF_WEIGHT = 0.35;
const EMBEDDING_WEIGHT = 0.65;

// ─── Helper: combine TF-IDF and embedding scores into one score ───────────────
function combineScores(tfidfScore = 0, embeddingScore = 0) {
  return parseFloat(
    (tfidfScore * TFIDF_WEIGHT + embeddingScore * EMBEDDING_WEIGHT).toFixed(4)
  );
}

// ─── CREATE — Submit text or file for plagiarism checking ─────────────────────
export async function createSubmission(req, res, next) {
  let filePath = null;

  try {
    const { title } = req.body;
    let rawText = '';
    let source = 'text';
    let fileName = null;

    // ── Determine input source ────────────────────────────────────────────
    if (req.file) {
      // File was uploaded via multer
      filePath = req.file.path;
      fileName = req.file.originalname;
      source = req.file.mimetype.includes('pdf') ? 'pdf' : 'docx';

      rawText = await extractText(filePath, req.file.mimetype);
    } else if (req.body.text && req.body.text.trim().length > 0) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: 'Provide either text content or a file upload.' });
    }

    // ── Basic validation ──────────────────────────────────────────────────
    const cleanedText = cleanText(rawText);
    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 20) {
      return res.status(400).json({ error: 'Submission must contain at least 20 words.' });
    }

    // ── Create a pending submission record ────────────────────────────────
    const submission = new Submission({
      title: title || fileName || `Submission ${new Date().toLocaleDateString()}`,
      text: cleanedText,
      source,
      fileName,
      status: 'processing',
    });
    await submission.save();

    // ── Load all existing submissions for comparison ──────────────────────
    // Exclude the newly created one and retrieve embeddings (normally excluded)
    const existingDocs = await Submission.find({ _id: { $ne: submission._id } })
      .select('+embedding text title createdAt')
      .lean();

    // ── Stage 1: TF-IDF cosine similarity ────────────────────────────────
    const tfidfDocs = existingDocs.map((d) => ({ id: d._id.toString(), text: d.text }));
    const tfidfScores = computeTFIDFSimilarity(cleanedText, tfidfDocs);
    const tfidfMap = Object.fromEntries(tfidfScores.map((s) => [s.id, s.score]));

    // ── Stage 2: Embedding (semantic) similarity ──────────────────────────
    let embeddingMap = {};
    let queryEmbedding = null;

    try {
      queryEmbedding = await generateEmbedding(cleanedText);

      const embeddingDocs = existingDocs
        .filter((d) => d.embedding && d.embedding.length > 0)
        .map((d) => ({ id: d._id.toString(), embedding: d.embedding }));

      const embeddingScores = computeEmbeddingSimilarity(queryEmbedding, embeddingDocs);
      embeddingMap = Object.fromEntries(embeddingScores.map((s) => [s.id, s.score]));
    } catch (embErr) {
      console.warn('[controller] Embedding generation failed, falling back to TF-IDF only:', embErr.message);
      // Degrade gracefully: use only TF-IDF
    }

    // ── Stage 3: Combine scores and find top 3 matches ────────────────────
    const combinedScores = existingDocs.map((doc) => {
      const id = doc._id.toString();
      const tfidf = tfidfMap[id] || 0;
      const embedding = embeddingMap[id] || 0;
      const combined = combineScores(tfidf, embedding);
      return {
        submissionId: doc._id,
        title: doc.title,
        tfidfScore: tfidf,
        embeddingScore: embedding,
        combinedScore: combined,
        excerpt: doc.text ? doc.text.slice(0, 250) + '…' : '',
      };
    });

    const topMatches = combinedScores
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 3);

    // Overall document score = highest single combined score
    const overallScore = topMatches.length > 0 ? topMatches[0].combinedScore : 0;

    // ── Stage 4: Claude AI analysis report ───────────────────────────────
    const analysis = await generatePlagiarismReport({
      submittedText: cleanedText,
      topMatches,
      combinedScore: overallScore,
    });

    // ── Persist final results ─────────────────────────────────────────────
    submission.embedding = queryEmbedding;
    submission.topMatches = topMatches;
    submission.analysis = analysis;
    submission.status = 'completed';
    await submission.save();

    // ── Clean up uploaded file ────────────────────────────────────────────
    if (filePath) {
      await fs.unlink(filePath).catch(() => {}); // best-effort cleanup
    }

    // ── Return result ─────────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      submissionId: submission._id,
      title: submission.title,
      wordCount: submission.wordCount,
      source: submission.source,
      topMatches,
      analysis,
      createdAt: submission.createdAt,
    });

  } catch (err) {
    // Try to mark submission as failed
    console.error('[createSubmission]', err);

    // Clean up file on error
    if (filePath) await fs.unlink(filePath).catch(() => {});

    next(err);
  }
}

// ─── GET ALL — List all submissions (paginated) ───────────────────────────────
export async function getAllSubmissions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find()
        .select('-embedding -text') // don't return huge fields in list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET ONE — Retrieve a single submission by ID ─────────────────────────────
export async function getSubmissionById(req, res, next) {
  try {
    const submission = await Submission.findById(req.params.id)
      .select('-embedding')
      .lean();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    return res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE — Remove a submission ────────────────────────────────────────────
export async function deleteSubmission(req, res, next) {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    return res.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// ─── GET STATS — Dashboard statistics ────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    const [total, byRisk] = await Promise.all([
      Submission.countDocuments({ status: 'completed' }),
      Submission.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$analysis.riskLevel', count: { $sum: 1 } } },
      ]),
    ]);

    const riskCounts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    byRisk.forEach(({ _id, count }) => { if (_id) riskCounts[_id] = count; });

    return res.json({
      success: true,
      stats: {
        totalSubmissions: total,
        riskDistribution: riskCounts,
      },
    });
  } catch (err) {
    next(err);
  }
}
