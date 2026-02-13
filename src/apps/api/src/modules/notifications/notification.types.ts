import {
  Channel,
  Reminder,
  ReminderDelivery,
} from '@libs/backend-config';

export interface QueueJobOptions {
  retryLimit?: number;
  retryDelaySeconds?: number;
  retryBackoff?: boolean;
}

export interface DispatchJobPayload {
  deliveryId: string;
  reminderId: string;
  channel: Channel;
  requestedChannel: Channel;
}

export type DispatchHandler = (
  payload: DispatchJobPayload & { jobId?: string },
) => Promise<void>;

export interface NotificationSendInput {
  reminder: Reminder;
  delivery: ReminderDelivery;
}

export interface NotificationSendResult {
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
}
