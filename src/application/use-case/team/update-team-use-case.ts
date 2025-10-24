import {err, ok, Result} from "neverthrow";
import {createId} from "../../../domain/value-objects/id";
import {createName} from "../../../domain/value-objects/name";
import {Participant} from "../../../domain/entities/participant/participant";
import {TeamParticipants} from "../../../domain/entities/team/team-participants";
import type {ITeam} from "../../../domain/entities/team/team";
import {type TeamRepositoryInterface,} from "../../../domain/entities/team/team-repository";
import type {TeamUseCasePayload} from "./team-use-case-types";
import {toTeamUseCasePayload} from "./team-use-case-types";

const createUpdatePayload = (
  input: UpdateTeamUseCaseInput,
): Result<Partial<Omit<ITeam, "id">>, UpdateTeamUseCaseError> => {
  const nameResult =
    typeof input.name === "undefined"
      ? ok<ITeam["name"] | undefined, UpdateTeamUseCaseError>(undefined)
      : createName(input.name).mapErr(
          (error) => new UpdateTeamUseCaseError(error.message),
        );

  if (nameResult.isErr()) {
    return err(nameResult.error);
  }

  const participantAggregate =
    typeof input.participants === "undefined"
      ? ok<ITeam["participants"] | undefined, UpdateTeamUseCaseError>(
          undefined,
        )
      : Result.combine(
          input.participants.map((participant) =>
            Participant.reconstruct({
              id: participant.id,
              name: participant.name,
              email: participant.email,
              enrollmentStatus: participant.enrollmentStatus,
            }).mapErr(
              (error) => new UpdateTeamUseCaseError(error.message),
            ),
          ),
        ).andThen((participants) =>
          TeamParticipants.reconstruct(participants).mapErr(
            (error) => new UpdateTeamUseCaseError(error.message),
          ),
        );

  if (participantAggregate.isErr()) {
    return err(participantAggregate.error);
  }

  const updatePayload: Partial<Omit<ITeam, "id">> = {
    ...(typeof nameResult.value === "undefined"
      ? {}
      : { name: nameResult.value }),
    ...(typeof participantAggregate.value === "undefined"
      ? {}
      : { participants: participantAggregate.value }),
  };

  return ok(updatePayload);
};

type UpdateTeamUseCaseParticipantInput = {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
};

type UpdateTeamUseCaseInput = {
  id: string;
  name?: string;
  participants?: UpdateTeamUseCaseParticipantInput[];
};

export class UpdateTeamUseCaseError extends Error {
  public constructor(message: string) {
    super(`UpdateTeamUseCaseError: ${message}`);
    this.name = "UpdateTeamUseCaseError";
  }
}

export class UpdateTeamUseCase {
  public constructor(
    private readonly teamRepository: TeamRepositoryInterface,
  ) {}

  public async invoke(
    input: UpdateTeamUseCaseInput,
  ): Promise<Result<TeamUseCasePayload, UpdateTeamUseCaseError>> {
    const teamIdResult = createId(input.id);
    if (teamIdResult.isErr()) {
      return err(new UpdateTeamUseCaseError(teamIdResult.error.message));
    }

    const updatePayloadResult = createUpdatePayload(input);
    if (updatePayloadResult.isErr()) {
      return err(updatePayloadResult.error);
    }

    const updateResult = await this.teamRepository.update(
      teamIdResult.value,
      updatePayloadResult.value,
    );

    if (updateResult.isErr()) {
      return err(new UpdateTeamUseCaseError(updateResult.error.message));
    }

    return ok(toTeamUseCasePayload(updateResult.value));
  }
}
