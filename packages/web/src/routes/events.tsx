import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { getAuthenticatedUser } from '../auth'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

type Showing = { id: string; startsAt: string; capacity: number }
type Event = {
  id: string
  title: string
  eventType: string
  imageUrl: string
  showings: Array<Showing>
}

export const Route = createFileRoute('/events')({
  loader: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/events`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load events.')
      return { events: body as Array<Event>, eventsError: null }
    } catch (error) {
      return {
        events: [] as Array<Event>,
        eventsError:
          error instanceof Error ? error.message : 'Unable to reach the API.',
      }
    }
  },
  component: Events,
})

function Events() {
  const { events, eventsError } = Route.useLoaderData()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null,
  )
  const [selectedShowingId, setSelectedShowingId] = useState<string | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const user = getAuthenticatedUser()
  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const selectedShowing = selectedEvent?.showings.find(
    (showing) => showing.id === selectedShowingId,
  )

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-5 text-[#17211c] sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between border-b border-[#17211c]/20 pb-5">
          <Link className="font-serif text-2xl font-bold" to="/">
            TICKETS
          </Link>
          {user ? (
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#17211c]/55">
              {user.username}
            </span>
          ) : (
            <Link
              className="text-xs font-bold uppercase tracking-[0.15em] text-[#17211c]/55"
              to="/login"
            >
              Login to book
            </Link>
          )}
        </header>
        <div className="py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">
            Book an event
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            What are you in the mood for?
          </h1>
          {eventsError && (
            <p className="mt-6 text-sm font-semibold text-[#a84a32]">
              {eventsError}
            </p>
          )}
          {!eventsError && events.length === 0 && (
            <p className="mt-6 text-sm text-[#17211c]/65">Loading events...</p>
          )}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <button
                key={event.id}
                className={`overflow-hidden border text-left ${selectedEvent?.id === event.id ? 'border-[#17211c] bg-[#17211c] text-[#f4f1e8]' : 'border-[#17211c]/20 bg-[#e7e3d7]'}`}
                onClick={() => {
                  setSelectedEventId(event.id)
                  setSelectedShowingId(null)
                  setBookingConfirmed(false)
                }}
              >
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="aspect-4/3 w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84a32]">
                    {event.eventType}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-bold">
                    {event.title}
                  </h2>
                </div>
              </button>
            ))}
          </div>
          {selectedEvent && (
            <section className="mt-10 border-t border-[#17211c]/20 pt-7">
              <h2 className="font-serif text-3xl font-bold">
                Available showings
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {selectedEvent.showings.map((showing) => (
                  <button
                    key={showing.id}
                    type="button"
                    aria-pressed={showing.id === selectedShowingId}
                    className={`border p-4 text-left transition-colors ${showing.id === selectedShowingId ? 'border-[#17211c] bg-[#17211c] text-[#f4f1e8]' : 'border-[#17211c]/20 bg-white/40 hover:border-[#17211c]/60'}`}
                    onClick={() => {
                      setSelectedShowingId(showing.id)
                      setBookingConfirmed(false)
                    }}
                  >
                    <p className="font-bold">
                      {new Intl.DateTimeFormat('en', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(showing.startsAt))}
                    </p>
                    <p className="mt-1 text-sm text-[#17211c]/65">
                      Capacity {showing.capacity}
                    </p>
                  </button>
                ))}
              </div>
              {selectedShowing && (
                <section className="mt-8 border border-[#17211c] bg-[#e7e3d7] p-5 sm:flex sm:items-end sm:justify-between sm:gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84a32]">
                      {bookingConfirmed ? 'Booking confirmed' : 'Your selection'}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-bold">
                      {selectedEvent.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#17211c]/65">
                      {new Intl.DateTimeFormat('en', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      }).format(new Date(selectedShowing.startsAt))}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-5 bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32] sm:mt-0"
                    onClick={() => setBookingConfirmed(true)}
                  >
                    {bookingConfirmed ? 'Confirmed' : 'Confirm booking'}
                  </button>
                </section>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
