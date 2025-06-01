import { promises as fs } from 'fs'
import path from 'path'

export interface User {
  id: string
  email: string
  password: string
  name: string
}

const USERS_FILE = path.resolve(process.cwd(), 'lib/data/users.json')

export async function getAllUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    // If file doesn't exist, return empty array
    return []
  }
}

export async function saveAllUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getAllUsers()
  return users.find((u) => u.email === email)
}

export async function validateUser(email: string, password: string): Promise<User | undefined> {
  const users = await getAllUsers()
  return users.find((u) => u.email === email && u.password === password)
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
  const users = await getAllUsers()
  const newUser: User = {
    ...user,
    id: Math.random().toString(36).substring(2, 10),
  }
  users.push(newUser)
  await saveAllUsers(users)
  return newUser
}
