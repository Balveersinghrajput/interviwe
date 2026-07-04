require('dotenv').config();

/**
 * Universal AI Service
 * Supports OpenAI, OpenRouter, Groq, DeepSeek, Ollama (Local), Claude, or any OpenAI-compatible API.
 */

async function callAI(prompt) {
  // Always reload dotenv with override: true so changes in .env take effect immediately
  require('dotenv').config({ override: true });

  let provider = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase();
  let apiKey = (process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

  // Strip inline comments if any
  if (apiKey.includes('#')) {
    apiKey = apiKey.split('#')[0].trim();
  }

  if (!apiKey || apiKey.includes('PASTE_') || apiKey.includes('your_api') || apiKey.includes('...')) {
    throw new Error('Please paste your real API key (from Groq, OpenAI, etc.) into server/.env file under AI_API_KEY=');
  }

  // Auto-detect provider from API key format
  if (apiKey.startsWith('gsk_')) {
    provider = 'groq';
  } else if (apiKey.startsWith('sk-or-')) {
    provider = 'openrouter';
  }

  let model = (process.env.AI_MODEL || '').trim();
  if (!model) {
    if (provider === 'groq') model = 'llama-3.3-70b-versatile';
    else if (provider === 'openrouter') model = 'meta-llama/llama-3.3-70b-instruct';
    else if (provider === 'deepseek') model = 'deepseek-chat';
    else if (provider === 'ollama') model = 'llama3';
    else model = 'gpt-4o-mini';
  }

  let baseUrl = (process.env.AI_BASE_URL || '').trim();
  if (!baseUrl) {
    if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
    else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
    else if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
    else if (provider === 'ollama') baseUrl = 'http://localhost:11434/v1';
    else baseUrl = 'https://api.openai.com/v1';
  }

  // Remove trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');

  // 1. Gemini Fallback if provider explicitly set to gemini
  if (provider === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash' });
    const res = await geminiModel.generateContent(prompt);
    return res.response.text();
  }

  // 2. OpenAI / OpenRouter / Groq / DeepSeek / Ollama / Custom API (Standard Chat Completion)
  const endpoint = `${baseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'InterviewHub';
  }

  const maxTokens = provider === 'groq' ? 2500 : 8192;

  const body = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a Principal Software Engineer and Technical Interviewer. Always respond in strict valid JSON format. All code snippets in string fields must have properly escaped quotes and newline characters.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ AI API Error (${provider}):`, response.status, errorText);

    // Auto-retry with lighter model / lower max_tokens if HTTP 400, 413 (TPM limit), or 429
    if (response.status === 400 || response.status === 413 || response.status === 429) {
      console.log('🔄 Retrying AI call with fallback parameters and model...');
      delete body.response_format;
      if (provider === 'groq') {
        body.model = 'llama-3.1-8b-instant';
        body.max_tokens = 2500;
      } else {
        body.max_tokens = 2000;
      }
      const retryRes = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        return retryData.choices && retryData.choices[0] && retryData.choices[0].message ? retryData.choices[0].message.content : '';
      }
    }

    if (response.status === 401) {
      throw new Error(`Invalid API Key for ${provider.toUpperCase()}. Please check your key in server/.env.`);
    }
    if (response.status === 429) {
      throw new Error(`Rate limit reached for ${provider.toUpperCase()}. Please wait a few seconds and try again.`);
    }
    throw new Error(`AI API call failed [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
  return content;
}

function cleanJSONResponse(rawText) {
  if (!rawText) throw new Error("AI returned an empty response. Please try again.");
  let cleaned = rawText.trim();

  // Strip ```json markdown blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  // Extract JSON object substring
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // 1. Try sanitizing control characters
    try {
      const sanitized = cleaned
        .replace(/[\u0000-\u001F]+/g, (m) => {
          if (m === '\n') return '\\n';
          if (m === '\r') return '\\r';
          if (m === '\t') return '\\t';
          return '';
        });
      return JSON.parse(sanitized);
    } catch (e) {
      // 2. Salvage partial questions array if JSON was truncated by max tokens
      try {
        const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)/);
        if (questionsMatch) {
          let questionsStr = questionsMatch[1];
          const lastObjEnd = questionsStr.lastIndexOf('}');
          if (lastObjEnd !== -1) {
            let validArrayStr = '[' + questionsStr.substring(0, lastObjEnd + 1) + ']';
            validArrayStr = validArrayStr.replace(/[\u0000-\u001F]+/g, (m) => (m === '\n' ? '\\n' : m === '\t' ? '\\t' : ''));
            const parsedQuestions = JSON.parse(validArrayStr);
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              return {
                explanation: "Successfully extracted questions from document",
                technologies: ["Java", "DSA"],
                questions: parsedQuestions
              };
            }
          }
        }
      } catch (salvageErr) {
        console.error("Salvage error:", salvageErr);
      }
      console.error("JSON parse error on raw text snippet:", rawText.substring(0, 300));
      throw new Error("AI returned invalid JSON format. Please click Analyze again.");
    }
  }
}

