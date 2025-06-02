"use client";

import { useState, useMemo } from "react";
import type { Event } from "@/lib/types";

interface UseCalendarProps {
  events: Event[];
  initialDate?: Date;
}

interface CalendarState {
  selectedDate: Date;
  viewMode: "day" | "week";
}

export function useCalendar({
  events,
  initialDate = new Date(),
}: UseCalendarProps) {
  const [state, setState] = useState<CalendarState>({
    selectedDate: initialDate,
    viewMode: "day",
  });

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(state.selectedDate);
    const offset = direction === "next" ? 1 : -1;

    if (state.viewMode === "week") {
      // In week view, move by 7 days
      const weekStart = new Date(state.selectedDate);
      const currentDay = weekStart.getDay();
      // Adjust to start of current week (Monday)
      weekStart.setDate(
        weekStart.getDate() - (currentDay === 0 ? 6 : currentDay - 1)
      );
      // Move to next/previous week
      newDate.setDate(weekStart.getDate() + offset * 7);
    } else {
      // In day view, move by 1 day
      newDate.setDate(newDate.getDate() + offset);
    }

    setState((prev) => ({ ...prev, selectedDate: newDate }));
    return newDate;
  };

  const setViewMode = (viewMode: "day" | "week") => {
    setState((prev) => ({ ...prev, viewMode }));
  };

  const setSelectedDate = (date: Date) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  };

  const getWeekDates = useMemo(() => {
    const dates = [];
    const currentDate = new Date(state.selectedDate);
    const currentDay = currentDate.getDay();

    // Calculate the start of the week (Monday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(
      currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1)
    );

    // Get 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [state.selectedDate]); // Recalculate when selected date changes

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      })
      .sort((a, b) => {
        // First, compare by start time
        const timeCompare =
          new Date(a.start).getTime() - new Date(b.start).getTime();
        if (timeCompare !== 0) return timeCompare;

        // If start times are equal, sort by priority (high > medium > low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityCompare =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityCompare !== 0) return priorityCompare;

        // If priorities are equal, sort alphabetically by title
        return a.title.localeCompare(b.title);
      });
  };

  const getEventPosition = (event: Event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    // Calculate position based on 15-minute intervals (each slot is 60px height)
    const minutesFromMidnight = start.getHours() * 60 + start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // duration in minutes

    const slotHeight = 60; // height of each hour slot in pixels
    const pixelsPerMinute = slotHeight / 60;

    return {
      top: `${minutesFromMidnight * pixelsPerMinute}px`,
      height: `${duration * pixelsPerMinute}px`,
    };
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      slots.push({
        time: `${hour}:00`,
        height: 60, // Each slot is 60px high
      });
    }
    return slots;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
    isToday,
  };
}
