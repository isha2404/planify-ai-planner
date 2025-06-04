"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

interface UseEventsProps {
  initialEvents: Event[];
}

export function useEvents({ initialEvents }: UseEventsProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch events when the component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const authStorage = localStorage.getItem("auth-storage");
        if (!authStorage) {
          throw new Error("Not authenticated");
        }

        const { token } = JSON.parse(authStorage).state;
        if (!token) {
          throw new Error("No auth token found");
        }

        const response = await fetch("/api/events", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const fetchedEvents = await response.json();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        if (error instanceof Error && error.message === "Not authenticated") {
          window.location.href = "/login";
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
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

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventData.title || "",
          start: eventData.start || new Date().toISOString(),
          end: eventData.end || new Date(Date.now() + 3600000).toISOString(),
          type: eventData.type || "meeting",
          priority: eventData.priority || "medium",
          attendees: eventData.attendees || [],
          description: eventData.description || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      const newEvent = await response.json();
      setEvents([...events, newEvent]);
      setShowEventModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        if (error.message === "Not authenticated") {
          // Handle authentication error (e.g., redirect to login)
          window.location.href = "/login";
          return;
        }
        throw error; // Re-throw the error to be caught by the UI layer
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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Unable to parse server response");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete event");
      }

      setEvents(events.filter((event) => event.id !== eventId));
      setShowEventModal(false);
      setSelectedEvent(null);
      toast({
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      // You might want to show an error message to the user here
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
