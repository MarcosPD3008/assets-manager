import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { FormErrorComponent } from '@shared/components';
import {
  ReminderService,
  ToastService,
  AssignmentService,
  MaintenanceService,
  ReminderRuleService,
} from '@core/services';
import {
  ReminderType,
  Priority,
  Channel,
  TargetType,
  Assignment,
  Maintenance,
  ReminderOffsetUnit,
  TargetEntityType,
  ReminderSourceType,
} from '@libs/shared';

type ReminderMode = 'MANUAL' | 'RULE';

interface PresetOption {
  label: string;
  value: string;
  offsetValue?: number;
  offsetUnit?: ReminderOffsetUnit;
}

@Component({
  selector: 'app-reminder-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormErrorComponent],
  templateUrl: './reminder-form.component.html',
  styleUrl: './reminder-form.component.scss',
})
export class ReminderFormComponent implements OnInit {
  reminderForm: FormGroup;
  isEditMode = false;
  isViewOnly = false;
  loading = false;
  reminderId?: string;

  assignments: Assignment[] = [];
  maintenances: Maintenance[] = [];
  private readonly activeChannels: Channel[] = [Channel.IN_APP];

  priorities = Object.values(Priority);
  channels = Object.values(Channel).filter((channel) =>
    this.activeChannels.includes(channel as Channel)
  ) as Channel[];
  targetTypes = Object.values(TargetType);
  reminderOffsetUnits = Object.values(ReminderOffsetUnit);
  targetEntityTypes = Object.values(TargetEntityType);

  modeOptions: ReminderMode[] = ['MANUAL', 'RULE'];

