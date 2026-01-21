from datetime import datetime
from typing import List

from app.tasks.email_task import send_email_task
from app.models.model import User, Issue
from app.common.logging import Logger
from app.core.conf import ERROR_NOTIFICATION_EMAILS, ENABLE_ERROR_EMAILS, APP_NAME, ENVIRONMENT


def invite_email(raw_token: str, new_user_name: str, new_user_email: str) -> dict:
    invite_link = f"https://zyro-forked.vercel.app/verify-token/{raw_token}"

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


async def send_issue_assigned_mail(assigned_to: User, issue: Issue, assigned_by: User) -> dict:
    subject = f"New Issue Assigned: {issue.name} by {assigned_by.name}"
    
    # Get issue details
    issue_status = issue.status.value if hasattr(issue.status, 'value') else str(issue.status)
    issue_priority = issue.priority.value if hasattr(issue.priority, 'value') else str(issue.priority) if issue.priority else "Moderate"
    issue_type = issue.type.value if hasattr(issue.type, 'value') else str(issue.type)
    sprint_name = issue.sprint.name if issue.sprint else "No Sprint"
    project_name = issue.project.name if issue.project else "Unknown Project"
    project_name_splited = project_name.split(" ")
    project_code = ""
    for i in project_name_splited:
      if i.isalpha():
        project_code += i
    project_code = project_code.upper()
    
    # Priority color mapping
    priority_colors = {
        "critical": "#dc2626",
        "high": "#ea580c",
        "moderate": "#f59e0b",
        "low": "#10b981"
    }
    priority_color = priority_colors.get(issue_priority.lower(), "#6b7280")
    
    # Status color mapping
    status_colors = {
        "todo": "#6b7280",
        "in_progress": "#3b82f6",
        "completed": "#10b981",
        "hold": "#f59e0b",
        "cancelled": "#ef4444"
    }
    status_color = status_colors.get(issue_status.lower(), "#6b7280")
    issue_code = f"{project_code}-{issue.id}"
    # Issue link (adjust URL as needed)
    issue_link = f"https://zyro-2dox.vercel.app/manager/issues/{issue_code}"
    
    issue_assigned_email_body = f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Issue Assigned</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
    <!-- Preheader (hidden preview text) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      A new issue "{issue.name}" has been assigned to you by {assigned_by.name}.
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background-color:#f3f4f6; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                 style="background-color:#ffffff; border-radius:12px; overflow:hidden;
                        box-shadow:0 10px 25px rgba(0,0,0,0.08); max-width:600px;">
            
            <!-- Header with gradient -->
            <tr>
              <td style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:32px; text-align:center;">
                <h1 style="margin:0; font-size:28px; color:#ffffff; font-weight:600;">
                  🎯 New Issue Assigned
                </h1>
                <p style="margin:8px 0 0 0; font-size:16px; color:#e0e7ff;">
                  You have a new task to work on
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 32px; font-family:Arial, sans-serif; color:#111827;">
                
                <!-- Greeting -->
                <h2 style="margin-top:0; font-size:22px; color:#111827; font-weight:600;">
                  Hello {assigned_to.name},
                </h2>

                <p style="font-size:16px; line-height:1.6; color:#374151; margin-bottom:24px;">
                  <strong>{assigned_by.name}</strong> has assigned a new issue to you. Here are the details:
                </p>

                <!-- Issue Card -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                       style="background-color:#f9fafb; border-radius:8px; border:1px solid #e5e7eb; 
                              margin:24px 0; overflow:hidden;">
                  
                  <!-- Issue Title -->
                  <tr>
                    <td style="padding:20px; background-color:#ffffff; border-bottom:2px solid #e5e7eb;">
                      <h3 style="margin:0; font-size:20px; color:#111827; font-weight:600;">
                        {issue.name}
                      </h3>
                    </td>
                  </tr>

                  <!-- Issue Description -->
                  {f'<tr><td style="padding:20px; background-color:#ffffff; border-bottom:1px solid #e5e7eb;"><p style="margin:0; font-size:15px; line-height:1.6; color:#374151;">{issue.description or "No description provided."}</p></td></tr>' if issue.description else ''}

                  <!-- Issue Details Grid -->
                  <tr>
                    <td style="padding:20px; background-color:#f9fafb;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <!-- Status -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Status
                              </span>
                            </div>
                            <div style="display:inline-block; padding:6px 12px; background-color:{status_color}15; 
                                        border-radius:6px; border:1px solid {status_color}40;">
                              <span style="font-size:14px; color:{status_color}; font-weight:600; text-transform:capitalize;">
                                {issue_status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>

                          <!-- Priority -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Priority
                              </span>
                            </div>
                            <div style="display:inline-block; padding:6px 12px; background-color:{priority_color}15; 
                                        border-radius:6px; border:1px solid {priority_color}40;">
                              <span style="font-size:14px; color:{priority_color}; font-weight:600; text-transform:capitalize;">
                                {issue_priority}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <!-- Type -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Type
                              </span>
                            </div>
                            <div style="font-size:14px; color:#111827; font-weight:500; text-transform:capitalize;">
                              {issue_type.replace('_', ' ')}
                            </div>
                          </td>

                          <!-- Story Points -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Story Points
                              </span>
                            </div>
                            <div style="font-size:14px; color:#111827; font-weight:500;">
                              {issue.story_point or 0} points
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <!-- Project -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Project
                              </span>
                            </div>
                            <div style="font-size:14px; color:#111827; font-weight:500;">
                              {project_name}
                            </div>
                          </td>

                          <!-- Sprint -->
                          <td width="50%" style="padding:12px; vertical-align:top;">
                            <div style="margin-bottom:8px;">
                              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                                Sprint
                              </span>
                            </div>
                            <div style="font-size:14px; color:#111827; font-weight:500;">
                              {sprint_name}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" role="presentation" style="margin:32px auto;">
                  <tr>
                    <td align="center">
                      <a href="{issue_link}"
                         style="display:inline-block;
                                background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                                color:#ffffff;
                                padding:16px 32px;
                                font-size:16px;
                                font-weight:600;
                                text-decoration:none;
                                border-radius:8px;
                                box-shadow:0 4px 12px rgba(79, 70, 229, 0.3);
                                transition:all 0.3s ease;">
                        View Issue Details →
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Additional Info -->
                <div style="background-color:#f0f9ff; border-left:4px solid #3b82f6; padding:16px; 
                            border-radius:6px; margin:24px 0;">
                  <p style="margin:0; font-size:14px; color:#1e40af; line-height:1.6;">
                    <strong>💡 Tip:</strong> Review the issue details and update the status as you progress. 
                    Don't hesitate to reach out if you have any questions!
                  </p>
                </div>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />

                <p style="font-size:14px; color:#374151; line-height:1.6; margin-bottom:8px;">
                  Assigned by <strong>{assigned_by.name}</strong>
                </p>

                <p style="font-size:14px; color:#6b7280; line-height:1.6; margin-top:0;">
                  If you have any questions about this issue, please contact {assigned_by.name} or your project manager.
                </p>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />

                <p style="font-size:14px; color:#374151; margin-bottom:4px;">
                  Regards,<br />
                  <strong style="color:#4f46e5;">The Zyro Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:24px; text-align:center;
                         font-family:Arial, sans-serif; border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 8px 0; font-size:12px; color:#9ca3af;">
                  © 2026 ZYRO. All rights reserved.
                </p>
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  This is an automated notification. Please do not reply to this email.
                </p>
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
        subject=subject,
        body=issue_assigned_email_body,
        to_email=[assigned_to.email],
    )

    return {
        "status": "success",
        "message": f"Issue assignment email sent to {assigned_to.email}",
    }


