import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendConfigModule } from '@libs/backend-config';
import { CommonModule } from '@libs/backend-common';
import { UsersController } from '../controllers/users.controller';
import { AssetsController } from '../controllers/assets.controller';
import { ContactsController } from '../controllers/contacts.controller';
import { AssignmentsController } from '../controllers/assignments.controller';
import { MaintenancesController } from '../controllers/maintenances.controller';
import { RemindersController } from '../controllers/reminders.controller';
import { CalendarController } from '../controllers/calendar.controller';
import { ReminderRulesController } from '../controllers/reminder-rules.controller';
import { NotificationDeliveriesController } from '../controllers/notification-deliveries.controller';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { EntityExportService } from '../modules/export/entity-export.service';
import { BulkImportService } from '../modules/import/bulk-import.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BackendConfigModule.forRoot(),
    CommonModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [
    AppController,
    UsersController,
    AssetsController,
    ContactsController,
    AssignmentsController,
    MaintenancesController,
    RemindersController,
    CalendarController,
    ReminderRulesController,
    NotificationDeliveriesController,
  ],
  providers: [AppService, EntityExportService, BulkImportService],
})
export class AppModule {}
