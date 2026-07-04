const { connectDatabase, Question } = require('./db');
require('dotenv').config();

const resumeQuestions = [
  // ----------------------------------------------------
  // PROJECT 1: RealityEngine (AI Learning Platform, Socket.io, Groq LLaMA, Redis, Microservices)
  // ----------------------------------------------------
  {
    language: 'Project: RealityEngine',
    category: 'System Design',
    difficulty: 'Hard',
    question: 'How did you design the microservice architecture and real-time messaging system using Socket.io in RealityEngine?',
    answer: 'RealityEngine separates frontend hosting (Vercel) from real-time and AI workloads (Render Node.js microservices). For real-time messaging, Socket.io establishes persistent WebSocket connections with fallback to HTTP long-polling. To scale Socket.io across multiple microservice instances, Redis Pub/Sub (Upstash Redis) acts as an adapter, broadcasting events between nodes so users connected to different servers receive instant messages and AI response streams.',
    code_example: `// Backend Socket.io with Redis Adapter setup
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { Redis } = require("ioredis");

const io = new Server(server, { cors: { origin: "*" } });
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

io.on("connection", (socket) => {
  socket.on("join-track", (trackId) => socket.join(trackId));
  socket.on("send-ai-prompt", async ({ trackId, prompt }) => {
    // Stream response from Groq LLaMA model
    io.to(trackId).emit("ai-chunk", { text: "..." });
  });
});`
  },
  {
    language: 'Project: RealityEngine',
    category: 'Framework-Specific',
    difficulty: 'Medium',
    question: 'How does Sigma Chat integrate with the Groq API (LLaMA models) to stream AI responses efficiently?',
    answer: 'Sigma Chat uses Groq LLaMA 3 models for ultra-low latency inference. Instead of waiting for the full AI response to generate, server-sent streaming (or Socket.io chunks) streams tokens as they are generated. On the frontend, TanStack Query and Zustand maintain chat state and append incoming text chunks in real-time, providing an interactive, ChatGPT-like experience.',
    code_example: `// Streaming Groq completion endpoint in Express
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/api/sigma-chat", async (req, res) => {
  const { messages } = req.body;
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    stream: true,
  });

  res.setHeader("Content-Type", "text/event-stream");
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    res.write(\`data: \${JSON.stringify({ content })}\\n\\n\`);
  }
  res.end();
});`
  },
  {
    language: 'Project: RealityEngine',
    category: 'Database',
    difficulty: 'Hard',
    question: 'How did you utilize Upstash Redis and Prisma ORM in RealityEngine for streak tracking and leaderboard caching?',
    answer: 'Calculating global and track leaderboards with XP, streaks, and reality scores from PostgreSQL can cause heavy DB load during high traffic. Upstash Redis Sorted Sets (ZADD / ZREVRANGE) are used to maintain active leaderboards in O(log N) time. Prisma ORM syncs streak & XP updates to Neon PostgreSQL asynchronously while Redis serves instant read queries for global rankings.',
    code_example: `// Redis Sorted Set Leaderboard
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

// Add or update user score
async function updateLeaderboard(userId, xpScore) {
  await redis.zadd("leaderboard:global", { score: xpScore, member: userId });
}

// Get Top 10 users
async function getTop10Leaderboard() {
  return await redis.zrevrange("leaderboard:global", 0, 9, { withScores: true });
}`
  },

  // ----------------------------------------------------
  // PROJECT 2: Task-Flow (Project Management, Drag-and-Drop Kanban, Clerk Auth, Prisma)
  // ----------------------------------------------------
  {
    language: 'Project: Task-Flow',
    category: 'Framework-Specific',
    difficulty: 'Medium',
    question: 'How is state managed during drag-and-drop Kanban reordering in Task-Flow to maintain fast optimistic UI updates?',
    answer: 'Task-Flow uses optimistic UI rendering. When a user drags a task card from "To Do" to "In Progress", local state (Zustand/React state) updates immediately before sending an HTTP request. If the backend Prisma ORM database update fails, the UI rolls back to the previous state and displays a error toast notification.',
    code_example: `// Optimistic state update pattern for Drag-and-Drop
const moveTask = async (taskId, newStatus) => {
  const previousTasks = [...tasks];
  // 1. Optimistic Update
  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

  try {
    // 2. Persist in Neon PostgreSQL via Prisma
    await updateTaskStatusApi(taskId, newStatus);
  } catch (err) {
    // 3. Rollback on error
    setTasks(previousTasks);
    toast.error("Failed to reorder task");
  }
};`
  },
  {
    language: 'Project: Task-Flow',
    category: 'Basics',
    difficulty: 'Medium',
    question: 'How does Role-Based Access Control (RBAC) work with Clerk Authentication in Task-Flow?',
    answer: 'Clerk Authentication handles session management and JWT token generation. User roles (Admin, Manager, Member) are stored in Clerk user metadata or synced to Neon PostgreSQL. Middleware in Next.js/Express inspects the user claims in the JWT on every API request, permitting actions like "create sprint" or "delete organization" only if the user possesses Admin or Manager privileges.',
    code_example: `// Middleware RBAC authorization check
const { auth } = require("@clerk/nextjs");

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    const { sessionClaims } = auth();
    const userRole = sessionClaims?.metadata?.role || "Member";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions" });
    }
    next();
  };
}`
  },

  // ----------------------------------------------------
  // PROJECT 3: ReadHub (Java, Servlets, JSP, JDBC, Tomcat, MySQL)
  // ----------------------------------------------------
  {
    language: 'Project: ReadHub',
    category: 'OOP',
    difficulty: 'Easy',
    question: 'Explain the Servlet architecture and request lifecycle in Apache Tomcat for ReadHub.',
    answer: 'In Apache Tomcat, Servlets follow a lifecycle managed by the servlet container: init(), service(), and destroy(). When a request hits ReadHub (e.g. submit review), Tomcat creates or reuses a servlet instance, extracts HttpServletRequest and HttpServletResponse objects, calls doGet() or doPost(), and forwards processed data to JSP views via RequestDispatcher.',
    code_example: `@WebServlet("/submit-review")
public class ReviewServlet extends HttpServlet {
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        String bookId = req.getParameter("bookId");
        String rating = req.getParameter("rating");
        
        // DAO logic via JDBC
        BookDAO.addReview(bookId, rating);
        
        req.setAttribute("message", "Review added successfully!");
        req.getRequestDispatcher("/book-details.jsp").forward(req, resp);
    }
}`
  },
  {
    language: 'Project: ReadHub',
    category: 'Database',
    difficulty: 'Medium',
    question: 'How did you prevent SQL Injection and manage database connections efficiently using JDBC in ReadHub?',
    answer: 'SQL Injection is prevented by using JDBC PreparedStatements instead of raw String concatenation, ensuring parameters are safely parameterized. To avoid connection leaks and overhead, a JDBC Connection Pool (like HikariCP or Tomcat DataSource) manages a pool of reusable database connections.',
    code_example: `// Safe JDBC query using PreparedStatement
String sql = "INSERT INTO reviews (book_id, user_rating, comment) VALUES (?, ?, ?)";
try (Connection conn = dataSource.getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, Integer.parseInt(bookId));
    pstmt.setInt(2, Integer.parseInt(rating));
    pstmt.setString(3, commentText);
    pstmt.executeUpdate();
}`
  },

  // ----------------------------------------------------
  // JAVA — BASIC TO HARD (Resume Skill)
  // ----------------------------------------------------
  {
    language: 'Java',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'What is JVM, JRE, and JDK in Java?',
    answer: 'JDK (Java Development Kit) is the complete development environment containing tools (compiler javac, debugger) and the JRE. JRE (Java Runtime Environment) contains libraries and the JVM required to run Java apps. JVM (Java Virtual Machine) is the execution engine that converts Java bytecode into machine code.',
    code_example: `// Compile: javac Main.java  (JDK tool)
// Execute: java Main        (JRE/JVM execution)
public class Main {
    public static void main(String[] args) {
        System.out.println("JVM executes this bytecode!");
    }
}`
  },
  {
    language: 'Java',
    category: 'OOP',
    difficulty: 'Medium',
    question: 'What is the difference between Method Overloading and Method Overriding in Java?',
    answer: 'Overloading (compile-time polymorphism) occurs within the same class when methods share the same name but different parameters (count or types). Overriding (runtime polymorphism) occurs when a subclass provides a specific implementation for a method defined in its superclass using @Override.',
    code_example: `class Calculator {
    // Overloading
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
}

class Animal {
    void makeSound() { System.out.println("Animal sound"); }
}
class Dog extends Animal {
    // Overriding
    @Override
    void makeSound() { System.out.println("Bark bark!"); }
}`
  },
  {
    language: 'Java',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'How does ConcurrentHashMap work in Java and how does it differ from Hashtable?',
    answer: 'Hashtable synchronizes every method call with a single lock, causing severe bottleneck in multi-threaded environments. ConcurrentHashMap (introduced in Java 5/8) uses bucket-level locking (CAS operations + synchronized on node headers in Java 8) to allow multiple threads to read and write concurrently without locking the entire map.',
    code_example: `import java.util.concurrent.ConcurrentHashMap;

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
// Thread-safe update without global lock
map.compute("user_score", (key, val) -> (val == null) ? 1 : val + 1);`
  },

  // ----------------------------------------------------
  // JAVASCRIPT & NEXT.JS (Resume Skill)
  // ----------------------------------------------------
  {
    language: 'JavaScript',
    category: 'Basics',
    difficulty: 'Medium',
    question: 'What are Async/Await and Promises in JavaScript, and how does error handling work?',
    answer: 'Promises represent future asynchronous completion or failure. Async/Await is syntactic sugar over Promises making async code look synchronous. Errors in async functions are caught using try/catch blocks or chained .catch() handlers.',
    code_example: `async function fetchUserData(userId) {
  try {
    const res = await fetch(\`/api/users/\${userId}\`);
    if (!res.ok) throw new Error("User not found");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}`
  },
  {
    language: 'Next.js',
    category: 'Framework-Specific',
    difficulty: 'Hard',
    question: 'What is the difference between Server Components and Client Components in Next.js 14 App Router?',
    answer: 'Server Components render exclusively on the server, producing zero JavaScript bundle size on the client. They can fetch data directly from databases without API routes. Client Components (marked with "use client") render on the server and hydrate on the browser, supporting state (useState), effects (useEffect), and event listeners.',
    code_example: `// Server Component (Default in App Router)
import db from "@/lib/db";

export default async function Page() {
  const users = await db.query("SELECT * FROM users"); // Direct DB access!
  return <div>Users count: {users.length}</div>;
}`
  },

  // ----------------------------------------------------
  // SQL & DATABASES (PostgreSQL, MongoDB, MySQL - Resume Skill)
  // ----------------------------------------------------
  {
    language: 'SQL',
    category: 'Database',
    difficulty: 'Hard',
    question: 'What are ACID properties in relational databases (PostgreSQL/MySQL)?',
    answer: 'Atomicity (all-or-nothing execution), Consistency (maintains valid state constraints), Isolation (concurrent transactions don\'t interfere), and Durability (committed data survives system failure). Database transactions use WAL (Write-Ahead Logging) and locks to guarantee ACID compliance.',
    code_example: `-- Transaction example
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- All or nothing`
  },
  {
    language: 'MongoDB',
    category: 'Database',
    difficulty: 'Medium',
    question: 'What is the difference between Embedding vs Referencing documents in MongoDB?',
    answer: 'Embedding stores related data within a single document (ideal for 1-to-few relationships and fast single-query reads). Referencing stores ObjectIDs pointing to separate collections (ideal for 1-to-many or many-to-many relationships to avoid 16MB document size limits).',
    code_example: `// Embedded (Fast read, 1 query)
{
  _id: ObjectId("..."),
  name: "Balveersing",
  addresses: [{ city: "Bidar", zip: "585401" }]
}

// Referenced ($lookup / populate required)
{
  _id: ObjectId("..."),
  author_id: ObjectId("60d5ec...") // reference to Author collection
}`
  },

  // ----------------------------------------------------
  // DATA STRUCTURES & ALGORITHMS (Java DSA - Resume Skill)
  // ----------------------------------------------------
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'How do you detect a cycle in a Linked List using Floyd\'s Cycle Detection Algorithm?',
    answer: 'Floyd\'s algorithm uses two pointers: a slow pointer (moves 1 step) and a fast pointer (moves 2 steps). If there is a cycle, the fast pointer will eventually meet the slow pointer inside the loop. If fast reaches null, there is no cycle. Time Complexity: O(N), Space Complexity: O(1).',
    code_example: `class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true; // Cycle detected!
    }
    return false; // No cycle
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'Explain Breadth-First Search (BFS) vs Depth-First Search (DFS) on Graphs.',
    answer: 'BFS explores graph nodes level-by-level using a Queue (FIFO), ideal for finding the shortest path in unweighted graphs. DFS explores as deep as possible along each branch before backtracking using a Stack or Recursion, ideal for topological sort and pathfinding.',
    code_example: `// BFS in Java using Queue
public void bfs(int startNode, List<List<Integer>> adj) {
    Queue<Integer> q = new LinkedList<>();
    boolean[] visited = new boolean[adj.size()];
    
    q.add(startNode);
    visited[startNode] = true;
    
    while (!q.isEmpty()) {
        int node = q.poll();
        System.out.print(node + " ");
        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.add(neighbor);
            }
        }
    }
}`
  },

  // ----------------------------------------------------
  // DSA (Python)
  // ----------------------------------------------------
  {
    language: 'DSA (Python)',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'How do Hash Maps (Dictionaries) work in Python, and how do you handle collisions?',
    answer: 'Python dictionaries use Hash Tables implemented with open addressing and pseudo-random probing to handle collisions. Average time complexity for insertion, lookup, and deletion is O(1).',
    code_example: `# Two Sum problem using Hash Map in Python
