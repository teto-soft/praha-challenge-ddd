import type {Result} from "neverthrow";
import {createId, type Id, type InvalidIdError} from "../../value-objects/id";
import {createName, type InvalidNameError, type Name,} from "../../value-objects/name";
import type {Email} from "../../value-objects/email";
import {createEmail} from "../../value-objects/email";
import type {EnrollmentStatus} from "../../value-objects/participant/enrollmentStatus";
import {createEnrollmentStatus} from "../../value-objects/participant/enrollmentStatus";

export type IParticipant = Readonly<{
  id: Id;
  name: Name;
  email: Email;
  enrollmentStatus: EnrollmentStatus;
}>;

type CreateParticipantProps = Readonly<{
  name: string;
  email: string;
  enrollmentStatus: string;
}>;

type ReconstructParticipantProps = Readonly<{
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
}>;

export type ParticipantError = InvalidIdError | InvalidNameError;

export const Participant = {
  create: (
    props: CreateParticipantProps,
  ): Result<IParticipant, ParticipantError> => {
    return createId().andThen((id) =>
      createName(props.name).andThen((name) =>
        createEmail(props.email).andThen((email) =>
          createEnrollmentStatus(props.enrollmentStatus).map(
            (enrollmentStatus) => ({
              id,
              name,
              email,
              enrollmentStatus,
            }),
          ),
        ),
      ),
    );
  },
  reconstruct: (
    props: ReconstructParticipantProps,
  ): Result<IParticipant, ParticipantError> => {
    return createId(props.id).andThen((id) =>
      createName(props.name).andThen((name) =>
        createEmail(props.email).andThen((email) =>
          createEnrollmentStatus(props.enrollmentStatus).map(
            (enrollmentStatus) => ({
              id,
              name,
              email,
              enrollmentStatus,
            }),
          ),
        ),
      ),
    );
  },
};
