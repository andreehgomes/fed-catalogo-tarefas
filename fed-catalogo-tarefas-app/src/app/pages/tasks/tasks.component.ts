import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NotAuthenticatedError } from '../../errors/not-authenticated.error';
import { TaskNotFoundError } from '../../errors/task-not-found.error';
import { UnauthorizedTaskAccessError } from '../../errors/unauthorized-task-access.error';
import { Task, TaskCreate, TaskPriority, TaskStatus } from '../../models/task';
import { PrioritySuggestionService } from '../../services/priority-suggestion.service';
import { TaskService } from '../../services/task.service';

interface CreateFormState {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface EditFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

type SuggestionContext = 'create' | 'edit';
type SuggestionSource = 'claude' | 'heuristic';

const EMPTY_CREATE_FORM: CreateFormState = {
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
};

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent {
  private readonly tasksService = inject(TaskService);
  private readonly suggestionService = inject(PrioritySuggestionService);

  protected readonly tasks = this.tasksService.list();
  protected readonly createForm = signal<CreateFormState>({ ...EMPTY_CREATE_FORM });
  protected readonly editingId = signal<string | null>(null);
  protected readonly editForm = signal<EditFormState | null>(null);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly suggestingFor = signal<SuggestionContext | null>(null);
  protected readonly lastSuggestionSource = signal<SuggestionSource | null>(null);

  protected readonly priorityOptions: ReadonlyArray<{ value: TaskPriority; label: string }> = [
    { value: TaskPriority.LOW, label: 'Baixa' },
    { value: TaskPriority.MEDIUM, label: 'Média' },
    { value: TaskPriority.HIGH, label: 'Alta' },
    { value: TaskPriority.URGENT, label: 'Urgente' },
  ];

  protected readonly statusOptions: ReadonlyArray<{ value: TaskStatus; label: string }> = [
    { value: TaskStatus.OPEN, label: 'Aberta' },
    { value: TaskStatus.IN_PROGRESS, label: 'Em andamento' },
    { value: TaskStatus.DONE, label: 'Concluída' },
    { value: TaskStatus.CANCELLED, label: 'Cancelada' },
  ];

  protected updateCreateField<K extends keyof CreateFormState>(
    field: K,
    value: CreateFormState[K],
  ): void {
    this.createForm.update((current) => ({ ...current, [field]: value }));
  }

  protected updateEditField<K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ): void {
    this.editForm.update((current) => (current ? { ...current, [field]: value } : current));
  }

  protected async submitCreate(): Promise<void> {
    if (this.busy()) return;
    const current = this.createForm();
    if (!current.title.trim()) {
      this.errorMessage.set('Título é obrigatório.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      const payload: TaskCreate = {
        title: current.title,
        description: current.description,
        priority: current.priority,
        status: TaskStatus.OPEN,
      };
      await this.tasksService.create(payload);
      this.createForm.set({ ...EMPTY_CREATE_FORM });
      this.lastSuggestionSource.set(null);
    } catch (error: unknown) {
      this.errorMessage.set(this.translateError(error, 'criar tarefa'));
    } finally {
      this.busy.set(false);
    }
  }

  protected startEdit(task: Task): void {
    this.errorMessage.set(null);
    this.editingId.set(task.id);
    this.editForm.set({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
    });
    this.lastSuggestionSource.set(null);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.set(null);
    this.lastSuggestionSource.set(null);
  }

  protected async saveEdit(): Promise<void> {
    if (this.busy()) return;
    const id = this.editingId();
    const current = this.editForm();
    if (!id || !current) return;
    if (!current.title.trim()) {
      this.errorMessage.set('Título é obrigatório.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await this.tasksService.update(id, {
        title: current.title,
        description: current.description,
        priority: current.priority,
        status: current.status,
      });
      this.cancelEdit();
    } catch (error: unknown) {
      this.errorMessage.set(this.translateError(error, 'atualizar tarefa'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(taskId: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.tasksService.delete(taskId);
    } catch (error: unknown) {
      if (error instanceof TaskNotFoundError) {
        this.errorMessage.set('Esta tarefa já havia sido removida.');
        return;
      }
      this.errorMessage.set(this.translateError(error, 'excluir tarefa'));
    }
  }

  protected async suggestForCreate(): Promise<void> {
    const current = this.createForm();
    await this.runSuggestion('create', current.title, current.description, (priority) => {
      this.createForm.update((c) => ({ ...c, priority }));
    });
  }

  protected async suggestForEdit(): Promise<void> {
    const current = this.editForm();
    if (!current) return;
    await this.runSuggestion('edit', current.title, current.description, (priority) => {
      this.editForm.update((c) => (c ? { ...c, priority } : c));
    });
  }

  private async runSuggestion(
    context: SuggestionContext,
    title: string,
    description: string,
    apply: (priority: TaskPriority) => void,
  ): Promise<void> {
    if (this.suggestingFor() !== null) return;
    if (!title.trim()) {
      this.errorMessage.set('Informe ao menos o título antes de pedir sugestão.');
      return;
    }

    this.suggestingFor.set(context);
    this.errorMessage.set(null);
    try {
      const result = await this.suggestionService.suggest({
        title,
        description: description ?? '',
      });
      apply(result.priority);
      this.lastSuggestionSource.set(result.source);
    } catch (error: unknown) {
      this.errorMessage.set(this.translateError(error, 'obter sugestão de prioridade'));
    } finally {
      this.suggestingFor.set(null);
    }
  }

  private translateError(error: unknown, action: string): string {
    if (error instanceof NotAuthenticatedError) {
      return 'Você precisa estar logado para realizar esta ação.';
    }
    if (error instanceof UnauthorizedTaskAccessError) {
      return 'Esta tarefa pertence a outro usuário.';
    }
    if (error instanceof TaskNotFoundError) {
      return 'Tarefa não encontrada.';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return `Falha ao ${action}.`;
  }
}
