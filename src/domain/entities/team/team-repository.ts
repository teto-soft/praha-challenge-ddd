import type {Result} from "neverthrow";
import type {ITeam} from "./team";

export type TeamRepositoryInterface = {
  list: () => Promise<Result<ITeam[], TeamRepositoryListError>>;
  update: (id: ITeam["id"], team: Partial<Omit<ITeam, "id">>) => Promise<Result<ITeam, TeamRepositoryError>>;
};

export class TeamRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryError";
  }
}

export class TeamRepositoryListError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryListError";
  }
}

export class TeamRepositoryUpdateError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryUpdateError";
  }
}