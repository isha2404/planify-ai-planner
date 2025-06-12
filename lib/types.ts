export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "meeting" | "focus" | "task";
  priority: "low" | "medium" | "high";
  description?: string;
  attendees?: string[];
  isOwner?: boolean;
  google_calendar_id?: string;
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
