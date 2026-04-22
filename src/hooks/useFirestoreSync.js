import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

// Behaves like useLocalStorage when user is null; syncs to Firestore when authenticated.
export default function useFirestoreSync(key, initialValue, user) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  const hydrated = useRef(false)

  // When user signs in, pull their Firestore value (overrides localStorage)
  useEffect(() => {
    if (!user) {
      hydrated.current = false
      return
    }
    hydrated.current = false
    const ref = doc(db, 'users', user.uid, 'data', key)
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const remote = snap.data().value
        setValue(remote)
        try { localStorage.setItem(key, JSON.stringify(remote)) } catch {}
      }
      hydrated.current = true
    }).catch(() => {
      hydrated.current = true
    })
  }, [user?.uid, key])

  // Persist to localStorage always; persist to Firestore when authenticated + hydrated
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}

    if (!user || !hydrated.current) return
    const ref = doc(db, 'users', user.uid, 'data', key)
    setDoc(ref, { value }, { merge: true }).catch(() => {})
  }, [key, value, user])

  return [value, setValue]
}
