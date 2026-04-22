import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../config/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined)  // undefined = still loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null)
      setLoading(false)

      // Tell the browser extension whether the user is logged in
      localStorage.setItem('mg_loggedIn', firebaseUser ? 'true' : 'false')

      // Create/update profile doc on every sign-in
      if (firebaseUser) {
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'meta', 'profile'),
          {
            displayName: firebaseUser.displayName,
            email:       firebaseUser.email,
            photoURL:    firebaseUser.photoURL,
            lastSeen:    serverTimestamp(),
          },
          { merge: true }
        )
      }
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
