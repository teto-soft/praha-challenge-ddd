import {err, ok, type Result} from "neverthrow";
import type {IParticipant} from "../participant/participant";
import {TeamValidationError} from "./team-error";
import type {StripAllBrands} from "../../value-objects/types/type";

export class TeamParticipants {
  private readonly participants: IParticipant[];

  private constructor(participants: IParticipant[]) {
    this.participants = participants;
  }

  static create(
    participants: IParticipant[],
  ): Result<TeamParticipants, TeamValidationError> {
    const validation = TeamParticipants.validate(participants);
    if (validation.isErr()) {
      return err(validation.error);
    }

    return ok(new TeamParticipants(participants));
  }

  static reconstruct(
    participants: IParticipant[],
  ): Result<TeamParticipants, TeamValidationError> {
    return TeamParticipants.create(participants);
  }

  private static validate(
    participants: IParticipant[],
  ): Result<void, TeamValidationError> {
    const length = participants.length;
    if (length < 2 || length > 4) {
      return err(
        new TeamValidationError(
          `チームの参加者は2人以上4人以下でなければなりません。 現在の参加者数: ${length}`,
        ),
      );
    }

    const emailSet = new Set<string>();
    for (const participant of participants) {
      if (emailSet.has(participant.email)) {
        return err(
          new TeamValidationError(
            `同じメールアドレスの参加者が複数存在します: ${participant.email}`,
          ),
        );
      }
      emailSet.add(participant.email);
    }

    return ok(undefined);
  }

  get value(): readonly IParticipant[] {
    return [...this.participants];
  }

  get length(): number {
    return this.participants.length;
  }

  add(
    participant: IParticipant,
  ): Result<TeamParticipants, TeamValidationError> {
    const newParticipants = [...this.participants, participant];
    return TeamParticipants.create(newParticipants);
  }

  remove(participantId: string): Result<TeamParticipants, TeamValidationError> {
    const newParticipants = this.participants.filter(
      (p) => p.id !== participantId,
    );
    return TeamParticipants.create(newParticipants);
  }

  contains(participantId: string): boolean {
    return this.participants.some((p) => p.id === participantId);
  }

  findByEmail(email: string): IParticipant | undefined {
    return this.participants.find((p) => p.email === email);
  }

  /**
   * 永続化層でのみ使用するメソッド
   * ドメインオブジェクトをプレーンオブジェクトに変換して返す
   *
   * @internal このメソッドはリポジトリ層でのみ使用してください
   */
  forPersistence(): StripAllBrands<IParticipant>[] {
    return this.participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      enrollmentStatus: p.enrollmentStatus,
    }));
  }
}
