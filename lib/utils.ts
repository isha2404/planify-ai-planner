import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TimeOverlap {
  event: Event;
  overlapType: "start" | "end" | "contain" | "contained";
  overlapMinutes: number;
}

export function findOverlappingEvents(
  event: Event,
  allEvents: Event[]
): TimeOverlap[] {
  const eventStart = new Date(event.start).getTime();
  const eventEnd = new Date(event.end).getTime();

  return allEvents
    .filter((e) => e.id !== event.id) // Exclude the current event
    .map((e) => {
      const eStart = new Date(e.start).getTime();
      const eEnd = new Date(e.end).getTime();

      // No overlap
      if (eEnd <= eventStart || eStart >= eventEnd) {
        return null;
      }

      // Calculate overlap duration in minutes
      const overlapStart = Math.max(eventStart, eStart);
      const overlapEnd = Math.min(eventEnd, eEnd);
      const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);

      // Determine overlap type
      let overlapType: TimeOverlap["overlapType"];
      if (eStart <= eventStart && eEnd >= eventEnd) {
        overlapType = "contained";
      } else if (eStart >= eventStart && eEnd <= eventEnd) {
        overlapType = "contain";
      } else if (eStart < eventStart) {
        overlapType = "start";
      } else {
        overlapType = "end";
      }

      return {
        event: e,
        overlapType,
        overlapMinutes,
      };
    })
    .filter((overlap): overlap is TimeOverlap => overlap !== null);
}

export function getOverlapSeverity(overlap: TimeOverlap): "warning" | "error" {
  // If the overlap is more than 30 minutes, it's an error
  if (overlap.overlapMinutes > 30) {
    return "error";
  }
  // If the overlap is more than 15 minutes, it's a warning
  if (overlap.overlapMinutes > 15) {
    return "warning";
  }
  return "warning";
}

