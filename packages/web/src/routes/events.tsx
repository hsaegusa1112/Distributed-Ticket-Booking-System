import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { getAccessToken, getAuthenticatedUser } from '../auth'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

type Showing = { id: string; startsAt: string; capacity: number; bookedAmount: number }
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
  const [eventList, setEventList] = useState(events)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    eventList[0]?.id ?? null,
  )
  const [selectedShowingId, setSelectedShowingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getAuthenticatedUser>>(null)
  const selectedEvent = eventList.find((event) => event.id === selectedEventId)
  const selectedShowing = selectedEvent?.showings.find(
    (showing) => showing.id === selectedShowingId,
  )

  useEffect(() => {
    setUser(getAuthenticatedUser())
  }, [])

  const confirmBooking = async () => {
    if (!selectedShowing) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setBookingError('Log in to confirm a booking.')
      return
    }

    setIsBooking(true)
    setBookingError(null)
    try {
      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showingId: selectedShowing.id, email: email.trim(), quantity: 1 }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to confirm your booking.')

      setEventList((currentEvents) => currentEvents.map((event) => (
        event.id !== selectedEvent?.id
          ? event
          : {
              ...event,
              showings: event.showings.map((showing) => (
                showing.id === selectedShowing.id
                  ? { ...showing, capacity: body.capacity, bookedAmount: body.bookedAmount }
                  : showing
              )),
            }
      )))
      setBookingConfirmed(true)
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Unable to reach the API.')
    } finally {
      setIsBooking(false)
    }
  }

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
            {eventList.map((event) => (
              <button
                key={event.id}
                className={`overflow-hidden border text-left ${selectedEvent?.id === event.id ? 'border-[#17211c] bg-[#17211c] text-[#f4f1e8]' : 'border-[#17211c]/20 bg-[#e7e3d7]'}`}
                onClick={() => {
                  setSelectedEventId(event.id)
                  setSelectedShowingId(null)
                  setBookingConfirmed(false)
                  setBookingError(null)
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
                      setBookingError(null)
                    }}
                  >
                    <p className="font-bold">
                      {new Intl.DateTimeFormat('en', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(showing.startsAt))}
                    </p>
                    <p
                      className={`mt-1 text-sm ${showing.id === selectedShowingId ? 'text-[#f4f1e8]/75' : 'text-[#17211c]/65'}`}
                    >
                      {showing.bookedAmount} booked of {showing.capacity}
                    </p>
                  </button>
                ))}
              </div>
              {selectedShowing && (
                <section className="mx-auto mt-8 max-w-3xl border border-[#17211c] bg-[#e7e3d7] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
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
                  <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:min-w-72">
                    <label className="text-xs font-bold uppercase tracking-[0.12em]" htmlFor="booking-email">
                      Email address
                    </label>
                    <input
                      id="booking-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setBookingConfirmed(false)
                        setBookingError(null)
                      }}
                      className="border border-[#17211c]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#17211c]"
                    />
                    <button
                      type="button"
                      disabled={isBooking || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                      className="bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32] disabled:cursor-not-allowed disabled:bg-[#17211c]/35"
                      onClick={() => void confirmBooking()}
                    >
                      {bookingConfirmed ? 'Confirmed' : isBooking ? 'Confirming...' : 'Confirm booking'}
                    </button>
                    {bookingError && <p className="text-sm text-[#a84a32]">{bookingError}</p>}
                  </div>
                </section>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
