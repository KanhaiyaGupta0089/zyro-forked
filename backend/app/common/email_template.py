from app.tasks.email_task import send_email_task


def invite_email(raw_token: str, new_user_name: str, new_user_email: str) -> dict:
    invite_link = f"http://localhost:5173/verify-token/{raw_token}"

    invite_email_body = f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>You're Invited</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6;">
    <!-- Preheader (hidden preview text) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      You're invited to join our platform. Activate your account in seconds.
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background-color:#f3f4f6; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                 style="background-color:#ffffff; border-radius:8px; overflow:hidden;
                        box-shadow:0 10px 25px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background-color:#4f46e5; padding:24px; text-align:center;">
                <h1 style="margin:0; font-family:Arial, sans-serif;
                           font-size:24px; color:#ffffff;">
                  You're Invited 🎉
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:32px; font-family:Arial, sans-serif; color:#111827;">
                <h2 style="margin-top:0; font-size:20px;">
                  Hello {new_user_name},
                </h2>

                <p style="font-size:15px; line-height:1.6; color:#374151;">
                  You’ve been invited to join our platform. We’re excited to have you on board!
                  Click the button below to activate your account and get started.
                </p>

                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" role="presentation"
                       style="margin:24px auto;">
                  <tr>
                    <td align="center">
                      <a href="{invite_link}"
                         style="display:inline-block;
                                background-color:#4f46e5;
                                color:#ffffff;
                                padding:14px 28px;
                                font-size:16px;
                                font-weight:bold;
                                text-decoration:none;
                                border-radius:6px;">
                        Activate Your Account
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:14px; color:#6b7280; line-height:1.6;">
                  ⏰ This invitation link will expire in <strong>7 days</strong>.
                </p>

                <p style="font-size:14px; color:#6b7280; line-height:1.6;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <p style="word-break:break-all; font-size:13px; color:#4f46e5;">
                  {invite_link}
                </p>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />

                <p style="font-size:14px; color:#374151;">
                  Regards,<br />
                  <strong>The Team Zyro</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:16px; text-align:center;
                         font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
                © {2026} ZYRO. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    send_email_task.delay(
        subject="You're Invited – Activate Your Account",
        body=invite_email_body,
        to_email=[new_user_email],
    )

    return {
        "status": "success",
        "message": f"User {new_user_email} invited successfully",
    }
