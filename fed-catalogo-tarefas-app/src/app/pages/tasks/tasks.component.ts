import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TaskNotFoundError } from '../../errors/task-not-found.error';
import { TaskCreate, TaskPriority } from '../../models/task';
import { TaskService } from '../../services/task.service';

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
};

/**
 * Página principal da Release 1: lista as tarefas do usuário e oferece um
 * formulário simples para criar novas. Persistência delegada ao
 * `TaskService`. Estado reativo da lista vem direto do Firestore (Signal),
 * estado do formulário é local (Signal).
 */
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

  protected readonly tasks = this.tasksService.list();
  protected readonly form = signal<FormState>({ ...EMPTY_FORM });
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly priorityOptions: ReadonlyArray<{ value: TaskPriority; label: string }> = [
    { value: TaskPriority.LOW, label: 'Baixa' },
    { value: TaskPriority.MEDIUM, label: 'Média' },
    { value: TaskPriority.HIGH, label: 'Alta' },
    { value: TaskPriority.URGENT, label: 'Urgente' },
  ];

  protected updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    const current = this.form();
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
        status: 'open',
      };
      await this.tasksService.create(payload);
      this.form.set({ ...EMPTY_FORM });
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Falha ao criar tarefa.',
      );
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
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Falha ao excluir tarefa.',
      );
    }
  }
}
