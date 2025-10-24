import {err, ok, type Result} from "neverthrow";
import {type TeamRepositoryInterface,} from "../../../domain/entities/team/team-repository";
import type {TeamUseCasePayload} from "./team-use-case-types";
import {toTeamUseCasePayload} from "./team-use-case-types";

export class FindManyTeamsUseCaseError extends Error {
  public constructor(message: string) {
    super(`FindManyTeamsUseCaseError: ${message}`);
    this.name = "FindManyTeamsUseCaseError";
  }
}

export class FindManyTeamsUseCase {
  public constructor(
    private readonly teamRepository: TeamRepositoryInterface,
  ) {}

  public async invoke(): Promise<
    Result<TeamUseCasePayload[], FindManyTeamsUseCaseError>
  > {
    const teamsResult = await this.teamRepository.list();
    if (teamsResult.isErr()) {
      return err(
        new FindManyTeamsUseCaseError(teamsResult.error.message),
      );
    }

    const payload = teamsResult.value.map(toTeamUseCasePayload);
    return ok(payload);
  }
}
