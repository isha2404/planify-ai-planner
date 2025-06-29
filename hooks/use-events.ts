"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

interface UseEventsProps {
  initialEvents?: Event[];
}

export function useEvents({ initialEvents = [] }: UseEventsProps = {}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) {
        console.error("Auth storage not found");
        throw new Error("Not authenticated");
      }

      const { token } = JSON.parse(authStorage).state;
      if (!token) {
        console.error("No auth token found in storage");
        throw new Error("No auth token found");
      }

      console.log(
        "Fetching events with token:",
        token.substring(0, 10) + "..."
      );
      const response = await fetch("/api/events", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch events:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          errorData.message ||
            `Failed to fetch events: ${response.status} ${response.statusText}`
        );
      }

      const fetchedEvents = await response.json();
      console.log("Successfully fetched events:", fetchedEvents.length);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      if (error instanceof Error) {
        if (
          error.message === "Not authenticated" ||
          error.message === "No auth token found"
        ) {
          console.log("Redirecting to login page...");
          window.location.href = "/login";
          return;
        }
        toast({
          title: "Error fetching events",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error fetching events",
          description: "An unexpected error occurred while fetching events",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events when the component mounts
  useEffect(() => {
    fetchEvents();

    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchEvents, 30000);

    // Refresh events when the window regains focus
    const handleFocus = () => {
      console.log("Window focused, refreshing events...");
      fetchEvents();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleEventCreate = async (eventData: Partial<Event>) => {
    try {
      // Make API call to create event in the database
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) {
        throw new Error("Not authenticated");
      }
      const { token } = JSON.parse(authStorage).state;
      if (!token) {
        throw new Error("No auth token found");
      }

      // Create event with a local ID first
      const localEvent = {
        ...eventData,
        id: `local_${Date.now()}`,
        title: eventData.title || "",
        start: eventData.start || new Date().toISOString(),
        end: eventData.end || new Date(Date.now() + 3600000).toISOString(),
        type: eventData.type || "meeting",
        priority: eventData.priority || "medium",
        attendees: eventData.attendees || [],
        description: eventData.description || "",
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(localEvent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      const newEvent = await response.json();
      setEvents([...events, newEvent]);
      setShowEventModal(false);

      // Sync to Google Calendar if connected
      const googleToken = localStorage.getItem("google_access_token");
      if (googleToken) {
        try {
          await fetch("/api/events/google-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              googleAccessToken: googleToken,
              syncDirection: "toGoogle",
            }),
          });
        } catch (error) {
          console.error("Failed to sync with Google Calendar:", error);
        }
      }
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        if (error.message === "Not authenticated") {
          window.location.href = "/login";
          return;
        }
        throw error;
      }
    }
  };

  const handleEventUpdate = async (eventData: Event | Partial<Event>) => {
    if ("id" in eventData) {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (!authStorage) {
          throw new Error("Not authenticated");
        }
        const { token } = JSON.parse(authStorage).state;
        if (!token) {
          throw new Error("No auth token found");
        }

        const response = await fetch(`/api/events/${eventData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          throw new Error("Unable to parse server response");
        }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to update event");
        }

        // Update successful
        setEvents(
          events.map((event) =>
            event.id === eventData.id ? { ...event, ...data } : event
          )
        );
        setShowEventModal(false);
        setSelectedEvent(null);
        toast({
          description: "Event updated successfully",
        });

        // Sync to Google Calendar if connected
        const googleToken = localStorage.getItem("google_access_token");
        if (googleToken) {
          try {
            await fetch("/api/events/google-sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                googleAccessToken: googleToken,
                syncDirection: "toGoogle",
              }),
            });
          } catch (error) {
            console.error("Failed to sync with Google Calendar:", error);
          }
        }
      } catch (error) {
        console.error("Error updating event:", error);
        if (error instanceof Error) {
          if (
            error.message === "Not authenticated" ||
            error.message === "No auth token found"
          ) {
            window.location.href = "/login";
            return;
          }
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description:
              "An unexpected error occurred while updating the event",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) {
        throw new Error("Not authenticated");
      }
      const { token } = JSON.parse(authStorage).state;
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Remove from local state
      setEvents(events.filter((event) => event.id !== eventId));
      setShowEventModal(false);
      setSelectedEvent(null);
      toast({
        description: "Event deleted successfully",
      });

      // Sync to Google Calendar if connected
      const googleToken = localStorage.getItem("google_access_token");
      if (googleToken) {
        try {
          await fetch("/api/events/google-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              googleAccessToken: googleToken,
              syncDirection: "toGoogle",
            }),
          });
        } catch (error) {
          console.error("Failed to sync with Google Calendar:", error);
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
      });
    }
  };

  const openCreateEventModal = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const openEditEventModal = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const getTodayEvents = () => {
    const today = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === today.toDateString();
    });
  };

  const getUpcomingEvents = (limit = 3) => {
    return events
      .filter((event) => new Date(event.start) > new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  };

  return {
    events,
    setEvents, // Expose setEvents for external updates
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
  };
}
