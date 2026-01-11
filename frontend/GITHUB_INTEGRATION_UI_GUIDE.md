# GitHub Integration UI Guide

## Overview

The GitHub integration UI allows you to easily link GitHub repositories to your projects and configure webhooks directly from the application interface.

## How to Access

1. Navigate to **Projects** from the main menu
2. Click on any project to open **Project Details**
3. Go to the **Settings** tab
4. Scroll down to the **Integrations** section

## Features

### 1. Link GitHub Repository

**Steps:**
1. In the Settings tab, find the **GitHub Integration** section
2. Click **"Link GitHub Repository"** button
3. Enter the repository in format: `owner/repository`
   - Example: `octocat/Hello-World`
   - Example: `myusername/myproject`
4. Click **"Link Repository"**
5. You'll see a success message and the repository will be linked

### 2. View Linked Repository

Once linked, you'll see:
- ✅ **Repository status**: Shows the linked repository name
- 🔗 **Open on GitHub**: Click the external link icon to open the repository on GitHub
- 🔗 **Unlink**: Click to remove the GitHub integration

### 3. Configure Webhook

After linking, you'll see webhook configuration instructions:

1. **Copy Webhook URL**: Click the "Copy" button to copy the webhook URL
2. **Configure in GitHub**:
   - Go to your GitHub repository
   - Navigate to **Settings** → **Webhooks**
   - Click **"Add webhook"**
   - Paste the copied URL
   - Set Content type to **"application/json"**
   - Add your webhook secret (from `GITHUB_SECRET_KEY` environment variable)
   - Select events: **Push**, **Pull requests**, **Issues**, **Releases**
   - Click **"Add webhook"**

### 4. Unlink Repository

To remove the GitHub integration:
1. Click the **"Unlink"** button
2. Confirm the action
3. The repository will be unlinked and webhook events will stop syncing

## UI Components

### Linked State
- Green success indicator
- Repository name display
- Quick link to GitHub
- Webhook configuration guide
- Unlink option

### Unlinked State
- Gray informational box
- Link button to start integration
- Input form for repository name
- Format validation

## What Gets Synced

Once configured, the following GitHub events are automatically synced:

- **Push Events**: Tracks commits and code pushes
- **Pull Requests**: Creates issues from PRs, updates status on merge/close
- **Issues**: Syncs GitHub issues with project issues
- **Releases**: Tracks repository releases

## Troubleshooting

### Repository Not Linking
- Check the format: Must be `owner/repository`
- Ensure you have permission to manage the project
- Check browser console for errors

### Webhook Not Working
- Verify the webhook URL is correct
- Check that `GITHUB_SECRET_KEY` matches in both systems
- Ensure webhook is active in GitHub settings
- Check backend logs for webhook processing errors

### Events Not Syncing
- Verify webhook is configured correctly in GitHub
- Check that the repository is properly linked
- Ensure the webhook secret matches
- Review backend logs for processing errors

## Visual Guide

```
┌─────────────────────────────────────┐
│  GitHub Integration                 │
├─────────────────────────────────────┤
│  ✅ Repository Linked               │
│                                     │
│  📦 octocat/Hello-World    [🔗]    │
│                                     │
│  ℹ️  Webhook Configuration          │
│  https://your-domain.com/...        │
│  [Copy]                             │
│                                     │
│  Steps to configure:                │
│  1. Go to GitHub → Settings...     │
│  2. Add webhook...                  │
│  ...                                │
└─────────────────────────────────────┘
```

## Next Steps

After linking and configuring:
1. Test by creating an issue in GitHub
2. Check if it appears in your project issues
3. Create a pull request and verify it syncs
4. Push code and check activity logs

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review backend logs
3. Verify environment variables are set
4. Test webhook delivery in GitHub settings