  presets: PresetOption[] = [
    { label: '1 día antes', value: '1_DAY', offsetValue: 1, offsetUnit: ReminderOffsetUnit.DAY },
    { label: '3 días antes', value: '3_DAY', offsetValue: 3, offsetUnit: ReminderOffsetUnit.DAY },
    { label: '1 semana antes', value: '1_WEEK', offsetValue: 1, offsetUnit: ReminderOffsetUnit.WEEK },
    { label: '2 semanas antes', value: '2_WEEK', offsetValue: 2, offsetUnit: ReminderOffsetUnit.WEEK },
    { label: '1 mes antes', value: '1_MONTH', offsetValue: 1, offsetUnit: ReminderOffsetUnit.MONTH },
    { label: 'Personalizado', value: 'CUSTOM' },
  ];

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService,
    private reminderRuleService: ReminderRuleService,
    private assignmentService: AssignmentService,
    private maintenanceService: MaintenanceService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.reminderForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadMaintenances();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.reminderId = params['id'];
        this.isEditMode = true;
        this.reminderForm.get('mode')?.disable();
        this.loadReminder(this.reminderId!);
      }
    });

    this.route.url.subscribe((segments) => {
      this.isViewOnly = segments.some((segment) => segment.path === 'view');
      if (this.isViewOnly) {
        this.reminderForm.disable();
      }
    });

    if (this.isEditMode) {
      this.reminderForm.get('mode')?.disable();
    }

    this.reminderForm.get('targetEntityType')?.valueChanges.subscribe(() => {
      this.updateEntitySelectors();
    });

    this.reminderForm.get('mode')?.valueChanges.subscribe(() => {
      this.updateModeValidation();
    });

    this.reminderForm.get('preset')?.valueChanges.subscribe((presetValue) => {
      this.applyPreset(presetValue);
    });

    this.updateModeValidation();
  }

  createForm(): FormGroup {
    return this.fb.group({
      mode: ['MANUAL' as ReminderMode, [Validators.required]],
      targetEntityType: [TargetEntityType.ASSIGNMENT, [Validators.required]],
      assignmentId: [null],
      maintenanceId: [null],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      scheduledDate: [null],
      preset: ['1_DAY'],
      offsetValue: [1],
      offsetUnit: [ReminderOffsetUnit.DAY],
      targetType: [TargetType.SYSTEM, [Validators.required]],
      priority: [Priority.MEDIUM, [Validators.required]],
      channel: [Channel.IN_APP, [Validators.required]],
    });
  }

  loadAssignments(): void {
    this.assignmentService.getAllPaginated([], { page: 1, pageSize: 500 }).subscribe({
      next: (response) => {
        this.assignments = response.items;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
      },
    });
  }

  loadMaintenances(): void {
    this.maintenanceService.getAllPaginated([], { page: 1, pageSize: 500 }).subscribe({
      next: (response) => {
        this.maintenances = response.items;
      },
      error: (error) => {
        console.error('Error loading maintenances:', error);
      },
    });
  }

  updateEntitySelectors(): void {
    const targetEntityType = this.reminderForm.get('targetEntityType')?.value as TargetEntityType;
    if (targetEntityType === TargetEntityType.ASSIGNMENT) {
      this.reminderForm.patchValue({ maintenanceId: null });
    } else {
      this.reminderForm.patchValue({ assignmentId: null });
    }
    this.updateModeValidation();
  }

  updateModeValidation(): void {
    const mode = this.reminderForm.get('mode')?.value as ReminderMode;
    const targetEntityType = this.reminderForm.get('targetEntityType')?.value as TargetEntityType;

    const assignmentIdControl = this.reminderForm.get('assignmentId');
    const maintenanceIdControl = this.reminderForm.get('maintenanceId');
    const scheduledDateControl = this.reminderForm.get('scheduledDate');
    const offsetValueControl = this.reminderForm.get('offsetValue');
    const offsetUnitControl = this.reminderForm.get('offsetUnit');
    const presetControl = this.reminderForm.get('preset');

    if (targetEntityType === TargetEntityType.ASSIGNMENT) {
      assignmentIdControl?.setValidators([Validators.required]);
      maintenanceIdControl?.clearValidators();
    } else {
      maintenanceIdControl?.setValidators([Validators.required]);
      assignmentIdControl?.clearValidators();
    }

    if (mode === 'MANUAL') {
      scheduledDateControl?.setValidators([Validators.required]);
      presetControl?.clearValidators();
      offsetValueControl?.clearValidators();
      offsetUnitControl?.clearValidators();
    } else {
      scheduledDateControl?.clearValidators();
      presetControl?.setValidators([Validators.required]);
      if (this.reminderForm.get('preset')?.value === 'CUSTOM') {
        offsetValueControl?.setValidators([Validators.required, Validators.min(1)]);
        offsetUnitControl?.setValidators([Validators.required]);
      } else {
        offsetValueControl?.clearValidators();
        offsetUnitControl?.clearValidators();
      }
    }

    assignmentIdControl?.updateValueAndValidity();
    maintenanceIdControl?.updateValueAndValidity();
    scheduledDateControl?.updateValueAndValidity();
    presetControl?.updateValueAndValidity();
    offsetValueControl?.updateValueAndValidity();
    offsetUnitControl?.updateValueAndValidity();
  }

  applyPreset(presetValue: string): void {
    if (presetValue === 'CUSTOM') {
      this.reminderForm.patchValue({
        offsetValue: 1,
        offsetUnit: ReminderOffsetUnit.DAY,
      });
    } else {
      const preset = this.presets.find((p) => p.value === presetValue);
      if (preset?.offsetValue && preset.offsetUnit) {
        this.reminderForm.patchValue({
          offsetValue: preset.offsetValue,
          offsetUnit: preset.offsetUnit,
        });
      }
    }
    this.updateModeValidation();
  }

  loadReminder(id: string): void {
    this.loading = true;
    this.reminderService.getById(id).subscribe({
      next: (response) => {
        const reminder = response as unknown as any;
        const sourceType =
          reminder.sourceType ??
          (reminder.isSent ? ReminderSourceType.MANUAL : ReminderSourceType.MANUAL);
        const targetEntityType =
          reminder.type === ReminderType.MAINTENANCE
            ? TargetEntityType.MAINTENANCE
            : TargetEntityType.ASSIGNMENT;

        this.reminderForm.patchValue({
          mode:
            sourceType === ReminderSourceType.RULE
              ? 'RULE'
              : 'MANUAL',
          targetEntityType,
          message: reminder.message,
          scheduledDate: reminder.scheduledDate
            ? new Date(reminder.scheduledDate)
            : null,
          targetType: reminder.targetType,
          priority: reminder.priority,
          channel: reminder.channel,
          assignmentId: reminder.assignmentId || null,
          maintenanceId: reminder.maintenanceId || null,
        });
        this.loading = false;
        this.updateModeValidation();
      },
      error: (error) => {
        console.error('Error loading reminder:', error);
        this.toastService.error('Error al cargar el recordatorio');
        this.loading = false;
        this.router.navigate(['/reminders']);
      },
    });
  }

  getTitle(): string {
    if (this.isViewOnly) {
      return 'Detalle del recordatorio';
    }
    return this.isEditMode ? 'Editar recordatorio' : 'Nuevo recordatorio';
  }

  onSubmit(): void {
    if (this.isViewOnly) {
      this.router.navigate(['/reminders']);
      return;
    }

    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      this.toastService.warning('Corrige los campos requeridos');
      return;
    }

    const mode = this.reminderForm.getRawValue().mode as ReminderMode;
    if (mode === 'RULE' && this.isEditMode) {
      this.toastService.warning(
        'Para editar reglas relativas usa una regla nueva o desactiva/crea otra.'
      );
      return;
    }

    this.loading = true;
    if (mode === 'RULE') {
      this.createRuleReminder();
    } else {
      this.createOrUpdateManualReminder();
    }
  }

  private createOrUpdateManualReminder(): void {
    const value = this.reminderForm.getRawValue();
    const targetEntityType = value.targetEntityType as TargetEntityType;

    const selectedAssignment = this.assignments.find((a) => a.id === value.assignmentId);
    const selectedMaintenance = this.maintenances.find((m) => m.id === value.maintenanceId);

    const targetId =
      targetEntityType === TargetEntityType.ASSIGNMENT
        ? selectedAssignment?.assigneeId
        : selectedMaintenance?.assetId;

    if (!targetId) {
      this.toastService.error('No se pudo determinar el destinatario');
      this.loading = false;
      return;
    }

    const payload = {
      message: value.message,
      scheduledDate: new Date(value.scheduledDate),
      type:
        targetEntityType === TargetEntityType.ASSIGNMENT
          ? ReminderType.ASSIGNMENT
          : ReminderType.MAINTENANCE,
      targetType: value.targetType,
      targetId,
      priority: value.priority,
      channel: value.channel,
      assignmentId:
        targetEntityType === TargetEntityType.ASSIGNMENT ? value.assignmentId : undefined,
      maintenanceId:
        targetEntityType === TargetEntityType.MAINTENANCE ? value.maintenanceId : undefined,
      sourceType: ReminderSourceType.MANUAL,
    };

    const request$ =
      this.isEditMode && this.reminderId
        ? this.reminderService.update(this.reminderId, payload)
        : this.reminderService.create(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode ? 'Recordatorio actualizado' : 'Recordatorio creado'
        );
        this.loading = false;
        this.router.navigate(['/reminders']);
      },
      error: (error) => {
        console.error('Error saving reminder:', error);
        this.toastService.error(error?.error?.message || 'Error al guardar recordatorio');
        this.loading = false;
      },
    });
  }

  private createRuleReminder(): void {
    const value = this.reminderForm.getRawValue();
    const targetEntityType = value.targetEntityType as TargetEntityType;
    const targetEntityId =
      targetEntityType === TargetEntityType.ASSIGNMENT
        ? value.assignmentId
        : value.maintenanceId;

    if (!targetEntityId) {
      this.toastService.error('Selecciona una asignación o mantenimiento');
      this.loading = false;
      return;
    }

    this.reminderRuleService
      .create({
        targetEntityType,
        targetEntityId,
        offsetValue: value.offsetValue,
        offsetUnit: value.offsetUnit,
        targetType: value.targetType,
        priority: value.priority,
        channel: value.channel,
        messageTemplate: value.message,
        active: true,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Regla relativa creada y recordatorio generado');
          this.loading = false;
          this.router.navigate(['/reminders']);
        },
        error: (error) => {
          console.error('Error creating reminder rule:', error);
          this.toastService.error(
            error?.error?.message || 'Error al crear la regla de recordatorio'
          );
          this.loading = false;
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/reminders']);
  }

  translatePriority(priority: Priority): string {
    const translations: Record<Priority, string> = {
      [Priority.LOW]: 'Baja',
      [Priority.MEDIUM]: 'Media',
      [Priority.HIGH]: 'Alta',
    };
    return translations[priority] || priority;
  }

  translateChannel(channel: Channel): string {
    const translations: Record<Channel, string> = {
      [Channel.IN_APP]: 'In-App',
      [Channel.EMAIL]: 'Correo',
      [Channel.SMS]: 'SMS',
      [Channel.PUSH]: 'Push',
      [Channel.WHATSAPP]: 'WhatsApp',
    };
    return translations[channel] || channel;
  }

  translateTargetType(targetType: TargetType): string {
    const translations: Record<TargetType, string> = {
      [TargetType.SYSTEM]: 'Sistema',
      [TargetType.CONTACT]: 'Contacto',
      [TargetType.BOTH]: 'Ambos',
    };
    return translations[targetType] || targetType;
  }

  getAssignmentDisplay(assignment: Assignment): string {
    const dueDate = assignment.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString('es-CO')
      : 'Sin fecha de devolución';
    return `${assignment.asset?.name || 'Activo'} - ${assignment.assignee?.name || 'Sin responsable'} (${dueDate})`;
  }

  getMaintenanceDisplay(maintenance: Maintenance): string {
    const nextDate = maintenance.nextServiceDate
      ? new Date(maintenance.nextServiceDate).toLocaleDateString('es-CO')
      : 'Sin próxima fecha';
    return `${maintenance.asset?.name || 'Activo'} - ${nextDate}`;
  }
}
