import {err, ok, type Result} from "neverthrow";
import {createId} from "../../../domain/value-objects/id";
import {type TeamRepositoryInterface,} from "../../../domain/entities/team/team-repository";

type DeleteTeamUseCaseInput = {
  id: string;
};

export class DeleteTeamUseCaseError extends Error {
  public constructor(message: string) {
    super(`DeleteTeamUseCaseError: ${message}`);
    this.name = "DeleteTeamUseCaseError";
  }
}

export class DeleteTeamUseCase {
  public constructor(
    private readonly teamRepository: TeamRepositoryInterface,
  ) {}

  public async invoke(
    input: DeleteTeamUseCaseInput,
  ): Promise<Result<void, DeleteTeamUseCaseError>> {
    const teamIdResult = createId(input.id);
    if (teamIdResult.isErr()) {
      return err(new DeleteTeamUseCaseError(teamIdResult.error.message));
    }

    const deleteResult = await this.teamRepository.delete(teamIdResult.value);
    if (deleteResult.isErr()) {
      return err(new DeleteTeamUseCaseError(deleteResult.error.message));
    }

    return ok(undefined);
  }
}