def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`
  },
  {
    language: 'DSA (Python)',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'How do you solve the 0/1 Knapsack problem using Dynamic Programming in Python?',
    answer: 'The 0/1 Knapsack problem uses dynamic programming to decide whether to include or exclude an item based on remaining capacity. State space is dp[i][w] representing max value using first i items and capacity w. Time Complexity: O(N * W), Space Complexity: O(W).',
    code_example: `def knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for cap in range(capacity, w - 1, -1):
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[capacity]`
  },

  // ----------------------------------------------------
  // DSA (JavaScript)
  // ----------------------------------------------------
  {
    language: 'DSA (JavaScript)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you implement Binary Search on a sorted array in JavaScript?',
    answer: 'Binary Search uses divide and conquer on a sorted array by maintaining left and right pointers. In each step, middle index mid = Math.floor((left + right)/2) is checked. Time Complexity: O(log N).',
    code_example: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // Not found
}`
  },

  // ----------------------------------------------------
  // DSA (C++)
  // ----------------------------------------------------
  {
    language: 'DSA (C++)',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'How do you implement a Min-Heap / Priority Queue using std::priority_queue in C++?',
    answer: 'In C++, std::priority_queue is a max-heap by default. To make it a min-heap, use std::greater<T> template parameter. It is built over a binary heap with push/pop in O(log N) time.',
    code_example: `#include <iostream>
#include <queue>
#include <vector>

int main() {
    // Min-Heap declaration
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    minHeap.push(10);
    minHeap.push(5);
    minHeap.push(20);

    while (!minHeap.empty()) {
        std::cout << minHeap.top() << " "; // Prints: 5 10 20
        minHeap.pop();
    }
    return 0;
}`
  }
];

async function seedResumeData() {
  try {
    await connectDatabase();
    console.log('🚀 Seeding Resume-Tailored Questions (Projects & Core Skills)...');

    for (const q of resumeQuestions) {
      await Question.create({
        ...q,
        is_user_added: true,
        source_file: '📄 Balveersing Rajput Resume'
      });
    }

    console.log(`✅ Successfully seeded ${resumeQuestions.length} custom resume & project questions!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding resume questions:', err);
    process.exit(1);
  }
}

seedResumeData();
