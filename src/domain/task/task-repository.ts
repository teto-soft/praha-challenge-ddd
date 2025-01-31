import type { Result } from "neverthrow";
import type { ITask, TaskError } from "./task";

export type TaskRepositoryInterface = {
  save: (task: ITask) => Promise<ITask>;
  findById(id: string): Promise<Result<ITask, TaskError> | undefined>;
};
