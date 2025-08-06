import type {Result} from "neverthrow";
import {createId, type Id, type InvalidIdError} from "../../value-objects/id";
import type {InvalidNameError,} from "../../value-objects/name";
import {createProgressStatus, type ProgressStatus} from "../../value-objects/assignment/progressStatus";

export type IAssignment = Readonly<{
  id: Id;
  taskId: Id;
  participantId: Id;
  progressStatus: ProgressStatus;
}>;

type CreateAssignmentProps = Readonly<{
  taskId: string;
  participantId: string;
  progressStatus: string;
}>;

type ReconstructAssignmentProps = Readonly<{
  id: string;
  taskId: string;
  participantId: string;
  progressStatus: string;
}>;

export type AssignmentError = InvalidIdError | InvalidNameError;

export const Assignment = {
  create: (
    props: CreateAssignmentProps,
  ): Result<IAssignment, AssignmentError> => {
    return createId().andThen((id) =>
      createId(props.taskId).andThen((taskId) =>
        createId(props.participantId).andThen((participantId) =>
          createProgressStatus(props.progressStatus).map((progressStatus) => ({
            id,
            taskId,
            participantId,
            progressStatus,
          })),
        ),
      ),
    );
  },
  reconstruct: (
    props: ReconstructAssignmentProps,
  ): Result<IAssignment, AssignmentError> => {
    return createId(props.id).andThen((id) =>
      createId(props.taskId).andThen((taskId) =>
        createId(props.participantId).andThen((participantId) =>
          createProgressStatus(props.progressStatus).map((progressStatus) => ({
            id,
            taskId,
            participantId,
            progressStatus,
          })),
        ),
      ),
    );
  },
};
