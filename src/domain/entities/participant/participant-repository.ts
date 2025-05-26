import type {Result} from "neverthrow";
import type {IParticipant} from "./participant";

export type ParticipantRepositoryInterface = {
  save: (
    participant: IParticipant,
  ) => Promise<Result<IParticipant, ParticipantRepositorySaveError>>;
  findManyBy(
    _?: Partial<Omit<IParticipant, "id">>,
  ): Promise<Result<IParticipant[], ParticipantRepositoryFindManyByError>>;
  update(
    id: IParticipant["id"],
    participant: Partial<Omit<IParticipant, "id">>,
  ): Promise<Result<IParticipant, ParticipantRepositoryUpdateError>>;
};

export class ParticipantRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParticipantRepositoryError";
  }
}

export class ParticipantRepositoryUpdateError extends ParticipantRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "ParticipantRepositoryUpdateError";
  }
}

export class ParticipantRepositorySaveError extends ParticipantRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "ParticipantRepositorySaveError";
  }
}

export class ParticipantRepositoryFindManyByError extends ParticipantRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "ParticipantRepositoryFindManyByError";
  }
}
