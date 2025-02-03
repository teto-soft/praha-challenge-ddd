import type { Result } from "neverthrow";
import type { ITask } from "./task";

export type TaskRepositoryInterface = {
  save: (task: ITask) => Promise<Result<ITask, TaskRepositorySaveError>>;
  findById(
    id: string,
  ): Promise<Result<ITask | undefined, TaskRepositoryNotFoundError>>;
};

export class TaskRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositoryError";
  }
}

export class TaskRepositoryNotFoundError extends TaskRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositoryNotFoundError";
  }
}

export class TaskRepositorySaveError extends TaskRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositorySaveError";
  }
}
