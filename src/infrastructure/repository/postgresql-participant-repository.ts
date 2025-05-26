import type {Database} from "../../libs/drizzle/get-database";
import {
  ParticipantRepositoryFindManyByError,
  type ParticipantRepositoryInterface,
  ParticipantRepositorySaveError,
  ParticipantRepositoryUpdateError,
} from "../../domain/entities/participant/participant-repository";
import {err, Result} from "neverthrow";
import {and, eq, type SQL, sql} from "drizzle-orm";
import {participants,} from "../../libs/drizzle/schema";
import {type IParticipant, Participant} from "../../domain/entities/participant/participant";

export const createPostgresqlParticipantRepository = (
  database: Database,
): ParticipantRepositoryInterface => {
  async function save(
    participant: IParticipant,
  ): Promise<Result<IParticipant, ParticipantRepositorySaveError>> {
    return database
      .insert(participants)
      .values(participant)
      .onConflictDoUpdate(createSaveOnConflictDoUpdateParams())
      .returning({
        id: participants.id,
        name: participants.name,
        email: participants.email,
        enrollmentStatus: participants.enrollmentStatus,
      })
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(
            new ParticipantRepositorySaveError("Failed to save a participant"),
          );
        }
        return Participant.reconstruct(row).mapErr(
          (error) => new ParticipantRepositorySaveError(error.message),
        );
      })
      .catch((error) =>
        err(
          new ParticipantRepositorySaveError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  async function findManyBy(
    participant?: Partial<Omit<IParticipant, "id">>,
  ): Promise<Result<IParticipant[], ParticipantRepositoryFindManyByError>> {
    const conditions = createConditions(participant);

    return database
      .select()
      .from(participants)
      .where(and(...conditions))
      .then((rows) => rows.map(Participant.reconstruct))
      .then((participants) => Result.combine(participants))
      .then((participants) =>
        participants.mapErr(
          (error) => new ParticipantRepositoryFindManyByError(error.message),
        ),
      )
      .catch((error) =>
        err(
          new ParticipantRepositoryFindManyByError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  async function update(
    id: IParticipant["id"],
    participant: Partial<Omit<IParticipant, "id">>,
  ): Promise<Result<IParticipant, ParticipantRepositoryUpdateError>> {
    return database
      .update(participants)
      .set(participant)
      .where(eq(participants.id, id))
      .returning()
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(
            new ParticipantRepositoryUpdateError("Participant not found"),
          );
        }
        return Participant.reconstruct(row);
      })
      .then((participants) =>
        participants.mapErr(
          (error) => new ParticipantRepositoryUpdateError(error.message),
        ),
      )
      .catch((error) =>
        err(
          new ParticipantRepositoryUpdateError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  return { save, findManyBy, update };
};

const createConditions = (participant?: Partial<IParticipant>): SQL[] => {
  if (!participant) return [];

  return Object.entries(participant)
    .filter(
      (
        entry,
      ): entry is [keyof IParticipant, IParticipant[keyof IParticipant]] => {
        const [key, value] = entry;
        return value !== null && key in participants;
      },
    )
    .map(([key, value]) => eq(participants[key], value));
};

const createSaveOnConflictDoUpdateParams = () => {
  const { id, ...rest } = participants;
  const set = Object.fromEntries(
    Object.entries(rest).map(([key]) => [key, sql.raw(`excluded.${key}`)]),
  );

  return { target: id, set };
};
