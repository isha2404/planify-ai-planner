"use client"

import { Send, Bot, User, Calendar, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useChat } from "@/hooks/use-chat"
import type { Event, Message } from "@/lib/types"

interface ChatInterfaceProps {
  events: Event[]
  onEventCreate: (eventData: Partial<Event>) => void
}

export default function ChatInterface({ events, onEventCreate }: ChatInterfaceProps) {
  const { messages, inputValue, isTyping, setInputValue, handleSendMessage, handleActionClick } = useChat({
    events,
    onEventCreate,
  })

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>AI Scheduling Assistant</span>
            <Badge variant="secondary">Online</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onActionClick={handleActionClick} />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your scheduling request... (e.g., 'Schedule a call with John tomorrow at 3 PM')"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Commands */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => setInputValue("Schedule a team meeting tomorrow at 2 PM")}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Schedule Meeting
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => setInputValue("Block focus time from 9 to 11 AM tomorrow")}
              >
                <Clock className="w-3 h-3 mr-1" />
                Block Focus Time
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => setInputValue("Do I have free time on Thursday?")}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Check Availability
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => setInputValue("Move my 3 PM meeting to the afternoon")}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Reschedule Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: Message
  onActionClick: (message: Message) => void
}

function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  return (
    <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="flex items-start space-x-2">
          {message.type === "ai" && <Bot className="w-4 h-4 mt-0.5 text-blue-600" />}
          {message.type === "user" && <User className="w-4 h-4 mt-0.5 text-white" />}
          <div className="flex-1">
            <p className="text-sm">{message.content}</p>
            <p className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            {/* Action buttons for AI messages */}
            {message.type === "ai" && message.action === "schedule" && message.eventData && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-gray-900 hover:bg-gray-50"
                  onClick={() => onActionClick(message)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Add to Calendar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
