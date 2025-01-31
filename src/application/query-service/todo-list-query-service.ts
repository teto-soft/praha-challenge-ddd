export type TodoListQueryServicePayload = Array<{
  id: string;
  title: string;
  isDone: boolean;
}>;

export interface TodoListQueryServiceInterface {
  invoke: () => Promise<TodoListQueryServicePayload>;
}
