"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/lib/types";
import {
  findOverlappingEvents,
  getOverlapSeverity,
  formatOverlapMessage,
  type TimeOverlap,
  autoRescheduleOverlappingEvents,
} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

interface EventModalProps {
  event?: Event | null;
  onSave: (eventData: Event | Partial<Event>) => void;
  onDelete?: (eventId: string) => void;
  onClose: () => void;
  isFocusMode?: boolean;
  allEvents?: Event[];
  workingHours?: { startTime: string; endTime: string; workingDays: number[] };
}

interface EventFormData {
  title: string;
  start: string;
  end: string;
  type: Event["type"];
  priority: Event["priority"];
  description: string;
  attendees: string[];
}

export default function EventModal({
  event,
  onSave,
  onDelete,
  onClose,
  isFocusMode = false,
  allEvents = [],
  workingHours,
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: "",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    type: "meeting",
    priority: "medium",
    description: "",
    attendees: [],
  });
  const [newAttendee, setNewAttendee] = useState("");
  const [overlappingEvents, setOverlappingEvents] = useState<TimeOverlap[]>([]);
  const [suggestedTime, setSuggestedTime] = useState<Event | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        start: new Date(event.start).toISOString().slice(0, 16),
        end: new Date(event.end).toISOString().slice(0, 16),
        type: event.type,
        priority: event.priority,
        description: event.description || "",
        attendees: event.attendees || [],
      });
    } else {
      // Default to next hour
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      nextHour.setMinutes(0, 0, 0);
      const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000);

      setFormData({
        title: "",
        start: nextHour.toISOString().slice(0, 16),
        end: endTime.toISOString().slice(0, 16),
        type: "meeting",
        priority: "medium",
        description: "",
        attendees: [],
      });
    }
  }, [event]);

  useEffect(() => {
    if (formData.start && formData.end) {
      const overlaps = findOverlappingEvents(
        { ...formData, id: event?.id || "temp" } as Event,
        allEvents
      );
      setOverlappingEvents(overlaps);

      // If there are overlaps, try to find a new time slot
      if (overlaps.length > 0) {
        const rescheduledEvent = autoRescheduleOverlappingEvents(
          { ...formData, id: event?.id || "temp" } as Event,
          allEvents,
          workingHours
        );
        setSuggestedTime(rescheduledEvent);
      } else {
        setSuggestedTime(null);
      }
    }
  }, [formData.start, formData.end, allEvents, event?.id, workingHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there are any error-level overlaps
    const hasErrors = overlappingEvents.some(
      (overlap) => getOverlapSeverity(overlap) === "error"
    );

    if (hasErrors) {
      // Show a confirmation dialog or toast here if you want
      // For now, we'll just proceed with a warning
    }

    await onSave(formData);
  };

  const addAttendee = () => {
    if (
      newAttendee.trim() &&
      !formData.attendees.includes(newAttendee.trim())
    ) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, newAttendee.trim()],
      });
      setNewAttendee("");
    }
  };

  const removeAttendee = (attendee: string) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((a) => a !== attendee),
    });
  };

  const getTypeIcon = (type: Event["type"]) => {
    switch (type) {
      case "meeting":
        return <Users className="w-4 h-4" />;
      case "focus":
        return <Clock className="w-4 h-4" />;
      case "break":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Event["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleUseSuggestedTime = () => {
    if (suggestedTime) {
      setFormData((prev) => ({
        ...prev,
        start: suggestedTime.start,
        end: suggestedTime.end,
      }));
      setSuggestedTime(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Start Time</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="end">End Time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Event["type"]) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={isFocusMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Meeting</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="focus">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Focus Time</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="break">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Break</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Event["priority"]) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <Label>Attendees</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                placeholder="Add attendee name"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAttendee())
                }
              />
              <Button type="button" onClick={addAttendee} variant="outline">
                Add
              </Button>
            </div>
            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attendees.map((attendee) => (
                  <Badge
                    key={attendee}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{attendee}</span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add event description or notes"
              rows={3}
            />
          </div>

          {/* Overlapping events warnings and suggestions */}
          {overlappingEvents.length > 0 && (
            <div className="space-y-2">
              {overlappingEvents.map((overlap, index) => {
                const severity = getOverlapSeverity(overlap);
                return (
                  <Alert
                    key={index}
                    variant={severity === "error" ? "destructive" : "default"}
                    className="text-sm"
                  >
                    {severity === "error" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {formatOverlapMessage(overlap)}
                    </AlertDescription>
                  </Alert>
                );
              })}

              {/* Show suggestion if available */}
              {suggestedTime && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p className="mb-2">Would you like to reschedule to:</p>
                    <p className="font-medium">
                      {new Date(suggestedTime.start).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(suggestedTime.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleUseSuggestedTime}
                    >
                      Use Suggested Time
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <Button type="submit">
              {event ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
