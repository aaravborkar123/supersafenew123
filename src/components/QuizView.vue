<script setup>
import { ref, computed, onMounted } from 'vue'
import { LESSONS } from '../data/lessons'
import { recordQuizAttempt, isAdmin } from '../data/db'

const props = defineProps({
  username: String,
  lesson: Object,           // current lesson object { id, name }
  onGoBack: Function,       // go back to lesson view
  onNextLesson: Function,   // go to next lesson (if unlocked)
  onRetake: Function,       // retake this quiz
  onQuizCompleted: Function // callback with (lessonId, score, updatedUser)
})

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// ─── State ────────────────────────────────────────────────────────────────────
const phase = ref('loading')  // loading | quiz | results
const questions = ref([])     // 10 selected questions shown to user
const answers = ref({})       // { [qIndex]: selectedOptionIndex }
const score = ref(0)
const showExitWarning = ref(false)
const loadingText = ref('Preparing your quiz...')
const errorMessage = ref('')

// ─── Computed ─────────────────────────────────────────────────────────────────
const currentLesson = computed(() => props.lesson)
const nextLesson = computed(() => {
  const idx = LESSONS.findIndex(l => l.id === currentLesson.value?.id)
  return idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null
})
// Admins always pass (bypass 7/10 requirement)
const lessonPassed = computed(() => isAdmin(props.username) || score.value >= 7)
const isLastLesson = computed(() => !nextLesson.value)

// ─── Quiz Generation ──────────────────────────────────────────────────────────
// Cache key for the split { setA, setB } object
const QUIZ_CACHE_KEY = (id) => `secure_coder_quiz_${id}`
// Tracks which set (0 = Set A, 1 = Set B) to show on the NEXT mount, per user+lesson
const TURN_KEY = (id) => `secure_coder_quiz_turn_${props.username}_${id}`

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

/**
 * Split all 20 questions into two balanced, fixed sets of 10:
 *   Set A: 6 MCQ + 2 T/F + 2 code  (questions 0–9 after shuffling by type)
 *   Set B: 6 MCQ + 2 T/F + 2 code  (questions 10–19 after shuffling by type)
 * Each set is then internally shuffled so question order differs every generation.
 * Sets are stored in cache so the split never changes between attempts.
 */
const buildSets = (all20) => {
  const mcq  = shuffle(all20.filter(q => q.type === 'mcq'))   // 12 items
  const tf   = shuffle(all20.filter(q => q.type === 'tf'))    // 4 items
  const code = shuffle(all20.filter(q => q.type === 'code'))  // 4 items

  const setA = shuffle([...mcq.slice(0, 6),  ...tf.slice(0, 2),  ...code.slice(0, 2)])
  const setB = shuffle([...mcq.slice(6, 12), ...tf.slice(2, 4),  ...code.slice(2, 4)])
  return { setA, setB }
}

