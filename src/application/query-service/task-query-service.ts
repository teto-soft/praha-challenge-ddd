export type TaskQueryServiceInput = {
  id: string;
};

export type TaskQueryServicePayload = {
  id: string;
  title: string;
  isDone: boolean;
};

export interface TaskQueryServiceInterface {
  invoke: (
    input: TaskQueryServiceInput,
  ) => Promise<TaskQueryServicePayload | undefined>;
}
