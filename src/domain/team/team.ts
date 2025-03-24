import type {Result} from "neverthrow";
import {createId, type Id, type InvalidIdError} from "../value-objects/id";
import {createTeamName, type InvalidTeamNameError, type TeamName} from "../value-objects/teamName";

export type ITeam = Readonly<{
  id: Id;
  name: TeamName;
}>;

type CreateTeamProps = Readonly<{
  name: string;
}>;

type ReconstructTeamProps = Readonly<{
  id: string;
  name: string;
}>;

export type TeamError = InvalidIdError | InvalidTeamNameError;

export const Team = {
  create: (props: CreateTeamProps): Result<ITeam, TeamError> =>
    createId().andThen((id) =>
      createTeamName(props.name).map((name) => ({
        id,
        name,
      })),
    ),
  reconstruct: (props: ReconstructTeamProps): Result<ITeam, TeamError> =>
    createId(props.id).andThen((id) =>
      createTeamName(props.name).map((name) => ({
        id,
        name,
      })),
    ),
};
