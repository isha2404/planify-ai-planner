export interface Event {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  type: "meeting" | "focus" | "break" | "personal";
  priority: "high" | "medium" | "low";
  attendees?: string[];
  description?: string;
}

export interface Availability {
  date: string;
  slots: {
    start: string;
    end: string;
    available: boolean;
  }[];
}

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  action?: "schedule" | "reschedule" | "cancel" | "availability";
  eventData?: Partial<Event>;
}

export interface TimeSlot {
  time: string;
  hour: number;
}
