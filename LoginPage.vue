<script setup>
import { ref } from 'vue'

const props = defineProps({
  onLogin: Function,
  onGoSignup: Function
})

const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = () => {
  error.value = ''
  if (!username.value.trim()) {
    error.value = 'Please enter your username.'
    return
  }
  if (!password.value.trim()) {
    error.value = 'Please enter your password.'
    return
  }
  props.onLogin(username.value.trim())
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-emblem">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <rect x="9" y="11" width="6" height="5" rx="1"></rect>
        <path d="M10 11V9a2 2 0 1 1 4 0v2"></path>
      </svg>
    </div>

    <h2 class="auth-title">Welcome Back</h2>
    <p class="auth-subtitle">Log in to continue your secure coding journey.</p>

    <form class="auth-form" @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="login-username" class="form-label">Username</label>
        <input
          id="login-username"
          v-model="username"
          type="text"
          class="form-input"
          placeholder="Enter your username"
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <label for="login-password" class="form-label">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          class="form-input"
          placeholder="Enter your password"
          autocomplete="current-password"
        />
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <button type="submit" class="btn btn-signup" style="width:100%; justify-content: center; margin-top: 0.5rem;">
        Log In
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </form>

    <p class="auth-switch">
      Don't have an account?
      <button @click="onGoSignup" class="link-btn">Sign Up</button>
    </p>
  </div>
</template>
