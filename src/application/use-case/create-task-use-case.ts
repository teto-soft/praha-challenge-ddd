import type {Result} from "neverthrow";
import {Task, type TaskError} from "../../domain/entities/task/task";
import type {TaskRepositoryInterface} from "../../domain/entities/task/task-repository";

type CreateTaskUseCaseInput = {
  title: string;
  body: string;
};

type CreateTaskUseCasePayload = {
  id: string;
  title: string;
  body: string;
};

export class CreateTaskUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: CreateTaskUseCaseInput,
  ): Promise<Result<CreateTaskUseCasePayload, TaskError>> {
    const taskResult = Task.create({
      title: input.title,
      body: input.body,
    });

    if (taskResult.isErr()) {
      return taskResult;
    }

    return await this.taskRepository.save(taskResult.value);
  }
}
