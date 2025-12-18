/**
 * SMS Notification Service
 * Provides functionality to send SMS notifications for IVR test results and alerts
 */

interface SMSConfig {
  provider: 'twilio' | 'nexmo' | 'plivo';
  accountId: string;
  authToken: string;
  fromNumber: string;
}

interface SMSMessage {
  to: string;
  body: string;
}

/**
 * Send an SMS notification
 * @param config SMS provider configuration
 * @param message SMS message details
 * @returns Promise indicating success or failure
 */
export async function sendSMS(config: SMSConfig, message: SMSMessage): Promise<boolean> {
  try {
    // In a real implementation, this would connect to an SMS provider API
    // For now, we'll simulate the SMS sending process
    
    console.log('📱 Sending SMS notification:');
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${config.fromNumber}`);
    console.log(`   Message: ${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate successful SMS delivery
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS notification:', error);
    return false;
  }
}

/**
 * Send test result SMS notification
 * @param config SMS provider configuration
 * @param testData Test result data
 * @returns Promise indicating success or failure
 */
export async function sendTestResultSMS(
  config: SMSConfig,
  testData: {
    testName: string;
    status: 'passed' | 'failed';
    duration: number;
    recipient: string;
  }
): Promise<boolean> {
  const statusEmoji = testData.status === 'passed' ? '✅' : '❌';
  const statusText = testData.status === 'passed' ? 'PASSED' : 'FAILED';
  
  const body = `${statusEmoji} IVR Test ${statusText}: ${testData.testName}
Duration: ${testData.duration}ms
View details in dashboard`;

  return sendSMS(config, {
    to: testData.recipient,
    body
  });
}

/**
 * Send alert SMS notification
 * @param config SMS provider configuration
 * @param alertData Alert data
 * @returns Promise indicating success or failure
 */
export async function sendAlertSMS(
  config: SMSConfig,
  alertData: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recipient: string;
  }
): Promise<boolean> {
  const severityEmojis: Record<string, string> = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔥'
  };

  const emoji = severityEmojis[alertData.severity] || '🔔';
  
  const body = `${emoji} [${alertData.severity.toUpperCase()}] IVR Alert: ${alertData.alertType}
Message: ${alertData.message.substring(0, 100)}${alertData.message.length > 100 ? '...' : ''}
Check dashboard for details`;

  return sendSMS(config, {
    to: alertData.recipient,
    body
  });
}