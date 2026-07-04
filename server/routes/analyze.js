const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FileAnalysis } = require('../db');
const { analyzeFile, analyzeImage, analyzeUrlContent } = require('../services/ai');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.js','.jsx','.ts','.tsx','.py','.java','.cpp','.c','.h','.go','.rb','.php','.swift','.cs','.rs','.sql','.html','.css','.scss','.json','.xml','.yaml','.yml','.txt','.md','.pdf','.kt','.dart','.sh','.png','.jpg','.jpeg','.webp','.bmp','.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not supported`));
  }
});

async function readFileContent(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text;
    } catch (err) {
      throw new Error('Failed to parse PDF file');
    }
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// POST /api/analyze (File, Image, PDF upload)
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const ext = path.extname(fileName).toLowerCase();
  const fileType = ext.slice(1);

  try {
    let analysis;
    const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg'].includes(ext);

    if (isImage) {
      const imageBuf = fs.readFileSync(filePath);
      const base64 = imageBuf.toString('base64');
      const mimeType = req.file.mimetype || `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
      analysis = await analyzeImage(base64, mimeType, fileName);
    } else {
      const content = await readFileContent(filePath, fileName);
      if (!content || !content.trim()) return res.status(400).json({ error: 'File is empty' });
      const truncated = content.length > 60000 ? content.substring(0, 60000) + '\n...[truncated]' : content;
      analysis = await analyzeFile(truncated, fileName, fileType);
    }

    // Save analysis to MongoDB
    const saved = await FileAnalysis.create({
      file_name: fileName,
      file_type: fileType,
      file_summary: analysis.explanation,
      technologies: analysis.technologies || []
    });

    const questionsWithSource = (analysis.questions || []).map(q => ({ ...q, source_file: fileName }));

    res.json({
      analysis_id: saved._id,
      file_name: fileName,
      file_type: fileType,
      explanation: analysis.explanation,
      technologies: analysis.technologies || [],
      questions: questionsWithSource
    });
  } catch (err) {
    console.error('File analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze file' });
  } finally {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
  }
});

// POST /api/analyze/url (Analyze web link / article URL)
router.post('/url', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.trim()) return res.status(400).json({ error: 'URL link is required' });

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log(`🌐 Fetching content from URL: ${targetUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let fetchRes;
    try {
      fetchRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        return res.status(400).json({ error: 'URL request timed out. Please copy and paste the text content directly!' });
      }
      return res.status(400).json({ error: `Could not connect to URL (${fetchErr.message}). Please copy and paste the text content directly!` });
    } finally {
      clearTimeout(timeout);
    }

    if (!fetchRes.ok) {
      return res.status(400).json({ 
        error: `Website returned status ${fetchRes.status} (${fetchRes.statusText}). Automated scraping was blocked. Please copy and paste the page text into the Paste Notes tab!` 
      });
    }

    const htmlText = await fetchRes.text();
    let cleanText = '';

    // Specialized extraction for ChatGPT shared chat links (chatgpt.com/share/...)
    if (targetUrl.includes('chatgpt.com') || htmlText.includes('__NEXT_DATA__')) {
      try {
        const nextDataMatch = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        if (nextDataMatch && nextDataMatch[1]) {
          const json = JSON.parse(nextDataMatch[1]);
          const pageProps = json.props?.pageProps || {};
          const serverResponse = pageProps.serverResponse || pageProps;
          const conversationData = serverResponse.data || serverResponse.sharedConversation || serverResponse;

          let messages = [];
          if (conversationData.linear_conversation && Array.isArray(conversationData.linear_conversation)) {
            messages = conversationData.linear_conversation;
          } else if (conversationData.mapping && typeof conversationData.mapping === 'object') {
            messages = Object.values(conversationData.mapping);
          }

          messages.forEach(node => {
            const msg = node.message || node;
            const role = msg?.author?.role || msg?.role;
            const parts = msg?.content?.parts;
            if (parts && Array.isArray(parts)) {
              const text = parts.filter(p => typeof p === 'string').join('\n');
              if (text.trim() && text.length > 5) {
                cleanText += `\n\n### [${role === 'user' ? 'USER QUESTION' : 'ANSWER & CODE'}]\n${text}`;
              }
            }
          });
        }
      } catch (err) {
        console.error('ChatGPT share parse error:', err);
      }
    }

    // Fallback: Clean HTML tags, scripts, and styles for standard documentation web pages
    if (!cleanText || cleanText.length < 50) {
      cleanText = htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!cleanText || cleanText.length < 50) {
      return res.status(400).json({ error: 'Could not extract text content from this URL. Please copy and paste the page text into the Paste Notes tab!' });
    }

    const analysis = await analyzeUrlContent(cleanText, targetUrl);

    const saved = await FileAnalysis.create({
      file_name: targetUrl,
      file_type: 'url',
      file_summary: analysis.explanation,
      technologies: analysis.technologies || []
    });

    const questionsWithSource = (analysis.questions || []).map(q => ({ ...q, source_file: targetUrl }));

    res.json({
      analysis_id: saved._id,
      file_name: targetUrl,
      file_type: 'url',
      explanation: analysis.explanation,
      technologies: analysis.technologies || [],
      questions: questionsWithSource
    });
  } catch (err) {
    console.error('URL analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze URL link' });
  }
});

// POST /api/analyze/text (Analyze pasted text, questions, PDF text, or code)
router.post('/text', async (req, res) => {
  const { text, title } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text content is required' });

  try {
    const fileName = title && title.trim() ? title.trim() : 'Pasted Notes & Questions';
    const truncated = text.length > 60000 ? text.substring(0, 60000) + '\n...[truncated]' : text;
    const analysis = await analyzeFile(truncated, fileName, 'text');

    const saved = await FileAnalysis.create({
      file_name: fileName,
      file_type: 'text',
      file_summary: analysis.explanation,
      technologies: analysis.technologies || []
    });

    const questionsWithSource = (analysis.questions || []).map(q => ({ ...q, source_file: fileName }));

    res.json({
      analysis_id: saved._id,
      file_name: fileName,
      file_type: 'text',
      explanation: analysis.explanation,
      technologies: analysis.technologies || [],
      questions: questionsWithSource
    });
  } catch (err) {
    console.error('Text analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze pasted text' });
  }
});

// GET /api/analyze/history
router.get('/history', async (req, res) => {
  try {
    const history = await FileAnalysis.find().sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;

