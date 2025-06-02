"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authApi } from "@/lib/services/api";
import { useAuth } from "@/lib/store/auth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CalendarView from "@/components/calendar-view";
import ChatInterface from "@/components/chat-interface";
import EventModal from "@/components/event-modal";
import SettingsModal from "@/components/settings-modal";
import { useEvents } from "@/hooks/use-events";
import type { Event } from "@/lib/types";

export default function PlanifyDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const logout = useAuth((state) => state.logout);
  const user = useAuth((state) => state.user);
  const [focusMode, setFocusMode] = useState(false);

  // Initialize with empty events array
  const {
    events,
    setEvents,
    selectedEvent,
    showEventModal,
    isLoading,
    handleEventCreate,
    handleEventUpdate,
    handleEventDelete,
    openCreateEventModal,
    openEditEventModal,
    closeEventModal,
    getTodayEvents,
    getUpcomingEvents,
  } = useEvents({ initialEvents: [] });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<"calendar" | "chat">("calendar");
  const [showSettings, setShowSettings] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    startTime: "09:00",
    endTime: "17:00",
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  });

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents(3);

  const handleSaveSettings = (newSettings: typeof workingHours) => {
    setWorkingHours(newSettings);
    toast({
      description: "Working hours settings saved successfully.",
    });
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => !prev);
    toast({
      description: focusMode
        ? "Focus time mode disabled"
        : "Focus time mode enabled - only focus time events are visible",
    });
  };

  // Filter events based on focus mode
  const filteredEvents = focusMode
    ? events.filter((event) => event.type === "focus")
    : events;

  // Add refs for access tokens (for demo purposes)
  const googleTokenRef = useRef<HTMLInputElement>(null);
  const outlookTokenRef = useRef<HTMLInputElement>(null);

  // Add sync handler
  const handleSyncCalendars = async () => {
    const googleAccessToken = googleTokenRef.current?.value || "";
    const outlookAccessToken = outlookTokenRef.current?.value || "";
    if (!googleAccessToken && !outlookAccessToken) {
      toast({ description: "Please provide at least one access token." });
      return;
    }
    try {
      const response = await fetch("/api/events/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAccessToken, outlookAccessToken }),
      });
      if (!response.ok) {
        throw new Error("Failed to sync events");
      }
      const data = await response.json();
      if (data.events) {
        // Merge with existing events (avoid duplicates by id)
        const merged = [
          ...events,
          ...data.events.filter(
            (e: Event) => !events.some((ev) => ev.id === e.id)
          ),
        ];
        setEvents(merged);
        toast({ description: "Events synchronized successfully!" });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Error synchronizing events.",
      });
    }
  };

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
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await authApi.logout();
                  logout();
                  toast({
                    description: "Logged out successfully",
                  });
                  router.push("/login");
                } catch (error) {
                  toast({
                    variant: "destructive",
                    description: "Error logging out",
                  });
                }
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  onClick={openCreateEventModal}
                  disabled={focusMode}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Event
                </Button>
                <Button
                  variant={focusMode ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={toggleFocusMode}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {focusMode ? "Exit Focus Time" : "Block Focus Time"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={focusMode}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team Meeting
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSyncCalendars}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Sync Calendars
                </Button>
                <input
                  ref={googleTokenRef}
                  type="text"
                  placeholder="Google Access Token"
                  className="mt-2 w-full border rounded px-2 py-1 text-xs"
                />
                <input
                  ref={outlookTokenRef}
                  type="text"
                  placeholder="Outlook Access Token"
                  className="mt-2 w-full border rounded px-2 py-1 text-xs"
                />
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
                            {new Date(event.start).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -
                            {new Date(event.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                  <p className="text-sm text-gray-500">
                    No events scheduled for today
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Upcoming Events
              </h3>
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
                        {new Date(event.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Availability Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Availability
              </h3>
              <Card className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available now</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Next meeting:{" "}
                  {upcomingEvents[0]
                    ? new Date(upcomingEvents[0].start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
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
              events={filteredEvents}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventClick={openEditEventModal}
              workingHours={workingHours}
            />
          ) : (
            <ChatInterface
              events={filteredEvents}
              onEventCreate={handleEventCreate}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onSave={selectedEvent ? handleEventUpdate : handleEventCreate}
          onDelete={selectedEvent ? handleEventDelete : undefined}
          onClose={closeEventModal}
          isFocusMode={focusMode}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onOpenChange={setShowSettings}
        settings={workingHours}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
