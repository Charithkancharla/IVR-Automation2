/**
 * Slack Notification Service
 * Provides functionality to send Slack notifications for IVR test results and alerts
 */

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
}

/**
 * Send a Slack notification
 * @param config Slack configuration
 * @param message Slack message details
 * @returns Promise indicating success or failure
 */
export async function sendSlackMessage(config: SlackConfig, message: SlackMessage): Promise<boolean> {
  try {
    // In a real implementation, this would make an HTTP POST request to the Slack webhook URL
    // For now, we'll simulate the Slack message sending process
    
    console.log('💬 Sending Slack notification:');
    console.log(`   Webhook URL: ${config.webhookUrl}`);
    console.log(`   Channel: ${config.channel || 'default'}`);
    console.log(`   Message: ${message.text.substring(0, 100)}${message.text.length > 100 ? '...' : ''}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate successful Slack message delivery
    return true;
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Send test result Slack notification
 * @param config Slack configuration
 * @param testData Test result data
 * @returns Promise indicating success or failure
 */
export async function sendTestResultSlack(
  config: SlackConfig,
  testData: {
    testName: string;
    status: 'passed' | 'failed';
    duration: number;
    timestamp: Date;
    testId: number;
  }
): Promise<boolean> {
  const statusEmoji = testData.status === 'passed' ? '✅' : '❌';
  const statusColor = testData.status === 'passed' ? '#28a745' : '#dc3545';
  
  const message = {
    text: `IVR Test ${testData.status === 'passed' ? 'PASSED' : 'FAILED'}: ${testData.testName}`,
    attachments: [
      {
        color: statusColor,
        fields: [
          {
            title: 'Test Name',
            value: testData.testName,
            short: true
          },
          {
            title: 'Status',
            value: `${statusEmoji} ${testData.status.toUpperCase()}`,
            short: true
          },
          {
            title: 'Duration',
            value: `${testData.duration}ms`,
            short: true
          },
          {
            title: 'Timestamp',
            value: testData.timestamp.toISOString(),
            short: true
          }
        ],
        footer: 'IVR Automation Testing Platform',
        ts: Math.floor(testData.timestamp.getTime() / 1000)
      }
    ]
  };

  return sendSlackMessage(config, message);
}

/**
 * Send alert Slack notification
 * @param config Slack configuration
 * @param alertData Alert data
 * @returns Promise indicating success or failure
 */
export async function sendAlertSlack(
  config: SlackConfig,
  alertData: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }
): Promise<boolean> {
  const severityEmojis: Record<string, string> = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔥'
  };

  const severityColors: Record<string, string> = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    critical: '#dc3545'
  };

  const emoji = severityEmojis[alertData.severity] || '🔔';
  const color = severityColors[alertData.severity] || '#333';
  
  const message = {
    text: `${emoji} [${alertData.severity.toUpperCase()}] IVR Alert: ${alertData.alertType}`,
    attachments: [
      {
        color: color,
        fields: [
          {
            title: 'Alert Type',
            value: alertData.alertType,
            short: true
          },
          {
            title: 'Severity',
            value: `${emoji} ${alertData.severity.toUpperCase()}`,
            short: true
          },
          {
            title: 'Message',
            value: alertData.message,
            short: false
          },
          {
            title: 'Timestamp',
            value: alertData.timestamp.toISOString(),
            short: true
          }
        ],
        footer: 'IVR Automation Testing Platform',
        ts: Math.floor(alertData.timestamp.getTime() / 1000)
      }
    ]
  };

  return sendSlackMessage(config, message);
}

/**
 * Send campaign completion Slack notification
 * @param config Slack configuration
 * @param campaignData Campaign data
 * @returns Promise indicating success or failure
 */
export async function sendCampaignCompletionSlack(
  config: SlackConfig,
  campaignData: {
    campaignName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
    timestamp: Date;
  }
): Promise<boolean> {
  const successRate = campaignData.totalTests > 0 ? 
    ((campaignData.passedTests / campaignData.totalTests) * 100).toFixed(1) : '0';
  
  const status = campaignData.failedTests === 0 ? 'SUCCESS' : 
    (campaignData.passedTests > campaignData.failedTests ? 'PARTIAL SUCCESS' : 'FAILURE');
  
  const statusEmoji = campaignData.failedTests === 0 ? '✅' : 
    (campaignData.passedTests > campaignData.failedTests ? '⚠️' : '❌');
  
  const statusColor = campaignData.failedTests === 0 ? '#28a745' : 
    (campaignData.passedTests > campaignData.failedTests ? '#ffc107' : '#dc3545');
  
  const message = {
    text: `${statusEmoji} Campaign Completed: ${campaignData.campaignName}`,
    attachments: [
      {
        color: statusColor,
        fields: [
          {
            title: 'Campaign Name',
            value: campaignData.campaignName,
            short: true
          },
          {
            title: 'Status',
            value: `${statusEmoji} ${status}`,
            short: true
          },
          {
            title: 'Tests Executed',
            value: `${campaignData.totalTests}`,
            short: true
          },
          {
            title: 'Success Rate',
            value: `${successRate}%`,
            short: true
          },
          {
            title: 'Passed',
            value: `${campaignData.passedTests}`,
            short: true
          },
          {
            title: 'Failed',
            value: `${campaignData.failedTests}`,
            short: true
          },
          {
            title: 'Duration',
            value: `${Math.round(campaignData.duration / 1000)}s`,
            short: true
          },
          {
            title: 'Completed At',
            value: campaignData.timestamp.toISOString(),
            short: true
          }
        ],
        footer: 'IVR Automation Testing Platform',
        ts: Math.floor(campaignData.timestamp.getTime() / 1000)
      }
    ]
  };

  return sendSlackMessage(config, message);
}