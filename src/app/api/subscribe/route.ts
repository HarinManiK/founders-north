// ---------------------------------------------------------------------------
// Founders North - Public Subscription API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, isSubscriberActive } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/newsletter/sender";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * GET: Silent background check if an email is actively subscribed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json({ subscribed: false });
    }

    const active = await isSubscriberActive(email);
    return NextResponse.json({ subscribed: active });
  } catch (error) {
    console.error("[Subscribe Check Error]", error);
    return NextResponse.json({ subscribed: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";

    const email = rawEmail.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const result = await addSubscriber(email);

    // Send welcome email asynchronously without blocking the user response
    if (result.success && !result.alreadySubscribed) {
      sendWelcomeEmail(result.subscriber).catch((err) => {
        console.warn("[Subscribe API] Could not send welcome email:", err);
      });
    }

    const message = result.alreadySubscribed
      ? "You're already a subscriber! You will receive our next daily briefing at 7:30 AM ET."
      : result.reactivated
      ? "Welcome back! Your subscription has been reactivated. You will receive tomorrow's briefing."
      : "Welcome to Founders North! You are now subscribed to the Daily Briefing.";

    return NextResponse.json({
      success: true,
      message,
      alreadySubscribed: !!result.alreadySubscribed,
      reactivated: !!result.reactivated,
    });
  } catch (error) {
    console.error("[Subscribe API Error]", error);
    return NextResponse.json(
      { error: "Unable to process subscription. Please try again later." },
      { status: 500 }
    );
  }
}