const generateQuizQuestions = async () => {
  const lessonId = currentLesson.value.id

  // ── Load from cache if available ───────────────────────────────────────────
  const cached = localStorage.getItem(QUIZ_CACHE_KEY(lessonId))
  if (cached) {
    try {
      const parsed = JSON.parse(cached)

      // Migrate old format (plain array of 20) → new { setA, setB } format
      let sets
      if (Array.isArray(parsed)) {
        sets = buildSets(parsed)
        localStorage.setItem(QUIZ_CACHE_KEY(lessonId), JSON.stringify(sets))
      } else {
        sets = parsed
      }

      // Read which set to show this attempt (0 = A, 1 = B), alternates each mount
      const turn = parseInt(localStorage.getItem(TURN_KEY(lessonId)) || '0', 10)
      questions.value = turn === 0 ? sets.setA : sets.setB
      phase.value = 'quiz'
      return
    } catch { /* fall through to re-generate */ }
  }

  if (!API_KEY) {
    errorMessage.value = 'Quiz unavailable: API key not configured.'
    phase.value = 'error'
    return
  }

  // ── Generate fresh questions from Gemini ───────────────────────────────────
  const loadingPhrases = [
    'Generating quiz questions...',
    'Crafting security challenges...',
    'Building code fault scenarios...',
    'Randomizing difficulty mix...',
    'Almost ready...'
  ]
  let phraseIdx = 0
  const interval = setInterval(() => {
    phraseIdx = (phraseIdx + 1) % loadingPhrases.length
    loadingText.value = loadingPhrases[phraseIdx]
  }, 2000)

  try {
    const prompt = `You are a Cyber Security Quiz Generator.

Generate exactly 20 quiz questions about the topic: "${currentLesson.value.name}".

The 20 questions MUST be structured as follows:
- 12 multiple choice questions (type: "mcq") — each with 4 options
- 4 true/false questions (type: "tf") — each with exactly 2 options: ["True", "False"]
- 4 faulty code questions (type: "code") — each contains a short 5-8 line code snippet with ONE deliberate security bug, and 4 option choices identifying which line has the error (e.g. "Line 2", "Line 4", etc.)

Return ONLY a valid JSON array of 20 objects. Each object must follow this exact structure:
{
  "type": "mcq" | "tf" | "code",
  "question": "Question text here",
  "code": "code snippet here (only for type code, omit for others)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Brief explanation of why the correct answer is right"
}

CRITICAL:
- Return ONLY the JSON array. No markdown, no explanation outside the array.
- correctIndex must be the 0-based index of the correct answer in the options array.
- For type "code", the code must be short, readable, and have exactly ONE clear security bug. Options must be line identifiers like "Line 1", "Line 3", etc.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error?.message || 'Failed to fetch quiz from Gemini.')
    }

    const data = await response.json()
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip markdown fences Gemini may add despite instructions
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    const all20 = JSON.parse(raw)
    if (!Array.isArray(all20) || all20.length < 10) {
      throw new Error('Quiz generation returned an unexpected format.')
    }

    const sets = buildSets(all20)
    localStorage.setItem(QUIZ_CACHE_KEY(lessonId), JSON.stringify(sets))

    // First attempt uses Set A (turn = 0)
    localStorage.setItem(TURN_KEY(lessonId), '0')
    questions.value = sets.setA
    phase.value = 'quiz'
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || 'Failed to generate quiz questions.'
    phase.value = 'error'
  } finally {
    clearInterval(interval)
  }
}

onMounted(() => generateQuizQuestions())

// ─── Quiz Logic ───────────────────────────────────────────────────────────────
const submitQuiz = () => {
  let correct = 0
  questions.value.forEach((q, idx) => {
    if (answers.value[idx] === q.correctIndex) correct++
  })
  score.value = correct

  const lessonId = currentLesson.value.id

  // Advance the turn so the NEXT attempt uses the other set
  const currentTurn = parseInt(localStorage.getItem(TURN_KEY(lessonId)) || '0', 10)
  localStorage.setItem(TURN_KEY(lessonId), currentTurn === 0 ? '1' : '0')

  const user = recordQuizAttempt(props.username, lessonId, correct)
  props.onQuizCompleted?.(lessonId, correct, user)
  phase.value = 'results'
}

const forceExit = () => {
  score.value = 0
  const lessonId = currentLesson.value.id
  recordQuizAttempt(props.username, lessonId, 0)
  props.onQuizCompleted?.(lessonId, 0)
  props.onGoBack?.()
}

const allAnswered = computed(() =>
  questions.value.every((_, idx) => answers.value[idx] !== undefined)
)
</script>

<template>
  <div class="quiz-container">
    <!-- ─── Loading ────────────────────────────────── -->
    <div v-if="phase === 'loading'" class="quiz-loading">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>

    <!-- ─── Error ─────────────────────────────────── -->
    <div v-else-if="phase === 'error'" class="quiz-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: hsl(0,80%,60%)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <p>{{ errorMessage }}</p>
      <button class="btn-action secondary" @click="onGoBack">Back to Lesson</button>
    </div>

    <!-- ─── Active Quiz ────────────────────────────── -->
    <div v-else-if="phase === 'quiz'" class="quiz-panel">
      <!-- Header -->
      <div class="quiz-header">
        <div class="quiz-meta">
          <span class="quiz-topic">Quiz: {{ lesson.name }}</span>
          <span class="quiz-count">10 Questions</span>
        </div>
        <button class="exit-btn" @click="showExitWarning = true" title="Exit Quiz">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Exit Warning Modal -->
      <div v-if="showExitWarning" class="modal-overlay">
        <div class="modal-card warning-modal">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: hsl(38,100%,65%); margin-bottom: 0.75rem;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h3>Exit Quiz?</h3>
          <p>Exiting the quiz now will result in a <strong>0/10</strong> score being recorded. Your progress on this lesson will be marked as failed and the next lesson will remain locked.</p>
          <div class="modal-actions">
            <button class="btn-action danger" @click="forceExit">Exit &amp; Record 0/10</button>
            <button class="btn-action secondary" @click="showExitWarning = false">Keep Going</button>
          </div>
        </div>
      </div>

      <!-- Questions -->
      <div class="questions-list">
        <div
          v-for="(q, idx) in questions"
          :key="idx"
          class="question-card"
        >
          <div class="question-header">
            <span class="q-badge" :class="q.type">
              {{ q.type === 'mcq' ? 'MCQ' : q.type === 'tf' ? 'True / False' : 'Code Fault' }}
            </span>
            <span class="q-number">Q{{ idx + 1 }}</span>
          </div>
          <p class="q-text">{{ q.question }}</p>
          <pre v-if="q.type === 'code' && q.code" class="code-snippet"><code>{{ q.code }}</code></pre>
          <div class="options-list">
            <label
              v-for="(opt, oIdx) in q.options"
              :key="oIdx"
              class="option-label"
              :class="{ selected: answers[idx] === oIdx }"
            >
              <input
                type="radio"
                :name="`q${idx}`"
                :value="oIdx"
                v-model="answers[idx]"
                class="option-radio"
              />
              <span class="option-letter">{{ ['A','B','C','D'][oIdx] }}</span>
              <span class="option-text">{{ opt }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="quiz-footer">
        <p v-if="!allAnswered" class="answer-reminder">Answer all questions to submit.</p>
        <button
          class="btn-action primary submit-btn"
          :disabled="!allAnswered"
          @click="submitQuiz"
        >
          Submit Quiz
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>

    <!-- ─── Results ────────────────────────────────── -->
    <div v-else-if="phase === 'results'" class="results-panel">
      <!-- Score Banner -->
      <div class="score-banner" :class="lessonPassed ? 'passed' : 'failed'">
        <div class="score-circle">
          <span class="score-num">{{ score }}</span>
          <span class="score-denom">/10</span>
        </div>
        <div class="score-info">
          <h2 class="score-title">{{ lessonPassed ? '🎉 Quiz Passed!' : '😓 Not Quite Yet' }}</h2>
          <p class="score-sub">
            {{ lessonPassed
              ? 'Great work! The next lesson is now unlocked.'
              : "You need 7/10 or higher to unlock the next lesson. Retake when you're ready!" }}
          </p>
        </div>
      </div>

      <!-- Question Breakdown -->
      <div class="review-section">
        <h3 class="review-title">Question Breakdown</h3>
        <div
          v-for="(q, idx) in questions"
          :key="idx"
          class="review-card"
          :class="answers[idx] === q.correctIndex ? 'correct' : 'incorrect'"
        >
          <div class="review-q-header">
            <span class="q-result-icon">{{ answers[idx] === q.correctIndex ? '✓' : '✗' }}</span>
            <span class="q-badge" :class="q.type">
              {{ q.type === 'mcq' ? 'MCQ' : q.type === 'tf' ? 'True / False' : 'Code Fault' }}
            </span>
            <span class="q-number">Q{{ idx + 1 }}</span>
          </div>
          <p class="q-text">{{ q.question }}</p>
          <pre v-if="q.type === 'code' && q.code" class="code-snippet"><code>{{ q.code }}</code></pre>
          <div class="options-list review-options">
            <div
              v-for="(opt, oIdx) in q.options"
              :key="oIdx"
              class="option-label static"
              :class="{
                'option-correct': oIdx === q.correctIndex,
                'option-wrong': oIdx === answers[idx] && oIdx !== q.correctIndex
              }"
            >
              <span class="option-letter">{{ ['A','B','C','D'][oIdx] }}</span>
              <span class="option-text">{{ opt }}</span>
              <span v-if="oIdx === q.correctIndex" class="badge-correct">Correct</span>
              <span v-if="oIdx === answers[idx] && oIdx !== q.correctIndex" class="badge-wrong">Your Answer</span>
            </div>
          </div>
          <p class="explanation"><strong>Explanation:</strong> {{ q.explanation }}</p>
        </div>
      </div>

      <!-- 3-Action Footer -->
      <div class="action-footer">
        <button class="btn-action secondary" @click="onGoBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Return to Lesson
        </button>
        <button class="btn-action secondary" @click="onRetake">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
          Retake Quiz
        </button>
        <button
          class="btn-action primary"
          :disabled="!lessonPassed || isLastLesson"
          @click="onNextLesson"
        >
          Next Lesson
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <p v-if="!lessonPassed" class="locked-note">
        🔒 The next lesson is locked until you score 7/10 or higher.
      </p>
      <p v-else-if="isLastLesson" class="locked-note">
        🎓 You have completed all lessons. Congratulations!
      </p>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: cardEntrance 0.4s ease-out;
}

/* Loading */
.quiz-loading, .quiz-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.25rem;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid hsla(152, 80%, 50%, 0.12);
  border-top-color: var(--primary-glow);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  color: var(--primary-glow);
  font-weight: 500;
  font-size: 0.95rem;
}

/* Quiz Panel */
.quiz-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 1rem;
}

.quiz-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quiz-topic {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-heading);
}

.quiz-count {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  background: hsla(224, 71%, 12%, 0.6);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
}

.exit-btn {
  background: hsla(0, 80%, 50%, 0.1);
  border: 1px solid hsla(0, 80%, 50%, 0.3);
  color: hsl(0, 80%, 70%);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.exit-btn:hover { background: hsla(0, 80%, 50%, 0.2); }

/* Exit Warning Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: hsla(224, 71%, 3%, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: hsl(224, 71%, 7%);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  max-width: 440px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.warning-modal h3 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-heading);
}
.warning-modal p {
  color: var(--text-main);
  font-size: 0.95rem;
  line-height: 1.6;
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Questions */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  background: hsla(224, 71%, 6%, 0.45);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.q-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}
.q-badge.mcq  { background: hsla(220, 80%, 60%, 0.15); color: hsl(220, 80%, 75%); }
.q-badge.tf   { background: hsla(280, 80%, 60%, 0.15); color: hsl(280, 80%, 75%); }
.q-badge.code { background: hsla(38, 90%, 55%, 0.15);  color: hsl(38, 90%, 70%);  }

.q-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: auto;
}

.q-text {
  font-size: 1rem;
  color: var(--text-heading);
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}

.code-snippet {
  background: hsla(224, 71%, 3%, 0.85);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--text-main);
  margin: 0;
  line-height: 1.6;
  white-space: pre;
}
.code-snippet code { color: hsl(190, 90%, 75%); }

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  cursor: pointer;
  transition: all 0.2s;
  background: hsla(224, 71%, 4%, 0.3);
}
.option-label:hover { border-color: var(--primary-glow); background: hsla(152, 80%, 50%, 0.06); }
.option-label.selected { border-color: var(--primary-glow); background: hsla(152, 80%, 50%, 0.1); }

.option-radio { display: none; }

.option-letter {
  font-size: 0.75rem;
  font-weight: 800;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: hsla(224, 71%, 12%, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: all 0.2s;
}
.option-label.selected .option-letter {
  background: var(--primary-glow);
  color: hsl(224, 71%, 4%);
}

.option-text {
  font-size: 0.9rem;
  color: var(--text-main);
}

/* Submit */
.quiz-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  border-top: 1px solid var(--card-border);
  padding-top: 1.25rem;
}
.answer-reminder {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.submit-btn { min-width: 160px; }

/* Results */
.results-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.score-banner {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid;
}
.score-banner.passed {
  background: hsla(152, 80%, 50%, 0.07);
  border-color: hsla(152, 80%, 50%, 0.3);
}
.score-banner.failed {
  background: hsla(0, 80%, 50%, 0.07);
  border-color: hsla(0, 80%, 50%, 0.3);
}

.score-circle {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  flex-shrink: 0;
}
.score-num {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
  color: var(--text-heading);
}
.score-denom {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-muted);
}

.score-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-heading);
  margin-bottom: 0.4rem;
}
.score-sub {
  font-size: 0.9rem;
  color: var(--text-main);
  line-height: 1.5;
}

/* Review */
.review-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-heading);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.review-card {
  background: hsla(224, 71%, 6%, 0.45);
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border: 1px solid;
  margin-bottom: 1rem;
}
.review-card.correct   { border-color: hsla(152, 80%, 50%, 0.3); }
.review-card.incorrect { border-color: hsla(0, 80%, 50%, 0.3); }

.review-q-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.q-result-icon { font-size: 1.1rem; font-weight: 800; }
.review-card.correct   .q-result-icon { color: var(--primary-glow); }
.review-card.incorrect .q-result-icon { color: hsl(0, 80%, 70%); }

.review-options { pointer-events: none; }
.option-label.static { cursor: default; }
.option-label.static:hover { border-color: var(--card-border); background: hsla(224, 71%, 4%, 0.3); }

.option-correct {
  border-color: hsla(152, 80%, 50%, 0.5) !important;
  background: hsla(152, 80%, 50%, 0.08) !important;
}
.option-wrong {
  border-color: hsla(0, 80%, 50%, 0.5) !important;
  background: hsla(0, 80%, 50%, 0.08) !important;
}

.badge-correct {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary-glow);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.badge-wrong {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
  color: hsl(0, 80%, 70%);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.explanation {
  font-size: 0.87rem;
  color: var(--text-muted);
  line-height: 1.55;
  padding: 0.75rem;
  background: hsla(224, 71%, 4%, 0.4);
  border-radius: 8px;
  border-left: 3px solid var(--primary-glow);
  margin: 0;
}

/* Action Footer */
.action-footer {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--card-border);
  padding-top: 1.5rem;
}

.locked-note {
  font-size: 0.87rem;
  color: var(--text-muted);
  text-align: center;
}

/* Shared Button Styles */
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn-action.primary {
  background: var(--primary-glow);
  color: hsl(224, 71%, 4%);
}
.btn-action.primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-action.primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-action.secondary {
  background: hsla(224, 71%, 12%, 0.5);
  border: 1px solid var(--card-border);
  color: var(--text-main);
}
.btn-action.secondary:hover { background: hsla(224, 71%, 16%, 0.6); color: var(--text-heading); }
.btn-action.danger {
  background: hsla(0, 80%, 50%, 0.15);
  border: 1px solid hsla(0, 80%, 50%, 0.4);
  color: hsl(0, 80%, 75%);
}
.btn-action.danger:hover { background: hsla(0, 80%, 50%, 0.25); }
</style>
