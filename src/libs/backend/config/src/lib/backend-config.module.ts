import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UserService } from './users/services/user.service';
import { Asset } from './features/assets/asset.entity';
import { Contact } from './features/contacts/contact.entity';
import { Assignment } from './features/assignments/assignment.entity';
import { Maintenance } from './features/maintenances/maintenance.entity';
import { Reminder } from './features/reminders/reminder.entity';
import { ReminderRule } from './features/reminders/reminder-rule.entity';
import { ReminderDelivery } from './features/reminders/reminder-delivery.entity';
import { MaintenanceExecution } from './features/maintenances/maintenance-execution.entity';
import { AssetService } from './features/assets/asset.service';
import { ContactService } from './features/contacts/contact.service';
import { AssignmentService } from './features/assignments/assignment.service';
import { MaintenanceService } from './features/maintenances/maintenance.service';
import { ReminderService } from './features/reminders/reminder.service';
import { ReminderRuleService } from './features/reminders/reminder-rule.service';
import { ReminderDeliveryService } from './features/reminders/reminder-delivery.service';
import databaseConfig from './config/database.config';

const allEntities = [
  User,
  Asset,
  Contact,
  Assignment,
  Maintenance,
  Reminder,
  ReminderRule,
  ReminderDelivery,
  MaintenanceExecution,
];

const allServices = [
  UserService,
  AssetService,
  ContactService,
  AssignmentService,
  MaintenanceService,
  ReminderService,
  ReminderRuleService,
  ReminderDeliveryService,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          entities: allEntities, // Use explicit entities array instead of path
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(allEntities),
  ],
  providers: allServices,
  exports: [ConfigModule, TypeOrmModule, ...allServices],
})
export class BackendConfigModule {
  static forRoot() {
    return {
      module: BackendConfigModule,
      global: true,
    };
  }

  static forRootAsync(options?: {
    entities?: any[];
    services?: any[];
  }) {
    return {
      module: BackendConfigModule,
      imports: [
        TypeOrmModule.forFeature(options?.entities || allEntities),
      ],
      providers: options?.services || allServices,
      exports: [
        TypeOrmModule,
        ...(options?.services || allServices),
      ],
      global: true,
    };
  }
}

