import {err, type Result} from "neverthrow";
import type {TaskRepositoryInterface} from "../../domain/entities/task/task-repository";

type FindManyTasksUseCasePayload = {
  id: string;
  title: string;
  body: string;
};

class FindManyTasksUseCaseError extends Error {
  public constructor(message: string) {
    super(`FindManyTasksUseCaseError: ${message}`);
    this.name = "FindManyTasksUseCaseError";
  }
}

export class FindManyTasksUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(): Promise<
    Result<FindManyTasksUseCasePayload[], FindManyTasksUseCaseError>
  > {
    const foundTaskResult = await this.taskRepository.findManyBy();
    if (foundTaskResult.isErr()) {
      return err(new FindManyTasksUseCaseError(foundTaskResult.error.message));
    }

    return foundTaskResult;
  }
}
