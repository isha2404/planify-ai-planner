import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { Event } from "@/lib/types";

interface ReschedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  originalEvents: Event[];
  rescheduledEvents: Event[];
}

export default function ReschedulePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  originalEvents,
  rescheduledEvents,
}: ReschedulePreviewModalProps) {
  // Find events that were actually rescheduled
  const changedEvents = rescheduledEvents.filter((event, index) => {
    const originalEvent = originalEvents[index];
    return (
      event.start !== originalEvent.start || event.end !== originalEvent.end
    );
  });

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: Event["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarClock className="w-5 h-5" />
            <span>Reschedule Preview</span>
          </DialogTitle>
          <DialogDescription>
            {changedEvents.length} events will be rescheduled to resolve
            conflicts. Review the changes below before confirming.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {changedEvents.map((event, index) => {
              const originalEvent = originalEvents.find(
                (e) => e.id === event.id
              );
              if (!originalEvent) return null;

              return (
                <div key={event.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(event.priority)}
                      >
                        {event.priority} priority
                      </Badge>
                    </div>
                    {event.attendees && event.attendees.length > 0 && (
                      <Badge variant="outline">
                        {event.attendees.length} attendee
                        {event.attendees.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>From:</span>
                      <span className="font-medium">
                        {formatDateTime(originalEvent.start)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium text-primary">
                        {formatDateTime(event.start)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>To:</span>
                      <span className="font-medium">
                        {formatDateTime(originalEvent.end)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium text-primary">
                        {formatDateTime(event.end)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm Rescheduling</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
