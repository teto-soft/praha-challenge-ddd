import { Result } from "neverthrow";
import { createTitle, InvalidTitleError, Title } from "../value-objects/title";
import { createId, Id, InvalidIdError } from "../value-objects/id";
import { createIsDone, IsDone } from "../value-objects/isDone";

type ITask = Readonly<{
  id: Id;
  title: Title;
  isDone: IsDone;
}>;

type CreateTaskProps = Readonly<{
  title: string;
  isDone: boolean;
}>;

type ReconstructTaskProps = Readonly<{
  id: string;
  title: string;
  isDone: boolean;
}>;

type TaskError = InvalidIdError | InvalidTitleError;

export const Task = {
  create: (props: CreateTaskProps): Result<ITask, TaskError> => {
    return createId().andThen((id) =>
      createTitle(props.title).map((title) => ({
        id,
        title,
        isDone: createIsDone(props.isDone),
      })),
    );
  },
  reconstruct: (props: ReconstructTaskProps): Result<ITask, TaskError> => {
    return createId(props.id).andThen((id) =>
      createTitle(props.title).map((title) => ({
        id,
        title,
        isDone: createIsDone(props.isDone),
      })),
    );
  },
  toggleDone: (task: ITask): ITask => ({
    ...task,
    isDone: createIsDone(!task.isDone),
  }),
  updateTitle: (task: ITask, newTitle: string): Result<ITask, TaskError> =>
    createTitle(newTitle).map((title) => ({
      ...task,
      title,
    })),
};
