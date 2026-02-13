/**
 * Entity interfaces shared between frontend and backend
 */

// Enums
export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum FrequencyUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum ReminderType {
  ASSIGNMENT = 'ASSIGNMENT',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  OVERDUE = 'OVERDUE',
}

export enum ReminderSourceType {
  MANUAL = 'MANUAL',
  RULE = 'RULE',
}

export enum ReminderOffsetUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export enum TargetEntityType {
  ASSIGNMENT = 'ASSIGNMENT',
  MAINTENANCE = 'MAINTENANCE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Channel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationDeliveryStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export enum TargetType {
  SYSTEM = 'SYSTEM',
  CONTACT = 'CONTACT',
  BOTH = 'BOTH',
}

// Base interface
export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// Asset interface
export interface Asset extends BaseEntity {
  name: string;
  description?: string;
  serialNumber?: string;
  metadata?: Record<string, any>;
  status: AssetStatus;
  category?: string;
  location?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  assignments?: Assignment[];
  maintenances?: Maintenance[];
}

// Contact interface
export interface Contact extends BaseEntity {
  name: string;
  email: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
  department?: string;
  position?: string;
  notes?: string;
  assignments?: Assignment[];
}

// Assignment interface
export interface Assignment extends BaseEntity {
  assetId: string;
  asset?: Asset;
  assigneeId: string;
  assignee?: Contact;
  startDate: Date;
  dueDate?: Date;
  returnDate?: Date;
  isPermanent: boolean;
  status: AssignmentStatus;
  notes?: string;
  assignedBy?: string;
  reminders?: Reminder[];
}

// Maintenance interface
export interface Maintenance extends BaseEntity {
  assetId: string;
  asset?: Asset;
  description: string;
  frequencyAmount: number;
  unit: FrequencyUnit;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  reminders?: Reminder[];
  executions?: MaintenanceExecution[];
}

export interface MaintenanceExecution extends BaseEntity {
  maintenanceId: string;
  maintenance?: Maintenance;
  executedAt: Date;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  performedBy?: string;
}

// Reminder interface
export interface Reminder extends BaseEntity {
  message: string;
  scheduledDate: Date;
  status: ReminderStatus;
  sourceType: ReminderSourceType;
  type: ReminderType;
  targetType: TargetType;
  targetId: string;
  priority: Priority;
  channel: Channel;
  reminderRuleId?: string;
  reminderRule?: ReminderRule;
  assignmentId?: string;
  assignment?: Assignment;
  maintenanceId?: string;
  maintenance?: Maintenance;
  // Legacy compatibility during migration from isSent -> status.
  isSent?: boolean;
}

export interface ReminderRule extends BaseEntity {
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  offsetValue: number;
  offsetUnit: ReminderOffsetUnit;
  targetType: TargetType;
  priority: Priority;
  channel: Channel;
  active: boolean;
  messageTemplate?: string;
  generatedReminders?: Reminder[];
}

export interface ReminderDelivery extends BaseEntity {
  reminderId: string;
  reminder?: Reminder;
  channel: Channel;
  status: NotificationDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  jobId?: string;
  idempotencyKey: string;
  queuedAt?: Date;
  processedAt?: Date;
  sentAt?: Date;
  deadLetterAt?: Date;
  lastError?: string;
  providerMessageId?: string;
  payload?: Record<string, unknown>;
}

// Calendar Response interface
export interface CalendarResponse {
  assignments: Assignment[];
  maintenances: Maintenance[];
  reminders: Reminder[];
}
