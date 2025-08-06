import type {Database} from "../../libs/drizzle/get-database";
import {
  AssignmentRepositoryFindManyByError,
  type AssignmentRepositoryInterface,
  AssignmentRepositorySaveError,
  AssignmentRepositoryUpdateError,
} from "../../domain/entities/assignment/assignment-repository";
import {err, Result} from "neverthrow";
import {and, eq, type SQL, sql} from "drizzle-orm";
import {assignments,} from "../../libs/drizzle/schema";
import {Assignment, type IAssignment} from "../../domain/entities/assignment/assignment";

export const createPostgresqlAssignmentRepository = (
  database: Database,
): AssignmentRepositoryInterface => {
  async function save(
    assignment: IAssignment,
  ): Promise<Result<IAssignment, AssignmentRepositorySaveError>> {
    return database
      .insert(assignments)
      .values(assignment)
      .onConflictDoUpdate(createSaveOnConflictDoUpdateParams())
      .returning({
        id: assignments.id,
        taskId: assignments.taskId,
        participantId: assignments.participantId,
        progressStatus: assignments.progressStatus,
      })
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(
            new AssignmentRepositorySaveError("Failed to save a assignment"),
          );
        }

        return Assignment.reconstruct(row).mapErr(
          (error) => new AssignmentRepositorySaveError(error.message),
        );
      })
      .catch((error) =>
        err(
          new AssignmentRepositorySaveError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  async function findManyBy(
    assignment?: Partial<Omit<IAssignment, "id">>,
  ): Promise<Result<IAssignment[], AssignmentRepositoryFindManyByError>> {
    const conditions = createConditions(assignment);

    return database
      .select()
      .from(assignments)
      .where(and(...conditions))
      .then((rows) => rows.map(Assignment.reconstruct))
      .then((assignments) => Result.combine(assignments))
      .then((assignments) =>
        assignments.mapErr(
          (error) => new AssignmentRepositoryFindManyByError(error.message),
        ),
      )
      .catch((error) =>
        err(
          new AssignmentRepositoryFindManyByError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  async function update(
    id: IAssignment["id"],
    assignment: Partial<Omit<IAssignment, "id">>,
  ): Promise<Result<IAssignment, AssignmentRepositoryUpdateError>> {
    return database
      .update(assignments)
      .set(assignment)
      .where(eq(assignments.id, id))
      .returning()
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(
            new AssignmentRepositoryUpdateError("Assignment not found"),
          );
        }
        return Assignment.reconstruct(row);
      })
      .then((assignments) =>
        assignments.mapErr(
          (error) => new AssignmentRepositoryUpdateError(error.message),
        ),
      )
      .catch((error) =>
        err(
          new AssignmentRepositoryUpdateError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  return { save, findManyBy, update };
};

const createConditions = (assignment?: Partial<IAssignment>): SQL[] => {
  if (!assignment) return [];

  return Object.entries(assignment)
    .filter(
      (entry): entry is [keyof IAssignment, IAssignment[keyof IAssignment]] => {
        const [key, value] = entry;
        return value !== null && key in assignments;
      },
    )
    .map(([key, value]) => eq(assignments[key], value));
};

const createSaveOnConflictDoUpdateParams = () => {
  const { id, ...rest } = assignments;
  const set = Object.fromEntries(
    Object.entries(rest).map(([key]) => [key, sql.raw(`excluded.${key}`)]),
  );

  return { target: id, set };
};
