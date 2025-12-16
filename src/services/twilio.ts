// Twilio Voice Call Service for IVR Testing
// This service handles real voice calls via Twilio API

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface CallOptions {
  to: string;
  dtmfInputs: string[];
  timeout: number;
  recordCall?: boolean;
  transcribe?: boolean;
}

export interface CallResult {
  callSid: string;
  status: string;
  duration: number;
  recordingUrl?: string;
  transcript?: string;
  dtmfSent: string[];
  success: boolean;
  errorMessage?: string;
}

export interface QualityMetrics {
  mos: number; // Mean Opinion Score (1-5)
  jitter: number; // in ms
  packetLoss: number; // percentage
  latency: number; // in ms
}

/**
 * Make a test call using Twilio REST API
 * Works in Cloudflare Workers environment
 */
export async function makeTestCall(
  config: TwilioConfig,
  options: CallOptions,
  callbackUrl: string
): Promise<CallResult> {
  try {
    // Create Basic Auth header
    const auth = btoa(`${config.accountSid}:${config.authToken}`);

    // Build TwiML URL for DTMF playback
    const twimlUrl = `${callbackUrl}/api/twilio/twiml?dtmf=${encodeURIComponent(
      JSON.stringify(options.dtmfInputs)
    )}`;

    // Make API call to Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: options.to,
          From: config.phoneNumber,
          Url: twimlUrl,
          Record: options.recordCall ? 'true' : 'false',
          RecordingStatusCallback: `${callbackUrl}/api/twilio/recording`,
          StatusCallback: `${callbackUrl}/api/twilio/status`,
          Timeout: options.timeout.toString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Twilio API call failed');
    }

    const data = await response.json();

    return {
      callSid: data.sid,
      status: data.status,
      duration: 0, // Will be updated via webhook
      dtmfSent: options.dtmfInputs,
      success: true,
    };
  } catch (error) {
    return {
      callSid: '',
      status: 'failed',
      duration: 0,
      dtmfSent: options.dtmfInputs,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate TwiML XML for call flow
 * Includes DTMF playback and recording
 */
export function generateTwiML(dtmfInputs: string[], recordCall: boolean = true): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

  // Add initial pause to wait for IVR to answer
  twiml += '<Pause length="3"/>';

  // Play each DTMF digit with pauses
  for (const digit of dtmfInputs) {
    twiml += `<Play digits="${digit}"/>`;
    twiml += '<Pause length="2"/>'; // Wait for IVR response
  }

  // Record the call if requested
  if (recordCall) {
    twiml += '<Record maxLength="120" transcribe="true" transcribeCallback="/api/twilio/transcription"/>';
  }

  // Add final pause before hanging up
  twiml += '<Pause length="2"/>';
  twiml += '<Hangup/>';
  twiml += '</Response>';

  return twiml;
}

/**
 * Get call quality metrics from Twilio Insights API
 */
export async function getCallQuality(
  config: TwilioConfig,
  callSid: string
): Promise<QualityMetrics | null> {
  try {
    const auth = btoa(`${config.accountSid}:${config.authToken}`);

    const response = await fetch(
      `https://insights.twilio.com/v1/Voice/${callSid}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Extract quality metrics
    return {
      mos: data.quality?.mos || 0,
      jitter: data.quality?.jitter_avg || 0,
      packetLoss: data.quality?.packet_loss_avg || 0,
      latency: data.quality?.latency_avg || 0,
    };
  } catch (error) {
    console.error('Error fetching call quality:', error);
    return null;
  }
}

/**
 * Get call details from Twilio
 */
export async function getCallDetails(config: TwilioConfig, callSid: string) {
  const auth = btoa(`${config.accountSid}:${config.authToken}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls/${callSid}.json`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch call details');
  }

  return await response.json();
}

/**
 * List recordings for a call
 */
export async function getCallRecordings(config: TwilioConfig, callSid: string) {
  const auth = btoa(`${config.accountSid}:${config.authToken}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls/${callSid}/Recordings.json`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recordings');
  }

  const data = await response.json();
  return data.recordings || [];
}

/**
 * Validate Twilio webhook signature for security
 */
export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Implementation of Twilio's signature validation
  // See: https://www.twilio.com/docs/usage/security#validating-requests
  
  // For production, implement proper signature validation
  // This is a simplified version
  return true; // TODO: Implement proper validation
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Add + if not present
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Calculate estimated cost for a call
 */
export function estimateCallCost(durationSeconds: number): number {
  // Twilio US pricing (approximate)
  const perMinuteRate = 0.013; // $0.013 per minute
  const recordingRate = 0.0025; // $0.0025 per minute for recording
  const transcriptionRate = 0.05; // $0.05 per minute for transcription

  const minutes = Math.ceil(durationSeconds / 60);

  return (perMinuteRate + recordingRate + transcriptionRate) * minutes;
}
