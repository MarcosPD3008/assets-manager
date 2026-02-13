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
  SYSTEM = 'SYSTEM',    // Admin/Sistema
  CONTACT = 'CONTACT',  // Contacto específico
  BOTH = 'BOTH',        // Ambos (sistema y contacto)
}