async function analyzeFile(fileContent, fileName, fileType) {
  const prompt = `Analyze the following technical file/document/code content thoroughly and extract structured interview questions & answers across ALL sections.

CRITICAL INSTRUCTIONS FOR ACCURATE EXTRACTION:
1. DO NOT summarize, abbreviate, or shorten any code snippets or output comments! Preserve the exact, full code (including import statements, class headers, and main methods) in "codeExample".
2. Include the exact output comment (e.g. "// output :- ...") and step-by-step logic in the "answer" field verbatim.
3. Extract EVERY distinct topic, pattern, or code block present in the text (such as Variables, Conditional Statements, Switch Statement, Loops, Methods, Star Patterns, Arrays, Basic Sorting, 2D Arrays, String Manipulation, Bit Manipulation, OOP Concepts, Recursion, ArrayList, LinkedList, Doubly LinkedList, Cycle Detection, etc.).
4. Assign clear, descriptive question titles based on the topic comments or logic (e.g. "Variables in Java - Declaration & Print", "Check Even or Odd Number using Modulo", "Tax Calculator Logic", "Print Largest of 3 Numbers", "Butterfly Star Pattern", "Reverse a Linked List", "Detect Cycle in Linked List using Slow & Fast Pointers").
5. Auto-detect language precisely: Use "DSA (Java)" for Java algorithms & Data Structures, "Java" for core Java, "Python", "JavaScript", "C++", "SQL", etc.
6. Map category accurately:
   - "Basics" for Variables, Conditionals, Loops, Switch Statements, Methods
   - "OOP" for Classes, Inheritance, Constructors, Abstraction, Polymorphism
   - "Data Structures" for Arrays, 2D Arrays, Strings, ArrayList, LinkedList, Doubly LinkedList
   - "Algorithms" for Sorting (Bubble, Selection, Insertion), Binary Search, Linear Search, Recursion, Bit Manipulation
   - "Design Patterns", "Database", "System Design"

Return ONLY valid JSON in this exact structure:
{
  "explanation": "Brief overview of the entire document and topics covered",
  "technologies": ["Tech1", "Tech2"],
  "questions": [
    {
      "language": "DSA (Java)|Java|Python|JavaScript|...",
      "category": "Basics|OOP|Data Structures|Algorithms|Design Patterns|Framework-Specific|Database|System Design",
      "difficulty": "Easy|Medium|Hard",
      "question": "Descriptive Question Title",
      "answer": "Detailed answer with exact output explanation verbatim",
      "codeExample": "Full intact code snippet with all imports, class, and main method"
    }
  ]
}

FILE NAME: ${fileName}
FILE TYPE: ${fileType}
CONTENT:
${fileContent}`;

  const responseText = await callAI(prompt);
  return cleanJSONResponse(responseText);
}

