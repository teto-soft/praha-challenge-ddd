import { Task } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

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
  public override readonly name = "EditTaskTitleUseCaseNotFoundError";

  public constructor() {
    super("task not found");
  }
}

export class EditTaskTitleUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: EditTaskTitleUseCaseInput,
  ): Promise<EditTaskTitleUseCasePayload> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task) {
      throw new EditTaskTitleUseCaseNotFoundError();
    }

    const editedTask = Task.reconstruct({
      ...task,
      title: input.title,
    });

    return await this.taskRepository.save(editedTask);
  }
}
