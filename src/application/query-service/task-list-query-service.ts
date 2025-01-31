export type TaskListQueryServicePayload = Array<{
  id: string;
  title: string;
  isDone: boolean;
}>;

export interface TaskListQueryServiceInterface {
  invoke: () => Promise<TaskListQueryServicePayload>;
}
