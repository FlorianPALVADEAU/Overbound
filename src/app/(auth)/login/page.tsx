'use client'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export default function Login() {
  const supabase = createSupabaseBrowser()
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOtp({ email: prompt('Email ?') || '' })
    alert(error ? error.message : 'Email de connexion envoyé')
  }
  return (
    <main className="p-8">
      <button onClick={signIn} className="btn">Se connecter par email</button>
    </main>
  )
}