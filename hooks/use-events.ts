"use client"

import { useState } from "react"
import type { Event } from "@/lib/types"

interface UseEventsProps {
  initialEvents: Event[]
}

export function useEvents({ initialEvents }: UseEventsProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  const handleEventCreate = (eventData: Partial<Event>) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: eventData.title || "",
      start: eventData.start || new Date().toISOString(),
      end: eventData.end || new Date(Date.now() + 3600000).toISOString(),
      type: eventData.type || "meeting",
      priority: eventData.priority || "medium",
      attendees: eventData.attendees || [],
      description: eventData.description || "",
    }
    setEvents([...events, newEvent])
    setShowEventModal(false)
  }

  const handleEventUpdate = (eventData: Event | Partial<Event>) => {
    if ('id' in eventData) {
      setEvents(events.map((event) => (event.id === eventData.id ? {...event, ...eventData} : event)))
      setShowEventModal(false)
      setSelectedEvent(null)
    }
  }

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId))
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  const openCreateEventModal = () => {
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const openEditEventModal = (event: Event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const closeEventModal = () => {
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  const getTodayEvents = () => {
    const today = new Date()
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === today.toDateString()
    })
  }

  const getUpcomingEvents = (limit = 3) => {
    return events
      .filter((event) => new Date(event.start) > new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit)
  }

  return {
    events,
    selectedEvent,
    showEventModal,
    handleEventCreate,
    handleEventUpdate,
    handleEventDelete,
    openCreateEventModal,
    openEditEventModal,
    closeEventModal,
    getTodayEvents,
    getUpcomingEvents,
  }
}
