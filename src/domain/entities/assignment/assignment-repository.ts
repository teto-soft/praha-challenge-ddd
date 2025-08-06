import type {Result} from "neverthrow";
import type {IAssignment} from "./assignment";

export type AssignmentRepositoryInterface = {
  save: (
    assignment: IAssignment,
  ) => Promise<Result<IAssignment, AssignmentRepositorySaveError>>;
  findManyBy(
    _?: Partial<Omit<IAssignment, "id">>,
  ): Promise<Result<IAssignment[], AssignmentRepositoryFindManyByError>>;
  update(
    id: IAssignment["id"],
    assignment: Partial<Omit<IAssignment, "id">>,
  ): Promise<Result<IAssignment, AssignmentRepositoryUpdateError>>;
};

export class AssignmentRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentRepositoryError";
  }
}

export class AssignmentRepositoryUpdateError extends AssignmentRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentRepositoryUpdateError";
  }
}

export class AssignmentRepositorySaveError extends AssignmentRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentRepositorySaveError";
  }
}

export class AssignmentRepositoryFindManyByError extends AssignmentRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentRepositoryFindManyByError";
  }
}
