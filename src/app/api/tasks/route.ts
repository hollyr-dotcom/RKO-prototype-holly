import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import fs from "fs";
import path from "path";
import type { TaskItem, TaskPriority, TaskStatus } from "@/types/task";

const TASKS_PATH = path.join(process.cwd(), "src/data/tasks.json");
const SPACES_PATH = path.join(process.cwd(), "src/data/spaces.json");

type SpaceRaw = { id: string; name: string };

function readTasks(): Omit<TaskItem, "spaceName">[] {
  return JSON.parse(fs.readFileSync(TASKS_PATH, "utf-8"));
}

function writeTasks(tasks: Omit<TaskItem, "spaceName">[]) {
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2) + "\n");
}

function readSpaces(): SpaceRaw[] {
  return JSON.parse(fs.readFileSync(SPACES_PATH, "utf-8"));
}

function attachSpaceNames(tasks: Omit<TaskItem, "spaceName">[]): TaskItem[] {
  const spaces = readSpaces();
  const spaceMap = new Map(spaces.map((s) => [s.id, s.name]));
  return tasks.map((t) => ({
    ...t,
    spaceName: t.spaceId ? spaceMap.get(t.spaceId) ?? null : null,
  }));
}

const VALID_STATUSES: TaskStatus[] = ["not_started", "in_progress", "complete"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

/** GET /api/tasks — list all tasks with optional filters */
export async function GET(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");
    const spaceIdFilter = searchParams.get("space_id");
    const sort = searchParams.get("sort");

    let tasks = readTasks();

    // Filter by status
    if (statusFilter === "active") {
      tasks = tasks.filter((t) => t.status !== "complete");
    } else if (statusFilter === "completed") {
      tasks = tasks.filter((t) => t.status === "complete");
    }

    // Filter by priority
    if (priorityFilter && VALID_PRIORITIES.includes(priorityFilter as TaskPriority)) {
      tasks = tasks.filter((t) => t.priority === priorityFilter);
    }

    // Filter by space
    if (spaceIdFilter) {
      tasks = tasks.filter((t) => t.spaceId === spaceIdFilter);
    }

    // Sort
    const withNames = attachSpaceNames(tasks);
    if (sort === "due_date") {
      withNames.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sort === "priority") {
      const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
      withNames.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sort === "created_at") {
      withNames.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json({ tasks: withNames });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/tasks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/tasks — create a new task */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { title, description, priority, dueDate, spaceId, tags } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const tasks = readTasks();
    const now = new Date().toISOString();
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) : -1;

    const newTask: Omit<TaskItem, "spaceName"> = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description ?? null,
      status: "not_started",
      priority: priority ?? "medium",
      dueDate: dueDate ?? null,
      assigneeId: null,
      spaceId: spaceId ?? null,
      canvasId: null,
      canvasShapeId: null,
      tags: Array.isArray(tags) ? tags : [],
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(newTask);
    writeTasks(tasks);

    const [taskWithName] = attachSpaceNames([newTask]);
    return NextResponse.json({ task: taskWithName }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/tasks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/tasks/reorder — update task order */
export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const { taskIds } = await req.json();

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "taskIds must be an array of task IDs" },
        { status: 400 }
      );
    }

    const tasks = readTasks();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    for (let i = 0; i < taskIds.length; i++) {
      const task = taskMap.get(taskIds[i]);
      if (task) {
        task.order = i;
      }
    }

    writeTasks(tasks);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/tasks/reorder error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
