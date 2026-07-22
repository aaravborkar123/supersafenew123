<script setup>
import { ref, computed, onMounted } from 'vue'
import { LESSONS } from '../data/lessons'
import { isLessonUnlocked } from '../data/db'

const props = defineProps({
  username: String,
  onGoBack: Function,
  onLessonCompleted: Function,
  onStartQuiz: Function,       // (lesson) => void  – passed from App.vue
  redirectLesson: Object       // lesson object to auto-select if matching
})

const emit = defineEmits(['clear-redirect'])

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const selectedLesson = ref(null)
const lessonContent = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const loadingText = ref('Connecting to Gemini...')

// Determine if a lesson is unlocked for this user
const lessonUnlocked = (lesson) => isLessonUnlocked(props.username, lesson.id, LESSONS)

const selectLesson = async (lesson) => {
  if (!lessonUnlocked(lesson)) return  // locked, ignore click

  selectedLesson.value = lesson
  errorMessage.value = ''
  lessonContent.value = ''

  const cacheKey = `secure_coder_lesson_${lesson.id}`
  const cachedContent = localStorage.getItem(cacheKey)
  if (cachedContent) {
    lessonContent.value = cachedContent
    props.onLessonCompleted?.(lesson.id)
    return
  }

  if (!API_KEY) {
    errorMessage.value = 'Service unavailable: API key not configured. Please contact the site administrator.'
    return
  }

  isLoading.value = true
  const loadingPhrases = [
    'Synthesizing security parameters...',
    'Analyzing threat vectors...',
    'Consulting Gemini AI...',
    'Generating secure code patterns...',
    'Formatting lesson modules...'
  ]

  let phraseIdx = 0
  loadingText.value = loadingPhrases[phraseIdx]
  const interval = setInterval(() => {
    phraseIdx = (phraseIdx + 1) % loadingPhrases.length
    loadingText.value = loadingPhrases[phraseIdx]
  }, 2000)

  try {
    const prompt = `You are a professional Cyber Security Educator. Generate a detailed secure coding lesson about: "${lesson.name}".

    Format the entire output as clean HTML structure inside a <div>. Do NOT wrap it in markdown code blocks (\`\`\`html). Use appropriate heading, paragraph, list, and code tags.

    The lesson MUST contain the following sections with styled tags:
    1. Lesson Overview (Use <h3>)
    2. Why the Topic is Important (Use <h3>)
    3. Real-world Example (Use <h3> and describe a real incident/scenario)
    4. Bad Practice Example (Use <h3>, followed by a code block <pre><code> displaying the vulnerable code)
    5. Good Practice Example (Use <h3>, followed by a code block <pre><code> displaying the secure/mitigated code)
    6. Best Practices (Use <h3>, followed by a <ul> list)
    7. Summary (Use <h3>)

    Ensure all code blocks are cleanly formatted. Keep the style modern and clear.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error?.message || 'Failed to fetch from Gemini API.')
    }

    const data = await response.json()
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip any markdown code block wrapper Gemini may add despite instructions
    generatedText = generatedText.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim()

    lessonContent.value = generatedText
    localStorage.setItem(cacheKey, generatedText)
    props.onLessonCompleted?.(lesson.id)
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || 'An error occurred while generating the lesson.'
  } finally {
    clearInterval(interval)
    isLoading.value = false
  }
}

onMounted(() => {
  if (props.redirectLesson) {
    const lesson = LESSONS.find(l => l.id === props.redirectLesson.id)
    if (lesson && lessonUnlocked(lesson)) {
      selectLesson(lesson)
    }
    emit('clear-redirect')
  }
})
</script>

<template>
  <div class="learning-container">
    <!-- Top Nav / Back button -->
    <div class="learning-topbar">
      <button @click="onGoBack" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
      <span class="learning-title">Learning Center</span>
    </div>

    <!-- Layout Grid -->
    <div class="learning-layout">
      <!-- Sidebar Topics -->
      <div class="topics-sidebar">
        <h4 class="sidebar-title">Lesson Topics</h4>
        <div class="topics-list">
          <button
            v-for="lesson in LESSONS"
            :key="lesson.id"
            @click="selectLesson(lesson)"
            class="topic-item"
            :class="{
              'topic-item--active': selectedLesson?.id === lesson.id,
              'topic-item--locked': !lessonUnlocked(lesson)
            }"
            :disabled="!lessonUnlocked(lesson)"
          >
            <span class="topic-bullet">
              <svg v-if="!lessonUnlocked(lesson)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <span class="topic-name">{{ lesson.name }}</span>
          </button>
        </div>
      </div>

      <!-- Main Lesson Content -->
      <div class="content-display card-glass">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p class="loading-message">{{ loadingText }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(0, 80%, 60%);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <p class="error-message">{{ errorMessage }}</p>
        </div>

        <!-- Active Lesson Content -->
        <template v-else-if="lessonContent">
          <div class="lesson-article" v-html="lessonContent"></div>

          <!-- Take Quiz Button -->
          <div class="quiz-cta">
            <div class="quiz-cta-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary-glow);"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <p class="cta-title">Ready to test your knowledge?</p>
                <p class="cta-sub">Complete the quiz to unlock the next lesson. You need 7/10 or higher to pass.</p>
              </div>
            </div>
            <button class="btn-take-quiz" @click="onStartQuiz(selectedLesson)">
              Take Quiz
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </template>

        <!-- Initial/Welcome View -->
        <div v-else class="welcome-view">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-glow); margin-bottom: 1.5rem;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>
          <h3>Secure Coding Classroom</h3>
          <p>Please select a lesson topic from the sidebar to generate a lesson dynamically using Gemini AI.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-container {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: cardEntrance 0.4s ease-out;
}

.learning-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 1rem;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-weight: 500;
  transition: all 0.2s;
}
.back-btn:hover {
  background: var(--card-border);
  color: var(--text-heading);
}

.learning-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-heading);
}

/* Layout Grid */
.learning-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  min-height: 500px;
}

.topics-sidebar {
  background: hsla(224, 71%, 6%, 0.45);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.topic-item {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-main);
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 550;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.25s;
}

.topic-bullet {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topic-item:not(.topic-item--locked):hover {
  background: hsla(224, 71%, 12%, 0.4);
  color: var(--text-heading);
}

.topic-item--active {
  background: hsla(152, 80%, 50%, 0.08);
  border-color: hsla(152, 80%, 50%, 0.25);
  color: var(--primary-glow);
}
.topic-item--active .topic-bullet svg { color: var(--primary-glow); }

.topic-item--locked {
  opacity: 0.45;
  cursor: not-allowed;
}
.topic-item--locked .topic-bullet svg { color: var(--text-muted); }

/* Content Area */
.content-display {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 450px;
}

.welcome-view {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}
.welcome-view h3 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-heading);
  margin-bottom: 0.5rem;
}
.welcome-view p {
  font-size: 0.95rem;
  max-width: 400px;
}

/* Loading State */
.loading-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid hsla(152, 80%, 50%, 0.1);
  border-top-color: var(--primary-glow);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.loading-message {
  font-size: 0.9rem;
  color: var(--primary-glow);
  font-weight: 500;
  letter-spacing: 0.02em;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error State */
.error-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  max-width: 450px;
  margin: 0 auto;
}
.error-message {
  font-size: 0.95rem;
  color: hsl(0, 80%, 75%);
}

/* Lesson Article Styling */
.lesson-article {
  color: var(--text-main);
  line-height: 1.7;
  font-size: 1rem;
  animation: cardEntrance 0.3s ease-out;
}
.lesson-article :deep(h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-heading);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  border-left: 3.5px solid var(--primary-glow);
  padding-left: 0.75rem;
}
.lesson-article :deep(h3:first-of-type) { margin-top: 0; }
.lesson-article :deep(p)  { margin-bottom: 1.25rem; }
.lesson-article :deep(ul), .lesson-article :deep(ol) { margin-bottom: 1.25rem; padding-left: 1.5rem; }
.lesson-article :deep(li) { margin-bottom: 0.5rem; }
.lesson-article :deep(pre) {
  background: hsla(224, 71%, 3%, 0.85);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 1.25rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}
.lesson-article :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: hsl(190, 90%, 75%);
}
.lesson-article :deep(pre code) { color: var(--text-main); }

/* Take Quiz CTA */
.quiz-cta {
  margin-top: 2.5rem;
  padding: 1.5rem;
  border-radius: 14px;
  background: hsla(258, 80%, 60%, 0.07);
  border: 1px solid hsla(258, 80%, 60%, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.quiz-cta-info {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}
.cta-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0 0 0.2rem 0;
}
.cta-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}
.btn-take-quiz {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  background: var(--secondary-glow);
  color: hsl(224, 71%, 4%);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-take-quiz:hover { filter: brightness(1.12); transform: translateY(-1px); }

@media (max-width: 800px) {
  .learning-layout { grid-template-columns: 1fr; }
}
</style>
