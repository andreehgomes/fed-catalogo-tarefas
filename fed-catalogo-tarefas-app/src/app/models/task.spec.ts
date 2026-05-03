import {
  Task,
  TaskCreateSchema,
  TaskOutSchema,
  TaskPriority,
  TaskStatus,
  TaskUpdateSchema,
} from './task';

describe('TaskCreateSchema', () => {
  it('aplica defaults para description, priority e status', () => {
    const parsed = TaskCreateSchema.parse({ title: 'Estudar' });
    expect(parsed).toEqual({
      title: 'Estudar',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
    });
  });

  it('rejeita título vazio', () => {
    expect(() => TaskCreateSchema.parse({ title: '   ' })).toThrowError();
  });

  it('rejeita prioridade fora do enum', () => {
    expect(() =>
      TaskCreateSchema.parse({ title: 'x', priority: 'invalid' as never }),
    ).toThrowError();
  });

  it('aplica trim no título', () => {
    const parsed = TaskCreateSchema.parse({ title: '  fazer compras  ' });
    expect(parsed.title).toBe('fazer compras');
  });
});

describe('TaskUpdateSchema', () => {
  it('aceita atualização parcial com um campo', () => {
    expect(() => TaskUpdateSchema.parse({ status: TaskStatus.DONE })).not.toThrow();
  });

  it('recusa update vazio', () => {
    expect(() => TaskUpdateSchema.parse({})).toThrowError(/pelo menos um campo/i);
  });

  it('recusa título vazio em update', () => {
    expect(() => TaskUpdateSchema.parse({ title: '' })).toThrowError();
  });
});

describe('TaskOutSchema', () => {
  const baseTask: Task = {
    id: 'abc123',
    title: 'Estudar',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.OPEN,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    userId: 'user-1',
  };

  it('aceita um documento válido completo', () => {
    expect(() => TaskOutSchema.parse(baseTask)).not.toThrow();
  });

  it('exige userId', () => {
    const { userId: _userId, ...rest } = baseTask;
    expect(() => TaskOutSchema.parse(rest)).toThrowError();
  });

  it('exige id', () => {
    const { id: _id, ...rest } = baseTask;
    expect(() => TaskOutSchema.parse(rest)).toThrowError();
  });
});
