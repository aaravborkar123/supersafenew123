<script setup>
import { ref } from 'vue'
import { authenticate } from '../data/db'

const props = defineProps({
  onLogin: Function,
  onGoSignup: Function
})

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const handleLogin = () => {
  error.value = ''
  const trimmedUser = username.value.trim()

  if (!trimmedUser) {
    error.value = 'Please enter your username.'
    return
  }
  if (!password.value) {
    error.value = 'Please enter your password.'
    return
  }

  try {
    authenticate(trimmedUser, password.value)
    props.onLogin(trimmedUser)
  } catch (err) {
    error.value = err.message
  }
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
        <div class="input-wrapper" style="position: relative; width: 100%;">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter your password"
            autocomplete="current-password"
            style="padding-right: 2.5rem; width: 100%;"
          />
          <button 
            type="button" 
            class="toggle-password-btn" 
            @click="showPassword = !showPassword"
            style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center;"
            aria-label="Toggle password visibility"
          >
            <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>
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
