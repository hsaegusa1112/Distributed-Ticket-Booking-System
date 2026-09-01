import { Link, createFileRoute } from '@tanstack/react-router'

import { getAuthenticatedUser } from '../auth'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const user = getAuthenticatedUser()
  return (
    <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col overflow-hidden border border-[#17211c]/15 bg-[#e7e3d7]">
        <nav className="flex items-center justify-between border-b border-[#17211c]/15 px-5 py-4 sm:px-8">
          <span className="font-serif text-2xl font-bold">TICKETS</span>
          <div className="flex items-center gap-5">
            {user ? <span className="text-sm font-semibold uppercase tracking-[0.12em]">{user.username}</span> : <Link className="text-sm font-semibold uppercase tracking-[0.12em]" to="/login">Login</Link>}
            <Link className="border-b border-[#17211c] text-sm font-semibold uppercase tracking-[0.12em]" to="/events">Browse events</Link>
          </div>
        </nav>
        <section className="grid flex-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">September programming</p>
            <h1 className="max-w-xl font-serif text-5xl font-bold leading-[0.95] sm:text-7xl">Make a night of it.</h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#17211c]/75">Find a film, performance, or an unexpected room to wander into. Your next good plan is waiting.</p>
            <Link className="mt-10 w-fit bg-[#17211c] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32]" to="/events">Find tickets</Link>
          </div>
          <div className="relative min-h-96 overflow-hidden lg:min-h-0">
            <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85" alt="Film projection" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-[#17211c]/90 p-6 text-[#f4f1e8] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7b75e]">Now showing</p>
              <p className="mt-2 font-serif text-3xl font-bold">Afterlight</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}