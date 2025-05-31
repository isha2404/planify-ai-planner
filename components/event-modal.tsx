"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, Users, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"

interface EventModalProps {
  event?: Event | null
  onSave: (eventData: Event | Partial<Event>) => void
  onDelete?: (eventId: string) => void
  onClose: () => void
}

interface EventFormData {
  title: string
  start: string
  end: string
  type: Event["type"]
  priority: Event["priority"]
  description: string
  attendees: string[]
}

export default function EventModal({ event, onSave, onDelete, onClose }: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    start: "",
    end: "",
    type: "meeting",
    priority: "medium",
    description: "",
    attendees: [],
  })
  const [newAttendee, setNewAttendee] = useState("")

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
      })
    } else {
      // Default to next hour
      const now = new Date()
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
      nextHour.setMinutes(0, 0, 0)
      const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000)

      setFormData({
        title: "",
        start: nextHour.toISOString().slice(0, 16),
        end: endTime.toISOString().slice(0, 16),
        type: "meeting",
        priority: "medium",
        description: "",
        attendees: [],
      })
    }
  }, [event])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const eventData = {
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      ...(event && { id: event.id }),
    }

    onSave(eventData)
  }

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, newAttendee.trim()],
      })
      setNewAttendee("")
    }
  }

  const removeAttendee = (attendee: string) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((a) => a !== attendee),
    })
  }

  const getTypeIcon = (type: Event["type"]) => {
    switch (type) {
      case "meeting":
        return <Users className="w-4 h-4" />
      case "focus":
        return <Clock className="w-4 h-4" />
      case "break":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: Event["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{event ? "Edit Event" : "Create New Event"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end">End Time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
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
                onValueChange={(value: Event["type"]) => setFormData({ ...formData, type: value })}
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
                onValueChange={(value: Event["priority"]) => setFormData({ ...formData, priority: value })}
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
              />
              <Button type="button" onClick={addAttendee} variant="outline">
                Add
              </Button>
            </div>
            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attendees.map((attendee) => (
                  <Badge key={attendee} variant="secondary" className="flex items-center space-x-1">
                    <span>{attendee}</span>
                    <button type="button" onClick={() => removeAttendee(attendee)} className="ml-1 hover:text-red-600">
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add event description or notes"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {event && onDelete && (
                <Button type="button" variant="destructive" onClick={() => onDelete(event.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{event ? "Update Event" : "Create Event"}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
