import { json, ActionFunction } from "@remix-run/cloudflare";
import { SESEmailService, createSubscriptionConfirmationEmail } from "~/lib/ses";

interface Env {
  DB?: D1Database;
  SECRET_PYLON_BASE_URL?: string;
  SECRET_POAPIN_READ_API?: string;
  SECRET_POAP_API_KEY?: string;
  GA_TRACKING_ID?: string;
  SECRET_POAP_GRAPHQL_BASE_URL?: string;
  // SES Configuration
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  SES_FROM_EMAIL?: string;
}

export const action: ActionFunction = async ({ request, context }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email) {
      return json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Invalid email format" }, { status: 400 });
    }

    const env = context.cloudflare?.env as unknown as Env;
    
    // Get user info for logging
    const userAgent = request.headers.get("User-Agent") || "";
    const forwardedFor = request.headers.get("CF-Connecting-IP") || 
                        request.headers.get("X-Forwarded-For") || 
                        "unknown";

    // Note: Database check and duplicate email check removed since we're not saving to DB yet
    // This will be re-enabled when database saving is implemented

    // Send confirmation email first (before saving to DB as requested)
    try {
      const sesConfig = {
        region: env.AWS_REGION || 'us-east-1',
        accessKeyId: env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
        fromEmail: env.SES_FROM_EMAIL || 'noreply@poap.in'
      };

      // Check if SES is configured
      if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.SES_FROM_EMAIL) {
        console.warn('SES not configured, skipping email send');
      } else {
        const sesService = new SESEmailService(sesConfig);
        const emailTemplate = createSubscriptionConfirmationEmail(email);
        
        const emailResult = await sesService.sendEmail({
          to: email,
          subject: emailTemplate.subject,
          htmlBody: emailTemplate.htmlBody,
          textBody: emailTemplate.textBody
        });

        if (emailResult.success) {
          console.log('Confirmation email sent successfully:', emailResult.messageId);
        } else {
          console.error('Failed to send confirmation email:', emailResult.error);
          // Continue with subscription even if email fails
        }
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue with subscription even if email fails
    }

    // Note: As requested, we're not saving to DB yet - just sending the email
    // Uncomment the following code when you want to save to database:
    /*
    const result = await env.DB.prepare(`
      INSERT INTO email_subscriptions (email, source, user_agent, ip_address)
      VALUES (?, ?, ?, ?)
    `).bind(email, "changelog", userAgent, forwardedFor).run();

    if (!result.success) {
      console.error("Failed to insert subscription:", result.error);
      return json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
    }
    */

    return json({ 
      message: "Thank you for subscribing! A confirmation email has been sent to your inbox.",
      success: true 
    });

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
};
