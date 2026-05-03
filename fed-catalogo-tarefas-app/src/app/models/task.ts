import { z } from 'zod';

/**
 * Prioridade de uma tarefa. Mantida como enum-like literal para casar com a
 * sugestão devolvida pela Cloud Function `suggestPriority` na Release 3.
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

/**
 * Status de uma tarefa no ciclo de vida básico do MVP.
 */
export const TaskStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

const taskPriorityValues = Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]];
const taskStatusValues = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];

/**
 * Schema de criação de tarefa: o que o cliente envia ao `TaskService.create`.
 * Não contém id, datas nem userId — esses são preenchidos pelo serviço.
 */
export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório').max(120),
  description: z.string().trim().max(2000).default(''),
  priority: z.enum(taskPriorityValues).default(TaskPriority.MEDIUM),
  status: z.enum(taskStatusValues).default(TaskStatus.OPEN),
});
export type TaskCreate = z.infer<typeof TaskCreateSchema>;

/**
 * Schema de atualização parcial de tarefa: qualquer subconjunto dos campos
 * mutáveis. `updatedAt` é gerenciado pelo serviço, não pelo cliente.
 */
export const TaskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    priority: z.enum(taskPriorityValues),
    status: z.enum(taskStatusValues),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Pelo menos um campo deve ser informado para atualização',
  });
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

/**
 * Schema de saída: shape que o serviço expõe para a UI após ler do Firestore.
 * `userId` é obrigatório a partir da Release 2 — toda tarefa pertence a um
 * usuário autenticado.
 */
export const TaskOutSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(taskPriorityValues),
  status: z.enum(taskStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().min(1),
});
export type Task = z.infer<typeof TaskOutSchema>;
