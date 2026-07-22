<script setup>
import { ref } from 'vue'
import { LESSONS } from '../data/lessons'

const props = defineProps({
  onGoBack: Function,
  onGoLesson: Function   // (lesson) => navigate to that lesson in Learning Center
})

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// ─── State ────────────────────────────────────────────────────────────────────
const userCode = ref('')
const isScanning = ref(false)
const scanResult = ref(null)   // { summary, flaws: [{ severity, title, lines, description, fix, relatedLesson }] }
const errorMessage = ref('')
const scanLoadingText = ref('Initializing security scan...')
const charCount = ref(0)

const MAX_CHARS = 8000

const updateCharCount = () => {
  charCount.value = userCode.value.length
  if (charCount.value > MAX_CHARS) {
    userCode.value = userCode.value.slice(0, MAX_CHARS)
    charCount.value = MAX_CHARS
  }
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
const severityClass = (s) => {
  const map = { critical: 'sev-critical', high: 'sev-high', medium: 'sev-medium', low: 'sev-low', info: 'sev-info' }
  return map[s?.toLowerCase()] || 'sev-info'
}
const severityLabel = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Info')

// ─── Related lesson matching ───────────────────────────────────────────────────
// Each flaw may reference one of the lesson topics by name (returned from AI).
// We fuzzy-match the relatedLesson string against our LESSONS list.
const matchLesson = (relatedLessonName) => {
  if (!relatedLessonName) return null
  const lower = relatedLessonName.toLowerCase()
  return LESSONS.find(l => lower.includes(l.topic.toLowerCase()) || l.topic.toLowerCase().includes(lower)) || null
}

// ─── Scan ─────────────────────────────────────────────────────────────────────
const runScan = async () => {
  const code = userCode.value.trim()
  if (!code) return
  if (!API_KEY) {
    errorMessage.value = 'Scanner unavailable: API key not configured.'
    return
  }

  isScanning.value = true
  scanResult.value = null
  errorMessage.value = ''

  const phrases = [
    'Initializing security scan...',
    'Parsing code structure...',
    'Detecting injection vulnerabilities...',
    'Checking authentication patterns...',
    'Analysing data exposure risks...',
    'Compiling security report...'
  ]
  let pi = 0
  scanLoadingText.value = phrases[pi]
  const interval = setInterval(() => {
    pi = (pi + 1) % phrases.length
    scanLoadingText.value = phrases[pi]
  }, 1800)

  try {
    const lessonTopics = LESSONS.map(l => l.topic).join(', ')

    const prompt = `You are an expert Secure Code Reviewer. Analyse the following code for security vulnerabilities.

Return ONLY a single valid JSON object (no markdown fences, no explanation outside JSON) with this exact structure:
{
  "summary": "A 1-2 sentence overall assessment of the code's security posture.",
  "flaws": [
    {
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Short name of the vulnerability (e.g. SQL Injection, Hardcoded Secret)",
      "lines": "e.g. 'Line 4' or 'Lines 7-9' or 'General' if not line-specific",
      "description": "Clear explanation of what the vulnerability is and why it is dangerous.",
      "fix": "Concrete, actionable suggestion to fix this specific vulnerability.",
      "relatedLesson": "If this flaw relates to one of these topics, name the matching topic exactly as listed, otherwise null: ${lessonTopics}"
    }
  ]
}

Rules:
- If no flaws are found, set "flaws" to an empty array and "summary" to a positive assessment.
- Order flaws from most severe to least severe.
- Be specific: reference exact line numbers or ranges where possible.
- Keep each description under 3 sentences.
- Keep each fix under 3 sentences and make it practical.
- Do NOT wrap the output in markdown code fences.

Code to analyse:
\`\`\`
${code}
\`\`\``

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error?.message || 'Scan request failed.')
    }

    const data = await response.json()
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip any accidental markdown fences
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    const parsed = JSON.parse(raw)

    // Sort flaws by severity
    parsed.flaws = (parsed.flaws || []).sort(
      (a, b) => (SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 99) - (SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 99)
    )

    scanResult.value = parsed
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || 'An error occurred during the scan.'
  } finally {
    clearInterval(interval)
    isScanning.value = false
  }
}

