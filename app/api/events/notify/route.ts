import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { Transporter } from "nodemailer";
import * as nodemailer from "nodemailer";

// Create a transporter using environment variables
let transporter: Transporter | null = null;

try {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    console.error("[EMAIL] Missing required SMTP configuration");
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify the connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error("[EMAIL] SMTP connection error:", error);
      } else {
        console.log("[EMAIL] SMTP server is ready to take our messages");
      }
    });
  }
} catch (error) {
  console.error("[EMAIL] Failed to create SMTP transporter:", error);
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { event, attendees, existingUsers } = await request.json();

    if (!event || !attendees || !Array.isArray(attendees)) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!transporter) {
      console.error("[EMAIL] SMTP transporter not configured");
      return NextResponse.json(
        {
          message: "Email service not configured",
          error: "SMTP configuration is missing or invalid",
        },
        { status: 503 }
      );
    }

    // Format the event time
    const startTime = new Date(event.start).toLocaleString();
    const endTime = new Date(event.end).toLocaleString();

    // Create different email content for existing and non-existing users
    const emailContent = {
      from:
        process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@planify.ai",
      subject: existingUsers
        ? `Meeting Notification: ${event.title}`
        : `Meeting Invitation: ${event.title}`,
      html: existingUsers
        ? `
          <h2>Meeting Notification</h2>
          <p>You have been added to a meeting:</p>
          <h3>${event.title}</h3>
          <p><strong>Description:</strong> ${
            event.description || "No description provided"
          }</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Organizer:</strong> ${payload.name} (${payload.email})</p>
          <p>You can view this meeting in your Planify.AI calendar.</p>
          <hr>
          <p><small>This is an automated message from Planify.AI. Please do not reply to this email.</small></p>
        `
        : `
          <h2>Meeting Invitation</h2>
          <p>You have been invited to a meeting:</p>
          <h3>${event.title}</h3>
          <p><strong>Description:</strong> ${
            event.description || "No description provided"
          }</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Organizer:</strong> ${payload.name} (${payload.email})</p>
          <p>To join this meeting, please sign up for Planify.AI at <a href="${
            process.env.NEXT_PUBLIC_APP_URL
          }/signup">${process.env.NEXT_PUBLIC_APP_URL}/signup</a></p>
          <hr>
          <p><small>This is an automated message from Planify.AI. Please do not reply to this email.</small></p>
        `,
    };

    // Send emails to all attendees
    const emailPromises = attendees.map(async (attendeeEmail) => {
      try {
        const info = await transporter!.sendMail({
          ...emailContent,
          to: attendeeEmail,
        });
        console.log(
          `[EMAIL] Message sent to ${attendeeEmail}:`,
          info.messageId
        );
        return { email: attendeeEmail, success: true };
      } catch (error) {
        console.error(`[EMAIL] Failed to send to ${attendeeEmail}:`, error);
        return { email: attendeeEmail, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      console.error("[EMAIL] Some emails failed to send:", failed);
      return NextResponse.json(
        {
          message: "Some notifications failed to send",
          successful: successful.map((r) => r.email),
          failed: failed.map((r) => ({ email: r.email, error: r.error })),
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      message: existingUsers
        ? "Meeting notifications sent successfully"
        : "Meeting invitations sent successfully",
      sentTo: attendees,
      type: existingUsers ? "notification" : "invitation",
    });
  } catch (error) {
    console.error("[EVENTS_NOTIFY] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to send notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
