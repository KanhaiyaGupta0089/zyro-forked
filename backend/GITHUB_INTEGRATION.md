# GitHub Integration Guide

## Overview

The GitHub integration allows you to connect your GitHub repositories to projects in the Zyro project management system. This enables automatic synchronization of GitHub events (pushes, pull requests, issues, releases) with your project.

## Features

- **Push Events**: Track code commits and pushes
- **Pull Request Events**: Automatically create/update issues from PRs
- **Issue Events**: Sync GitHub issues with project issues
- **Release Events**: Track repository releases

## Setup

### 1. Link GitHub Repository to Project

Link a GitHub repository to a project using the API:

```bash
POST /api/v1/project/{project_id}/link-github
Authorization: Bearer <token>
Content-Type: application/json

{
  "github_repo": "username/repository"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/project/1/link-github" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"github_repo": "octocat/Hello-World"}'
```

### 2. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure the webhook:
   - **Payload URL**: `https://your-domain.com/api/v1/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Set your `GITHUB_SECRET_KEY` from environment variables
   - **Events**: Select the events you want to track:
     - ✅ Push
     - ✅ Pull requests
     - ✅ Issues
     - ✅ Releases
   - **Active**: ✅

### 3. Environment Variables

Ensure your `.env.local` file has:

```env
GITHUB_SECRET_KEY=your_github_webhook_secret_here
```

## How It Works

### Event Processing

1. **Push Events**: 
   - Tracks commits and code pushes
   - Logs activity for linked projects

2. **Pull Request Events**:
   - Creates issues from opened PRs
   - Updates issue status when PR is merged/closed
   - Links PRs to project issues

3. **Issue Events**:
   - Syncs GitHub issues with project issues
   - Maps GitHub issue labels to issue types and priorities
   - Creates issues automatically when GitHub issues are opened

4. **Release Events**:
   - Tracks repository releases
   - Logs release information

### Issue Mapping

GitHub issues are automatically mapped to project issues:

- **Issue Type**: Determined from labels
  - `bug` → Bug
  - `feature` → Feature
  - Default → Task

- **Priority**: Determined from labels
  - `critical`, `high` → High Priority
  - `low` → Low Priority
  - Default → Moderate Priority

- **Status**: 
  - `open` → Todo
  - `closed` → Done

## API Endpoints

### Link GitHub Repository

```http
POST /api/v1/project/{project_id}/link-github
```

**Request Body:**
```json
{
  "github_repo": "owner/repository"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub repository 'owner/repository' linked successfully",
  "data": {
    "project_id": 1,
    "github_repo": "owner/repository"
  }
}
```

### Webhook Endpoint

```http
POST /api/v1/webhook/github
```

This endpoint is called by GitHub automatically. It:
- Verifies the webhook signature
- Processes the event
- Creates/updates issues as needed

## Security

- All webhook requests are verified using HMAC SHA-256 signature
- Invalid signatures are rejected with 401 Unauthorized
- The secret key must match between GitHub and your environment

## Troubleshooting

### Webhook Not Working

1. **Check Signature**: Ensure `GITHUB_SECRET_KEY` matches GitHub webhook secret
2. **Check URL**: Verify webhook URL is correct and accessible
3. **Check Logs**: Review application logs for error messages
4. **Check Project Link**: Ensure repository is linked to a project

### Issues Not Created

1. **Check Repository Link**: Verify project has `github_repo` in data field
2. **Check Event Type**: Ensure the event type is supported (push, pull_request, issues, release)
3. **Check Permissions**: Verify project access permissions

### Testing

You can test the webhook using GitHub's webhook delivery feature:

1. Go to repository **Settings** → **Webhooks**
2. Click on your webhook
3. Click **Recent Deliveries**
4. Click on a delivery to see details
5. Click **Redeliver** to resend the event

## Example Workflow

1. **Link Repository**:
   ```bash
   POST /api/v1/project/1/link-github
   {"github_repo": "myorg/myproject"}
   ```

2. **Create GitHub Issue**: Create an issue in GitHub repository

3. **Automatic Sync**: The webhook automatically:
   - Receives the issue event
   - Finds the linked project
   - Creates a corresponding issue in Zyro
   - Maps labels to issue type and priority

4. **Pull Request**: When a PR is opened:
   - Webhook receives the event
   - Creates an issue in Zyro
   - Updates issue status when PR is merged

## Notes

- Only one repository can be linked per project
- GitHub usernames are matched to users by email (partial match)
- If no user match is found, issue is created without assignee
- All events are logged for debugging
