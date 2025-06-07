"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCalendar } from "@/hooks/use-calendar";
import type { Event } from "@/lib/types";

interface CalendarViewProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  workingHours?: {
    startTime: string;
    endTime: string;
    workingDays: number[];
  };
}

export default function CalendarView({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  workingHours,
}: CalendarViewProps) {
  const {
    viewMode,
    setViewMode,
    navigateDate,
    getWeekDates,
    getEventsForDate,
    getTimeSlots,
    getEventPosition,
    formatDate,
  } = useCalendar({ events, initialDate: selectedDate });

  const timeSlots = getTimeSlots();

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === "day" ? formatDate(selectedDate) : "Week View"}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = navigateDate("prev");
                onDateSelect(newDate);
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = navigateDate("next");
                onDateSelect(newDate);
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
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
              <Badge variant="outline">
                {getEventsForDate(selectedDate).length} events
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[calc(24*60px)] overflow-y-auto">
              {/* Time slots with fixed time column */}
              <div className="sticky top-0 left-0 w-20 z-10 bg-white border-r border-gray-100 h-full">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className="h-[60px] flex items-center justify-end pr-4"
                  >
                    <div className="text-sm text-gray-500 font-medium">
                      {slot.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main calendar grid */}
              <div className="absolute top-0 left-20 right-0 h-full">
                {/* Time grid lines */}
                <div className="relative h-full">
                  {timeSlots.map((slot) => {
                    // Check if this time slot is within working hours
                    const isWorkingHour =
                      workingHours &&
                      (() => {
                        const currentDay = selectedDate.getDay();
                        if (!workingHours.workingDays.includes(currentDay)) {
                          return false;
                        }
                        const time = slot.time;
                        return (
                          time >= workingHours.startTime &&
                          time < workingHours.endTime
                        );
                      })();

                    return (
                      <div
                        key={slot.time}
                        className={`h-[60px] border-b border-gray-100 ${
                          isWorkingHour ? "bg-blue-50" : ""
                        }`}
                      />
                    );
                  })}

                  {/* Events */}
                  <div className="absolute top-0 left-0 right-0 bottom-0">
                    {getEventsForDate(selectedDate).map((event, index, arr) => {
                      const eventStart = new Date(event.start).getTime();
                      const eventEnd = new Date(event.end).getTime();
                      const position = getEventPosition(event);

                      // Find events that overlap with this event's time slot
                      const overlappingEvents = arr.filter((e) => {
                        const eStart = new Date(e.start).getTime();
                        const eEnd = new Date(e.end).getTime();
                        return (
                          e.id !== event.id &&
                          ((eStart >= eventStart && eStart < eventEnd) ||
                            (eEnd > eventStart && eEnd <= eventEnd) ||
                            (eStart <= eventStart && eEnd >= eventEnd))
                        );
                      });

                      // Find events that overlap and are either earlier in the sort order or start earlier
                      const eventsBeforeCurrent = overlappingEvents.filter(
                        (e) => {
                          const eStart = new Date(e.start).getTime();
                          // If starts at same time, use array index for consistent ordering
                          if (eStart === eventStart) {
                            return arr.indexOf(e) < index;
                          }
                          return eStart < eventStart;
                        }
                      );

                      const columnCount = Math.max(
                        overlappingEvents.length + 1,
                        1
                      );
                      const columnWidth = 95 / columnCount; // Leave 5% for gaps
                      const columnIndex = eventsBeforeCurrent.length;

                      // Determine event color based on priority and date
                      const isOutOfDate = new Date(event.end) < new Date();
                      const priorityColors = {
                        high: isOutOfDate
                          ? "bg-gray-100 hover:bg-gray-200 border-gray-500"
                          : "bg-red-100 hover:bg-red-200 border-red-500",
                        medium: isOutOfDate
                          ? "bg-gray-100 hover:bg-gray-200 border-gray-500"
                          : "bg-blue-100 hover:bg-blue-200 border-blue-500",
                        low: isOutOfDate
                          ? "bg-gray-100 hover:bg-gray-200 border-gray-500"
                          : "bg-green-100 hover:bg-green-200 border-green-500",
                      };

                      return (
                        <div
                          key={event.id}
                          className={`absolute rounded p-2 cursor-pointer transition-colors overflow-hidden border-l-4 ${
                            priorityColors[event.priority]
                          }`}
                          style={{
                            top: position.top,
                            height: position.height,
                            minHeight: "20px",
                            left: `${2 + columnIndex * columnWidth}%`,
                            width: `${columnWidth - 1}%`, // Subtract 1% for gap
                          }}
                          onClick={() => onEventClick(event)}
                        >
                          <p
                            className={`font-medium text-sm truncate ${
                              isOutOfDate ? "text-gray-500" : ""
                            }`}
                          >
                            {event.title}
                          </p>
                          <p
                            className={`text-xs opacity-75 ${
                              isOutOfDate ? "text-gray-400" : ""
                            }`}
                          >
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
                          {event.attendees && event.attendees.length > 0 && (
                            <p
                              className={`text-xs opacity-75 mt-1 truncate ${
                                isOutOfDate ? "text-gray-400" : ""
                              }`}
                            >
                              {event.attendees.length} attendee
                              {event.attendees.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
              {getWeekDates.map((date: Date, index: number) => {
                const isCurrentDate =
                  date.toDateString() === selectedDate.toDateString();
                const isToday =
                  new Date().toDateString() === date.toDateString();
                const dateEvents = getEventsForDate(date);

                return (
                  <div
                    key={index}
                    className={`space-y-2 p-2 rounded-lg cursor-pointer transition-colors
                      ${
                        isCurrentDate
                          ? "bg-blue-50 ring-2 ring-blue-200"
                          : "hover:bg-gray-50"
                      }
                    `}
                    onClick={() => onDateSelect(date)}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isToday ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div className="space-y-1 min-h-[100px]">
                      {dateEvents.slice(0, 3).map((event) => {
                        const isOutOfDate = new Date(event.end) < new Date();
                        return (
                          <div
                            key={event.id}
                            className={`p-2 rounded text-xs cursor-pointer
                              ${
                                isOutOfDate
                                  ? "bg-gray-100 hover:bg-gray-200 text-gray-500"
                                  : event.priority === "high"
                                  ? "bg-red-100 hover:bg-red-200 text-red-900"
                                  : event.priority === "medium"
                                  ? "bg-blue-100 hover:bg-blue-200 text-blue-900"
                                  : "bg-green-100 hover:bg-green-200 text-green-900"
                              }
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          >
                            <p className="font-medium truncate">
                              {event.title}
                            </p>
                            <p
                              className={`opacity-75 ${
                                isOutOfDate ? "text-gray-400" : ""
                              }`}
                            >
                              {new Date(event.start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        );
                      })}
                      {dateEvents.length > 3 && (
                        <button
                          className="w-full text-xs text-blue-600 hover:text-blue-800 text-center py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDateSelect(date);
                            setViewMode("day");
                          }}
                        >
                          +{dateEvents.length - 3} more events
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
