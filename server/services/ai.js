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

function getVisualExplanationFallback(topicName) {
  const topicLower = topicName.toLowerCase();
  
  if (topicLower.includes('sort') || topicLower.includes('bubble')) {
    return {
      title: "Bubble Sort Algorithm",
      analogy: "Sorting 5 books of different heights on a library shelf",
      explanation: `### Bubble Sort Visualization & Tutorial\n\nBubble Sort is a simple comparison-based sorting algorithm. It works by repeatedly stepping through the list to be sorted, comparing each pair of adjacent items, and swapping them if they are in the wrong order (e.g., ascending order).\n\n#### How It Works:\n1. Compare adjacent elements. If the left element is greater than the right, swap them.\n2. Do this for all adjacent pairs in the array. At the end of the first pass, the largest element is 'bubbled' up to its correct final position.\n3. Repeat for all remaining unsorted elements.\n\n#### Time & Space Complexity:\n- **Best Case**: O(N) (when the array is already sorted)\n- **Average/Worst Case**: O(N²)\n- **Space Complexity**: O(1) (In-place sorting)\n\n#### Java Code Example:\n\`\`\`java\npublic static void bubbleSort(int[] arr) {\n    int n = arr.length;\n    for (int i = 0; i < n - 1; i++) {\n        boolean swapped = false;\n        for (int j = 0; j < n - 1 - i; j++) {\n            if (arr[j] > arr[j + 1]) {\n                // Swap arr[j] and arr[j+1]\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n                swapped = true;\n            }\n        }\n        if (!swapped) break;\n    }\n}\n\`\`\``,
      verbalScript: "Let's learn bubble sort by sorting books on a library shelf by height. We'll compare books side-by-side, swapping them if the left one is taller, until the tallest book bubbles to the end of the shelf.",
      topicType: "bubble_sort",
      codeExample: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
      visualSteps: [
        {
          stepNumber: 1,
          description: "Initial state of unsorted books on the shelf",
          state: {
            array: [25, 12, 38, 15, 20],
            labels: ["Math (25)", "History (12)", "Physics (38)", "Novel (15)", "Bio (20)"],
            highlight: [],
            sorted: []
          },
          spokenText: "We start with five unsorted books on the shelf. Their heights are 25, 12, 38, 15, and 20 centimeters."
        },
        {
          stepNumber: 2,
          description: "Compare Math (25) and History (12)",
          state: {
            array: [25, 12, 38, 15, 20],
            labels: ["Math (25)", "History (12)", "Physics (38)", "Novel (15)", "Bio (20)"],
            highlight: [0, 1],
            sorted: []
          },
          spokenText: "First, we compare the Math book and the History book. Since 25 is greater than 12, they are in the wrong order."
        },
        {
          stepNumber: 3,
          description: "Swap Math and History books",
          state: {
            array: [12, 25, 38, 15, 20],
            labels: ["History (12)", "Math (25)", "Physics (38)", "Novel (15)", "Bio (20)"],
            highlight: [0, 1],
            sorted: []
          },
          spokenText: "We swap the Math and History books. The shelf is now slightly more sorted."
        },
        {
          stepNumber: 4,
          description: "Compare Math (25) and Physics (38)",
          state: {
            array: [12, 25, 38, 15, 20],
            labels: ["History (12)", "Math (25)", "Physics (38)", "Novel (15)", "Bio (20)"],
            highlight: [1, 2],
            sorted: []
          },
          spokenText: "Next, we compare the Math book with the Physics book. Since 25 is less than 38, they are already in the correct order."
        },
        {
          stepNumber: 5,
          description: "Compare Physics (38) and Novel (15)",
          state: {
            array: [12, 25, 38, 15, 20],
            labels: ["History (12)", "Math (25)", "Physics (38)", "Novel (15)", "Bio (20)"],
            highlight: [2, 3],
            sorted: []
          },
          spokenText: "Now we compare the Physics book with the Novel. Since 38 is greater than 15, we must swap them."
        },
        {
          stepNumber: 6,
          description: "Swap Physics and Novel books",
          state: {
            array: [12, 25, 15, 38, 20],
            labels: ["History (12)", "Math (25)", "Novel (15)", "Physics (38)", "Bio (20)"],
            highlight: [2, 3],
            sorted: []
          },
          spokenText: "Swapping Physics and Novel. The Physics book continues to bubble toward the right."
        },
        {
          stepNumber: 7,
          description: "Compare Physics (38) and Bio (20) and swap them",
          state: {
            array: [12, 25, 15, 20, 38],
            labels: ["History (12)", "Math (25)", "Novel (15)", "Bio (20)", "Physics (38)"],
            highlight: [3, 4],
            sorted: [4]
          },
          spokenText: "Finally for this pass, we compare Physics and Biology, and swap them. The Physics book has bubbled to its final correct position at the end of the shelf."
        },
        {
          stepNumber: 8,
          description: "Complete Pass 2 and finalize sorting",
          state: {
            array: [12, 15, 20, 25, 38],
            labels: ["History (12)", "Novel (15)", "Bio (20)", "Math (25)", "Physics (38)"],
            highlight: [],
            sorted: [0, 1, 2, 3, 4]
          },
          spokenText: "We continue comparing and sorting the remaining books. Soon, all books are correctly arranged on the shelf in ascending height order."
        }
      ]
    };
  }
  
  if (topicLower.includes('search') || topicLower.includes('binary')) {
    return {
      title: "Binary Search Algorithm",
      analogy: "Finding a name in an alphabetical list of students",
      explanation: `### Binary Search Visualization & Tutorial\n\nBinary Search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one.\n\n#### How It Works:\n1. Initialize low pointer at index 0 and high pointer at index N-1.\n2. Calculate the middle index: mid = (low + high) / 2.\n3. Compare middle element with the target. If target matches, return mid.\n4. If target is smaller than mid, move high to mid - 1.\n5. If target is larger than mid, move low to mid + 1.\n6. Repeat until target is found or low exceeds high.\n\n#### Time & Space Complexity:\n- **Time Complexity**: O(log N)\n- **Space Complexity**: O(1)\n\n#### Java Code Example:\n\`\`\`java\npublic static int binarySearch(int[] arr, int target) {\n    int low = 0;\n    int high = arr.length - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\`\`\n`,
      verbalScript: "Let's perform a binary search to find Grace in our alphabetical student roster. We'll start at the middle, check if her name comes before or after, and discard half the list at each step.",
      topicType: "binary_search",
      codeExample: `public static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
      visualSteps: [
        {
          stepNumber: 1,
          description: "Initialize search range: Low index 0, High index 8",
          state: {
            array: [10, 22, 35, 47, 55, 68, 72, 85, 90],
            labels: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Jack"],
            low: 0,
            high: 8,
            mid: -1,
            target: 72,
            found: false
          },
          spokenText: "We start with a sorted list of nine names. We want to find Grace, who has the target key 72."
        },
        {
          stepNumber: 2,
          description: "Calculate Mid index: (0 + 8) / 2 = 4 (Emma)",
          state: {
            array: [10, 22, 35, 47, 55, 68, 72, 85, 90],
            labels: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Jack"],
            low: 0,
            high: 8,
            mid: 4,
            target: 72,
            found: false
          },
          spokenText: "The middle index is 4, which is Emma. Grace's name comes alphabetically after Emma, so 72 is greater than 55."
        },
        {
          stepNumber: 3,
          description: "Discard left half. Set Low = Mid + 1 = 5",
          state: {
            array: [10, 22, 35, 47, 55, 68, 72, 85, 90],
            labels: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Jack"],
            low: 5,
            high: 8,
            mid: 4,
            target: 72,
            found: false
          },
          spokenText: "We discard Emma and everyone to her left. We set the new low boundary to index 5."
        },
        {
          stepNumber: 4,
          description: "Calculate Mid index: (5 + 8) / 2 = 6 (Grace)",
          state: {
            array: [10, 22, 35, 47, 55, 68, 72, 85, 90],
            labels: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Jack"],
            low: 5,
            high: 8,
            mid: 6,
            target: 72,
            found: true
          },
          spokenText: "The new middle index is 6, which is Grace. Grace is our target name. We have successfully found the target in just 4 steps."
        }
      ]
    };
  }

  if (topicLower.includes('stack')) {
    return {
      title: "Stack Data Structure",
      analogy: "A stack of plates in a buffet cupboard",
      explanation: `### Stack Visualization & Tutorial\n\nA Stack is a linear data structure that follows the LIFO (Last In First Out) principle. The element inserted last is the first one to be removed.\n\n#### Operations:\n- **Push**: Add an item to the top.\n- **Pop**: Remove the top item.\n- **Peek**: Get the value of the top item without removing it.\n\n#### Complexity:\n- Push/Pop/Peek: O(1) time.`,
      verbalScript: "Let's explore the Stack operations using a stack of plates. Plates are placed on top and removed from the top.",
      topicType: "stack",
      codeExample: `public class Stack {
    private List<String> list = new ArrayList<>();
    public void push(String item) { list.add(item); }
    public String pop() { return list.remove(list.size() - 1); }
    public String peek() { return list.get(list.size() - 1); }
}`,
      visualSteps: [
        {
          stepNumber: 1,
          description: "Initial empty stack",
          state: { elements: [], action: "idle", activeVal: "" },
          spokenText: "We start with an empty stack cupboard."
        },
        {
          stepNumber: 2,
          description: "Push Plate A onto the stack",
          state: { elements: ["Plate A"], action: "push", activeVal: "Plate A" },
          spokenText: "We push Plate A onto the stack. It sits at the bottom."
        },
        {
          stepNumber: 3,
          description: "Push Plate B onto the stack",
          state: { elements: ["Plate A", "Plate B"], action: "push", activeVal: "Plate B" },
          spokenText: "We push Plate B onto the stack. It sits on top of Plate A."
        },
        {
          stepNumber: 4,
          description: "Peek the top plate",
          state: { elements: ["Plate A", "Plate B"], action: "peek", activeVal: "Plate B" },
          spokenText: "Peeking at the stack tells us Plate B is currently at the top."
        },
        {
          stepNumber: 5,
          description: "Pop the top plate (Plate B)",
          state: { elements: ["Plate A"], action: "pop", activeVal: "Plate B" },
          spokenText: "We pop the top plate. Plate B is removed first, leaving Plate A on the stack."
        }
      ]
    };
  }

  if (topicLower.includes('queue')) {
    return {
      title: "Queue Data Structure",
      analogy: "A line of customers waiting at a movie ticket counter",
      explanation: `### Queue Visualization & Tutorial\n\nA Queue is a linear data structure that follows the FIFO (First In First Out) principle. The first item added is the first one to be removed.\n\n#### Operations:\n- **Enqueue**: Add an item to the back.\n- **Dequeue**: Remove an item from the front.\n\n#### Complexity:\n- Enqueue/Dequeue: O(1) time.`,
      verbalScript: "Let's explore the Queue operations using a customer line. Customers join at the back and are served at the front.",
      topicType: "queue",
      codeExample: `public class Queue {
    private List<String> list = new ArrayList<>();
    public void enqueue(String item) { list.add(item); }
    public String dequeue() { return list.remove(0); }
}`,
      visualSteps: [
        {
          stepNumber: 1,
          description: "Initial empty queue",
          state: { elements: [], action: "idle", activeVal: "" },
          spokenText: "The ticket line is empty."
        },
        {
          stepNumber: 2,
          description: "Enqueue Alice to the line",
          state: { elements: ["Alice"], action: "enqueue", activeVal: "Alice" },
          spokenText: "Alice joins the line. She is at the front."
        },
        {
          stepNumber: 3,
          description: "Enqueue Bob to the line",
          state: { elements: ["Alice", "Bob"], action: "enqueue", activeVal: "Bob" },
          spokenText: "Bob joins behind Alice."
        },
        {
          stepNumber: 4,
          description: "Dequeue served customer (Alice)",
          state: { elements: ["Bob"], action: "dequeue", activeVal: "Alice" },
          spokenText: "Alice is served and leaves the front of the line. Bob is now next in line."
        }
      ]
    };
  }

  if (topicLower.includes('list') || topicLower.includes('link')) {
    return {
      title: "Linked List Reversal",
      analogy: "Reversing a chain of linked train carriages",
      explanation: `### Linked List Reversal\n\nReversing a singly linked list involves modifying the next pointers of every node so they point to the preceding node instead of the succeeding one.\n\n#### How It Works:\n1. Maintain three pointers: prev (null), curr (head), and next (null).\n2. Iterate through the list.\n3. Save the next node: next = curr.next.\n4. Reverse the pointer: curr.next = prev.\n5. Move prev and curr forward: prev = curr, curr = next.`,
      verbalScript: "Let's reverse a linked list of train carriages. We will detach and point each carriage's coupler backward step-by-step.",
      topicType: "linked_list",
      codeExample: `public void reverse() {
    Node prev = null;
    Node curr = head;
    Node next = null;
    while (curr != null) {
        next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    head = prev;
}`,
      visualSteps: [
        {
          stepNumber: 1,
          description: "Original linked list: Node 1 -> Node 2 -> Node 3",
          state: {
            nodes: [
              { id: 1, val: 10, label: "Carriage 1", nextId: 2 },
              { id: 2, val: 20, label: "Carriage 2", nextId: 3 },
              { id: 3, val: 30, label: "Carriage 3", nextId: null }
            ],
            action: "idle",
            activeNodeId: 1
          },
          spokenText: "Here is our initial list of carriages pointing from left to right."
        },
        {
          stepNumber: 2,
          description: "Reverse Carriage 1 pointer to point to Null",
          state: {
            nodes: [
              { id: 1, val: 10, label: "Carriage 1", nextId: null },
              { id: 2, val: 20, label: "Carriage 2", nextId: 3 },
              { id: 3, val: 30, label: "Carriage 3", nextId: null }
            ],
            action: "reverse",
            activeNodeId: 1
          },
          spokenText: "We make Carriage 1 point to null, since it will become the new tail carriage."
        },
        {
          stepNumber: 3,
          description: "Reverse Carriage 2 pointer to point to Carriage 1",
          state: {
            nodes: [
              { id: 1, val: 10, label: "Carriage 1", nextId: null },
              { id: 2, val: 20, label: "Carriage 2", nextId: 1 },
              { id: 3, val: 30, label: "Carriage 3", nextId: null }
            ],
            action: "reverse",
            activeNodeId: 2
          },
          spokenText: "Now, Carriage 2's coupler is reversed to point back to Carriage 1."
        },
        {
          stepNumber: 4,
          description: "Reverse Carriage 3 pointer to point to Carriage 2",
          state: {
            nodes: [
              { id: 1, val: 10, label: "Carriage 1", nextId: null },
              { id: 2, val: 20, label: "Carriage 2", nextId: 1 },
              { id: 3, val: 30, label: "Carriage 3", nextId: 2 }
            ],
            action: "reverse",
            activeNodeId: 3
          },
          spokenText: "Finally, Carriage 3 points back to Carriage 2. Carriage 3 is now the new head of our reversed chain."
        }
      ]
    };
  }

  // Fallback for everything else: General Flow
  return {
    title: topicName,
    analogy: `Understanding ${topicName} step-by-step`,
    explanation: `### Visual Explanation of ${topicName}\n\nHere is a step-by-step breakdown of how **${topicName}** operates in production systems, detailing its core components and architectural layers.\n\n#### Highlights:\n- Clear modular boundaries.\n- Step-by-step data flows.\n- High-availability considerations.\n\n#### Code Example:\n\`\`\`javascript\n// Conceptual illustration\nfunction executeTask() {\n  console.log("Executing ${topicName} workflow...");\n}\n\`\`\``,
    verbalScript: `Let's walk through the steps of ${topicName}. We'll examine how data flows from the initialization phase down to completion.`,
    topicType: "general_flow",
    codeExample: `// Conceptual example\nfunction executeWorkflow() {\n    console.log("Executing ${topicName} workflow...");\n}`,
    visualSteps: [
      {
        stepNumber: 1,
        description: "Initialize client-side action",
        state: {
          nodes: [
            { id: 1, label: "Client Request", status: "active" },
            { id: 2, label: "Processing Service", status: "idle" },
            { id: 3, label: "Data Warehouse", status: "idle" }
          ],
          connections: [
            { from: 1, to: 2 },
            { from: 2, to: 3 }
          ],
          activeNodeId: 1
        },
        spokenText: "First, the user initiates a client request to trigger the workflow."
      },
      {
        stepNumber: 2,
        description: "Processing request through services",
        state: {
          nodes: [
            { id: 1, label: "Client Request", status: "done" },
            { id: 2, label: "Processing Service", status: "active" },
            { id: 3, label: "Data Warehouse", status: "idle" }
          ],
          connections: [
            { from: 1, to: 2 },
            { from: 2, to: 3 }
          ],
          activeNodeId: 2
        },
        spokenText: "Next, our processing service validates and transforms the request data."
      },
      {
        stepNumber: 3,
        description: "Persisting changes to database",
        state: {
          nodes: [
            { id: 1, label: "Client Request", status: "done" },
            { id: 2, label: "Processing Service", status: "done" },
            { id: 3, label: "Data Warehouse", status: "active" }
          ],
          connections: [
            { from: 1, to: 2 },
            { from: 2, to: 3 }
          ],
          activeNodeId: 3
        },
        spokenText: "Finally, the changes are committed to the data warehouse, and a success response is returned."
      }
    ]
  };
}

