import { Request } from 'express';
import { db } from '../db';
import { auditLogs } from '@shared/schema';

export async function trackUserActivity(
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  resourceId: string,
  details: any,
  req: any
) {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    // Safely get user name with multiple fallbacks
    let userName = "Unknown User";
    if (req.user) {
      if (req.user.firstName && req.user.lastName) {
        userName = `${req.user.firstName} ${req.user.lastName}`;
      } else if (req.user.firstName) {
        userName = req.user.firstName;
      } else if (req.user.lastName) {
        userName = req.user.lastName;
      } else if (userEmail) {
        userName = userEmail.split('@')[0]; // Use email prefix as fallback
      }
    } else if (userEmail) {
      userName = userEmail.split('@')[0]; // Use email prefix as fallback
    }

    await db.insert(auditLogs).values({
      userId,
      userEmail,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status: "success",
    });
  } catch (error) {
    console.error("Failed to track user activity:", error);
  }
}