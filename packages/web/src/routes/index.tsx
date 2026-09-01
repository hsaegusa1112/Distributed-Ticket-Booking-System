import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const events = [
  { id: 'afterlight', title: 'Afterlight', type: 'Cinema premiere', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85' },
  { id: 'echoes', title: 'Echoes at Dusk', type: 'Live concert', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85' },
  { id: 'archive', title: 'The Archive', type: 'Immersive exhibition', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85' },
]

const days = ['Today, Sep 1', 'Tue, Sep 2', 'Wed, Sep 3']
const times = ['11:30 AM', '2:15 PM', '5:45 PM', '8:30 PM']
type View = 'home' | 'booking' | 'login' | 'register'

function Home() {
  const [view, setView] = useState<View>('home')
  const [eventId, setEventId] = useState(events[0].id)
  const [day, setDay] = useState(days[0])
  const [time, setTime] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const selectedEvent = events.find((event) => event.id === eventId) ?? events[0]

  const selectEvent = (nextEventId: string) => {
    setEventId(nextEventId)
    setTime(null)
    setIsConfirmed(false)
  }

  const selectDay = (nextDay: string) => {
    setDay(nextDay)
    setTime(null)
    setIsConfirmed(false)
  }

  const showAuthMessage = (formElement: HTMLFormElement, action: 'register' | 'login') => {
    const form = new FormData(formElement)
    const username = String(form.get('username') ?? '')
    const password = String(form.get('password') ?? '')

    if (username.trim().length < 3 || password.length < 8) {
      setAuthMessage('Enter a username of at least 3 characters and a password of at least 8 characters.')
      return
    }

    setAuthMessage(
      action === 'register'
        ? 'Registration is ready to connect to the auth service. Passwords are never stored in this browser.'
        : 'Login is ready to connect to the auth service. Passwords are never stored in this browser.',
    )
  }

  if (view === 'login' || view === 'register') {
    const isRegistering = view === 'register'

    return <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8"><div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl border border-[#17211c]/15 bg-[#e7e3d7] lg:grid-cols-[1fr_0.9fr]"><section className="flex flex-col justify-between p-6 sm:p-10"><button className="w-fit font-serif text-2xl font-bold" onClick={() => setView('home')}>TICKETS</button><div className="max-w-xl py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">Your ticket account</p><h1 className="mt-4 font-serif text-5xl font-bold leading-[0.95] sm:text-6xl">{isRegistering ? 'Start with a good plan.' : 'Welcome back.'}</h1><p className="mt-6 max-w-md text-lg leading-relaxed text-[#17211c]/75">Keep your bookings in one place and come back to the moments you saved.</p></div><p className="text-sm text-[#17211c]/55">Ticketing for films, performances, and unexpected rooms.</p></section><section className="flex items-center border-t border-[#17211c]/15 bg-[#f4f1e8] p-6 sm:p-10 lg:border-l lg:border-t-0"><form className="w-full max-w-md" onSubmit={(event) => { event.preventDefault(); showAuthMessage(event.currentTarget, isRegistering ? 'register' : 'login') }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">{isRegistering ? 'Create account' : 'Sign in'}</p><h2 className="mt-3 font-serif text-4xl font-bold">{isRegistering ? 'Register' : 'Login'}</h2><label className="mt-8 block text-sm font-bold" htmlFor="username">Username</label><input className="mt-2 w-full border border-[#17211c]/30 bg-white px-4 py-3 outline-none focus:border-[#a84a32]" id="username" name="username" autoComplete="username" minLength={3} required /> <label className="mt-5 block text-sm font-bold" htmlFor="password">Password</label><input className="mt-2 w-full border border-[#17211c]/30 bg-white px-4 py-3 outline-none focus:border-[#a84a32]" id="password" name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={8} required /><button className="mt-7 w-full bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32]">{isRegistering ? 'Create account' : 'Sign in'}</button>{authMessage && <p className="mt-4 text-sm leading-relaxed text-[#a84a32]" role="status">{authMessage}</p>}<p className="mt-7 text-sm text-[#17211c]/70">{isRegistering ? 'Already have an account?' : 'New here?'} <button className="border-b border-[#17211c] font-bold" type="button" onClick={() => { setAuthMessage(null); setView(isRegistering ? 'login' : 'register') }}>{isRegistering ? 'Login' : 'Register'}</button></p></form></section></div></main>
  }

  if (view === 'home') {
    return <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8"><div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col overflow-hidden border border-[#17211c]/15 bg-[#e7e3d7]"><nav className="flex items-center justify-between border-b border-[#17211c]/15 px-5 py-4 sm:px-8"><span className="font-serif text-2xl font-bold">TICKETS</span><div className="flex items-center gap-5"><button className="text-sm font-semibold uppercase tracking-[0.12em]" onClick={() => setView('login')}>Login</button><button className="border-b border-[#17211c] text-sm font-semibold uppercase tracking-[0.12em]" onClick={() => setView('booking')}>Browse events</button></div></nav><section className="grid flex-1 lg:grid-cols-[1.05fr_0.95fr]"><div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16"><p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">September programming</p><h1 className="max-w-xl font-serif text-5xl font-bold leading-[0.95] sm:text-7xl">Make a night of it.</h1><p className="mt-7 max-w-md text-lg leading-relaxed text-[#17211c]/75">Find a film, performance, or an unexpected room to wander into. Your next good plan is waiting.</p><button className="mt-10 w-fit bg-[#17211c] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32]" onClick={() => setView('booking')}>Find tickets</button></div><div className="relative min-h-96 overflow-hidden lg:min-h-0"><img src={events[0].image} alt="Film projection" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-[#17211c]/90 p-6 text-[#f4f1e8] sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7b75e]">Now showing</p><p className="mt-2 font-serif text-3xl font-bold">Afterlight</p></div></div></section></div></main>
  }

  return <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8"><div className="mx-auto max-w-7xl"><header className="flex items-center justify-between border-b border-[#17211c]/20 pb-5"><button className="font-serif text-2xl font-bold" onClick={() => setView('home')}>TICKETS</button><button className="text-xs font-bold uppercase tracking-[0.15em] text-[#17211c]/55" onClick={() => setView('login')}>Login to book</button></header><div className="py-10 sm:py-14"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">Book an event</p><h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">What are you in the mood for?</h1><div className="mt-8 grid gap-4 md:grid-cols-3">{events.map((event) => <button key={event.id} className={`overflow-hidden border text-left ${event.id === eventId ? 'border-[#17211c] bg-[#17211c] text-[#f4f1e8]' : 'border-[#17211c]/20 bg-[#e7e3d7] hover:border-[#17211c]'}`} onClick={() => selectEvent(event.id)}><img src={event.image} alt={event.title} className="aspect-4/3 w-full object-cover" /><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84a32]">{event.type}</p><h2 className="mt-2 font-serif text-2xl font-bold">{event.title}</h2></div></button>)}</div><section className="mt-12 grid gap-8 border-t border-[#17211c]/20 pt-8 lg:grid-cols-[1fr_0.8fr]"><div><h2 className="font-serif text-3xl font-bold">Pick a showing</h2><div className="mt-6 flex flex-wrap gap-2">{days.map((item) => <button key={item} className={`border px-4 py-3 text-sm font-semibold ${day === item ? 'border-[#17211c] bg-[#17211c] text-[#f4f1e8]' : 'border-[#17211c]/25'}`} onClick={() => selectDay(item)}>{item}</button>)}</div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{times.map((item) => <button key={item} className={`border px-3 py-4 text-sm font-bold ${time === item ? 'border-[#a84a32] bg-[#a84a32] text-white' : 'border-[#17211c]/25 bg-white/30'}`} onClick={() => { setTime(item); setIsConfirmed(false) }}>{item}</button>)}</div></div><aside className="border border-[#17211c] bg-[#17211c] p-6 text-[#f4f1e8] sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7b75e]">Your selection</p><h2 className="mt-3 font-serif text-3xl font-bold">{selectedEvent.title}</h2><p className="mt-1 text-sm text-[#f4f1e8]/70">{selectedEvent.type}</p><div className="my-6 border-t border-[#f4f1e8]/20" /><p className="text-sm">{day}</p><p className="mt-1 text-xl font-bold">{time ?? 'Choose a time'}</p><button disabled={!time} className="mt-7 w-full bg-[#d7b75e] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#17211c] disabled:cursor-not-allowed disabled:bg-[#f4f1e8]/20 disabled:text-[#f4f1e8]/50" onClick={() => setView('login')}>Login to book</button>{isConfirmed && <p className="mt-5 text-sm text-[#d7b75e]">Booked. We saved your spot for {time}.</p>}</aside></section></div></div></main>
}
