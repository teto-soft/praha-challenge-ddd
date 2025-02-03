import type { Result } from "neverthrow";
import { Task, type TaskError } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type CreateTaskUseCaseInput = {
  title: string;
};

export type CreateTaskUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
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
      isDone: false,
    });

    if (taskResult.isErr()) {
      return taskResult;
    }

    return await this.taskRepository.save(taskResult.value);
  }
}