async def send_issue_status_update_mail(issue: Issue, old_status: str, updated_by: User, recipients: List[User]) -> dict:
    """
    Send professional HTML email notification when issue status is updated
    """
    subject = f"Issue Status Updated: {issue.name}"
    
    # Get issue details
    new_status = issue.status.value if hasattr(issue.status, 'value') else str(issue.status)
    issue_priority = issue.priority.value if hasattr(issue.priority, 'value') else str(issue.priority) if issue.priority else "Moderate"
    issue_type = issue.type.value if hasattr(issue.type, 'value') else str(issue.type)
    sprint_name = issue.sprint.name if issue.sprint else "No Sprint"
    project_name = issue.project.name if issue.project else "Unknown Project"
    project_name_splited = project_name.split(" ")
    project_code = ""
    for i in project_name_splited:
        if i.isalpha():
            project_code += i
    project_code = project_code.upper()
    
    # Status color mapping
    status_colors = {
        "todo": "#6b7280",
        "in_progress": "#3b82f6",
        "completed": "#10b981",
        "hold": "#f59e0b",
        "qa": "#8b5cf6",
        "cancelled": "#ef4444"
    }
    old_status_color = status_colors.get(old_status.lower().replace("_", ""), "#6b7280")
    new_status_color = status_colors.get(new_status.lower().replace("_", ""), "#6b7280")
    
    # Priority color mapping
    priority_colors = {
        "critical": "#dc2626",
        "high": "#ea580c",
        "moderate": "#f59e0b",
        "low": "#10b981"
    }
    priority_color = priority_colors.get(issue_priority.lower(), "#6b7280")
    
    issue_code = f"{project_code}-{issue.id}"
    issue_link = f"https://zyro-2dox.vercel.app/manager/issues/{issue_code}"
    
    # Format status names for display
    old_status_display = old_status.replace("_", " ").title()
    new_status_display = new_status.replace("_", " ").title()
    
    # Get assignee and reporter names
    assignee_name = issue.assignee.name if issue.assignee else "Unassigned"
    reporter_name = issue.reporter.name if issue.reporter else "Unknown"
    
    status_update_email_body = f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Issue Status Updated</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:32px; text-align:center; border-radius:8px 8px 0 0;">
                <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">
                  📋 Issue Status Updated
                </h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding:32px;">
                <p style="font-size:16px; color:#374151; line-height:1.6; margin:0 0 24px 0;">
                  Hello,
                </p>
                
                <p style="font-size:16px; color:#374151; line-height:1.6; margin:0 0 24px 0;">
                  The status of issue <strong style="color:#4f46e5;">{issue.name}</strong> has been updated.
                </p>

                <!-- Status Change Highlight -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb; border-radius:8px; padding:20px; margin:24px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:0 16px;">
                            <div style="background-color:{old_status_color}; color:#ffffff; padding:8px 16px; border-radius:6px; font-size:14px; font-weight:600; display:inline-block;">
                              {old_status_display}
                            </div>
                          </td>
                          <td style="padding:0 16px; font-size:20px; color:#6b7280;">
                            →
                          </td>
                          <td style="padding:0 16px;">
                            <div style="background-color:{new_status_color}; color:#ffffff; padding:8px 16px; border-radius:6px; font-size:14px; font-weight:600; display:inline-block;">
                              {new_status_display}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Issue Details Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; margin:24px 0;">
                  <tr>
                    <td style="padding:24px;">
                      <h2 style="margin:0 0 20px 0; font-size:18px; color:#111827; border-bottom:2px solid #e5e7eb; padding-bottom:12px;">
                        Issue Details
                      </h2>
                      
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280; width:140px;">
                            Issue ID:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:600;">
                            {issue_code}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Issue Name:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:600;">
                            {issue.name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280; vertical-align:top;">
                            Description:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827;">
                            {issue.description or "No description provided"}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Priority:
                          </td>
                          <td style="padding:8px 0;">
                            <span style="background-color:{priority_color}; color:#ffffff; padding:4px 12px; border-radius:4px; font-size:12px; font-weight:600; display:inline-block;">
                              {issue_priority.upper()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Type:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827;">
                            {issue_type.replace("_", " ").title()}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Project:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:600;">
                            {project_name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Sprint:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827;">
                            {sprint_name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Assigned To:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827;">
                            {assignee_name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; font-size:14px; color:#6b7280;">
                            Reported By:
                          </td>
                          <td style="padding:8px 0; font-size:14px; color:#111827;">
                            {reporter_name}
                          </td>
                        </tr>
                        {f'<tr><td style="padding:8px 0; font-size:14px; color:#6b7280;">Story Points:</td><td style="padding:8px 0; font-size:14px; color:#111827;">{issue.story_point}</td></tr>' if issue.story_point else ''}
                        {f'<tr><td style="padding:8px 0; font-size:14px; color:#6b7280;">Time Estimate:</td><td style="padding:8px 0; font-size:14px; color:#111827;">{issue.time_estimate} hours</td></tr>' if issue.time_estimate else ''}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Updated By Section -->
                <div style="background-color:#f0f9ff; border-left:4px solid #3b82f6; padding:16px; border-radius:4px; margin:24px 0;">
                  <p style="margin:0; font-size:14px; color:#1e40af;">
                    <strong>Updated by:</strong> {updated_by.name} ({updated_by.email})
                  </p>
                  <p style="margin:8px 0 0 0; font-size:12px; color:#6b7280;">
                    {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
                  </p>
                </div>

                <!-- CTA Button -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
                  <tr>
                    <td align="center">
                      <a href="{issue_link}" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:600; display:inline-block; box-shadow:0 4px 6px rgba(102, 126, 234, 0.3);">
                        View Issue Details →
                      </a>
                    </td>
                  </tr>
                </table>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />

                <p style="font-size:14px; color:#6b7280; line-height:1.6; margin-top:0;">
                  This is an automated notification from {APP_NAME}. If you have any questions, please contact the project manager or the person who updated this issue.
                </p>

                <p style="font-size:14px; color:#374151; margin-bottom:4px; margin-top:24px;">
                  Regards,<br />
                  <strong style="color:#4f46e5;">The {APP_NAME} Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:24px; text-align:center; font-family:Arial, sans-serif; border-top:1px solid #e5e7eb; border-radius:0 0 8px 8px;">
                <p style="margin:0 0 8px 0; font-size:12px; color:#9ca3af;">
                  © 2026 {APP_NAME.upper()}. All rights reserved.
                </p>
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  This is an automated notification. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    # Send email to all recipients
    recipient_emails = [user.email for user in recipients if user and user.email]
    
    if recipient_emails:
        send_email_task.delay(
            subject=subject,
            body=status_update_email_body,
            to_email=recipient_emails,
        )
        Logger.info(f"Issue status update email sent to {len(recipient_emails)} recipient(s) for issue {issue_code}")
    
    return {
        "status": "success",
        "message": f"Issue status update email sent to {len(recipient_emails)} recipient(s)",
    }


def send_error_notification_email(error_data: dict) -> dict:
    """Send error notification email to administrators."""
    if not _is_email_enabled():
        return {"status": "skipped", "message": "Error email notifications disabled"}
    
    # Skip sending emails for client errors (status code 400)
    # These are user input errors like invalid credentials, unauthorized access, etc.
    status_code = error_data.get('status_code', 500)
    if status_code == 400:
        Logger.info(f"Skipping error notification email for client error (status_code: 400) - {error_data.get('error_type', 'UnknownError')}")
        return {"status": "skipped", "message": "Client error (400) - email notification skipped"}
    
    recipient_emails = _get_valid_recipients()
    if not recipient_emails:
        return {"status": "skipped", "message": "No valid recipients configured"}
    
    Logger.info(f"Sending error notification email to {len(recipient_emails)} recipient(s): {recipient_emails}")
    
    error_type = error_data.get('error_type', 'UnknownError')
    error_message = error_data.get('error', 'Unknown error')
    uri = error_data.get('uri', 'unknown-uri')
    method = error_data.get('method', 'unknown')
    log_level = error_data.get('log_level', 'error').upper()
    traceback_text = error_data.get('traceback', 'No traceback available')
    environment = error_data.get('environment', ENVIRONMENT)
    request_id = error_data.get('id', 'N/A')
    
    # Truncate traceback if too long
    if len(traceback_text) > 2000:
        traceback_text = traceback_text[:2000] + "\n... (truncated)"
    
    # Get request data (safely)
    request_data = error_data.get('request_data', {})
    request_data_str = str(request_data)[:500] if request_data else "No request data"
    if len(str(request_data)) > 500:
        request_data_str += "... (truncated)"
    
    # Priority color based on log level
    priority_colors = {
        "CRITICAL": "#dc2626",
        "ERROR": "#ea580c",
        "WARNING": "#f59e0b",
        "INFO": "#3b82f6"
    }
    priority_color = priority_colors.get(log_level, "#6b7280")
    
    subject = f"[{APP_NAME}] {log_level} Error: {error_type} - {environment.upper()}"
    
    error_email_body = f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Error Notification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
    <!-- Preheader -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      {log_level} error occurred in {APP_NAME}: {error_type}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background-color:#f3f4f6; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="700" cellpadding="0" cellspacing="0" role="presentation"
                 style="background-color:#ffffff; border-radius:12px; overflow:hidden;
                        box-shadow:0 10px 25px rgba(0,0,0,0.08); max-width:700px;">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg, {priority_color} 0%, {priority_color}dd 100%); padding:32px; text-align:center;">
                <h1 style="margin:0; font-size:28px; color:#ffffff; font-weight:600;">
                  ⚠️ Error Notification
                </h1>
                <p style="margin:8px 0 0 0; font-size:16px; color:#ffffffdd;">
                  {log_level} level error detected
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 32px; font-family:Arial, sans-serif; color:#111827;">
                
                <!-- Error Summary Card -->
                <div style="background-color:#fef2f2; border-left:4px solid {priority_color}; padding:20px; border-radius:6px; margin-bottom:24px;">
                  <h2 style="margin:0 0 12px 0; font-size:20px; color:#991b1b; font-weight:600;">
                    {error_type}
                  </h2>
                  <p style="margin:0; font-size:15px; color:#7f1d1d; line-height:1.6;">
                    {error_message}
                  </p>
                </div>

                <!-- Error Details Grid -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                       style="background-color:#f9fafb; border-radius:8px; border:1px solid #e5e7eb; 
                              margin:24px 0; overflow:hidden;">
                  
                  <tr>
                    <td style="padding:16px; border-bottom:1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="40%" style="padding:8px; vertical-align:top;">
                            <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              Environment
                            </span>
                            <div style="font-size:14px; color:#111827; font-weight:500; margin-top:4px;">
                              {environment.upper()}
                            </div>
                          </td>
                          <td width="60%" style="padding:8px; vertical-align:top;">
                            <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              Log Level
                            </span>
                            <div style="display:inline-block; padding:4px 12px; background-color:{priority_color}15; 
                                        border-radius:6px; border:1px solid {priority_color}40; margin-top:4px;">
                              <span style="font-size:14px; color:{priority_color}; font-weight:600;">
                                {log_level}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td width="40%" style="padding:8px; vertical-align:top;">
                            <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              Request ID
                            </span>
                            <div style="font-size:13px; color:#111827; font-weight:500; margin-top:4px; font-family:monospace;">
                              {request_id}
                            </div>
                          </td>
                          <td width="60%" style="padding:8px; vertical-align:top;">
                            <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              Method
                            </span>
                            <div style="font-size:14px; color:#111827; font-weight:500; margin-top:4px;">
                              {method.upper()}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding:8px; vertical-align:top;">
                            <span style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              URI / Endpoint
                            </span>
                            <div style="font-size:13px; color:#111827; font-weight:500; margin-top:4px; font-family:monospace; word-break:break-all;">
                              {uri}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Traceback Section -->
                <div style="margin:24px 0;">
                  <h3 style="margin:0 0 12px 0; font-size:16px; color:#111827; font-weight:600;">
                    Stack Trace
                  </h3>
                  <div style="background-color:#1f2937; color:#f3f4f6; padding:16px; border-radius:6px; 
                              font-family:'Courier New', monospace; font-size:12px; line-height:1.6; 
                              overflow-x:auto; max-height:400px; overflow-y:auto;">
                    <pre style="margin:0; white-space:pre-wrap; word-wrap:break-word;">{traceback_text}</pre>
                  </div>
                </div>

                <!-- Request Data Section -->
                {f'''
                <div style="margin:24px 0;">
                  <h3 style="margin:0 0 12px 0; font-size:16px; color:#111827; font-weight:600;">
                    Request Data
                  </h3>
                  <div style="background-color:#f9fafb; border:1px solid #e5e7eb; padding:16px; border-radius:6px; 
                              font-family:'Courier New', monospace; font-size:12px; line-height:1.6; 
                              overflow-x:auto; max-height:200px; overflow-y:auto;">
                    <pre style="margin:0; white-space:pre-wrap; word-wrap:break-word; color:#374151;">{request_data_str}</pre>
                  </div>
                </div>
                ''' if request_data else ''}

                <!-- Action Info -->
                <div style="background-color:#eff6ff; border-left:4px solid #3b82f6; padding:16px; 
                            border-radius:6px; margin:24px 0;">
                  <p style="margin:0; font-size:14px; color:#1e40af; line-height:1.6;">
                    <strong>💡 Action Required:</strong> Please review this error and take appropriate action. 
                    Check the logs for more details using Request ID: <code style="background-color:#dbeafe; padding:2px 6px; border-radius:3px;">{request_id}</code>
                  </p>
                </div>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />

                <p style="font-size:14px; color:#374151; margin-bottom:4px;">
                  This is an automated error notification from <strong style="color:#4f46e5;">{APP_NAME}</strong>
                </p>
                <p style="font-size:12px; color:#6b7280; margin-top:8px;">
                  Generated at {error_data.get('timestamp', 'N/A')} | Environment: {environment.upper()}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:24px; text-align:center;
                         font-family:Arial, sans-serif; border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 8px 0; font-size:12px; color:#9ca3af;">
                  © 2026 {APP_NAME}. All rights reserved.
                </p>
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  This is an automated notification. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
    
    error_data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    _queue_email_task(subject, error_email_body, recipient_emails, error_type)
    
    return {
        "status": "success",
        "message": f"Error notification email queued for {len(recipient_emails)} recipient(s)",
    }


def _is_email_enabled() -> bool:
    """Check if error email notifications are enabled."""
    if not ENABLE_ERROR_EMAILS:
        Logger.warning("Error email notifications are disabled (ENABLE_ERROR_EMAILS=False)")
        return False
    return True


def _get_valid_recipients() -> list:
    """Get and validate error notification email recipients."""
    if not ERROR_NOTIFICATION_EMAILS:
        Logger.warning("No error notification email recipients configured")
        return []
    
    recipient_emails = [
        email.strip() 
        for email in ERROR_NOTIFICATION_EMAILS 
        if email and email.strip() and '@' in email.strip()
    ]
    
    return recipient_emails


def _queue_email_task(subject: str, body: str, recipients: list, error_type: str):
    """Queue error notification email task to Celery."""
    Logger.info(f"Queueing error notification email task - Subject: {subject}, Recipients: {recipients}")
    
    send_email_task.delay(
        subject=subject,
        body=body,
        to_email=recipients,
    )
    
    Logger.info(f"Error notification email task queued successfully to Celery for {error_type} to {len(recipients)} recipient(s)")  