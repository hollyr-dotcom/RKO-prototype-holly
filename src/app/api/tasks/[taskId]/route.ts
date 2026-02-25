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

function attachSpaceName(task: Omit<TaskItem, "spaceName">): TaskItem {
  const spaces = readSpaces();
  const spaceMap = new Map(spaces.map((s) => [s.id, s.name]));
  return {
    ...task,
    spaceName: task.spaceId ? spaceMap.get(task.spaceId) ?? null : null,
  };
}

const VALID_STATUSES: TaskStatus[] = ["not_started", "in_progress", "complete"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

/** PUT /api/tasks/[taskId] — update a task */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await requireAuth();

    const { taskId } = await params;
    const body = await req.json();
    const tasks = readTasks();
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = tasks[index];
    const now = new Date().toISOString();

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      task.title = body.title.trim();
    }

    if (body.description !== undefined) {
      task.description = body.description;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      task.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(body.priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
          { status: 400 }
        );
      }
      task.priority = body.priority;
    }

    if (body.dueDate !== undefined) {
      task.dueDate = body.dueDate;
    }

    if (body.assigneeId !== undefined) {
      task.assigneeId = body.assigneeId;
    }

    if (body.spaceId !== undefined) {
      task.spaceId = body.spaceId;
    }

    if (body.canvasId !== undefined) {
      task.canvasId = body.canvasId;
    }

    if (body.canvasShapeId !== undefined) {
      task.canvasShapeId = body.canvasShapeId;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: "Tags must be an array" }, { status: 400 });
      }
      task.tags = body.tags;
    }

    task.updatedAt = now;
    tasks[index] = task;
    writeTasks(tasks);

    return NextResponse.json({ task: attachSpaceName(task) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/tasks/[taskId] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/tasks/[taskId] — delete a task */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await requireAuth();

    const { taskId } = await params;
    const tasks = readTasks();
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks.splice(index, 1);
    writeTasks(tasks);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/tasks/[taskId] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
