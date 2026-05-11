/**
 * models/Submission.js
 *
 * Mongoose schema for a plagiarism check submission.
 * Stores the original text, file metadata, extracted content,
 * and the AI-generated analysis report.
 */

import mongoose from 'mongoose';

// ─── Sub-schema: matched source ───────────────────────────────────────────────
const matchedSourceSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  title: String,
  tfidfScore: { type: Number, min: 0, max: 1 },
  embeddingScore: { type: Number, min: 0, max: 1 },
  combinedScore: { type: Number, min: 0, max: 1 },
  excerpt: String, // short snippet from the matched document
}, { _id: false });

// ─── Sub-schema: detailed AI analysis ────────────────────────────────────────
const analysisSchema = new mongoose.Schema({
  plagiarismPercentage: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'] },
  summary: String,
  directMatches: String,
  paraphrasingDetected: String,
  structuralSimilarity: String,
  aiGeneratedPatterns: String,
  conclusion: String,
  rawReport: String, // full unstructured response from Claude
}, { _id: false });

// ─── Main schema ──────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema(
  {
    // Submission identity
    title: {
      type: String,
      default: 'Untitled Submission',
      trim: true,
      maxlength: 200,
    },

    // The raw text content (extracted from file or typed directly)
    text: {
      type: String,
      required: [true, 'Submission text is required'],
    },

    // Normalised / cleaned text used for similarity computation
    processedText: {
      type: String,
    },

    // Source type
    source: {
      type: String,
      enum: ['text', 'pdf', 'docx'],
      default: 'text',
    },

    // Original filename if uploaded
    fileName: String,

    // Word count (computed at save time)
    wordCount: {
      type: Number,
      default: 0,
    },

    // Pre-computed OpenAI embedding vector (stored as flat array)
    embedding: {
      type: [Number],
      default: undefined,
      select: false, // exclude from normal queries — it's large
    },

    // Top-3 similar matches found at submission time
    topMatches: [matchedSourceSchema],

    // AI analysis from Claude
    analysis: analysisSchema,

    // Processing state
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    // Optional error message if processing failed
    errorMessage: String,
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: short excerpt ───────────────────────────────────────────────────
submissionSchema.virtual('excerpt').get(function () {
  return this.text ? this.text.slice(0, 200) + (this.text.length > 200 ? '…' : '') : '';
});

// ─── Pre-save hook: compute word count & processedText ───────────────────────
submissionSchema.pre('save', function (next) {
  if (this.isModified('text')) {
    this.wordCount = this.text.trim().split(/\s+/).filter(Boolean).length;
    // Basic normalisation: lowercase, collapse whitespace
    this.processedText = this.text.toLowerCase().replace(/\s+/g, ' ').trim();
  }
  next();
});

// ─── Index for text search ────────────────────────────────────────────────────
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ 'analysis.plagiarismPercentage': 1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
