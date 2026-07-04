const { callAI, cleanJSONResponse } = require('./ai');

/**
 * Start a new live multi-stage conversational AI interview session
 */
async function startInterviewSession({ jobRole = 'Software Engineer', interviewType = 'Full Comprehensive Round', difficulty = 'Mid-Senior Level', language = 'Java / JavaScript' }) {
  const prompt = `You are an executive Principal Interviewer at a Tier-1 tech company conducting a realistic, multi-stage job interview.

Target Job Role: ${jobRole}
Interview Style: ${interviewType}
Difficulty Level: ${difficulty}
Primary Tech/Language: ${language}

Your objective:
Initiate Stage 1 of 4 of the job interview: "Self-Introduction & Professional Background".
Greet the candidate professionally, welcome them to the interview for the ${jobRole} role, and invite them to introduce themselves, share their professional background, and explain why they are pursuing this role.

Return ONLY valid JSON in this exact format:
{
  "stage": "self_intro",
  "stageNumber": 1,
  "totalStages": 4,
  "stageTitle": "1. Self-Introduction & Background",
  "interviewerMessage": "Warm, professional greeting welcoming candidate to the ${jobRole} interview and asking for their introduction...",
  "verbalPrompt": "Audio speech version of interviewer greeting...",
  "requiresCode": false,
  "category": "Conversational Intro",
  "suggestedTopics": ["Past background & experience", "Core passions", "Reason for applying for ${jobRole}"]
}`;

  try {
    const responseText = await callAI(prompt);
    const parsed = cleanJSONResponse(responseText);
    return {
      stage: parsed.stage || "self_intro",
      stageNumber: 1,
      totalStages: 4,
      stageTitle: parsed.stageTitle || "1. Self-Introduction & Background",
      interviewerMessage: parsed.interviewerMessage || `Hello and welcome! Thank you for taking the time to interview today for the ${jobRole} position. To kick things off, could you please introduce yourself, share a brief overview of your background, and tell me what draws you to this role?`,
      verbalPrompt: parsed.verbalPrompt || `Hello and welcome to your interview for the ${jobRole} position! Please introduce yourself and share a bit about your background.`,
      requiresCode: false,
      category: "Conversational Intro",
      suggestedTopics: parsed.suggestedTopics || ["Education & work history", "Primary technology focus", "Motivation for the role"]
    };
  } catch (err) {
    console.warn('⚠️ AI Interview start fallback used:', err.message);
    return {
      stage: "self_intro",
      stageNumber: 1,
      totalStages: 4,
      stageTitle: "1. Self-Introduction & Background",
      interviewerMessage: `Hello and welcome! Thank you for taking the time to interview today for the ${jobRole} position. To start off naturally, could you please tell me about yourself, your background, and your key highlights as a ${jobRole}?`,
      verbalPrompt: `Welcome to your interview for the ${jobRole} role. Please introduce yourself and tell me about your background.`,
      requiresCode: false,
      category: "Conversational Intro",
      suggestedTopics: ["Educational background & journey", "Key technical interests", "Career goals & strengths"]
    };
  }
}

/**
 * Evaluate candidate's stage response and proceed to the next stage in the interview flow
 */
async function evaluateAndNext({
  jobRole = 'Software Engineer',
  interviewType = 'Full Comprehensive Round',
  difficulty = 'Mid-Senior Level',
  language = 'Java / JavaScript',
  stageNumber = 1,
  userExplanation = '',
  userCode = '',
  conversationHistory = []
}) {
  const currentStageNum = Number(stageNumber);
  const nextStageNum = currentStageNum + 1;
  const isFinal = currentStageNum >= 4;

  const prompt = `You are a Principal Tech Interviewer evaluating candidate responses in a live interview for a ${jobRole} position.

Current Interview Stage: ${currentStageNum} of 4.
Primary Language / Tech Stack: ${language}
Difficulty Level: ${difficulty}

Candidate's Answer / Spoken Response for Stage ${currentStageNum}:
"${userExplanation || 'No verbal or typed answer provided'}"

${userCode ? `Candidate Code Submitted (if technical stage):\n\`\`\`${language}\n${userCode}\n\`\`\`` : ''}

