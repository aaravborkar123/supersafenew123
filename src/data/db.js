// src/data/db.js

const USERS_KEY = 'supersafe_users_db'

function getAllUsers() {
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : {}
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUser(username) {
  const users = getAllUsers()
  return users[username.toLowerCase()] || null
}

export function createUser(username, password) {
  const users = getAllUsers()
  const key = username.toLowerCase()

  if (users[key]) {
    throw new Error('This username is already taken. Please choose another one.')
  }

  const newUser = {
    username: username, // Preserve original casing for display
    password: password,
    lessonsCompleted: [],   // lessonIds where the lesson content was viewed
    lessonsPassed: [],      // lessonIds where quiz score >= 7/10
    quizHistory: {},        // { [lessonId]: { bestScore, attempts: [{ score, date }] } }
    lastQuizScore: null
  }

  users[key] = newUser
  saveAllUsers(users)
  return newUser
}

export function authenticate(username, password) {
  const user = getUser(username)
  if (!user || user.password !== password) {
    throw new Error('Invalid username or password.')
  }
  // Migrate legacy users that don't have lessonsPassed / quizHistory yet
  if (!user.lessonsPassed) user.lessonsPassed = []
  if (!user.quizHistory) user.quizHistory = {}
  return user
}

export function completeLesson(username, lessonId) {
  const users = getAllUsers()
  const key = username.toLowerCase()
  const user = users[key]

  if (!user) return null

  if (!user.lessonsCompleted.includes(lessonId)) {
    user.lessonsCompleted.push(lessonId)
    users[key] = user
    saveAllUsers(users)
  }
  return user
}

export function recordQuizAttempt(username, lessonId, score) {
  const users = getAllUsers()
  const key = username.toLowerCase()
  const user = users[key]

  if (!user) return null

  // Initialise quiz history for this lesson if not present
  if (!user.quizHistory) user.quizHistory = {}
  if (!user.lessonsPassed) user.lessonsPassed = []

  if (!user.quizHistory[lessonId]) {
    user.quizHistory[lessonId] = { bestScore: 0, attempts: [] }
  }

  const history = user.quizHistory[lessonId]
  history.attempts.push({ score, date: new Date().toISOString() })
  if (score > history.bestScore) history.bestScore = score

  // Update lastQuizScore
  user.lastQuizScore = score

  // Mark lesson as passed if score >= 7
  if (score >= 7 && !user.lessonsPassed.includes(lessonId)) {
    user.lessonsPassed.push(lessonId)
  }

  users[key] = user
  saveAllUsers(users)
  return user
}

export function isLessonUnlocked(username, lessonId, allLessons) {
  // The first lesson is always unlocked
  if (lessonId === allLessons[0].id) return true

  const user = getUser(username)
  if (!user || !user.lessonsPassed) return false

  // A lesson is unlocked if the previous lesson has been passed
  const idx = allLessons.findIndex(l => l.id === lessonId)
  if (idx <= 0) return true
  const prevLesson = allLessons[idx - 1]
  return user.lessonsPassed.includes(prevLesson.id)
}

export function updateQuizScore(username, score) {
  const users = getAllUsers()
  const key = username.toLowerCase()
  const user = users[key]

  if (!user) return null

  user.lastQuizScore = score
  users[key] = user
  saveAllUsers(users)
  return user
}
