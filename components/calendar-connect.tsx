"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Calendar } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const OUTLOOK_CLIENT_ID = process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID;

interface CalendarConnectionProps {
  onConnect: (provider: "google" | "outlook", token: string) => void;
}

export function CalendarConnect({ onConnect }: CalendarConnectionProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState({
    google: false,
    outlook: false,
  });

  const handleGoogleConnect = async () => {
    setIsConnecting((prev) => ({ ...prev, google: true }));
    try {
      // Define the required scopes with full URLs
      const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ];

      // Construct auth URL with proper parameters
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || "",
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: scopes.join(" ")
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to connect to Google Calendar",
      });
    } finally {
      setIsConnecting((prev) => ({ ...prev, google: false }));
    }
  };

  const handleOutlookConnect = async () => {
    setIsConnecting((prev) => ({ ...prev, outlook: true }));
    try {
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${OUTLOOK_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
        window.location.origin
      )}/api/auth/outlook/callback&scope=Calendars.Read`;
      window.location.href = authUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to connect to Outlook Calendar",
      });
    } finally {
      setIsConnecting((prev) => ({ ...prev, outlook: false }));
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleGoogleConnect}
        disabled={isConnecting.google}
      >
        <Calendar className="w-4 h-4 mr-2 text-red-500" />
        {isConnecting.google ? "Connecting..." : "Connect Google Calendar"}
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleOutlookConnect}
        disabled={isConnecting.outlook}
      >
        <Mail className="w-4 h-4 mr-2 text-blue-500" />
        {isConnecting.outlook ? "Connecting..." : "Connect Outlook Calendar"}
      </Button>
    </div>
  );
}
