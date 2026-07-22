<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  username: String,
  lessonsCompleted: {
    type: Number,
    default: 0
  },
  lastQuizScore: {
    type: Number,
    default: 0
  },
  onLogout: Function,
  onGoLearning: Function,
  onGoChecker: Function
})

const isLightMode = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('secure_coder_theme')
  if (savedTheme === 'light') {
    isLightMode.value = true
    document.body.classList.add('light-theme')
  } else {
    isLightMode.value = false
    document.body.classList.remove('light-theme')
  }
})

const toggleTheme = () => {
  isLightMode.value = !isLightMode.value
  if (isLightMode.value) {
    document.body.classList.add('light-theme')
    localStorage.setItem('secure_coder_theme', 'light')
  } else {
    document.body.classList.remove('light-theme')
    localStorage.setItem('secure_coder_theme', 'dark')
  }
}
</script>

<template>
  <div class="home-card">
    <!-- Top Bar with Theme Toggle & Logout -->
    <div class="home-topbar">
      <div class="home-brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-glow);">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span class="home-brand-name">Secure Coder</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button @click="toggleTheme" class="theme-toggle-btn" :title="isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'">
          <!-- Sun Icon (shown in dark mode to switch to light) -->
          <svg v-if="!isLightMode" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Moon Icon (shown in light mode to switch to dark) -->
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button @click="onLogout" class="logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
      </div>
    </div>

    <!-- Welcome Greeting -->
    <div class="welcome-section">
      <h2 class="welcome-text">
        Welcome back,
        <span class="username-highlight">{{ username }}</span>!
      </h2>

      <!-- Progress Stats -->
      <div class="progress-card">
        <h3 class="progress-title">Your Progress</h3>
        <div class="progress-stats">
          <div class="stat-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-glow); flex-shrink: 0;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span class="stat-label">Lessons Completed:</span>
            <span class="stat-value">
              <span class="stat-number">{{ lessonsCompleted }}</span>
              <span class="stat-total">/ 7</span>
            </span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary-glow); flex-shrink: 0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span class="stat-label">Last Quiz Score:</span>
            <span class="stat-value">
              <template v-if="lastQuizScore !== null && lastQuizScore !== undefined">
                <span class="stat-number">{{ lastQuizScore }}</span>
                <span class="stat-total">/ 10</span>
              </template>
              <template v-else>
                <span class="stat-number" style="font-size: 1rem; font-weight: 600;">No score yet</span>
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Buttons -->
    <div class="features-section">
      <button @click="onGoLearning" class="feature-btn feature-btn--green">
        <div class="feature-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div class="feature-label">Learning Center</div>
        <div class="feature-sublabel">Quizzes &amp; Lessons</div>
      </button>
      <button @click="onGoChecker" class="feature-btn feature-btn--purple">
        <div class="feature-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/></svg>
        </div>
        <div class="feature-label">AI Code Checker</div>
        <div class="feature-sublabel">Scan for Vulnerabilities</div>
      </button>
    </div>
  </div>
</template>
