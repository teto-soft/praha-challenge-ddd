import {err, type Result} from "neverthrow";
import type {TaskRepositoryInterface} from "../../domain/task/task-repository";
import {createIsDone} from "../../domain/value-objects/isDone";

export type FindManyTasksUseCaseInput = {
  filter: string | undefined;
};

export type FindManyTasksUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export class FindManyTasksUseCaseError extends Error {
  public constructor(message: string) {
    super(`FindManyTasksUseCaseError: ${message}`);
    this.name = "FindManyTasksUseCaseError";
  }
}

export class FindManyTasksUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: FindManyTasksUseCaseInput,
  ): Promise<Result<FindManyTasksUseCasePayload[], FindManyTasksUseCaseError>> {
    if (input.filter === "todo") {
      const isNotDone = createIsDone(false);

      const foundTaskResult = await this.taskRepository.findManyBy({
        isDone: isNotDone,
      });
      if (foundTaskResult.isErr()) {
        return err(
          new FindManyTasksUseCaseError(foundTaskResult.error.message),
        );
      }
      return foundTaskResult;
    }

    const foundTaskResult = await this.taskRepository.findManyBy();
    if (foundTaskResult.isErr()) {
      return err(new FindManyTasksUseCaseError(foundTaskResult.error.message));
    }

    return foundTaskResult;
  }
}
