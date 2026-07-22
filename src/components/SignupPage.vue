<script setup>
import { ref } from 'vue'
import { createUser } from '../data/db'

const props = defineProps({
  onSignup: Function,
  onGoLogin: Function
})

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const error = ref('')

const handleSignup = () => {
  error.value = ''
  const trimmedUser = username.value.trim()

  if (!trimmedUser) {
    error.value = 'Please enter a username.'
    return
  }
  if (trimmedUser.length < 3) {
    error.value = 'Username must be at least 3 characters.'
    return
  }
  if (!password.value) {
    error.value = 'Please enter a password.'
    return
  }

  // Password constraints validation
  const uppercaseMatch = password.value.match(/[A-Z]/g)
  const digitMatch = password.value.match(/[0-9]/g)
  const specialMatch = password.value.match(/[^A-Za-z0-9]/g)

  if (!uppercaseMatch || uppercaseMatch.length < 1) {
    error.value = 'Password must contain at least 1 capital letter.'
    return
  }
  if (!digitMatch || digitMatch.length < 3) {
    error.value = 'Password must contain at least 3 numbers.'
    return
  }
  if (!specialMatch || specialMatch.length < 1) {
    error.value = 'Password must contain at least 1 special symbol.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  try {
    createUser(trimmedUser, password.value)
    props.onSignup(trimmedUser)
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
        <div class="input-wrapper" style="position: relative; width: 100%;">
          <input
            id="signup-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Create a password"
            autocomplete="new-password"
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

      <div class="form-group">
        <label for="signup-confirm" class="form-label">Confirm Password</label>
        <div class="input-wrapper" style="position: relative; width: 100%;">
          <input
            id="signup-confirm"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Repeat your password"
            autocomplete="new-password"
            style="padding-right: 2.5rem; width: 100%;"
          />
          <button 
            type="button" 
            class="toggle-password-btn" 
            @click="showConfirmPassword = !showConfirmPassword"
            style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center;"
            aria-label="Toggle confirm password visibility"
          >
            <svg v-if="showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>
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
