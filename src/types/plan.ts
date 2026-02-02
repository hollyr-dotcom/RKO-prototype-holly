// Task and Plan types for the planning system

export type TaskStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface Task {
  id: string;
  index: number;
  title: string;
  description: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  toolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  currentTaskIndex: number;
  status: 'planning' | 'awaiting_approval' | 'executing' | 'paused' | 'completed' | 'error';
  createdAt: number;
}

export interface PlanUpdate {
  type: 'plan_created' | 'plan_approved' | 'task_started' | 'task_completed' | 'task_error' | 'plan_paused' | 'plan_completed';
  plan: Plan;
  taskIndex?: number;
}
