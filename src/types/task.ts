export type TaskStatus = "not_started" | "in_progress" | "complete";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  spaceId: string | null;
  spaceName: string | null;
  canvasId: string | null;
  canvasShapeId: string | null;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}
