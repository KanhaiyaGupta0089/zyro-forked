# Ngrok Setup Guide for GitHub Webhooks

## Overview

GitHub webhooks require a publicly accessible URL. Since `localhost` is not reachable from the internet, we use **ngrok** to create a secure tunnel to your local development server.

## Quick Start

### 1. Install Ngrok

**Option A: Using npm (Recommended)**
```bash
npm install -g ngrok
```

**Option B: Download from website**
1. Visit [ngrok.com](https://ngrok.com)
2. Sign up for a free account
3. Download ngrok for your OS
4. Extract and add to PATH

**Option C: Using package manager**
```bash
# macOS
brew install ngrok

# Linux (Ubuntu/Debian)
sudo snap install ngrok

# Windows (Chocolatey)
choco install ngrok
```

### 2. Get Your Auth Token (First Time Only)

1. Sign up at [ngrok.com](https://ngrok.com)
2. Go to [Dashboard → Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your authtoken
4. Run:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Start Your Backend Server

Make sure your backend is running on port 8000:
```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
uvicorn main:app --reload --port 8000
```

### 4. Start Ngrok Tunnel

In a **new terminal**, run:
```bash
ngrok http 8000
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important:** Copy the `Forwarding` URL (e.g., `https://abc123def456.ngrok.io`)

### 5. Configure in Frontend

1. Open your project in the browser
2. Go to **Projects** → Select a project → **Settings** tab
3. Scroll to **GitHub Integration** section
4. If repository is linked, you'll see the ngrok setup section
5. Paste your ngrok URL (e.g., `https://abc123def456.ngrok.io`)
6. The webhook URL will update automatically

### 6. Configure GitHub Webhook

1. Copy the generated webhook URL from the UI
2. Go to your GitHub repository
3. Navigate to **Settings** → **Webhooks** → **Add webhook**
4. Paste the webhook URL
5. Set Content type to **"application/json"**
6. Add your webhook secret (from `GITHUB_SECRET_KEY` in `.env.local`)
7. Select events: **Push**, **Pull requests**, **Issues**, **Releases**
8. Click **"Add webhook"**

### 7. Test the Webhook

1. Create a test issue in your GitHub repository
2. Check the webhook delivery in GitHub (Settings → Webhooks → Recent Deliveries)
3. Verify the issue appears in your Zyro project

## Ngrok Web Interface

Ngrok provides a web interface to inspect requests:
- URL: `http://127.0.0.1:4040`
- View all HTTP requests
- Replay webhook deliveries
- Debug webhook issues

## Important Notes

### ⚠️ Free Plan Limitations

- **URL changes on restart**: Each time you restart ngrok, you get a new URL
- **Solution**: Use ngrok's static domain (paid) or update the URL in the UI each time

### 🔒 Security

- Ngrok URLs are public - anyone with the URL can access your local server
- Use webhook secret verification (already implemented)
- Don't share your ngrok URL publicly
- Consider using ngrok's IP restrictions (paid feature)

### 🔄 URL Changes

When ngrok restarts:
1. You get a new URL
2. Update it in the GitHub Integration UI
3. Update the webhook URL in GitHub settings

### 💡 Pro Tips

1. **Keep ngrok running**: Don't close the ngrok terminal while testing
2. **Use ngrok web interface**: Monitor requests at `http://127.0.0.1:4040`
3. **Check logs**: Both ngrok and your backend logs show webhook activity
4. **Test locally first**: Verify webhook endpoint works before configuring GitHub

## Troubleshooting

### Ngrok URL Not Working

**Problem**: Webhook URL shows "your-ngrok-url"
**Solution**: 
- Make sure ngrok is running
- Copy the actual forwarding URL from ngrok output
- Paste it in the GitHub Integration UI

### Webhook Not Receiving Events

**Problem**: GitHub webhook shows "Failed to deliver"
**Solution**:
1. Check ngrok is running: `ngrok http 8000`
2. Verify backend is running on port 8000
3. Check webhook URL in GitHub matches ngrok URL
4. Verify webhook secret matches `GITHUB_SECRET_KEY`
5. Check ngrok web interface for errors

### Connection Refused

**Problem**: Ngrok shows "connection refused"
**Solution**:
- Make sure backend server is running
- Verify it's running on port 8000
- Check firewall isn't blocking the port

### URL Changed After Restart

**Problem**: Webhook stopped working after restarting ngrok
**Solution**:
- Update ngrok URL in the GitHub Integration UI
- Update webhook URL in GitHub repository settings

## Alternative: Static Domain (Paid)

For production or persistent URLs:
1. Upgrade to ngrok paid plan
2. Reserve a static domain
3. Use: `ngrok http 8000 --domain=your-domain.ngrok.io`
4. URL won't change on restart

## Production Deployment

For production, you don't need ngrok:
- Deploy your backend to a public server
- Use the production URL directly
- Configure webhook with production URL

## Example Workflow

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Start ngrok
ngrok http 8000

# Copy the forwarding URL (e.g., https://abc123.ngrok.io)
# Paste in GitHub Integration UI
# Configure webhook in GitHub
# Test by creating an issue in GitHub
```

## Resources

- [Ngrok Documentation](https://ngrok.com/docs)
- [Ngrok Dashboard](https://dashboard.ngrok.com)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
