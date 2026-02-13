import {
  DispatchHandler,
  DispatchJobPayload,
  QueueJobOptions,
} from '../notification.types';

export interface NotificationQueuePort {
  enqueueDispatch(
    job: DispatchJobPayload,
    opts?: QueueJobOptions,
  ): Promise<string | undefined>;
  enqueueDeadLetter(
    job: DispatchJobPayload,
    reason: string,
  ): Promise<string | undefined>;
  registerDispatchWorker(handler: DispatchHandler): Promise<void>;
  close(): Promise<void>;
}
