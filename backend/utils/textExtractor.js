/**
 * utils/textExtractor.js
 *
 * Extracts plain text from uploaded PDF or DOCX files.
 * Uses pdf-parse for PDFs and mammoth for DOCX files.
 */

import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from a file based on its MIME type or extension.
 *
 * @param {string} filePath  - Absolute path to the uploaded file on disk
 * @param {string} mimetype  - MIME type reported by multer
 * @returns {Promise<string>} - Extracted plain text
 */
export async function extractText(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    return extractFromPDF(filePath);
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    return extractFromDOCX(filePath);
  }

  // ── Plain text fallback ───────────────────────────────────────────────────
  if (mimetype === 'text/plain' || ext === '.txt') {
    return fs.readFile(filePath, 'utf-8');
  }

  throw new Error(`Unsupported file type: ${mimetype || ext}`);
}

/**
 * Extract text from a PDF buffer.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractFromPDF(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);

  if (!data.text || data.text.trim().length === 0) {
    throw new Error('PDF appears to be scanned / image-based and contains no extractable text.');
  }

  // Clean up excessive whitespace introduced by PDF column layout
  return data.text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from a DOCX file.
 * mammoth.extractRawText strips all formatting and returns clean prose.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });

  if (result.messages.length > 0) {
    const warnings = result.messages.filter((m) => m.type === 'warning');
    if (warnings.length) {
      console.warn('[textExtractor] DOCX warnings:', warnings.map((w) => w.message));
    }
  }

  if (!result.value || result.value.trim().length === 0) {
    throw new Error('DOCX file appears to be empty or contains no extractable text.');
  }

  return result.value.trim();
}

/**
 * Clean and normalise extracted text for downstream processing.
 * - Removes control characters
 * - Collapses multiple spaces/newlines
 * - Trims
 *
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
    .replace(/[ \t]+/g, ' ')                             // collapse spaces
    .replace(/\n{3,}/g, '\n\n')                          // max 2 newlines
    .trim();
}
