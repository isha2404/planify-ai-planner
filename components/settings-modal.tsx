"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Trash2 } from "lucide-react";

interface WorkingHoursSettings {
  startTime: string;
  endTime: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: WorkingHoursSettings;
  onSave: (settings: WorkingHoursSettings) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function SettingsModal({
  isOpen,
  onOpenChange,
  settings,
  onSave,
}: SettingsModalProps) {
  const [formData, setFormData] = useState<WorkingHoursSettings>(settings);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const logout = useAuth((state) => state.logout);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const toggleWorkingDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) {
        throw new Error("Not authenticated");
      }
      const { token } = JSON.parse(authStorage).state;
      if (!token) {
        throw new Error("No auth token found");
      }

      // Get Google access token if available
      const googleAccessToken = localStorage.getItem("google_access_token");

      console.log("[Delete Account] Sending delete request");
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(googleAccessToken && {
            "x-google-access-token": googleAccessToken,
          }),
        },
      });

      console.log("[Delete Account] Response status:", response.status);
      const data = await response.json();
      console.log("[Delete Account] Response data:", data);

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || "Failed to delete account";
        console.error("[Delete Account] Error response:", errorMessage);
        throw new Error(errorMessage);
      }

      // Clear all local storage
      console.log("[Delete Account] Clearing local storage");
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("google_access_token");
      logout();

      toast({
        title: "Account Deleted",
        description: `Your account and all associated data have been successfully deleted. Deleted: ${data.deleted.events} events, ${data.deleted.settings} settings, ${data.deleted.tokens} tokens, and ${data.deleted.googleEvents} Google Calendar events.`,
      });

      router.push("/login");
    } catch (error) {
      console.error("[Delete Account] Error:", error);
      toast({
        variant: "destructive",
        title: "Error Deleting Account",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Working Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.workingDays.includes(day.value)}
                      onCheckedChange={() => toggleWorkingDay(day.value)}
                    />
                    <label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
            <div className="rounded-lg border border-red-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-red-600">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All your events and schedules</li>
                          <li>Your settings and preferences</li>
                          <li>Your account information</li>
                          <li>All associated data</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
