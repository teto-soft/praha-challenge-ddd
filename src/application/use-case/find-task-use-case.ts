import {err, type Result} from "neverthrow";
import type {TaskRepositoryInterface} from "../../domain/task/task-repository";
import {createId} from "../../domain/value-objects/id";

export type FindTaskUseCaseInput = {
  id: string;
};

export type FindTaskUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export class FindTaskUseCaseError extends Error {
  public constructor(message: string) {
    super(`FindTaskUseCaseError: ${message}`);
    this.name = "FindTaskUseCaseError";
  }
}

class FindTaskUseCaseNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "FindTaskUseCaseNotFoundError";
  }
}

export class FindTaskUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: FindTaskUseCaseInput,
  ): Promise<Result<FindTaskUseCasePayload, FindTaskUseCaseError>> {
    const taskId = createId(input.id);
    if (taskId.isErr()) {
      return err(new FindTaskUseCaseError(taskId.error.message));
    }

    const foundTaskResult = await this.taskRepository.findById(taskId.value);
    if (foundTaskResult.isErr()) {
      return err(new FindTaskUseCaseError(foundTaskResult.error.message));
    }

    if (typeof foundTaskResult === "undefined") {
      return err(new FindTaskUseCaseNotFoundError("Task not found"));
    }

    return foundTaskResult;
  }
}
