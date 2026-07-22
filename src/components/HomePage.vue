<script setup>
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
  onGoLearning: Function
})
</script>

<template>
  <div class="home-card">
    <!-- Top Bar with Logout -->
    <div class="home-topbar">
      <div class="home-brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-glow);">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span class="home-brand-name">Secure Coder</span>
      </div>
      <button @click="onLogout" class="logout-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Log Out
      </button>
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
    <div class="features-section" style="grid-template-columns: 1fr;">
      <button @click="onGoLearning" class="feature-btn feature-btn--green" style="border-right: none; width: 100%;">
        <div class="feature-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div class="feature-label">Learning Center</div>
        <div class="feature-sublabel">Quizzes &amp; Lessons</div>
      </button>
    </div>
  </div>
</template>
