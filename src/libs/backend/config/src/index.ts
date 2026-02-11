export * from './lib/backend-config.module';
export * from './lib/config/database.config';
export * from './lib/users/entities/base.entity';
export * from './lib/users/entities/user.entity';
export * from './lib/users/repositories/base.repository';
export * from './lib/users/services/base.service';
export * from './lib/users/services/user.service';
export * from './lib/users/dto/user.dto';

// Features - Shared
export * from './lib/features/shared/enums';
export * from './lib/features/shared/dto/calendar-query.dto';
export * from './lib/features/shared/dto/paginated-response.dto';

// Features - Assets
export * from './lib/features/assets/asset.entity';
export * from './lib/features/assets/dto/asset.dto';
export * from './lib/features/assets/asset.service';

// Features - Contacts
export * from './lib/features/contacts/contact.entity';
export * from './lib/features/contacts/dto/contact.dto';
export * from './lib/features/contacts/contact.service';

// Features - Assignments
export * from './lib/features/assignments/assignment.entity';
export * from './lib/features/assignments/dto/assignment.dto';
export * from './lib/features/assignments/assignment.service';

// Features - Maintenances
export * from './lib/features/maintenances/maintenance.entity';
export * from './lib/features/maintenances/dto/maintenance.dto';
export * from './lib/features/maintenances/maintenance.service';

// Features - Reminders
export * from './lib/features/reminders/reminder.entity';
export * from './lib/features/reminders/dto/reminder.dto';
export * from './lib/features/reminders/reminder.service';

// Utils
export * from './lib/utils/odata-filter-backend';

export { Repository, Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
export { Injectable, Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
export { IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength, IsString, IsNumber, IsEnum, IsUUID, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';
export { Type } from 'class-transformer';