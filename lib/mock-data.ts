import type { Event, Availability } from "@/lib/types"

// Mock events data
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Team Standup",
    // Use static dates to avoid hydration errors
    start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    type: "meeting",
    priority: "high",
    attendees: ["Alice", "Bob", "Charlie"],
    description: "Daily team standup meeting",
  },
  {
    id: "2",
    title: "Focus Time - Project Review",
    start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    type: "focus",
    priority: "high",
    description: "Deep work session for project review",
  },
  {
    id: "3",
    title: "Client Call - Product Demo",
    // Tomorrow
    start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0, 0)).toISOString(),
    type: "meeting",
    priority: "high",
    attendees: ["John Smith", "Sarah Johnson"],
    description: "Product demonstration for potential client",
  },
  {
    id: "4",
    title: "Lunch Break",
    // Tomorrow
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(12, 0, 0, 0)).toISOString(),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(13, 0, 0, 0)).toISOString(),
    type: "break",
    priority: "low",
    description: "Lunch break",
  },
  {
    id: "5",
    title: "Sprint Planning",
    // Day after tomorrow
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(10, 0, 0, 0)).toISOString(),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(12, 0, 0, 0)).toISOString(),
    type: "meeting",
    priority: "medium",
    attendees: ["Development Team", "Product Manager"],
    description: "Planning session for next sprint",
  },
  {
    id: "6",
    title: "Code Review Session",
    // 3 days from now
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(14, 0, 0, 0)).toISOString(),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(15, 30, 0, 0)).toISOString(),
    type: "meeting",
    priority: "medium",
    attendees: ["Senior Developer", "Tech Lead"],
    description: "Review recent code changes and improvements",
  },
]

// Mock availability data
export const mockAvailability: Availability[] = [
  {
    date: new Date().toISOString().split("T")[0],
    slots: [
      { start: "09:00", end: "10:00", available: true },
      { start: "10:00", end: "11:00", available: false },
      { start: "11:00", end: "12:00", available: true },
      { start: "14:00", end: "15:00", available: true },
      { start: "15:00", end: "16:00", available: false },
      { start: "16:00", end: "17:00", available: true },
    ],
  },
]

// Mock team members data
export const mockTeamMembers = [
  { id: "1", name: "Alice Johnson", role: "Product Manager", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "2", name: "Bob Smith", role: "Developer", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "3", name: "Charlie Brown", role: "Designer", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "4", name: "Diana Prince", role: "QA Engineer", avatar: "/placeholder.svg?height=32&width=32" },
]
