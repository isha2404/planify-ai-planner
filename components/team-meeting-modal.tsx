"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface TeamMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any, attendees: string[]) => void;
}

export function TeamMeetingModal({
  isOpen,
  onClose,
  onSave,
}: TeamMeetingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
  });
  const [attendees, setAttendees] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (
        !formData.title ||
        !formData.start ||
        !formData.end ||
        !attendees.trim()
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate dates
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }

      if (startDate >= endDate) {
        throw new Error("End time must be after start time");
      }

      // Basic email validation
      const attendeeEmails = attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (attendeeEmails.length === 0) {
        throw new Error("Please enter at least one attendee email address");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = attendeeEmails.filter(
        (email) => !emailRegex.test(email)
      );
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email format: ${invalidEmails.join(", ")}`);
      }

      // Remove duplicates
      const uniqueEmails = [...new Set(attendeeEmails)];

      // Submit the form
      await onSave(
        {
          ...formData,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        uniqueEmails
      );

      // Reset form
      setFormData({
        title: "",
        description: "",
        start: "",
        end: "",
      });
      setAttendees("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create team meeting",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Team Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Meeting Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter meeting description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">
              Attendees <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              rows={3}
              required
            />
            <p className="text-sm text-gray-500">
              Enter email addresses separated by commas (e.g., john@example.com,
              jane@example.com)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
