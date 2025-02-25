import {err, ok, type Result} from "neverthrow";
import {Task} from "../../domain/task/task";
import type {TaskRepositoryInterface} from "../../domain/task/task-repository";
import {createId} from "../../domain/value-objects/id";

export type EditTaskTitleUseCaseInput = {
  taskId: string;
  title: string;
};

export type EditTaskTitleUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export class EditTaskTitleUseCaseNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "EditTaskTitleUseCaseNotFoundError";
  }
}

export class EditTaskTitleUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: EditTaskTitleUseCaseInput,
  ): Promise<
    Result<
      EditTaskTitleUseCasePayload | undefined,
      EditTaskTitleUseCaseNotFoundError
    >
  > {
    const taskId = createId(input.taskId);
    if (taskId.isErr()) {
      return err(new EditTaskTitleUseCaseNotFoundError(taskId.error.message));
    }

    const foundTaskResult = await this.taskRepository.findById(taskId.value);
    if (foundTaskResult.isErr()) {
      return err(
        new EditTaskTitleUseCaseNotFoundError(foundTaskResult.error.message),
      );
    }

    if (typeof foundTaskResult.value === "undefined") {
      return ok(foundTaskResult.value);
    }

    const editedTaskResult = Task.reconstruct({
      ...foundTaskResult.value,
      title: input.title,
    });

    if (editedTaskResult.isErr()) {
      return editedTaskResult;
    }

    return await this.taskRepository.save(editedTaskResult.value);
  }
}
