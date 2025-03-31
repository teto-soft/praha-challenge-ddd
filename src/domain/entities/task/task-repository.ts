import type {Result} from "neverthrow";
import type {ITask} from "./task";

export type TaskRepositoryInterface = {
  save: (task: ITask) => Promise<Result<ITask, TaskRepositorySaveError>>;
  findById(
    id: ITask["id"],
  ): Promise<Result<ITask, TaskRepositoryFindByIdError>>;
  findManyBy(
    _?: Partial<Omit<ITask, "id">>,
  ): Promise<Result<ITask[], TaskRepositoryFindManyByError>>;
};

export class TaskRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositoryError";
  }
}

export class TaskRepositoryFindByIdError extends TaskRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositoryFindByIdError";
  }
}

export class TaskRepositorySaveError extends TaskRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositorySaveError";
  }
}

export class TaskRepositoryFindManyByError extends TaskRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRepositoryFindManyByError";
  }
}
