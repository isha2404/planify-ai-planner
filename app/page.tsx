"use client"

import { useState } from "react"
import { Calendar, Clock, MessageSquare, Plus, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import CalendarView from "@/components/calendar-view"
import ChatInterface from "@/components/chat-interface"
import EventModal from "@/components/event-modal"
import { mockEvents } from "@/lib/mock-data"
import { useEvents } from "@/hooks/use-events"

export default function PlanifyDashboard() {
  const {
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
  } = useEvents({ initialEvents: mockEvents })

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeView, setActiveView] = useState<"calendar" | "chat">("calendar")

  const todayEvents = getTodayEvents()
  const upcomingEvents = getUpcomingEvents(3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Planify.AI</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Smart Planner
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={activeView === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("calendar")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={activeView === "chat" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("chat")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6">
            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start" onClick={openCreateEventModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Event
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Block Focus Time
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Team Meeting
                </Button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Today's Schedule ({todayEvents.length} events)
              </h3>
              <div className="space-y-2">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => openEditEventModal(event)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                            {new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            event.priority === "high"
                              ? "destructive"
                              : event.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {event.priority}
                        </Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No events scheduled for today</p>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Events</h3>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => openEditEventModal(event)}
                  >
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start).toLocaleDateString()} at{" "}
                        {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Availability Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Availability</h3>
              <Card className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available now</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Next meeting:{" "}
                  {upcomingEvents[0]
                    ? new Date(upcomingEvents[0].start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "No upcoming meetings"}
                </p>
              </Card>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeView === "calendar" ? (
            <CalendarView
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventClick={openEditEventModal}
            />
          ) : (
            <ChatInterface events={events} onEventCreate={handleEventCreate} />
          )}
        </main>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onSave={selectedEvent ? handleEventUpdate : handleEventCreate}
          onDelete={selectedEvent ? handleEventDelete : undefined}
          onClose={closeEventModal}
        />
      )}
    </div>
  )
}