const clearAll = () => {
  userCode.value = ''
  charCount.value = 0
  scanResult.value = null
  errorMessage.value = ''
}
</script>

<template>
  <div class="checker-container">
    <!-- Top bar -->
    <div class="checker-topbar">
      <button @click="onGoBack" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </button>
      <span class="checker-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary-glow);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/></svg>
        AI Code Checker
      </span>
    </div>

    <!-- Disclaimer Banner -->
    <div class="checker-disclaimer">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="disclaimer-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span class="disclaimer-text"><strong>Disclaimer:</strong> This AI-powered tool does not catch or mention all potential vulnerabilities. Always manually verify and review your code before deployment.</span>
    </div>

    <!-- Main layout -->
    <div class="checker-layout">
      <!-- LEFT — Code Input -->
      <div class="input-panel card-glass">
        <div class="panel-header">
          <h3 class="panel-title">Paste Your Code</h3>
          <span class="char-count" :class="{ 'char-limit': charCount >= MAX_CHARS }">
            {{ charCount.toLocaleString() }} / {{ MAX_CHARS.toLocaleString() }}
          </span>
        </div>

        <textarea
          v-model="userCode"
          @input="updateCharCount"
          class="code-input"
          placeholder="// Paste or type your code here...
// Supports any language: Python, JavaScript, Java, PHP, etc.

function login(username, password) {
  const query = 'SELECT * FROM users WHERE user=\'' + username + '\'';
  // ...
}"
          spellcheck="false"
          autocomplete="off"
        ></textarea>

        <div class="input-actions">
          <button class="btn-clear" @click="clearAll" :disabled="!userCode && !scanResult">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
            Clear
          </button>
          <button
            class="btn-scan"
            @click="runScan"
            :disabled="!userCode.trim() || isScanning"
          >
            <svg v-if="!isScanning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <div v-else class="btn-spinner"></div>
            {{ isScanning ? 'Scanning...' : 'Scan for Vulnerabilities' }}
          </button>
        </div>
      </div>

      <!-- RIGHT — Results -->
      <div class="results-panel card-glass">
        <!-- Scanning state -->
        <div v-if="isScanning" class="results-loading">
          <div class="radar-ring"></div>
          <p class="scan-loading-text">{{ scanLoadingText }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMessage" class="results-error">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: hsl(0,80%,60%)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Scan Results -->
        <template v-else-if="scanResult">
          <!-- Summary banner -->
          <div class="summary-banner" :class="scanResult.flaws.length === 0 ? 'safe' : scanResult.flaws.some(f => ['critical','high'].includes(f.severity?.toLowerCase())) ? 'danger' : 'warn'">
            <div class="summary-icon">
              <svg v-if="scanResult.flaws.length === 0" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/></svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="summary-text">
              <p class="summary-headline">
                {{ scanResult.flaws.length === 0 ? 'No issues found' : `${scanResult.flaws.length} issue${scanResult.flaws.length > 1 ? 's' : ''} detected` }}
              </p>
              <p class="summary-body">{{ scanResult.summary }}</p>
            </div>
          </div>

          <!-- Flaws list -->
          <div v-if="scanResult.flaws.length > 0" class="flaws-list">
            <div
              v-for="(flaw, idx) in scanResult.flaws"
              :key="idx"
              class="flaw-card"
              :class="severityClass(flaw.severity)"
            >
              <div class="flaw-header">
                <span class="severity-badge" :class="severityClass(flaw.severity)">
                  {{ severityLabel(flaw.severity) }}
                </span>
                <span class="flaw-title">{{ flaw.title }}</span>
                <span class="flaw-lines">{{ flaw.lines }}</span>
              </div>

              <p class="flaw-description">{{ flaw.description }}</p>

              <div class="flaw-fix">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; color: var(--primary-glow);"><polyline points="20 6 9 17 4 12"/></svg>
                <p>{{ flaw.fix }}</p>
              </div>

              <!-- Related lesson link -->
              <div v-if="matchLesson(flaw.relatedLesson)" class="lesson-cta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>This relates to the <strong>{{ matchLesson(flaw.relatedLesson).name }}</strong> lesson.</span>
                <button class="btn-view-lesson" @click="onGoLesson(matchLesson(flaw.relatedLesson))">
                  View Lesson
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty / placeholder -->
        <div v-else class="results-placeholder">
          <div class="placeholder-graphic">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary-glow); opacity: 0.6;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3" stroke-width="1.8"/></svg>
          </div>
          <h3>Your security report will appear here</h3>
          <p>Paste any code snippet on the left and click <strong>Scan for Vulnerabilities</strong> to receive an AI-powered security analysis with fix recommendations.</p>
          <ul class="placeholder-tips">
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Supports any programming language
            </li>
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Detects injection, exposure, auth flaws &amp; more
            </li>
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Links issues to relevant learning lessons
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checker-container {
  width: 100%;
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: cardEntrance 0.4s ease-out;
}

