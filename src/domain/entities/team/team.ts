import {err, ok, Result} from "neverthrow";
import {createId, type Id} from "../../value-objects/id";
import {createName, type Name} from "../../value-objects/name";
import {type IParticipant, Participant} from "../participant/participant";
import type {StripAllBrands} from "../../value-objects/types/type";
import {type TeamError, TeamValidationError} from "./team-error";

export type ITeam = Readonly<{
  id: Id;
  name: Name;
  participants: IParticipant[];
}>;

type PlainParticipant = StripAllBrands<IParticipant>;

type CreateTeamProps = Readonly<{
  name: string;
  participants: Omit<PlainParticipant, "id">[];
}>;

type ReconstructTeamProps = Readonly<{
  id: string;
  name: string;
  participants: PlainParticipant[];
}>;

export const Team = {
  create: (props: CreateTeamProps): Result<ITeam, TeamError> => {
    return createId().andThen((id) =>
      createName(props.name).andThen((name) => {
        const validatedParticipants = validateParticipants(props.participants);
        if (validatedParticipants.isErr()) {
          return err(validatedParticipants.error);
        }

        const participantResults = Result.combine(
          validatedParticipants.value.map(Participant.create),
        );

        return participantResults.map((participants) => ({
          id,
          name,
          participants,
        }));
      }),
    );
  },
  reconstruct: (props: ReconstructTeamProps): Result<ITeam, TeamError> => {
    return createId(props.id).andThen((id) =>
      createName(props.name).andThen((name) => {
        const validatedParticipants = validateParticipants(props.participants);
        if (validatedParticipants.isErr()) {
          return err(validatedParticipants.error);
        }

        const participantResults = Result.combine(
          validatedParticipants.value.map(Participant.reconstruct),
        );

        return participantResults.map((participants) => ({
          id,
          name,
          participants,
        }));
      }),
    );
  },
};

const validateParticipants = <
  T extends PlainParticipant | Omit<PlainParticipant, "id">,
>(
  participants: T[],
): Result<T[], TeamValidationError> => {
  const length = participants.length;
  if (length < 2 || length > 4) {
    return err(
      new TeamValidationError(
        `チームの参加者は2人以上4人以下でなければなりません。 現在の参加者数: ${length}`,
      ),
    );
  }
  return ok(participants);
};
