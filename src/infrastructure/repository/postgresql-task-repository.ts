import {and, eq, type SQL, sql} from "drizzle-orm";
import {err, Result} from "neverthrow";
import {type ITask, Task} from "../../domain/task/task";
import {
  TaskRepositoryFindByIdError,
  type TaskRepositoryInterface,
  TaskRepositorySaveError,
} from "../../domain/task/task-repository";
import type {Database} from "../../libs/drizzle/get-database";
import {tasks} from "../../libs/drizzle/schema";

export const createPostgresqlTaskRepository = (
  database: Database,
): TaskRepositoryInterface => {
  const save = async (
    task: ITask,
  ): Promise<Result<ITask, TaskRepositorySaveError>> => {
    return database
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
      })
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(new TaskRepositorySaveError("Failed to save a task"));
        }
        return Task.reconstruct(row).mapErr(
          (error) => new TaskRepositorySaveError(error.message),
        );
      })
      .catch((error) => {
        if (error instanceof Error) {
          return err(new TaskRepositorySaveError(error.message));
        }
        return err(new TaskRepositorySaveError("Unknown error"));
      });
  };

  const findById = async (
    id: ITask["id"],
  ): Promise<Result<ITask, TaskRepositoryFindByIdError>> => {
    return database
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(new TaskRepositoryFindByIdError("Task not found"));
        }

        return Task.reconstruct(row).mapErr(
          (error) => new TaskRepositoryFindByIdError(error.message),
        );
      })
      .catch((error) => {
        if (error instanceof Error) {
          return err(new TaskRepositoryFindByIdError(error.message));
        }
        return err(new TaskRepositoryFindByIdError("Unknown error"));
      });
  };

  const createConditions = (task: Partial<ITask>): SQL[] =>
    Object.entries(task)
      .filter((entry): entry is [keyof ITask, ITask[keyof ITask]] => {
        const [key, value] = entry;
        return value !== null && key in tasks;
      })
      .map(([key, value]) => eq(tasks[key], value));

  const findManyBy = async (
    task: Partial<Omit<ITask, "id">>,
  ): Promise<Result<ITask[], TaskRepositoryFindByIdError>> => {
    const conditions = createConditions(task);

    return database
      .select()
      .from(tasks)
      .where(and(...conditions))
      .then((rows) => rows.map(Task.reconstruct))
      .then((tasks) => Result.combine(tasks))
      .then((tasks) =>
        tasks.mapErr((error) => new TaskRepositoryFindByIdError(error.message)),
      )
      .catch((error) =>
        err(
          new TaskRepositoryFindByIdError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  };

  return {
    save,
    findById,
    findManyBy,
  };
};
