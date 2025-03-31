import type {Result} from "neverthrow";
import {createId, type Id, type InvalidIdError} from "../../value-objects/id";
import {createTitle, type InvalidTitleError, type Title,} from "../../value-objects/title";
import {type Body, createBody} from "../../value-objects/body";

export type ITask = Readonly<{
  id: Id;
  title: Title;
  body: Body;
}>;

type CreateTaskProps = Readonly<{
  title: string;
  body: string;
}>;

type ReconstructTaskProps = Readonly<{
  id: string;
  title: string;
  body: string;
}>;

export type TaskError = InvalidIdError | InvalidTitleError;

export const Task = {
  create: (props: CreateTaskProps): Result<ITask, TaskError> => {
    return createId().andThen((id) =>
      createTitle(props.title).andThen((title) =>
        createBody(props.body).map((body) => ({
          id,
          title,
          body,
        })),
      ),
    );
  },
  reconstruct: (props: ReconstructTaskProps): Result<ITask, TaskError> => {
    return createId(props.id).andThen((id) =>
      createTitle(props.title).andThen((title) =>
        createBody(props.body).map((body) => ({
          id,
          title,
          body,
        })),
      ),
    );
  },
};
