"use client"

import { useState, useMemo } from "react"
import type { Event } from "@/lib/types"

interface UseCalendarProps {
  events: Event[]
  initialDate?: Date
}

interface CalendarState {
  selectedDate: Date
  viewMode: "day" | "week"
}

export function useCalendar({ events, initialDate = new Date() }: UseCalendarProps) {
  const [state, setState] = useState<CalendarState>({
    selectedDate: initialDate,
    viewMode: "day",
  })

  const navigateDate = (direction: "prev" | "next") => {
    setState((prev) => {
      const newDate = new Date(prev.selectedDate)
      if (prev.viewMode === "day") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
      } else {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
      }
      return { ...prev, selectedDate: newDate }
    })
  }

  const setViewMode = (viewMode: "day" | "week") => {
    setState((prev) => ({ ...prev, viewMode }))
  }

  const setSelectedDate = (date: Date) => {
    setState((prev) => ({ ...prev, selectedDate: date }))
  }

  const getWeekDates = useMemo(() => {
    const week = []
    const startOfWeek = new Date(state.selectedDate)
    startOfWeek.setDate(state.selectedDate.getDate() - state.selectedDate.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }, [state.selectedDate])

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === date.toDateString()
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour < 22; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        hour,
      })
    }
    return slots
  }

  const getEventPosition = (event: Event) => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const startHour = start.getHours() + start.getMinutes() / 60
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    return {
      top: `${Math.max(0, (startHour - 6) * 60)}px`,
      height: `${duration * 60}px`,
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return {
    selectedDate: state.selectedDate,
    viewMode: state.viewMode,
    navigateDate,
    setViewMode,
    setSelectedDate,
    getWeekDates,
    getEventsForDate,
    getTimeSlots,
    getEventPosition,
    formatDate,
  }
}
