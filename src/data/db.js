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
    lessonsCompleted: [],
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
