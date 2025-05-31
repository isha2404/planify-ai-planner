"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCalendar } from "@/hooks/use-calendar"
import type { Event } from "@/lib/types"

interface CalendarViewProps {
  events: Event[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
}

export default function CalendarView({ events, selectedDate, onDateSelect, onEventClick }: CalendarViewProps) {
  const {
    viewMode,
    setViewMode,
    navigateDate,
    getWeekDates,
    getEventsForDate,
    getTimeSlots,
    getEventPosition,
    formatDate,
  } = useCalendar({ events, initialDate: selectedDate })

  const timeSlots = getTimeSlots()

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === "day" ? formatDate(selectedDate) : "Week View"}
          </h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDateSelect(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "day" ? "default" : "outline"} size="sm" onClick={() => setViewMode("day")}>
            Day
          </Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" onClick={() => setViewMode("week")}>
            Week
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daily Schedule</span>
              <Badge variant="outline">{getEventsForDate(selectedDate).length} events</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Time slots */}
              <div className="space-y-0">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="flex border-b border-gray-100 h-15">
                    <div className="w-20 py-2 text-sm text-gray-500 font-medium">{slot.time}</div>
                    <div className="flex-1 relative h-15"></div>
                  </div>
                ))}

                {/* Events positioned absolutely */}
                <div className="absolute top-0 left-20 right-0 bottom-0">
                  {getEventsForDate(selectedDate).map((event) => {
                    const position = getEventPosition(event)
                    return (
                      <div
                        key={event.id}
                        className="absolute left-2 right-2 bg-blue-100 border-l-4 border-blue-500 rounded p-2 cursor-pointer hover:bg-blue-200 transition-colors"
                        style={{
                          top: position.top,
                          height: position.height,
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <p className="font-medium text-sm text-blue-900">{event.title}</p>
                        <p className="text-xs text-blue-700">
                          {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                          {new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Week View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {getWeekDates.map((date, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{date.getDate()}</p>
                  </div>
                  <div className="space-y-1">
                    {getEventsForDate(date)
                      .slice(0, 3)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="bg-blue-100 text-blue-900 p-1 rounded text-xs cursor-pointer hover:bg-blue-200"
                          onClick={() => onEventClick(event)}
                        >
                          <p className="font-medium truncate">{event.title}</p>
                          <p className="text-blue-700">
                            {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    {getEventsForDate(date).length > 3 && (
                      <p className="text-xs text-gray-500 text-center">+{getEventsForDate(date).length - 3} more</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
