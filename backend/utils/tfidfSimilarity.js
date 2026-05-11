/**
 * utils/tfidfSimilarity.js
 *
 * Implements TF-IDF vectorisation and cosine similarity comparison
 * using the `natural` NLP library.
 *
 * Algorithm overview:
 *  1. Tokenise + stem all documents with the Porter stemmer.
 *  2. Build a TF-IDF model over all stored documents + the query.
 *  3. Retrieve the TF-IDF vector for each document.
 *  4. Compute cosine similarity between the query vector and each stored doc.
 */

import natural from 'natural';

const { TfIdf, PorterStemmer, WordTokenizer } = natural;
const tokenizer = new WordTokenizer();

/**
 * Preprocess a document: tokenise, lowercase, stem, remove stop-words.
 *
 * @param {string} text
 * @returns {string} space-joined stemmed tokens
 */
function preprocess(text) {
  const stopWords = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','it','its','was','are','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should',
    'may','might','shall','can','not','no','nor','so','yet','both','either',
    'neither','each','few','more','most','other','some','such','than','too',
    'very','just','about','above','after','before','between','into','through',
    'during','that','this','these','those','he','she','they','we','you','i',
    'me','him','her','us','them','what','which','who','when','where','why','how',
  ]);

  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  return tokens
    .filter((t) => t.length > 2 && !stopWords.has(t))
    .map((t) => PorterStemmer.stem(t))
    .join(' ');
}

/**
 * Compute TF-IDF cosine similarity between a query document and a set of
 * stored documents.
 *
 * @param {string}   queryText   - The submission being checked
 * @param {Array<{id: string, text: string}>} documents - All stored docs
 * @returns {Array<{id: string, score: number}>} Sorted (desc) similarity scores
 */
export function computeTFIDFSimilarity(queryText, documents) {
  if (!documents || documents.length === 0) return [];

  const tfidf = new TfIdf();

  // Index: 0 = query, 1..n = stored documents
  tfidf.addDocument(preprocess(queryText));
  documents.forEach((doc) => tfidf.addDocument(preprocess(doc.text)));

  // Collect all unique terms across all documents to build a shared vocab
  const vocab = new Set();
  tfidf.documents.forEach((doc) => {
    Object.keys(doc).forEach((term) => {
      if (term !== '__key') vocab.add(term);
    });
  });
  const terms = Array.from(vocab);

  /**
   * Extract a TF-IDF vector for the document at the given index.
   * @param {number} docIndex
   * @returns {number[]}
   */
  const getVector = (docIndex) =>
    terms.map((term) => tfidf.tfidf(term, docIndex));

  /**
   * Compute cosine similarity between two vectors.
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number} similarity in [0, 1]
   */
  const cosineSimilarity = (vecA, vecB) => {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  };

  const queryVector = getVector(0);

  // Compare query against each stored document (indices 1..n)
  const scores = documents.map((doc, i) => ({
    id: doc.id,
    score: parseFloat(cosineSimilarity(queryVector, getVector(i + 1)).toFixed(4)),
  }));

  // Sort descending by score
  return scores.sort((a, b) => b.score - a.score);
}
