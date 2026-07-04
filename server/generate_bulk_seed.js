const { connectDatabase, Question } = require('./db');
const { generateQuestionsByAI } = require('./services/ai');
require('dotenv').config();

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'TypeScript', 'Go', 'HTML/CSS'];

async function bulkGenerate() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('❌ Please add your GEMINI_API_KEY to server/.env first!');
    process.exit(1);
  }

  try {
    await connectDatabase();
    console.log('🚀 Starting AI Bulk Question Generation using Gemini...\n');

    let totalNew = 0;
    for (const lang of LANGUAGES) {
      console.log(`🧠 Generating 5 AI questions for ${lang}...`);
      try {
        const questions = await generateQuestionsByAI(lang, 'All', 5, 'Mixed');
        if (questions && questions.length > 0) {
          const docs = questions.map(q => ({
            language: q.language || lang,
            category: q.category || 'Basics',
            difficulty: q.difficulty || 'Medium',
            question: q.question,
            answer: q.answer,
            code_example: q.codeExample || q.code_example || '',
            is_user_added: true,
            source_file: '🤖 Gemini Bulk Generator'
          }));
          await Question.insertMany(docs);
          totalNew += docs.length;
          console.log(`   ✅ Added ${docs.length} questions for ${lang}`);
        }
      } catch (err) {
        console.error(`   ❌ Failed for ${lang}:`, err.message);
      }
    }

    console.log(`\n🎉 Bulk generation complete! Total ${totalNew} new AI questions added to database.`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

bulkGenerate();