async function explainTopicWithVisuals(topicName) {
  const prompt = `You are a world-class computer science teacher and algorithm visualizer designer.
Explain the following topic or problem: "${topicName}"

CRITICAL INSTRUCTION:
1. Every explanation and visualization MUST be built around a concrete, relatable real-world example/analogy (e.g. sorting books on a shelf by size, searching for a name in an alphabetical student roster/phonebook, a stack of dinner plates, a ticket queue of customers at a cinema, reversing a chain of linked train carriages, or tracking recursive family ancestors).
2. The explanation, code example, visual step descriptions, and speech scripts must consistently refer to this concrete analogy/example and its items.
3. Provide granular, step-by-step state logs. For algorithms, do not skip steps. Generate between 8 and 15 steps representing the full flow of the analogy/example from start to finish.
4. Ensure the JSON returned is fully complete and valid.

If the topic is a standard algorithm/data structure, classify it into one of these types:
- "bubble_sort" (for sorting algorithms like bubble, selection, insertion, quick, merge)
- "binary_search" (for search algorithms and interval division)
- "stack" (for stack operations LIFO)
- "queue" (for queue operations FIFO)
- "linked_list" (for linked lists insertion, deletion, reversal)
- "binary_tree" (for tree traversals BFS, DFS, insertion)
- "recursion" (for recursive operations like Fibonacci or factorial)
- "general_flow" (for any general concepts like JS closures, DB indexing, API calls, OAuth, etc.)

For "general_flow", you will provide a sequence of visual nodes/elements that represent the flow of the explanation.
For the specific types, provide the corresponding structural state configuration for each animation step.

Return ONLY valid JSON in this exact structure:
{
  "title": "${topicName}",
  "analogy": "Short 1-2 sentence describing the real-world analogy chosen (e.g., 'Sorting 5 books of different heights on a shelf').",
  "explanation": "Markdown string containing complete written explanation, detail of the analogy, best practices, and code example",
  "verbalScript": "A continuous narration script to be read aloud via Text-to-Speech (TTS). It should be engaging, informative, and synchronized step-by-step with the animation steps.",
  "topicType": "bubble_sort|binary_search|stack|queue|linked_list|binary_tree|recursion|general_flow",
  "codeExample": "A complete, working code implementation of the concept.",
  "visualSteps": [
    {
      "stepNumber": 1,
      "description": "Short label/action for this step referencing the real-world example (e.g. 'Compare height of Book A (15cm) and Book B (12cm)')",
      "state": {
        // state config
      },
      "spokenText": "The specific portion of the narration corresponding to this animation step, explaining the action in terms of the real-world analogy."
    }
  ]
}`;

  try {
    const responseText = await callAI(prompt);
    return cleanJSONResponse(responseText);
  } catch (err) {
    console.warn('⚠️ AI explain topic fallback used for topic:', topicName, 'Error:', err.message);
    return getVisualExplanationFallback(topicName);
  }
}

module.exports = { callAI, cleanJSONResponse, analyzeFile, analyzeImage, analyzeUrlContent, generateQuestionsByAI, answerAndCategorizeQuestion, explainTopicWithVisuals };


