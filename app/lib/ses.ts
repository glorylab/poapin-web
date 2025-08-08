// SES email utility for sending confirmation emails
// This uses AWS SES v3 SDK which is compatible with Cloudflare Workers

interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromEmail: string;
}

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

// AWS SES API v3 compatible implementation
export class SESEmailService {
  private config: SESConfig;

  constructor(config: SESConfig) {
    this.config = config;
  }

  private async sign(method: string, url: string, headers: Record<string, string>, body: string): Promise<Record<string, string>> {
    // AWS Signature Version 4 implementation for SES
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n') + '\n';
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const payloadHash = await this.sha256(body);
    
    const canonicalRequest = [
      method,
      '/',
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.config.region}/ses/aws4_request`;
    const stringToSign = [
      algorithm,
      timeStamp,
      credentialScope,
      await this.sha256(canonicalRequest)
    ].join('\n');

    // Calculate signature
    const signature = await this.calculateSignature(stringToSign, dateStamp);
    
    // Create authorization header
    const authorization = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      'Authorization': authorization,
      'X-Amz-Date': timeStamp
    };
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  }

  private async calculateSignature(stringToSign: string, dateStamp: string): Promise<string> {
    const kDate = await this.hmac(
      new TextEncoder().encode(`AWS4${this.config.secretAccessKey}`),
      dateStamp
    );
    const kRegion = await this.hmac(kDate, this.config.region);
    const kService = await this.hmac(kRegion, 'ses');
    const kSigning = await this.hmac(kService, 'aws4_request');
    const signature = await this.hmac(kSigning, stringToSign);
    
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const sesEndpoint = `https://email.${this.config.region}.amazonaws.com`;
      
      // Prepare SES API request body
      const requestBody = new URLSearchParams({
        'Action': 'SendEmail',
        'Version': '2010-12-01',
        'Source': `Kira <${this.config.fromEmail}>`,
        'Destination.ToAddresses.member.1': params.to,
        'Message.Subject.Data': params.subject,
        'Message.Subject.Charset': 'UTF-8',
        'Message.Body.Html.Data': params.htmlBody,
        'Message.Body.Html.Charset': 'UTF-8',
        'Message.Body.Text.Data': params.textBody,
        'Message.Body.Text.Charset': 'UTF-8'
      }).toString();

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': `email.${this.config.region}.amazonaws.com`,
        'Content-Length': requestBody.length.toString()
      };

      const signedHeaders = await this.sign('POST', sesEndpoint, headers, requestBody);

      const response = await fetch(sesEndpoint, {
        method: 'POST',
        headers: signedHeaders,
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SES API Error:', errorText);
        return { success: false, error: `SES API Error: ${response.status}` };
      }

      const responseText = await response.text();
      
      // Extract MessageId from XML response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;

      return { success: true, messageId };
    } catch (error) {
      console.error('SES Email Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Email templates
export const createSubscriptionConfirmationEmail = (email: string) => {
  const subject = "You're in! Welcome to the POAPin Newsletter 🎉";

  const htmlBody = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>POAPin Newsletter</title>
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      /* Better default text rendering */
      body { margin:0; padding:0; background:#f6f8fb; -webkit-font-smoothing:antialiased; -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
      a { color:#0ea5e9; text-decoration:none; }
      @media (prefers-color-scheme: dark) {
        body { background:#0b1220; }
      }
    </style>
  </head>
  <body>
    <!-- Preheader -->
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Thanks for subscribing to POAPin. Here's what to expect next.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fb;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(10,31,68,0.08);">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:28px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font:600 20px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;letter-spacing:0.2px;">POAPin</td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:6px;font:700 26px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">Welcome aboard! 🎉</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px 28px;font:400 16px/1.75 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
                <p style="margin:0 0 12px 0;">Hi there,</p>
                <p style="margin:0 0 12px 0;">Thanks for subscribing to the POAPin newsletter with <strong>${email}</strong>.</p>
                <p style="margin:0 0 12px 0;">You'll receive occasional updates with:</p>
                <ul style="margin:8px 0 0 20px;padding:0;line-height:1.75;">
                  <li>🚀 Feature announcements</li>
                  <li>📱 Product updates & improvements</li>
                  <li>🎯 Highlights from the POAP ecosystem</li>
                  <li>💡 Tips to organize and showcase your POAPs</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 28px 24px 28px;">
                <a href="https://poap.in/changelog" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#ffffff;font:600 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:12px 20px;border-radius:10px;">See what's new</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px;font:400 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
                      <div style="margin:0 0 6px 0;font-weight:600;color:#0ea5e9;">Kira · POAP.in</div>
                      <div style="color:#64748b;">Glory Lab, Inc.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="border-top:1px solid #e5e7eb;padding:16px 24px 22px 24px;background:#ffffff;font:400 12px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6b7280;">
                <div style="margin-bottom:6px;">This email was sent to ${email} because you subscribed to POAPin updates.</div>
                <div>
                  <a href="https://poap.in" style="color:#0ea5e9;">poap.in</a>
                  · <a href="https://github.com/glorylab" style="color:#0ea5e9;">GitHub</a>
                  · <a href="https://x.com/glorylaboratory" style="color:#0ea5e9;">X</a>
                  · <a href="https://farcaster.xyz/glorylab.eth" style="color:#0ea5e9;">Farcaster</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  const textBody = `You're in! Welcome to the POAPin Newsletter 🎉\n\n` +
`Thanks for subscribing with ${email}. You'll receive: \n` +
`• 🚀 Feature announcements\n` +
`• 📱 Product updates & improvements\n` +
`• 🎯 POAP ecosystem highlights\n` +
`• 💡 Tips to organize and showcase your POAPs\n\n` +
`See what's new: https://poap.in/changelog\n\n` +
`— Kira, POAP.in (Glory Lab, Inc.)\n` +
`poap.in · GitHub: https://github.com/glorylab/POAPin · Twitter: https://x.com/glorylaboratory\n` +
`Farcaster: https://farcaster.xyz/glorylab.eth\n\n` +
`---\n` +
`This email was sent to ${email} because you subscribed to POAPin updates.`;

  return { subject, htmlBody, textBody };
};
