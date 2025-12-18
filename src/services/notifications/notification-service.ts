/**
 * Unified Notification Service
 * Central service for sending notifications through multiple channels
 */

import { sendEmail, sendTestResultNotification, sendAlertNotification } from './email';
import { sendSMS, sendTestResultSMS, sendAlertSMS } from './sms';
import { sendTestResultSlack, sendAlertSlack, sendCampaignCompletionSlack } from './slack';

// Type definitions for Cloudflare Worker environment
interface Env {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM_ADDRESS?: string;
  SMS_PROVIDER?: 'twilio' | 'nexmo' | 'plivo';
  SMS_ACCOUNT_ID?: string;
  SMS_AUTH_TOKEN?: string;
  SMS_FROM_NUMBER?: string;
  SLACK_WEBHOOK_URL?: string;
  SLACK_CHANNEL?: string;
  SLACK_USERNAME?: string;
}

// Helper function to get notification config from environment
export function getNotificationConfig(env: Env) {
  return {
    email: env.SMTP_HOST && env.SMTP_USERNAME && env.SMTP_PASSWORD ? {
      smtpHost: env.SMTP_HOST,
      smtpPort: parseInt(env.SMTP_PORT || '587'),
      username: env.SMTP_USERNAME,
      password: env.SMTP_PASSWORD,
      fromAddress: env.EMAIL_FROM_ADDRESS || 'noreply@ivrtesting.com'
    } : undefined,
    sms: env.SMS_ACCOUNT_ID && env.SMS_AUTH_TOKEN ? {
      provider: (env.SMS_PROVIDER || 'twilio') as 'twilio' | 'nexmo' | 'plivo',
      accountId: env.SMS_ACCOUNT_ID,
      authToken: env.SMS_AUTH_TOKEN,
      fromNumber: env.SMS_FROM_NUMBER || ''
    } : undefined,
    slack: env.SLACK_WEBHOOK_URL ? {
      webhookUrl: env.SLACK_WEBHOOK_URL,
      channel: env.SLACK_CHANNEL || '#ivr-notifications',
      username: env.SLACK_USERNAME || 'IVR Bot',
      iconEmoji: ':telephone_receiver:'
    } : undefined
  };
}

// Configuration interfaces
interface NotificationConfig {
  email?: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    fromAddress: string;
  };
  sms?: {
    provider: 'twilio' | 'nexmo' | 'plivo';
    accountId: string;
    authToken: string;
    fromNumber: string;
  };
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
  };
}

// Notification preferences for users
interface UserNotificationPreferences {
  email?: boolean;
  sms?: boolean;
  slack?: boolean;
  emailAddresses?: string[];
  phoneNumbers?: string[];
  slackWebhooks?: string[];
}

// Notification types
type NotificationType = 'test-result' | 'alert' | 'campaign-completion';

/**
 * Unified Notification Service Class
 */
class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * Send test result notification through all enabled channels
   */
  async sendTestResultNotification(
    testData: {
      testName: string;
      status: 'passed' | 'failed';
      duration: number;
      timestamp: Date;
      testId: number;
    },
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const promises: Promise<boolean>[] = [];

    // Send email notification
    if (preferences.email && this.config.email && preferences.emailAddresses) {
      for (const email of preferences.emailAddresses) {
        promises.push(
          sendTestResultNotification(this.config.email, {
            ...testData,
            recipient: email
          })
        );
      }
    }

    // Send SMS notification
    if (preferences.sms && this.config.sms && preferences.phoneNumbers) {
      for (const phone of preferences.phoneNumbers) {
        promises.push(
          sendTestResultSMS(this.config.sms, {
            testName: testData.testName,
            status: testData.status,
            duration: testData.duration,
            recipient: phone
          })
        );
      }
    }

    // Send Slack notification
    if (preferences.slack && this.config.slack) {
      promises.push(
        sendTestResultSlack(this.config.slack, testData)
      );
    }

    // Wait for all notifications to be sent
    await Promise.all(promises);
  }

  /**
   * Send alert notification through all enabled channels
   */
  async sendAlertNotification(
    alertData: {
      alertType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    },
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const promises: Promise<boolean>[] = [];

    // Send email notification
    if (preferences.email && this.config.email && preferences.emailAddresses) {
      for (const email of preferences.emailAddresses) {
        promises.push(
          sendAlertNotification(this.config.email, {
            ...alertData,
            recipient: email
          })
        );
      }
    }

    // Send SMS notification
    if (preferences.sms && this.config.sms && preferences.phoneNumbers) {
      for (const phone of preferences.phoneNumbers) {
        promises.push(
          sendAlertSMS(this.config.sms, {
            ...alertData,
            recipient: phone
          })
        );
      }
    }

    // Send Slack notification
    if (preferences.slack && this.config.slack) {
      promises.push(
        sendAlertSlack(this.config.slack, alertData)
      );
    }

    // Wait for all notifications to be sent
    await Promise.all(promises);
  }

  /**
   * Send campaign completion notification through all enabled channels
   */
  async sendCampaignCompletionNotification(
    campaignData: {
      campaignName: string;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      duration: number;
      timestamp: Date;
    },
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const promises: Promise<boolean>[] = [];

    // Send Slack notification (campaign completion is primarily for team awareness)
    if (preferences.slack && this.config.slack) {
      promises.push(
        sendCampaignCompletionSlack(this.config.slack, campaignData)
      );
    }

    // Wait for all notifications to be sent
    await Promise.all(promises);
  }

  /**
   * Send a simple notification through all enabled channels
   */
  async sendSimpleNotification(
    message: string,
    type: NotificationType,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const promises: Promise<boolean>[] = [];

    // Send email notification
    if (preferences.email && this.config.email && preferences.emailAddresses) {
      for (const email of preferences.emailAddresses) {
        promises.push(
          sendEmail(this.config.email, {
            to: email,
            subject: `IVR Notification: ${type}`,
            body: message
          })
        );
      }
    }

    // Send SMS notification
    if (preferences.sms && this.config.sms && preferences.phoneNumbers) {
      for (const phone of preferences.phoneNumbers) {
        promises.push(
          sendSMS(this.config.sms, {
            to: phone,
            body: message
          })
        );
      }
    }

    // Wait for all notifications to be sent
    await Promise.all(promises);
  }
}

// Export a singleton instance
export default NotificationService;

// Export individual functions for direct use
export {
  sendEmail,
  sendSMS,
  sendSlackMessage,
  sendTestResultNotification,
  sendAlertNotification,
  sendTestResultSMS,
  sendAlertSMS,
  sendTestResultSlack,
  sendAlertSlack,
  sendCampaignCompletionSlack
};