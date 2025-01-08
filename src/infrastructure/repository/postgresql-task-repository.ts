import { eq, sql } from "drizzle-orm";
import { Task } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";
import type { Database } from "../../libs/drizzle/get-database";
import { tasks } from "../../libs/drizzle/schema";

export class PostgresqlTaskRepository implements TaskRepositoryInterface {
  public constructor(private readonly database: Database) {}

  public async save(task: Task) {
    const [row] = await this.database
      .insert(tasks)
      .values(task)
      .onConflictDoUpdate(
        (() => {
          const { id, ...rest } = tasks;

          return {
            target: tasks.id,
            set: Object.fromEntries(
              Object.entries(rest).map(([key]) => [
                key,
                sql.raw(`excluded.${key}`),
              ]),
            ),
          };
        })(),
      )
      .returning({
        id: tasks.id,
        title: tasks.title,
        isDone: tasks.isDone,
      });

    if (!row) {
      throw new Error("Failed to save a task");
    }

    return new Task(row);
  }

  public async findById(id: string) {
    const [row] = await this.database
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!row) {
      return undefined;
    }

    return new Task(row);
  }
}