Task:
1. Provide constructive interviewer feedback evaluating the candidate's answer for Stage ${currentStageNum}.
2. Assign a score (0 to 100) for this stage.
3. ${!isFinal ? `Transition naturally to Stage ${nextStageNum} of 4.` : 'Synthesize a final candidate scorecard & hiring decision.'}

Stages structure:
- Stage 1: Self-Introduction & Background -> Next is Stage 2: Resume, Skills & Technical Experience
- Stage 2: Resume, Skills & Technical Experience -> Next is Stage 3: Major Projects & Architecture Deep-Dive
- Stage 3: Major Projects & Architecture Deep-Dive -> Next is Stage 4: Practical Role-Specific Technical Challenge / Problem-Solving
- Stage 4: Technical Challenge -> Final Scorecard

Return ONLY valid JSON in this exact structure:
{
  "stageNumber": ${currentStageNum},
  "score": 88,
  "stageFeedback": "Feedback on candidate's stage response...",
  "isFinal": ${isFinal},
  ${!isFinal ? `
  "nextStage": {
    "stage": "${nextStageNum === 2 ? 'skills_experience' : nextStageNum === 3 ? 'project_deepdive' : 'technical_challenge'}",
    "stageNumber": ${nextStageNum},
    "totalStages": 4,
    "stageTitle": "${nextStageNum === 2 ? '2. Resume, Skills & Technical Stack' : nextStageNum === 3 ? '3. Project Deep-Dive & Architecture' : '4. Practical Technical & Problem-Solving Challenge'}",
    "interviewerMessage": "Conversational transition thanking candidate for their response and asking the next question for stage ${nextStageNum}...",
    "verbalPrompt": "Audio prompt for next stage question...",
    "requiresCode": ${nextStageNum === 4},
    "category": "${nextStageNum === 2 ? 'Skills & Experience' : nextStageNum === 3 ? 'Project Architecture' : 'Technical Coding Challenge'}",
    "problemTitle": "${nextStageNum === 4 ? `Role Coding Challenge for ${jobRole}` : ''}",
    "problemStatement": "${nextStageNum === 4 ? `Write an efficient function or class in ${language} to solve the specified role problem...` : ''}",
    "exampleInput": "${nextStageNum === 4 ? 'Sample Input Data...' : ''}",
    "exampleOutput": "${nextStageNum === 4 ? 'Expected Return Output...' : ''}",
    "constraints": "${nextStageNum === 4 ? 'Target Time Complexity: O(1) or O(N log N). Space Complexity: O(N).' : ''}",
    "starterCode": "${nextStageNum === 4 ? `// ${language} Solution Workspace for ${jobRole}\\npublic class Solution {\\n    public static void main(String[] args) {\\n        // Implement solution here\\n    }\\n}` : ''}",
    "hints": ["Hint 1 for stage ${nextStageNum}"]
  }` : `
  "finalScorecard": {
    "overallScore": 88,
    "hiringDecision": "Strong Hire|Hire|Weak Hire|No Hire",
    "communicationScore": 90,
    "skillsScore": 85,
    "projectScore": 88,
    "problemSolvingScore": 89,
    "summary": "Comprehensive evaluation summary of candidate performance across all 4 interview stages...",
    "strengths": ["Strong verbal communication", "Deep project architecture understanding", "Solid technical problem solving"],
    "improvements": ["Elaborate more on specific edge case handling", "Quantify project impact metrics clearly"]
  }`}
}`;

  try {
    const responseText = await callAI(prompt);
    const parsed = cleanJSONResponse(responseText);
    return parsed;
  } catch (err) {
    console.warn('⚠️ AI Evaluation fallback triggered:', err.message);
    
    // Fallback logic for each stage if AI call fails or times out
    if (currentStageNum === 1) {
      return {
        stageNumber: 1,
        score: userExplanation.length > 30 ? 85 : 70,
        stageFeedback: "Good introduction! You clearly expressed your background and motivation for the role.",
        isFinal: false,
        nextStage: {
          stage: "skills_experience",
          stageNumber: 2,
          totalStages: 4,
          stageTitle: "2. Resume, Skills & Technical Stack",
          interviewerMessage: `Thank you for sharing your background! Now let me ask about your skills and experience. For the ${jobRole} role, what are your primary programming languages, frameworks, and core technical skills? How do you rate your expertise in ${language}?`,
          verbalPrompt: `Great intro! Now let's discuss your skills. What are your primary technical skills, tools, and frameworks relevant to ${jobRole}?`,
          requiresCode: false,
          category: "Skills & Experience",
          hints: ["Highlight core frameworks and tools you use daily.", "Mention both frontend/backend or specialized domain tools."]
        }
      };
    } else if (currentStageNum === 2) {
      return {
        stageNumber: 2,
        score: userExplanation.length > 40 ? 88 : 72,
        stageFeedback: "Solid breakdown of your tech stack and expertise. Your familiarity with modern tooling is evident.",
        isFinal: false,
        nextStage: {
          stage: "project_deepdive",
          stageNumber: 3,
          totalStages: 4,
          stageTitle: "3. Project Deep-Dive & Architecture",
          interviewerMessage: `Excellent! Now let me ask about your hands-on project experience. Could you walk me through a major project you built or contributed to? What was your specific role, how did you design the architecture, and what was the most difficult challenge you solved?`,
          verbalPrompt: `Awesome. Now, tell me about a significant project you worked on. What was your role, the architecture, and the toughest challenge you solved?`,
          requiresCode: false,
          category: "Project Architecture",
          hints: ["Describe the problem, architecture/design, key tech used, and measurable results.", "Explain a specific technical hurdle and how you resolved it."]
        }
      };
    } else if (currentStageNum === 3) {
      // Role-Tailored Technical Coding Problems for Stage 4 Fallback
      const isJava = language.toLowerCase().includes('java') && !language.toLowerCase().includes('script');
      const isPython = language.toLowerCase().includes('python');
      const isReactOrJS = language.toLowerCase().includes('script') || language.toLowerCase().includes('react');

      let problemTitle = `Design & Implement LRU Cache with O(1) Operations`;
      let problemStatement = `Design a Data Structure for a Least Recently Used (LRU) Cache. It should support get(key) and put(key, value) operations. The get(key) operation gets the key value if it exists. The put(key, value) operation updates or inserts the value, evicting the least recently used key if capacity is reached.`;
      let exampleInput = `put(1, 100); put(2, 200); get(1); put(3, 300); // evicts key 2`;
      let exampleOutput = `get(1) returns 100; get(2) returns -1 (evicted); get(3) returns 300`;
      let constraints = `Time Complexity: O(1) for both get and put. Space Complexity: O(Capacity).`;
      let starterCode = `// ${language} — LRU Cache Technical Solution
import java.util.*;

public class LRUCache {
    private final int capacity;
    private final Map<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true);
    }

    public int get(int key) {
        return map.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        if (!map.containsKey(key) && map.size() >= capacity) {
            int oldestKey = map.keySet().iterator().next();
            map.remove(oldestKey);
        }
        map.put(key, value);
    }

    public static void main(String[] args) {
        LRUCache cache = new LRUCache(2);
        cache.put(1, 100);
        cache.put(2, 200);
        System.out.println("Key 1 Value: " + cache.get(1)); // returns 100
        cache.put(3, 300); // evicts key 2
        System.out.println("Key 2 Value: " + cache.get(2)); // returns -1
    }
}`;

      if (isPython) {
        problemTitle = `Cosine Similarity & Top-K Vector Search`;
        problemStatement = `Write a Python function to compute the cosine similarity between a target query vector and an array/matrix of embedding vectors, returning the indices of the top-K highest similarity scores.`;
        exampleInput = `query = [0.1, 0.5, 0.9], K = 2`;
        exampleOutput = `Indices of top 2 matching vectors in descending order of similarity.`;
        constraints = `Time Complexity: O(N * D) where N is number of vectors and D is vector dimension.`;
        starterCode = `# Python 3 — Vector Cosine Similarity Search
import math

function_cosine_search = """
def top_k_cosine_similarity(query_vec, embeddings, k=2):
    def cosine_sim(v1, v2):
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        return dot / (norm1 * norm2) if norm1 * norm2 != 0 else 0.0

    scores = [(i, cosine_sim(query_vec, emb)) for i, emb in enumerate(embeddings)]
    scores.sort(key=lambda x: x[1], reverse=True)
    return [idx for idx, score in scores[:k]]
"""

print("Vector Search Algorithm Initialized.")
`;
      } else if (isReactOrJS) {
        problemTitle = `Implement Custom Debounce Hook with Cancellation`;
        problemStatement = `Implement a JavaScript utility function debounce(fn, delay, options) that delays invoking fn until after delay milliseconds have elapsed since the last time the debounced function was invoked. Include a cancel() method.`;
        exampleInput = `const debouncedFn = debounce(searchAPI, 300); debouncedFn("react"); debouncedFn("react hooks");`;
        exampleOutput = `Only one API call executed with "react hooks" after 300ms pause.`;
        constraints = `Time Complexity: O(1) execution setup. Must clear pending timeouts correctly.`;
        starterCode = `// JavaScript / TypeScript — Debounce Function Implementation
function debounce(fn, delay) {
    let timerId = null;

    function debounced(...args) {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
            fn.apply(this, args);
            timerId = null;
        }, delay);
    }

    debounced.cancel = function() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    };

    return debounced;
}

// Test usage
const logSearch = debounce((query) => console.log("Searching for:", query), 300);
logSearch("Java");
logSearch("Java Spring");
`;
      }

      return {
        stageNumber: 3,
        score: userExplanation.length > 50 ? 90 : 75,
        stageFeedback: "Impressive project overview! You demonstrated strong architectural ownership and problem-solving capability.",
        isFinal: false,
        nextStage: {
          stage: "technical_challenge",
          stageNumber: 4,
          totalStages: 4,
          stageTitle: "4. Practical Technical & Coding Challenge",
          interviewerMessage: `Now let's move to the practical coding section for ${jobRole}! Here is a coding challenge tailored for your role: "${problemTitle}". Review the problem statement, write your solution in ${language}, and click "Run Code Test" or "Submit Answer".`,
          verbalPrompt: `Let's move to the practical coding challenge for ${jobRole}. Please review the problem statement in the studio and implement your solution.`,
          requiresCode: true,
          category: "Technical Coding Challenge",
          problemTitle: problemTitle,
          problemStatement: problemStatement,
          exampleInput: exampleInput,
          exampleOutput: exampleOutput,
          constraints: constraints,
          starterCode: starterCode,
          hints: ["Focus on optimal time and space complexity.", "Handle empty inputs, boundary conditions, and memory eviction."]
        }
      };
    } else {
      return {
        stageNumber: 4,
        score: userCode.length > 30 || userExplanation.length > 30 ? 88 : 75,
        stageFeedback: "Great work on the technical challenge! Your logic and approach demonstrate solid technical foundations.",
        isFinal: true,
        finalScorecard: {
          overallScore: 87,
          hiringDecision: "Strong Hire",
          communicationScore: 90,
          skillsScore: 86,
          projectScore: 88,
          problemSolvingScore: 85,
          summary: `The candidate performed exceptionally well across all 4 stages of the ${jobRole} interview. Demonstrated clear background communication, strong tech stack proficiency, clear project architectural ownership, and effective problem-solving skills.`,
          strengths: [
            "Clear and confident professional communication",
            "Strong grasp of core technical stack and toolchains",
            "Solid project ownership and technical decision making"
          ],
          improvements: [
            "Provide quantitative metrics on past project optimizations",
            "Elaborate slightly more on automated unit test coverage"
          ]
        }
      };
    }
  }
}

/**
 * Generate a subtle hint for the current stage/question
 */
async function getInterviewHint({ question, stageTitle, userCode, language }) {
  const prompt = `You are an AI Technical Interviewer helping a candidate with a hint during an interview.

Stage/Question: "${stageTitle || question}"
Code Draft:
\`\`\`${language}
${userCode || ''}
\`\`\`

Provide a concise, helpful hint (1-2 sentences) to guide the candidate.

Return ONLY valid JSON:
{
  "hint": "Subtle helpful hint..."
}`;

  try {
    const responseText = await callAI(prompt);
    return cleanJSONResponse(responseText);
  } catch (err) {
    return {
      hint: "Structure your thoughts systematically: start with your core objective, break down the component architecture, and highlight edge-case handling."
    };
  }
}

module.exports = { startInterviewSession, evaluateAndNext, getInterviewHint };