export function formatOverlapMessage(overlap: TimeOverlap): string {
  const event = overlap.event;
  const startTime = new Date(event.start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(event.end).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  switch (overlap.overlapType) {
    case "contained":
      return `This event is completely within "${event.title}" (${startTime} - ${endTime})`;
    case "contain":
      return `This event completely contains "${event.title}" (${startTime} - ${endTime})`;
    case "start":
      return `This event overlaps with the start of "${event.title}" (${startTime} - ${endTime})`;
    case "end":
      return `This event overlaps with the end of "${event.title}" (${startTime} - ${endTime})`;
  }
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export function findNextAvailableTimeSlot(
  event: Event,
  allEvents: Event[],
  workingHours?: { startTime: string; endTime: string; workingDays: number[] }
): TimeSlot | null {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = eventEnd.getTime() - eventStart.getTime();

  // Get all events for the same day
  const sameDayEvents = allEvents
    .filter((e) => {
      const eDate = new Date(e.start);
      return (
        eDate.toDateString() === eventStart.toDateString() && e.id !== event.id
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // If no events on the same day, return the original time slot
  if (sameDayEvents.length === 0) {
    return { start: eventStart, end: eventEnd };
  }

  // Check working hours constraints
  const [workStartHour, workStartMinute] = (workingHours?.startTime || "09:00")
    .split(":")
    .map(Number);
  const [workEndHour, workEndMinute] = (workingHours?.endTime || "17:00")
    .split(":")
    .map(Number);
  const workingDayStart = new Date(eventStart);
  workingDayStart.setHours(workStartHour, workStartMinute, 0, 0);
  const workingDayEnd = new Date(eventStart);
  workingDayEnd.setHours(workEndHour, workEndMinute, 0, 0);

  // If event is outside working hours, move it to the start of working hours
  if (eventStart < workingDayStart) {
    eventStart.setHours(workStartHour, workStartMinute, 0, 0);
    eventEnd.setTime(eventStart.getTime() + duration);
  }

  // Find gaps between events
  let currentTime = eventStart;

  for (const existingEvent of sameDayEvents) {
    const existingStart = new Date(existingEvent.start);
    const existingEnd = new Date(existingEvent.end);

    // If current time is before this event and there's enough space
    if (currentTime < existingStart) {
      const gapDuration = existingStart.getTime() - currentTime.getTime();
      if (gapDuration >= duration) {
        return {
          start: new Date(currentTime),
          end: new Date(currentTime.getTime() + duration),
        };
      }
    }

    // Move current time to the end of this event
    currentTime = new Date(
      Math.max(currentTime.getTime(), existingEnd.getTime())
    );
  }

  // Check if there's space after the last event
  if (currentTime < workingDayEnd) {
    const remainingTime = workingDayEnd.getTime() - currentTime.getTime();
    if (remainingTime >= duration) {
      return {
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + duration),
      };
    }
  }

  // If no slot found on the same day, try the next day
  const nextDay = new Date(eventStart);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(workStartHour, workStartMinute, 0, 0);

  // Check if next day is a working day
  if (workingHours?.workingDays.includes(nextDay.getDay())) {
    return {
      start: nextDay,
      end: new Date(nextDay.getTime() + duration),
    };
  }

  // If next day is not a working day, find the next working day
  let daysToAdd = 1;
  while (daysToAdd < 7) {
    const nextWorkingDay = new Date(eventStart);
    nextWorkingDay.setDate(nextWorkingDay.getDate() + daysToAdd);
    if (workingHours?.workingDays.includes(nextWorkingDay.getDay())) {
      nextWorkingDay.setHours(workStartHour, workStartMinute, 0, 0);
      return {
        start: nextWorkingDay,
        end: new Date(nextWorkingDay.getTime() + duration),
      };
    }
    daysToAdd++;
  }

  return null; // No available slot found
}

export function autoRescheduleOverlappingEvents(
  event: Event,
  allEvents: Event[],
  workingHours?: { startTime: string; endTime: string; workingDays: number[] }
): Event | null {
  const overlaps = findOverlappingEvents(event, allEvents);

  if (overlaps.length === 0) {
    return null; // No overlaps, no need to reschedule
  }

  // Find the next available time slot
  const newTimeSlot = findNextAvailableTimeSlot(event, allEvents, workingHours);

  if (!newTimeSlot) {
    return null; // No available slot found
  }

  // Create a new event with the rescheduled time
  return {
    ...event,
    start: newTimeSlot.start.toISOString(),
    end: newTimeSlot.end.toISOString(),
  };
}

export function rescheduleAllOverlappingEvents(
  events: Event[],
  workingHours?: { startTime: string; endTime: string; workingDays: number[] }
): Event[] {
  // Sort events by start time and priority
  const sortedEvents = [...events].sort((a, b) => {
    const timeCompare =
      new Date(a.start).getTime() - new Date(b.start).getTime();
    if (timeCompare !== 0) return timeCompare;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const rescheduledEvents: Event[] = [];
  const processedEvents = new Set<string>();

  // Process each event
  for (const event of sortedEvents) {
    if (processedEvents.has(event.id)) continue;

    // Find all events that overlap with this event
    const overlappingEvents = findOverlappingEvents(event, sortedEvents);

    if (overlappingEvents.length === 0) {
      // No overlaps, keep the event as is
      rescheduledEvents.push(event);
      processedEvents.add(event.id);
      continue;
    }

    // Get all events in this overlapping group
    const overlappingGroup = [event, ...overlappingEvents.map((o) => o.event)];

    // Sort the group by priority and start time
    overlappingGroup.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityCompare =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityCompare !== 0) return priorityCompare;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    // Keep the highest priority event in its original slot
    const highestPriorityEvent = overlappingGroup[0];
    rescheduledEvents.push(highestPriorityEvent);
    processedEvents.add(highestPriorityEvent.id);

    // Reschedule the rest of the events
    let currentEvents = [...rescheduledEvents];
    for (let i = 1; i < overlappingGroup.length; i++) {
      const eventToReschedule = overlappingGroup[i];
      const newTimeSlot = findNextAvailableTimeSlot(
        eventToReschedule,
        currentEvents,
        workingHours
      );

      if (newTimeSlot) {
        const rescheduledEvent = {
          ...eventToReschedule,
          start: newTimeSlot.start.toISOString(),
          end: newTimeSlot.end.toISOString(),
        };
        rescheduledEvents.push(rescheduledEvent);
        currentEvents.push(rescheduledEvent);
      } else {
        // If no slot found, keep the original time but mark it as conflicting
        rescheduledEvents.push({
          ...eventToReschedule,
          // You might want to add a flag or property to indicate this event couldn't be rescheduled
        });
      }
      processedEvents.add(eventToReschedule.id);
    }
  }

  return rescheduledEvents;
}
