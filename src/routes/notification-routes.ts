import { Hono } from 'hono';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../services/auth';

const notificationRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

// Get user notification preferences
notificationRoutes.get('/api/notification-preferences', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const preferences = await getUserNotificationPreferences(user.id, c.env.DB);
    return c.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return c.json({ success: false, message: 'Failed to fetch notification preferences' }, 500);
  }
});

// Update user notification preferences
notificationRoutes.put('/api/notification-preferences', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    
    const success = await updateUserNotificationPreferences(
      user.id,
      {
        emailEnabled: body.emailEnabled ?? true,
        smsEnabled: body.smsEnabled ?? false,
        slackEnabled: body.slackEnabled ?? false,
        emailAddresses: body.emailAddresses ?? [],
        phoneNumbers: body.phoneNumbers ?? [],
        slackWebhooks: body.slackWebhooks ?? []
      },
      c.env.DB
    );

    if (success) {
      return c.json({ success: true, message: 'Notification preferences updated successfully' });
    } else {
      return c.json({ success: false, message: 'Failed to update notification preferences' }, 500);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return c.json({ success: false, message: 'Failed to update notification preferences' }, 500);
  }
});

export default notificationRoutes;