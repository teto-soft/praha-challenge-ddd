import {err, type Result} from "neverthrow";
import {Task} from "../../domain/task/task";
import type {TaskRepositoryInterface} from "../../domain/task/task-repository";
import {createIsDone} from "../../domain/value-objects/isDone";
import {createId} from "../../domain/value-objects/id";
import {EditTaskTitleUseCaseNotFoundError} from "./edit-task-title-use-case";

export type SetTaskDoneUseCaseInput = {
  taskId: string;
};

export type SetTaskDoneUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export class SetTaskDoneUseCaseNotFoundError extends Error {
  public constructor(message: string) {
    super(`TaskNotFound: ${message}`);
    this.name = "SetTaskDoneUseCaseNotFoundError";
  }
}

export class SetTaskDoneUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: SetTaskDoneUseCaseInput,
  ): Promise<
    Result<SetTaskDoneUseCasePayload, SetTaskDoneUseCaseNotFoundError>
  > {
    const taskId = createId(input.taskId);
    if (taskId.isErr()) {
      return err(new EditTaskTitleUseCaseNotFoundError(taskId.error.message));
    }

    const foundTaskResult = await this.taskRepository.findById(taskId.value);
    if (foundTaskResult.isErr()) {
      return err(
        new SetTaskDoneUseCaseNotFoundError(foundTaskResult.error.message),
      );
    }

    if (typeof foundTaskResult.value === "undefined") {
      return err(new SetTaskDoneUseCaseNotFoundError("Task not found"));
    }

    const doneTaskResult = Task.reconstruct({
      ...foundTaskResult.value,
      isDone: createIsDone(true),
    });
    if (doneTaskResult.isErr()) {
      return err(
        new SetTaskDoneUseCaseNotFoundError(doneTaskResult.error.message),
      );
    }

    return await this.taskRepository.save(doneTaskResult.value);
  }
}
