// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_BASE = "https://inter-view-backend.onrender.com/api";


async function handleResponse(res, defaultErrorMsg) {
  if (!res.ok) {
    let errMsg = defaultErrorMsg;
    try {
      const err = await res.json();
      errMsg = err.error || err.message || defaultErrorMsg;
    } catch (e) { }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function fetchQuestions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.category) params.append("category", filters.category);
  if (filters.difficulty) params.append("difficulty", filters.difficulty);
  if (filters.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE}/questions?${params.toString()}`);
  return handleResponse(res, "Failed to fetch questions");
}

export async function addQuestion(data) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to add question");
}

export async function addQuestionsBatch(questions) {
  const res = await fetch(`${API_BASE}/questions/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions }),
  });
  return handleResponse(res, "Failed to save questions");
}

export async function generateAiQuestions({ language, category, count, difficulty }) {
  const res = await fetch(`${API_BASE}/questions/generate-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, category, count, difficulty }),
  });
  return handleResponse(res, "Failed to generate AI questions");
}

export async function askAiQuestion({ question, language }) {
  const res = await fetch(`${API_BASE}/questions/ask-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, language }),
  });
  return handleResponse(res, "Failed to process question with AI");
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/questions/${id}`, { method: "DELETE" });
  return handleResponse(res, "Failed to delete question");
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res, "Failed to analyze file");
}

export async function analyzeUrl(url) {
  const res = await fetch(`${API_BASE}/analyze/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return handleResponse(res, "Failed to analyze URL link");
}

export async function analyzeText(text, title) {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title }),
  });
  return handleResponse(res, "Failed to analyze pasted text");
}

export async function fetchLanguages() {
  const res = await fetch(`${API_BASE}/questions/meta/languages`);
  return handleResponse(res, "Failed to fetch languages");
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/questions/meta/categories`);
  return handleResponse(res, "Failed to fetch categories");
}
