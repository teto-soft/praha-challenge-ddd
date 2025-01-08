import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type SetTaskDoneUseCaseInput = {
  taskId: string;
};

export type SetTaskDoneUseCasePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export class SetTaskDoneUseCaseNotFoundError extends Error {
  public override readonly name = "SetTaskDoneUseCaseNotFoundError";

  public constructor() {
    super("task not found");
  }
}

export class SetTaskDoneUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: SetTaskDoneUseCaseInput,
  ): Promise<SetTaskDoneUseCasePayload> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task) {
      throw new SetTaskDoneUseCaseNotFoundError();
    }

    task.makeAsDone();

    return await this.taskRepository.save(task);
  }
}
