# IVR Automation Testing Platform - Notification System

The notification system provides multiple channels for alerting users about test results, system alerts, and campaign completions.

## Supported Notification Channels

### 1. Email Notifications
Send detailed HTML emails with test results and system alerts.

**Configuration Variables:**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_USERNAME` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password
- `EMAIL_FROM_ADDRESS` - Sender email address (default: noreply@ivrtesting.com)

### 2. SMS Notifications
Send SMS messages for critical alerts and urgent notifications.

**Configuration Variables:**
- `SMS_PROVIDER` - SMS provider (supported: twilio, nexmo, plivo)
- `SMS_ACCOUNT_ID` - Provider account ID/API key
- `SMS_AUTH_TOKEN` - Provider authentication token
- `SMS_FROM_NUMBER` - Sender phone number

### 3. Slack Notifications
Send rich notifications to Slack channels with detailed formatting.

**Configuration Variables:**
- `SLACK_WEBHOOK_URL` - Incoming webhook URL for your Slack app
- `SLACK_CHANNEL` - Default channel to send notifications (default: #ivr-notifications)
- `SLACK_USERNAME` - Username to appear in notifications (default: IVR Bot)

## Setting Up Notifications

### For Local Development
Create a `.dev.vars` file in the project root with your configuration:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=your-email@gmail.com

# SMS Configuration (Twilio example)
SMS_PROVIDER=twilio
SMS_ACCOUNT_ID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SMS_AUTH_TOKEN=your_twilio_auth_token
SMS_FROM_NUMBER=+1234567890

# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#ivr-notifications
SLACK_USERNAME=IVR Bot
```

### For Production Deployment
Set secrets using Wrangler:

```bash
# Email Configuration
npx wrangler pages secret put SMTP_HOST
npx wrangler pages secret put SMTP_PORT
npx wrangler pages secret put SMTP_USERNAME
npx wrangler pages secret put SMTP_PASSWORD
npx wrangler pages secret put EMAIL_FROM_ADDRESS

# SMS Configuration
npx wrangler pages secret put SMS_PROVIDER
npx wrangler pages secret put SMS_ACCOUNT_ID
npx wrangler pages secret put SMS_AUTH_TOKEN
npx wrangler pages secret put SMS_FROM_NUMBER

# Slack Configuration
npx wrangler pages secret put SLACK_WEBHOOK_URL
npx wrangler pages secret put SLACK_CHANNEL
npx wrangler pages secret put SLACK_USERNAME
```

## User Notification Preferences

Users can customize their notification preferences through the web interface:

1. Click on "Notification Preferences" in the sidebar
2. Enable/disable notification channels
3. Add/remove email addresses, phone numbers, and Slack webhooks
4. Save preferences

Preferences are stored per-user in the database and respected for all notifications.

## Notification Types

### Test Result Notifications
Sent when a test case completes execution.
- **Email**: Detailed report with test results
- **SMS**: Brief status (pass/fail) with test name
- **Slack**: Rich message with execution metrics

### Alert Notifications
Sent when system alerts are triggered.
- **Email**: Detailed alert information with severity
- **SMS**: Critical alerts only with brief description
- **Slack**: Formatted alert with severity indicator

### Campaign Completion Notifications
Sent when a test campaign finishes execution.
- **Slack**: Summary of campaign results with pass/fail statistics

## Notification Templates

### Email Templates
HTML templates for professional-looking emails with branding and formatting.

### SMS Templates
Concise text messages optimized for mobile readability.

### Slack Templates
Richly formatted messages with color-coded severity indicators and interactive elements.

## Security Considerations

1. All notification credentials are stored as secrets and never committed to version control
2. Email addresses and phone numbers are only used for notifications to registered users
3. Slack webhooks are user-configurable and stored securely
4. All communication uses secure protocols (TLS/SSL)

## Troubleshooting

### No Emails Received
1. Verify SMTP configuration in environment variables
2. Check spam/junk folders
3. Ensure sender domain is not blocked

### SMS Not Sending
1. Verify provider credentials
2. Check phone number formatting
3. Confirm account has sufficient credits/balance

### Slack Notifications Not Working
1. Verify webhook URL is correct and active
2. Check channel permissions
3. Ensure webhook hasn't been revoked

## Extending the Notification System

The notification system is designed to be extensible:

1. Add new notification channels by implementing new service modules
2. Create custom notification templates for specific use cases
3. Add notification filtering and routing logic
4. Integrate with additional messaging platforms

To add a new channel:
1. Create a new service file in `src/services/notifications/`
2. Implement send functions following the existing patterns
3. Update the NotificationService class to support the new channel
4. Add configuration variables to `wrangler.jsonc`
5. Update the frontend preferences interface