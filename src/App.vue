<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import SignupPage from './components/SignupPage.vue'
import HomePage from './components/HomePage.vue'
import LearningCenter from './components/LearningCenter.vue'

import { getUser, completeLesson } from './data/db'

// View state: 'landing' | 'login' | 'signup' | 'home' | 'learning'
const currentView = ref('landing')

// User session state
const username = ref('')
const lessonsCompleted = ref(0)
const lastQuizScore = ref(null)

// Navigation handlers
const goTo = (view) => { currentView.value = view }

const loadUserStats = (name) => {
  const user = getUser(name)
  if (user) {
    username.value = user.username
    lessonsCompleted.value = user.lessonsCompleted.length
    lastQuizScore.value = user.lastQuizScore
  }
}

const handleLogin = (name) => {
  loadUserStats(name)
  currentView.value = 'home'
}

const handleSignup = (name) => {
  loadUserStats(name)
  currentView.value = 'home'
}

const handleLogout = () => {
  username.value = ''
  lessonsCompleted.value = 0
  lastQuizScore.value = null
  currentView.value = 'landing'
}

const handleGoLearning = () => {
  currentView.value = 'learning'
}

const handleLessonCompleted = (lessonId) => {
  if (username.value) {
    const user = completeLesson(username.value, lessonId)
    if (user) {
      lessonsCompleted.value = user.lessonsCompleted.length
    }
  }
}
</script>

<template>
  <div class="page-wrapper">
    <!-- ─── Landing Page ─── -->
    <template v-if="currentView === 'landing'">
      <div class="hero-card">
        <div class="emblem-wrapper">
          <div class="chatbot-emblem">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <rect x="9" y="11" width="6" height="5" rx="1"></rect>
              <path d="M10 11V9a2 2 0 1 1 4 0v2"></path>
            </svg>
          </div>
        </div>

        <h1 class="hero-title">
          <span class="highlight-text">Welcome to the<br/>Learn Secure Coding Chatbot</span>
        </h1>

        <p class="hero-desc">
          Identify vulnerabilities in your code and learn some common secure coding practices through lessons and quizzes.
        </p>

        <div class="btn-group">
          <button @click="goTo('signup')" class="btn btn-signup">
            Create Account
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          <button @click="goTo('login')" class="btn btn-login">
            Log In
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </template>

    <!-- ─── Login Page ─── -->
    <template v-else-if="currentView === 'login'">
      <LoginPage
        :on-login="handleLogin"
        :on-go-signup="() => goTo('signup')"
      />
    </template>

    <!-- ─── Signup Page ─── -->
    <template v-else-if="currentView === 'signup'">
      <SignupPage
        :on-signup="handleSignup"
        :on-go-login="() => goTo('login')"
      />
    </template>

    <!-- ─── Home Page ─── -->
    <template v-else-if="currentView === 'home'">
      <HomePage
        :username="username"
        :lessons-completed="lessonsCompleted"
        :last-quiz-score="lastQuizScore"
        :on-logout="handleLogout"
        :on-go-learning="handleGoLearning"
      />
    </template>

    <!-- ─── Learning Center ─── -->
    <template v-else-if="currentView === 'learning'">
      <LearningCenter
        :username="username"
        :on-go-back="() => goTo('home')"
        :on-lesson-completed="handleLessonCompleted"
      />
    </template>
  </div>
</template>
