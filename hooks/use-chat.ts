"use client"

import { useState } from "react"
import type { Event, Message } from "@/lib/types"

interface UseChatProps {
  events: Event[]
  onEventCreate: (eventData: Partial<Event>) => void
}

export function useChat({ events, onEventCreate }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hi! I'm your AI scheduling assistant. I can help you schedule meetings, block focus time, check availability, and manage your calendar. Try saying something like 'Schedule a call with John tomorrow at 3 PM' or 'Do I have free time on Thursday?'",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const extractEventData = (message: string): Partial<Event> => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(15, 0, 0, 0) // Default to 3 PM

    const endTime = new Date(tomorrow)
    endTime.setHours(16, 0, 0, 0) // 1 hour duration

    // Extract name if mentioned
    const nameMatch = message.match(/with (\w+)/i)
    const name = nameMatch ? nameMatch[1] : "Team"

    return {
      title: `Call with ${name}`,
      start: tomorrow.toISOString(),
      end: endTime.toISOString(),
      type: "meeting",
      priority: "medium",
      attendees: [name],
      description: `Scheduled via AI assistant`,
    }
  }

  const extractFocusTimeData = (message: string): Partial<Event> => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // Default to 9 AM

    const endTime = new Date(tomorrow)
    endTime.setHours(11, 0, 0, 0) // 2 hour duration

    return {
      title: "Focus Time",
      start: tomorrow.toISOString(),
      end: endTime.toISOString(),
      type: "focus",
      priority: "high",
      description: "Blocked time for focused work",
    }
  }

  const getAvailabilityResponse = (message: string): string => {
    const today = new Date()
    const todayEvents = events.filter((event) => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === today.toDateString()
    })

    if (todayEvents.length === 0) {
      return "You're completely free today! Perfect time to schedule new meetings or focus work."
    }

    return `Today you have ${todayEvents.length} scheduled events. You have free time between meetings - would you like me to suggest some optimal time slots for new activities?`
  }

  const processUserMessage = (message: string): Message => {
    const lowerMessage = message.toLowerCase()

    // Schedule meeting patterns
    if (lowerMessage.includes("schedule") && (lowerMessage.includes("call") || lowerMessage.includes("meeting"))) {
      const eventData = extractEventData(message)
      return {
        id: Date.now().toString(),
        type: "ai",
        content: `I'll schedule "${eventData.title}" for ${new Date(eventData.start!).toLocaleDateString()} at ${new Date(
          eventData.start!,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. This looks good based on your availability!`,
        timestamp: new Date(),
        action: "schedule",
        eventData,
      }
    }

    // Block time patterns
    if (lowerMessage.includes("block") && lowerMessage.includes("time")) {
      const eventData = extractFocusTimeData(message)
      return {
        id: Date.now().toString(),
        type: "ai",
        content: `I'll block ${eventData.title} for ${new Date(eventData.start!).toLocaleDateString()} from ${new Date(
          eventData.start!,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${new Date(
          eventData.end!,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. This time slot is available!`,
        timestamp: new Date(),
        action: "schedule",
        eventData,
      }
    }

    // Availability check
    if (
      lowerMessage.includes("free time") ||
      lowerMessage.includes("available") ||
      lowerMessage.includes("availability")
    ) {
      return {
        id: Date.now().toString(),
        type: "ai",
        content: getAvailabilityResponse(message),
        timestamp: new Date(),
        action: "availability",
      }
    }

    // Move/reschedule patterns
    if (lowerMessage.includes("move") || lowerMessage.includes("reschedule")) {
      return {
        id: Date.now().toString(),
        type: "ai",
        content:
          "I can help you reschedule that meeting. Which meeting would you like to move, and what's your preferred new time?",
        timestamp: new Date(),
        action: "reschedule",
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: "ai",
      content:
        "I understand you want to manage your schedule. I can help you schedule meetings, block focus time, check availability, or reschedule existing events. Could you be more specific about what you'd like to do?",
      timestamp: new Date(),
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = processUserMessage(inputValue)
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleActionClick = (message: Message) => {
    if (message.action === "schedule" && message.eventData) {
      onEventCreate(message.eventData)

      // Add confirmation message
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "✅ Event successfully added to your calendar! You can view it in the calendar view.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, confirmationMessage])
    }
  }

  return {
    messages,
    inputValue,
    isTyping,
    setInputValue,
    handleSendMessage,
    handleActionClick,
  }
}