/* Top bar */
.checker-topbar {
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
.back-btn:hover { background: var(--card-border); color: var(--text-heading); }

.checker-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-heading);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Layout */
.checker-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  min-height: 560px;
}

/* Panels */
.input-panel,
.results-panel {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  font-family: var(--font-mono);
  transition: color 0.2s;
}
.char-count.char-limit { color: hsl(0, 80%, 65%); }

/* Code textarea */
.code-input {
  flex: 1;
  resize: none;
  background: hsla(224, 71%, 3%, 0.7);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  color: hsl(190, 90%, 78%);
  line-height: 1.65;
  outline: none;
  min-height: 360px;
  transition: border-color 0.2s;
}
.code-input::placeholder { color: hsla(220, 20%, 50%, 0.5); }
.code-input:focus { border-color: hsla(258, 80%, 65%, 0.5); }

/* Input actions */
.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear:hover:not(:disabled) { color: var(--text-main); border-color: var(--text-muted); }
.btn-clear:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-scan {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--secondary-glow);
  color: hsl(224, 71%, 4%);
  border: none;
  padding: 0.65rem 1.3rem;
  border-radius: 10px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-scan:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.btn-scan:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid hsla(224, 71%, 4%, 0.25);
  border-top-color: hsl(224, 71%, 4%);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Results loading */
.results-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

/* Radar animation */
.radar-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid hsla(258, 80%, 65%, 0.15);
  position: relative;
  animation: radar-pulse 1.6s ease-in-out infinite;
}
.radar-ring::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 2px solid hsla(258, 80%, 65%, 0.25);
  animation: radar-pulse 1.6s ease-in-out 0.3s infinite;
}
.radar-ring::after {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  background: hsla(258, 80%, 65%, 0.2);
  animation: radar-pulse 1.6s ease-in-out 0.6s infinite;
}
@keyframes radar-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
}

.scan-loading-text {
  font-size: 0.9rem;
  color: var(--secondary-glow);
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* Error */
.results-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  color: hsl(0, 80%, 70%);
  font-size: 0.9rem;
  padding: 2rem;
}

/* Summary banner */
.summary-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border-radius: 12px;
  border: 1px solid;
}
.summary-banner.safe   { background: hsla(152, 80%, 50%, 0.07); border-color: hsla(152, 80%, 50%, 0.3); }
.summary-banner.warn   { background: hsla(38, 90%, 55%, 0.07);  border-color: hsla(38, 90%, 55%, 0.3);  }
.summary-banner.danger { background: hsla(0, 80%, 50%, 0.07);   border-color: hsla(0, 80%, 50%, 0.3);   }

.summary-icon { flex-shrink: 0; margin-top: 0.1rem; }
.summary-banner.safe   .summary-icon { color: var(--primary-glow); }
.summary-banner.warn   .summary-icon { color: hsl(38, 90%, 65%); }
.summary-banner.danger .summary-icon { color: hsl(0, 80%, 65%); }

