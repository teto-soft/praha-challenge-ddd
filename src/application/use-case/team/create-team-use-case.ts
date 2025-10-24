import {err, ok, type Result} from "neverthrow";
import {Team} from "../../../domain/entities/team/team";
import {type TeamRepositoryInterface,} from "../../../domain/entities/team/team-repository";
import type {TeamUseCasePayload} from "./team-use-case-types";
import {toTeamUseCasePayload} from "./team-use-case-types";

type CreateTeamUseCaseParticipantInput = {
  name: string;
  email: string;
  enrollmentStatus: string;
};

type CreateTeamUseCaseInput = {
  name: string;
  participants: CreateTeamUseCaseParticipantInput[];
};

export class CreateTeamUseCaseError extends Error {
  public constructor(message: string) {
    super(`CreateTeamUseCaseError: ${message}`);
    this.name = "CreateTeamUseCaseError";
  }
}

export class CreateTeamUseCase {
  public constructor(
    private readonly teamRepository: TeamRepositoryInterface,
  ) {}

  public async invoke(
    input: CreateTeamUseCaseInput,
  ): Promise<Result<TeamUseCasePayload, CreateTeamUseCaseError>> {
    const teamResult = Team.create({
      name: input.name,
      participants: input.participants,
    });

    if (teamResult.isErr()) {
      return err(new CreateTeamUseCaseError(teamResult.error.message));
    }

    const persistenceResult = await this.teamRepository.create(
      teamResult.value,
    );
    if (persistenceResult.isErr()) {
      return err(new CreateTeamUseCaseError(persistenceResult.error.message));
    }

    return ok(toTeamUseCasePayload(persistenceResult.value));
  }
}
