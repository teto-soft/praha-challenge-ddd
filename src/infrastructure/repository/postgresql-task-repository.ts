import { eq, sql } from "drizzle-orm";
import { type Result, err, ok } from "neverthrow";
import { type ITask, Task } from "../../domain/task/task";
import {
  type TaskRepositoryInterface,
  TaskRepositoryNotFoundError,
  TaskRepositorySaveError,
} from "../../domain/task/task-repository";
import type { Database } from "../../libs/drizzle/get-database";
import { tasks } from "../../libs/drizzle/schema";

export class PostgresqlTaskRepository implements TaskRepositoryInterface {
  public constructor(private readonly database: Database) {}

  async save(task: ITask): Promise<Result<ITask, TaskRepositorySaveError>> {
    try {
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
        return err(new TaskRepositorySaveError("Failed to save a task"));
      }

      return ok(task);
    } catch (error) {
      if (error instanceof Error) {
        return err(new TaskRepositorySaveError(error.message));
      }

      return err(new TaskRepositorySaveError("Unknown error"));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<ITask | undefined, TaskRepositoryNotFoundError>> {
    try {
      const [row] = await this.database
        .select()
        .from(tasks)
        .where(eq(tasks.id, id));

      if (!row) {
        return ok(undefined);
      }

      return Task.reconstruct(row);
    } catch (error) {
      if (error instanceof Error) {
        return err(new TaskRepositoryNotFoundError(error.message));
      }

      return err(new TaskRepositoryNotFoundError("Unknown error"));
    }
  }
}
