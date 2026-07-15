<script setup>
import { ref } from 'vue'

const props = defineProps({
  onSignup: Function,
  onGoLogin: Function
})

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const handleSignup = () => {
  error.value = ''
  if (!username.value.trim()) {
    error.value = 'Please enter a username.'
    return
  }
  if (username.value.trim().length < 3) {
    error.value = 'Username must be at least 3 characters.'
    return
  }
  if (!password.value.trim()) {
    error.value = 'Please enter a password.'
    return
  }
  if (password.value.length < 4) {
    error.value = 'Password must be at least 4 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  props.onSignup(username.value.trim())
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-emblem">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M12 8v4M12 16h.01"></path>
      </svg>
    </div>

    <h2 class="auth-title">Create Account</h2>
    <p class="auth-subtitle">Start your secure coding learning journey today.</p>

    <form class="auth-form" @submit.prevent="handleSignup">
      <div class="form-group">
        <label for="signup-username" class="form-label">Username</label>
        <input
          id="signup-username"
          v-model="username"
          type="text"
          class="form-input"
          placeholder="Choose a username"
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <label for="signup-password" class="form-label">Password</label>
        <input
          id="signup-password"
          v-model="password"
          type="password"
          class="form-input"
          placeholder="Create a password"
          autocomplete="new-password"
        />
      </div>

      <div class="form-group">
        <label for="signup-confirm" class="form-label">Confirm Password</label>
        <input
          id="signup-confirm"
          v-model="confirmPassword"
          type="password"
          class="form-input"
          placeholder="Repeat your password"
          autocomplete="new-password"
        />
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <button type="submit" class="btn btn-signup" style="width:100%; justify-content: center; margin-top: 0.5rem;">
        Create Account
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </form>

    <p class="auth-switch">
      Already have an account?
      <button @click="onGoLogin" class="link-btn">Log In</button>
    </p>
  </div>
</template>