.summary-headline {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0 0 0.25rem 0;
}
.summary-body {
  font-size: 0.87rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

/* Flaws list */
.flaws-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  max-height: 480px;
  padding-right: 4px;
}
.flaws-list::-webkit-scrollbar { width: 4px; }
.flaws-list::-webkit-scrollbar-track { background: transparent; }
.flaws-list::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 4px; }

.flaw-card {
  padding: 1.2rem 1.3rem;
  border-radius: 12px;
  border-left: 3px solid;
  background: hsla(224, 71%, 6%, 0.5);
  border-top: 1px solid var(--card-border);
  border-right: 1px solid var(--card-border);
  border-bottom: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: cardEntrance 0.3s ease-out;
}
.flaw-card.sev-critical { border-left-color: hsl(0, 90%, 55%); }
.flaw-card.sev-high     { border-left-color: hsl(22, 90%, 55%); }
.flaw-card.sev-medium   { border-left-color: hsl(38, 90%, 55%); }
.flaw-card.sev-low      { border-left-color: hsl(200, 80%, 60%); }
.flaw-card.sev-info     { border-left-color: var(--text-muted); }

.flaw-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.severity-badge {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.18rem 0.55rem;
  border-radius: 5px;
  flex-shrink: 0;
}
.severity-badge.sev-critical { background: hsla(0, 90%, 55%, 0.18);  color: hsl(0, 90%, 70%); }
.severity-badge.sev-high     { background: hsla(22, 90%, 55%, 0.18); color: hsl(22, 90%, 70%); }
.severity-badge.sev-medium   { background: hsla(38, 90%, 55%, 0.18); color: hsl(38, 90%, 70%); }
.severity-badge.sev-low      { background: hsla(200, 80%, 60%, 0.18);color: hsl(200, 80%, 75%); }
.severity-badge.sev-info     { background: hsla(220, 20%, 60%, 0.15);color: var(--text-muted); }

.flaw-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-heading);
  flex: 1;
}

.flaw-lines {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: hsla(224, 71%, 4%, 0.5);
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
}

.flaw-description {
  font-size: 0.87rem;
  color: var(--text-main);
  line-height: 1.55;
  margin: 0;
}

.flaw-fix {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: hsla(152, 80%, 50%, 0.05);
  border: 1px solid hsla(152, 80%, 50%, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.flaw-fix p {
  font-size: 0.85rem;
  color: var(--text-main);
  line-height: 1.5;
  margin: 0;
}

/* Related lesson CTA */
.lesson-cta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  background: hsla(258, 80%, 60%, 0.07);
  border: 1px solid hsla(258, 80%, 60%, 0.2);
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  font-size: 0.83rem;
  color: var(--text-muted);
}
.lesson-cta strong { color: var(--text-main); }
.lesson-cta svg { color: var(--secondary-glow); }

.btn-view-lesson {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: auto;
  background: var(--secondary-glow);
  color: hsl(224, 71%, 4%);
  border: none;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-view-lesson:hover { filter: brightness(1.1); }

/* Placeholder */
.results-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  color: var(--text-muted);
  padding: 1rem;
}
.placeholder-graphic { margin-bottom: 0.5rem; }
.results-placeholder h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-heading);
}
.results-placeholder p {
  font-size: 0.87rem;
  line-height: 1.6;
  max-width: 320px;
  color: var(--text-muted);
}
.results-placeholder strong { color: var(--text-main); }

.placeholder-tips {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-align: left;
}
.placeholder-tips li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.placeholder-tips li svg { color: var(--primary-glow); flex-shrink: 0; }

@media (max-width: 800px) {
  .checker-layout { grid-template-columns: 1fr; }
  .code-input { min-height: 240px; }
}

.checker-disclaimer {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  background: hsla(38, 90%, 55%, 0.08);
  border: 1px solid hsla(38, 90%, 55%, 0.25);
  border-radius: 8px;
  color: hsl(38, 90%, 75%);
  font-size: 0.82rem;
  line-height: 1.4;
}
.disclaimer-icon {
  flex-shrink: 0;
  color: hsl(38, 90%, 65%);
}
.disclaimer-text strong {
  color: hsl(38, 90%, 80%);
}
</style>
