const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeFile(fileContent, fileName, fileType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert technical interviewer. Analyze the following file and:

1. **Explain** what this file does in 3-5 sentences. Be specific about its purpose, architecture, and key patterns used.
2. **Detect** all technologies, frameworks, and programming languages used.
3. **Generate exactly 8 interview questions** based on the concepts, technologies, and patterns found in this file. 

For each question provide:
- "language": The primary programming language (e.g., "JavaScript", "Java", "Python")
- "category": One of these categories ONLY: "Basics", "OOP", "Data Structures", "Algorithms", "Design Patterns", "Framework-Specific", "Database", "System Design"
- "difficulty": One of "Easy", "Medium", "Hard" (mix of all three)
- "question": A clear interview question
- "answer": A detailed best answer (3-6 sentences)
- "codeExample": A relevant code example (can be from the file or a clean example demonstrating the concept). Use proper indentation.

**IMPORTANT: Return ONLY valid JSON in this exact format, no markdown code fences:**
{
  "explanation": "...",
  "technologies": ["Tech1", "Tech2"],
  "questions": [
    {
      "language": "...",
      "category": "...",
      "difficulty": "...",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}

---
FILE NAME: ${fileName}
FILE TYPE: ${fileType}
FILE CONTENT:
${fileContent}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up response — remove markdown code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error('Gemini API error:', err);
    throw new Error('Failed to analyze file with AI: ' + err.message);
  }
}

async function generateQuestionsByAI(language, category = 'All', count = 10, difficulty = 'Mixed') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a Principal Software Architect and Senior Technical Interviewer.
Generate exactly ${count} realistic, high-frequency technical interview questions for ${language}${category && category !== 'All' ? ` focused on ${category}` : ''}.

Ensure a mix of difficulty levels (${difficulty}) and cover diverse categories like:
"Basics", "OOP", "Data Structures", "Algorithms", "Design Patterns", "Framework-Specific", "Database", "System Design".

For EVERY question, provide:
- "language": "${language}"
- "category": One of "Basics", "OOP", "Data Structures", "Algorithms", "Design Patterns", "Framework-Specific", "Database", "System Design"
- "difficulty": "Easy", "Medium", or "Hard"
- "question": A crisp, high-quality interview question asked by top tech companies
- "answer": A comprehensive, expert answer (4-8 sentences) explaining core principles, trade-offs, and best practices
- "codeExample": Clear, idiomatic code snippet demonstrating the solution or concept with comments.

**IMPORTANT: Return ONLY valid JSON in this exact structure, no markdown formatting outside JSON:**
{
  "questions": [
    {
      "language": "${language}",
      "category": "...",
      "difficulty": "...",
      "question": "...",
      "answer": "...",
      "codeExample": "..."
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    let cleaned = result.response.text().trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    return parsed.questions || [];
  } catch (err) {
    console.error('Gemini question generation error:', err);
    throw new Error('AI Question Generation failed: ' + err.message);
  }
}

module.exports = { analyzeFile, generateQuestionsByAI };
