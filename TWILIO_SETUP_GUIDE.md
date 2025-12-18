# Twilio and Notification System Setup Guide

This guide will help you configure the Twilio integration and notification system for your IVR Automation Testing Platform.

## 📞 Twilio Integration Setup

### Step 1: Get Twilio Credentials

1. Sign up for a Twilio account at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Once logged in, navigate to the Console Dashboard
3. Note down the following values:
   - **Account SID** (starts with AC)
   - **Auth Token**
   - Purchase or get a Twilio phone number

### Step 2: Local Development Configuration

Create a `.dev.vars` file in the root of your project:

```bash
cp .dev.vars.example .dev.vars
```

Edit the `.dev.vars` file with your Twilio credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# JWT Secret for authentication
JWT_SECRET=your-secure-jwt-secret-key

# Email Notification Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=your-email@gmail.com

# SMS Notification Configuration (using Twilio)
SMS_PROVIDER=twilio
SMS_ACCOUNT_ID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SMS_AUTH_TOKEN=your_actual_auth_token_here
SMS_FROM_NUMBER=+1234567890

# Slack Notification Configuration (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
SLACK_CHANNEL=#ivr-notifications
SLACK_USERNAME=IVR Bot
```

### Step 3: Production Deployment Configuration

For production deployment on Cloudflare Pages, use wrangler secrets:

```bash
# Twilio configuration
npx wrangler pages secret put TWILIO_ACCOUNT_SID --project-name ivr-automation-testing
npx wrangler pages secret put TWILIO_AUTH_TOKEN --project-name ivr-automation-testing
npx wrangler pages secret put TWILIO_PHONE_NUMBER --project-name ivr-automation-testing

# JWT Secret
npx wrangler pages secret put JWT_SECRET --project-name ivr-automation-testing

# Email configuration
npx wrangler pages secret put SMTP_HOST --project-name ivr-automation-testing
npx wrangler pages secret put SMTP_USERNAME --project-name ivr-automation-testing
npx wrangler pages secret put SMTP_PASSWORD --project-name ivr-automation-testing
npx wrangler pages secret put EMAIL_FROM_ADDRESS --project-name ivr-automation-testing

# SMS configuration
npx wrangler pages secret put SMS_ACCOUNT_ID --project-name ivr-automation-testing
npx wrangler pages secret put SMS_AUTH_TOKEN --project-name ivr-automation-testing
npx wrangler pages secret put SMS_FROM_NUMBER --project-name ivr-automation-testing

# Slack configuration
npx wrangler pages secret put SLACK_WEBHOOK_URL --project-name ivr-automation-testing
```

## 📧 Email Notification Setup

### Gmail Setup (Recommended for testing)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use these values in your configuration:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```

### Other Email Providers

For other providers, use their SMTP settings:
- **Outlook/Hotmail**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Use your provider's SMTP settings

## 💬 Slack Notification Setup

1. Create a Slack App:
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App"
   - Choose "From scratch"
   - Give it a name (e.g., "IVR Bot") and select your workspace

2. Enable Incoming Webhooks:
   - In your app settings, go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Select the channel where you want notifications
   - Copy the Webhook URL

3. Configure in your environment:
   ```env
   SLACK_WEBHOOK_URL=your_actual_slack_webhook_url
   SLACK_CHANNEL=#ivr-notifications
   SLACK_USERNAME=IVR Bot
   ```

## 📱 SMS Notification Setup

The system is preconfigured to use Twilio for SMS. If you want to use another provider:

### Nexmo/Vonage Setup
```env
SMS_PROVIDER=nexmo
SMS_ACCOUNT_ID=your_nexmo_api_key
SMS_AUTH_TOKEN=your_nexmo_api_secret
SMS_FROM_NUMBER=your_vonage_phone_number
```

### Plivo Setup
```env
SMS_PROVIDER=plivo
SMS_ACCOUNT_ID=your_plivo_auth_id
SMS_AUTH_TOKEN=your_plivo_auth_token
SMS_FROM_NUMBER=your_plivo_phone_number
```

## 🧪 Testing the Configuration

### 1. Start the Development Server

```bash
npm run dev:d1
```

### 2. Test Twilio Integration

Check if Twilio is properly configured:
```bash
curl http://localhost:3000/api/twilio/status
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "message": "Twilio is configured and ready"
}
```

### 3. Test Real Call Execution

Create a test case and execute a real call:
1. Log in to the application
2. Create a test case with a valid phone number
3. Click "Execute Real Call" button
4. Check your Twilio console for the call

### 4. Test Notifications

Trigger a test notification by creating a test case execution that generates alerts:
1. Create a test case that will fail
2. Execute the test case
3. Check your email, phone (SMS), and Slack for notifications

## 🛠️ Troubleshooting

### Common Issues

1. **Twilio Not Configured Error**
   - Ensure all Twilio environment variables are set
   - Check for typos in the variable names
   - Restart the development server after changes

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check if your email provider requires app passwords
   - Ensure firewall isn't blocking SMTP connections

3. **SMS Not Sending**
   - Verify SMS provider credentials
   - Check if your Twilio account has sufficient balance
   - Ensure the "from" number is a valid Twilio number

4. **Slack Notifications Not Working**
   - Verify the webhook URL is correct
   - Check if the webhook hasn't been revoked
   - Ensure the Slack app has appropriate permissions

### Debugging Tips

1. Check the browser console for JavaScript errors
2. Check the terminal where the server is running for error messages
3. Use the Twilio console to monitor API calls
4. Enable debug logging in your email client if needed

## 📊 Cost Considerations

### Twilio Pricing (Approximate)

- **Outbound calls**: $0.0130 per minute
- **Recording**: $0.0025 per minute
- **Transcription**: $0.05 per minute
- **Total**: ~$0.07 per minute of testing

**Example**: 100 test calls per day, 1-minute average = ~$210/month

### Free Trial Benefits

Twilio provides a $15.50 credit for new accounts, which equals approximately 220 minutes of testing.

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. Use environment variables for all sensitive data
3. Rotate credentials regularly
4. Use strong JWT secrets
5. Enable two-factor authentication on all accounts
6. Monitor usage and set up alerts for unusual activity

## 🔄 Next Steps

1. Configure your Twilio credentials
2. Test the real call functionality
3. Set up notification preferences in the application UI
4. Monitor your usage and adjust configurations as needed
5. Explore advanced features like speech recognition and quality metrics

The IVR Automation Testing Platform is now ready to make real phone calls and send notifications through multiple channels!