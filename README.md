# PlagiaScope — AI-Powered Plagiarism Detection System

> A production-quality, full-stack plagiarism detection platform built for final-year CS projects.
> Uses TF-IDF, OpenAI embeddings, and Claude AI for multi-algorithm analysis.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)               │
│  HomePage → UploadForm → API call                           │
│  ResultsPage → ResultsDashboard → PlagiarismMeter,          │
│                 AIReport, MatchedSources                     │
│  HistoryPage → Paginated table of all submissions           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (Vite proxy → localhost:5000)
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│  POST /api/submissions                                      │
│    1. Extract text (multer + pdf-parse + mammoth)           │
│    2. TF-IDF cosine similarity  (natural library)           │
│    3. OpenAI text-embedding-3-small                         │
│    4. Combine scores → top 3 matches                        │
│    5. Claude API → structured JSON report                   │
│    6. Persist to MongoDB                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼──────────────────────────────────┐
│                     MongoDB (local / Atlas)                  │
│  Collection: submissions                                    │
│  Stores: text, embedding vector, analysis, matches          │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local install or MongoDB Atlas free tier)
- OpenAI API key (for embeddings)
- Anthropic API key (for Claude report generation)

---

## Setup Instructions

### 1. Clone / extract the project

```bash
cd plagiarism-detector
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy the example env file and fill in your keys
cp .env.example .env
nano .env   # or open in your editor
```

**Required `.env` values:**
```
MONGODB_URI=mongodb://127.0.0.1:27017/plagiarism_db
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Start MongoDB locally:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

Start the backend:
```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

The API will be running at `http://localhost:5000`

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

The app will be at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/submissions` | Submit text or file for checking |
| `GET`  | `/api/submissions` | List all submissions (paginated) |
| `GET`  | `/api/submissions/stats` | Dashboard statistics |
| `GET`  | `/api/submissions/:id` | Get single submission |
| `DELETE` | `/api/submissions/:id` | Delete a submission |
| `GET`  | `/api/health` | Health check |

### Submit text example (curl):
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"title": "My Essay", "text": "Your essay text here..."}'
```

### Submit file example (curl):
```bash
curl -X POST http://localhost:5000/api/submissions \
  -F "title=My Report" \
  -F "file=@/path/to/document.pdf"
```

---

## How the Detection Works

### Stage 1: TF-IDF Cosine Similarity (Weight: 35%)
- Tokenises and stems both documents using the Porter Stemmer
- Removes stop words and builds a shared vocabulary
- Computes TF-IDF vectors and calculates cosine similarity
- Best for detecting verbatim and near-verbatim copying

### Stage 2: OpenAI Embedding Similarity (Weight: 65%)
- Sends text to `text-embedding-3-small` (1536 dimensions)
- Long texts are chunked and embeddings are averaged
- Cosine similarity on semantic vectors
- Catches paraphrasing, idea theft, and structural copying

### Stage 3: Claude AI Report
- Top 3 matches + combined score sent to `claude-sonnet-4-20250514`
- Returns structured JSON with: percentage, risk level, section-by-section analysis, flagged excerpts, and conclusion

### Final Score Formula:
```
finalScore = (tfidf * 0.35) + (embedding * 0.65)
plagiarismPercentage = round(finalScore * 100)
```

---

## Project Structure

```
plagiarism-detector/
├── backend/
│   ├── .env.example          # Environment variable template
│   ├── package.json
│   ├── server.js             # Express app entry point
│   ├── models/
│   │   └── Submission.js     # Mongoose schema
│   ├── routes/
│   │   └── submission.js     # API routes + multer config
│   ├── controllers/
│   │   └── submissionController.js  # Business logic
│   ├── utils/
│   │   ├── textExtractor.js  # PDF + DOCX text extraction
│   │   ├── tfidfSimilarity.js        # TF-IDF algorithm
│   │   ├── embeddingsSimilarity.js   # OpenAI embeddings
│   │   └── claudeAnalysis.js         # Claude AI report
│   └── uploads/              # Temporary file storage
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx            # Router
        ├── index.css          # Global design system
        ├── utils/
        │   └── api.js         # Axios API client
        ├── components/
        │   ├── Navbar.jsx
        │   ├── UploadForm.jsx       # Text/file input
        │   ├── ResultsDashboard.jsx # Results layout
        │   ├── PlagiarismMeter.jsx  # Circular gauge
        │   ├── MatchedSources.jsx   # Source cards
        │   └── AIReport.jsx        # Claude report display
        └── pages/
            ├── HomePage.jsx     # Submit page
            ├── ResultsPage.jsx  # Results display
            └── HistoryPage.jsx  # All submissions
```

---

## Possible Improvements

### Performance
- Add Redis caching for embeddings (avoid re-computing unchanged documents)
- Use worker threads for TF-IDF on large corpora (>10 000 documents)
- Implement background job queue (BullMQ) so the API returns immediately

### Detection Quality
- Add n-gram fingerprinting (Rabin-Karp rolling hash) as a third algorithm
- Integrate web search API (SerpAPI / Google CSE) for internet plagiarism detection
- Add sentence-level comparison for pinpoint highlighting
- Fine-tune embedding weights per document type (academic vs. code)

### Academic Features
- Student/instructor role-based access (JWT auth)
- Batch upload for checking an entire class's submissions
- Export report as PDF (using Puppeteer)
- Citation extraction and bibliography checking
- Plagiarism threshold alerts (email notifications)

### Infrastructure
- Dockerise the entire stack (`docker-compose.yml`)
- Deploy backend to Railway/Render, frontend to Vercel
- Switch to MongoDB Atlas for persistent cloud storage
- Add request rate limiting (express-rate-limit)
- Implement comprehensive logging (Winston + Morgan)

---

## License

MIT — Free to use for academic and personal projects.