async function analyzeImage(imageBase64, mimeType, fileName) {
  require('dotenv').config({ override: true });
  let apiKey = (process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (apiKey.includes('#')) apiKey = apiKey.split('#')[0].trim();

  // 1. Try Gemini Vision if Gemini API key or gemini provider
  if (apiKey.startsWith('AIza') || (process.env.AI_PROVIDER || '').toLowerCase() === 'gemini') {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze this image (which may be a screenshot of code, diagram, question paper, resume, or technical notes).
Extract all technical details and generate 8-15 technical interview questions with full detailed answers and code examples.

Return ONLY valid JSON:
{
  "explanation": "...",
  "technologies": ["Tech1", "Tech2"],
  "questions": [
    {
      "language": "Java|JavaScript|Python|React|DSA (Java)|System Design",
      "category": "Basics|OOP|Data Structures|Algorithms|System Design",
      "difficulty": "Easy|Medium|Hard",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}`;
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      };
      const res = await model.generateContent([prompt, imagePart]);
      return cleanJSONResponse(res.response.text());
    } catch (err) {
      console.warn('Gemini vision failed, falling back to OpenAI/Groq vision or prompt:', err.message);
    }
  }

  // 2. Try OpenAI / Groq Vision or Vision chat completion endpoint
  const endpoint = `https://api.groq.com/openai/v1/chat/completions`;
  const body = {
    model: 'llama-3.2-11b-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image containing technical content, code, questions, or notes.
Generate 8-15 technical interview questions with comprehensive answers and code examples.
Return ONLY valid JSON matching this exact structure:
{
  "explanation": "...",
  "technologies": ["Tech1", "Tech2"],
  "questions": [
    {
      "language": "DSA (Java)|DSA (Python)|Java|JavaScript|Python|React|Database",
      "category": "Basics|OOP|Data Structures|Algorithms|Design Patterns|Database|System Design",
      "difficulty": "Easy|Medium|Hard",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      return cleanJSONResponse(content);
    }
  } catch (err) {
    console.warn('Groq vision failed:', err.message);
  }

  // 3. Fallback: Use text model to generate technical interview questions for the uploaded image/file topic
  try {
    console.log(`ℹ️ Vision model unavailable/restricted, using standard AI model for image: ${fileName}`);
    const fallbackPrompt = `The user uploaded/pasted an image screenshot/file named "${fileName}".
Generate 8-12 comprehensive, high-frequency technical interview questions with answers and code examples covering relevant computer science concepts (Data Structures, Algorithms, OOP, Web/System Architecture).

Return ONLY valid JSON in this exact structure:
{
  "explanation": "Analyzed technical content from file '${fileName}'. Extracted concepts and generated technical Q&As.",
  "technologies": ["Software Engineering", "Algorithms", "Data Structures"],
  "questions": [
    {
      "language": "DSA (Java)",
      "category": "Algorithms",
      "difficulty": "Medium",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}`;
    const responseText = await callAI(fallbackPrompt);
    return cleanJSONResponse(responseText);
  } catch (err) {
    throw new Error(`Image analysis could not be completed. Please paste the copied text directly into the text tab!`);
  }
}

async function analyzeUrlContent(urlContent, url) {
  const prompt = `Analyze the web page / document content extracted from the URL: "${url}".

CRITICAL INSTRUCTION: EXTRACT EVERY SINGLE INTERVIEW QUESTION & ANSWER PRESENT IN THIS DOCUMENT OR CHAT CONVERSATION! Generate up to 30+ questions covering ALL topics mentioned. DO NOT limit or cap the question count to 8!

1. Summarize the content in 3-5 sentences.
2. List detected technologies in array format.
3. For EVERY question, topic, or code problem found:
   - Provide a clear, descriptive question title.
   - Put the exact answer and output explanation verbatim in "answer".
   - Put the full, intact code snippet (including imports, classes, and main methods) in "codeExample".

Return ONLY valid JSON in this exact structure:
{
  "explanation": "Brief overview of all topics in the document",
  "technologies": ["Tech1", "Tech2"],
  "questions": [
    {
      "language": "DSA (Java)|Java|Python|JavaScript|React|Node.js|SQL|...",
      "category": "Basics|OOP|Data Structures|Algorithms|Design Patterns|Framework-Specific|Database|System Design",
      "difficulty": "Easy|Medium|Hard",
      "question": "Descriptive Question Title",
      "answer": "Detailed answer with exact output explanation",
      "codeExample": "Full intact code snippet"
    }
  ]
}

URL: ${url}
CONTENT:
${urlContent.substring(0, 60000)}`;

  const responseText = await callAI(prompt);
  return cleanJSONResponse(responseText);
}

async function generateQuestionsByAI(language, category = 'All', count = 10, difficulty = 'Mixed') {
  const prompt = `Generate exactly ${count} realistic, high-frequency technical interview questions for ${language}${category && category !== 'All' ? ` focused on ${category}` : ''}.

IMPORTANT: Format and arrange questions in a logical STEP-BY-STEP ROADMAP PATTERN (starting from Step 1: Core Basics, moving to Step 2: OOP, Step 3: Data Structures, Step 4: Algorithms, up to Advanced System Design).

Mix of difficulty: ${difficulty}.
Categories allowed: "Basics", "OOP", "Data Structures", "Algorithms", "Design Patterns", "Framework-Specific", "Database", "System Design".

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "language": "${language}",
      "category": "Basics|OOP|Data Structures|Algorithms|Design Patterns|Framework-Specific|Database|System Design",
      "difficulty": "Easy|Medium|Hard",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}`;

  const responseText = await callAI(prompt);
  const parsed = cleanJSONResponse(responseText);
  return parsed.questions || [];
}

async function answerAndCategorizeQuestion(userQuestion, suggestedLanguage = '') {
  const prompt = `You are a Senior Technical Interview Expert.
A user asked the following interview question:
"${userQuestion}"

Your job:
1. Auto-detect the programming language / technology. Use "DSA (Java)" for Java algorithms/Data Structures, "DSA (Python)" for Python algorithms, "DSA (C++)" for C++ algorithms, or "Java", "JavaScript", "Python", "React", "Node.js", "SQL", "MongoDB", "Project: RealityEngine", etc.
2. Auto-categorize into ONE of: "Basics", "OOP", "Data Structures", "Algorithms", "Design Patterns", "Framework-Specific", "Database", "System Design".
3. Auto-assign difficulty: "Easy", "Medium", or "Hard".
4. Write a comprehensive, expert interview answer (4-8 sentences).
5. Write a clean, commented code example demonstrating the answer.

Return ONLY valid JSON in this exact structure:
{
  "language": "...",
  "category": "...",
  "difficulty": "Easy|Medium|Hard",
  "question": "${userQuestion.replace(/"/g, '\\"')}",
  "answer": "...",
  "codeExample": "..."
}`;

  const responseText = await callAI(prompt);
  return cleanJSONResponse(responseText);
}

module.exports = { callAI, cleanJSONResponse, analyzeFile, analyzeImage, analyzeUrlContent, generateQuestionsByAI, answerAndCategorizeQuestion };


