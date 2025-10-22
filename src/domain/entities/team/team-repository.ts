import type {Result} from "neverthrow";
import type {ITeam} from "./team";

export type TeamRepositoryInterface = {
  list: () => Promise<Result<ITeam[], TeamRepositoryListError>>;
  findById: (
    id: ITeam["id"],
  ) => Promise<Result<ITeam, TeamRepositoryFindByIdError>>;
  create: (team: ITeam) => Promise<Result<ITeam, TeamRepositoryCreateError>>;
  update: (
    id: ITeam["id"],
    team: Partial<Omit<ITeam, "id">>,
  ) => Promise<Result<ITeam, TeamRepositoryUpdateError>>;
  delete: (
    id: ITeam["id"],
  ) => Promise<Result<void, TeamRepositoryDeleteError>>;
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

export class TeamRepositoryFindByIdError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryFindByIdError";
  }
}

export class TeamRepositoryCreateError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryCreateError";
  }
}

export class TeamRepositoryUpdateError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryUpdateError";
  }
}

export class TeamRepositoryDeleteError extends TeamRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "TeamRepositoryDeleteError";
  }
}
