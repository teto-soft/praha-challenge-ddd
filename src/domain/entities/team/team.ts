import {Result} from "neverthrow";
import {createId, type Id} from "../../value-objects/id";
import {createName, type Name} from "../../value-objects/name";
import {Participant} from "../participant/participant";
import type {TeamError} from "./team-error";
import {TeamParticipants} from "./team-participants";

export type ITeam = Readonly<{
  id: Id;
  name: Name;
  participants: TeamParticipants;
}>;

type PlainParticipant = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly enrollmentStatus: string;
};

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
        const participantResults = Result.combine(
          props.participants.map(Participant.create),
        );

        return participantResults.andThen((createdParticipants) =>
          TeamParticipants.create(createdParticipants).map((participants) => ({
            id,
            name,
            participants,
          })),
        );
      }),
    );
  },
  reconstruct: (props: ReconstructTeamProps): Result<ITeam, TeamError> => {
    return createId(props.id).andThen((id) =>
      createName(props.name).andThen((name) => {
        const participantResults = Result.combine(
          props.participants.map(Participant.reconstruct),
        );

        return participantResults.andThen((reconstructedParticipants) =>
          TeamParticipants.reconstruct(reconstructedParticipants).map(
            (participants) => ({
              id,
              name,
              participants,
            }),
          ),
        );
      }),
    );
  },
};
