"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getAuth, signInWithPopup, GoogleAuthProvider, type User } from "firebase/auth"
import { FcGoogle } from "react-icons/fc"

interface GoogleSignInProps {
  onSignIn: (user: User) => void
}

export function GoogleSignIn({ onSignIn }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        onSignIn(user)
      }
    })

    return () => unsubscribe()
  }, [onSignIn])

  const handleSignIn = async () => {
    setLoading(true)
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      onSignIn(result.user)
    } catch (error) {
      console.error("Error signing in with Google", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
    >
      {loading ? (
        "Iniciando sesión..."
      ) : (
        <>
          <FcGoogle className="mr-2 h-4 w-4" />
          Iniciar sesión con Google
        </>
      )}
    </Button>
  )
}

