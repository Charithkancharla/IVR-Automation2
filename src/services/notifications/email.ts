/**
 * Email Notification Service
 * Provides functionality to send email notifications for IVR test results and alerts
 */

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromAddress: string;
}

interface EmailMessage {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
}

/**
 * Send an email notification
 * @param config SMTP configuration
 * @param message Email message details
 * @returns Promise indicating success or failure
 */
export async function sendEmail(config: EmailConfig, message: EmailMessage): Promise<boolean> {
  try {
    // In a real implementation, this would connect to an SMTP server
    // For now, we'll simulate the email sending process
    
    console.log('📧 Sending email notification:');
    console.log(`   To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);
    console.log(`   Subject: ${message.subject}`);
    console.log(`   Body: ${message.body.substring(0, 100)}${message.body.length > 100 ? '...' : ''}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate successful email delivery
    return true;
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    return false;
  }
}

/**
 * Send test result notification
 * @param config SMTP configuration
 * @param testData Test result data
 * @returns Promise indicating success or failure
 */
export async function sendTestResultNotification(
  config: EmailConfig,
  testData: {
    testName: string;
    status: 'passed' | 'failed';
    duration: number;
    timestamp: Date;
    recipient: string;
  }
): Promise<boolean> {
  const subject = `IVR Test ${testData.status === 'passed' ? 'PASSED' : 'FAILED'}: ${testData.testName}`;
  
  const body = `
IVR Test Result Notification
============================

Test Name: ${testData.testName}
Status: ${testData.status.toUpperCase()}
Duration: ${testData.duration}ms
Timestamp: ${testData.timestamp.toISOString()}

${testData.status === 'passed' 
  ? '✅ The test completed successfully.' 
  : '❌ The test failed. Please review the test configuration and logs.'}

For more details, visit the IVR Automation Testing Platform dashboard.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IVR Test Result</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: ${testData.status === 'passed' ? '#28a745' : '#dc3545'};">
      IVR Test ${testData.status === 'passed' ? 'PASSED' : 'FAILED'}
    </h1>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2>${testData.testName}</h2>
      <p><strong>Status:</strong> <span style="color: ${testData.status === 'passed' ? '#28a745' : '#dc3545'};">${testData.status.toUpperCase()}</span></p>
      <p><strong>Duration:</strong> ${testData.duration}ms</p>
      <p><strong>Timestamp:</strong> ${testData.timestamp.toISOString()}</p>
    </div>
    
    <p>${testData.status === 'passed' 
      ? '✅ The test completed successfully.' 
      : '❌ The test failed. Please review the test configuration and logs.'}</p>
    
    <p><a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>
    
    <hr style="margin: 30px 0;">
    <p style="font-size: 0.9em; color: #666;">
      This is an automated notification from the IVR Automation Testing Platform.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(config, {
    to: testData.recipient,
    subject,
    body,
    html
  });
}

/**
 * Send alert notification
 * @param config SMTP configuration
 * @param alertData Alert data
 * @returns Promise indicating success or failure
 */
export async function sendAlertNotification(
  config: EmailConfig,
  alertData: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    recipient: string;
  }
): Promise<boolean> {
  const severityColors: Record<string, string> = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    critical: '#dc3545'
  };

  const subject = `[${alertData.severity.toUpperCase()}] IVR Alert: ${alertData.alertType}`;
  
  const body = `
IVR System Alert
================

Alert Type: ${alertData.alertType}
Severity: ${alertData.severity.toUpperCase()}
Message: ${alertData.message}
Timestamp: ${alertData.timestamp.toISOString()}

Please investigate this alert in the IVR Automation Testing Platform.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IVR System Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: ${severityColors[alertData.severity] || '#333'};">
      IVR System Alert
    </h1>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${severityColors[alertData.severity] || '#333'};">
      <h2>${alertData.alertType}</h2>
      <p><strong>Severity:</strong> <span style="color: ${severityColors[alertData.severity] || '#333'};">${alertData.severity.toUpperCase()}</span></p>
      <p><strong>Message:</strong> ${alertData.message}</p>
      <p><strong>Timestamp:</strong> ${alertData.timestamp.toISOString()}</p>
    </div>
    
    <p><a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Alert Details</a></p>
    
    <hr style="margin: 30px 0;">
    <p style="font-size: 0.9em; color: #666;">
      This is an automated alert from the IVR Automation Testing Platform.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(config, {
    to: alertData.recipient,
    subject,
    body,
    html
  });
}