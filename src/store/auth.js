import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ap_user') || 'null') } catch { return null }
  })

  function login(userData, token) {
    localStorage.setItem('ap_token', token)
    localStorage.setItem('ap_user', JSON.stringify(userData))
    setUser(userData)
  }
  function logout() {
    localStorage.removeItem('ap_token')
    localStorage.removeItem('ap_user')
    setUser(null)
  }
  return <Ctx.Provider value={{ user, login, logout, isAuthed: !!user }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
