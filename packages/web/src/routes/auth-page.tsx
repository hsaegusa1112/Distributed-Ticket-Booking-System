import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { getAuthenticatedUser, saveAccessToken } from '../auth'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function AuthPage({ action }: { action: 'login' | 'register' }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const isRegistering = action === 'register'

  useEffect(() => {
    if (getAuthenticatedUser()) void navigate({ to: '/', replace: true })
  }, [navigate])

  const submit = async (formElement: HTMLFormElement) => {
    const form = new FormData(formElement)
    const username = String(form.get('username') ?? '')
    const password = String(form.get('password') ?? '')

    if (username.trim().length < 3 || password.length < 8) {
      setMessage('Enter a username of at least 3 characters and a password of at least 8 characters.')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to complete your request.')

      if (isRegistering) {
        await navigate({ to: '/login' })
        return
      }

      if (!body.accessToken || typeof body.accessToken !== 'string') {
        throw new Error('The API returned an invalid login response.')
      }
      saveAccessToken(body.accessToken)
      await navigate({ to: '/' })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to reach the API.')
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl border border-[#17211c]/15 bg-[#e7e3d7] lg:grid-cols-[1fr_0.9fr]">
        <section className="flex flex-col justify-between p-6 sm:p-10">
          <Link className="w-fit font-serif text-2xl font-bold" to="/">TICKETS</Link>
          <div className="max-w-xl py-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">Your ticket account</p>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-[0.95] sm:text-6xl">{isRegistering ? 'Start with a good plan.' : 'Welcome back.'}</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#17211c]/75">Keep your bookings in one place and come back to the moments you saved.</p>
          </div>
          <p className="text-sm text-[#17211c]/55">Ticketing for films, performances, and unexpected rooms.</p>
        </section>
        <section className="flex items-center border-t border-[#17211c]/15 bg-[#f4f1e8] p-6 sm:p-10 lg:border-l lg:border-t-0">
          <form className="w-full max-w-md" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget) }}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">{isRegistering ? 'Create account' : 'Sign in'}</p>
            <h2 className="mt-3 font-serif text-4xl font-bold">{isRegistering ? 'Register' : 'Login'}</h2>
            <label className="mt-8 block text-sm font-bold" htmlFor="username">Username</label>
            <input className="mt-2 w-full border border-[#17211c]/30 bg-white px-4 py-3 outline-none focus:border-[#a84a32]" id="username" name="username" autoComplete="username" minLength={3} required />
            <label className="mt-5 block text-sm font-bold" htmlFor="password">Password</label>
            <input className="mt-2 w-full border border-[#17211c]/30 bg-white px-4 py-3 outline-none focus:border-[#a84a32]" id="password" name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={8} required />
            {message && <p className="mt-4 text-sm text-[#a84a32]">{message}</p>}
            <button className="mt-7 w-full bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32]" type="submit">{isRegistering ? 'Create account' : 'Login'}</button>
            <p className="mt-5 text-sm text-[#17211c]/65">{isRegistering ? 'Already have an account? ' : 'New here? '}<Link className="font-bold text-[#a84a32]" to={isRegistering ? '/login' : '/register'}>{isRegistering ? 'Login' : 'Create an account'}</Link></p>
          </form>
        </section>
      </div>
    </main>
  )
}