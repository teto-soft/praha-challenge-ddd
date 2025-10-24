import {err, ok, type Result} from "neverthrow";
import {createId} from "../../../domain/value-objects/id";
import {type TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import type {TeamUseCasePayload} from "./team-use-case-types";
import {toTeamUseCasePayload} from "./team-use-case-types";

type FindTeamByIdUseCaseInput = {
  id: string;
};

export class FindTeamByIdUseCaseError extends Error {
  public constructor(message: string) {
    super(`FindTeamByIdUseCaseError: ${message}`);
    this.name = "FindTeamByIdUseCaseError";
  }
}

export class FindTeamByIdUseCase {
  public constructor(
    private readonly teamRepository: TeamRepositoryInterface,
  ) {}

  public async invoke(
    input: FindTeamByIdUseCaseInput,
  ): Promise<Result<TeamUseCasePayload, FindTeamByIdUseCaseError>> {
    const teamIdResult = createId(input.id);
    if (teamIdResult.isErr()) {
      return err(new FindTeamByIdUseCaseError(teamIdResult.error.message));
    }

    const teamResult = await this.teamRepository.findById(teamIdResult.value);
    if (teamResult.isErr()) {
      return err(
        new FindTeamByIdUseCaseError(teamResult.error.message),
      );
    }

    return ok(toTeamUseCasePayload(teamResult.value));
  }
}
