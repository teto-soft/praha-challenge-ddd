import type {Database} from "../../libs/drizzle/get-database";
import {
  TeamRepositoryCreateError,
  TeamRepositoryDeleteError,
  TeamRepositoryFindByIdError,
  type TeamRepositoryInterface,
  TeamRepositoryListError,
  TeamRepositoryUpdateError,
} from "../../domain/entities/team/team-repository";
import {err, ok, Result} from "neverthrow";
import {type ITeam, Team} from "../../domain/entities/team/team";
import {participants, teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";
import type {StripAllBrands} from "../../domain/value-objects/types/type";
import type {IParticipant} from "../../domain/entities/participant/participant";

type ParticipantRow = typeof participants.$inferSelect;

const toPlainParticipants = (
  rows: ParticipantRow[],
): StripAllBrands<IParticipant>[] =>
  rows.map((participant) => ({
    id: participant.id,
    name: participant.name,
    email: participant.email,
    enrollmentStatus: participant.enrollmentStatus,
  })) as StripAllBrands<IParticipant>[];

export const createPostgresqlTeamRepository = (
  database: Database,
): TeamRepositoryInterface => {
  async function list(): Promise<Result<ITeam[], TeamRepositoryListError>> {
    try {
      const teamsData = await database.select().from(teams);

      const teamResults = await Promise.all(
        teamsData.map(async (teamRow) => {
          const teamParticipantRows = await database
            .select()
            .from(participants)
            .where(eq(participants.teamId, teamRow.id));

          return Team.reconstruct({
            id: teamRow.id,
            name: teamRow.name,
            participants: toPlainParticipants(teamParticipantRows),
          });
        }),
      );

      return Result.combine(teamResults).mapErr(
        (error) => new TeamRepositoryListError(error.message),
      );
    } catch (error) {
      return err(
        new TeamRepositoryListError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  async function findById(
    id: ITeam["id"],
  ): Promise<Result<ITeam, TeamRepositoryFindByIdError>> {
    try {
      const teamRows = await database
        .select()
        .from(teams)
        .where(eq(teams.id, id));

      const teamRow = teamRows.at(0);
      if (!teamRow) {
        return err(new TeamRepositoryFindByIdError("Team not found"));
      }

      const teamParticipantRows = await database
        .select()
        .from(participants)
        .where(eq(participants.teamId, id));

      return Team.reconstruct({
        id: teamRow.id,
        name: teamRow.name,
        participants: toPlainParticipants(teamParticipantRows),
      }).mapErr((error) => new TeamRepositoryFindByIdError(error.message));
    } catch (error) {
      return err(
        new TeamRepositoryFindByIdError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  async function create(
    team: ITeam,
  ): Promise<Result<ITeam, TeamRepositoryCreateError>> {
    try {
      const result = await database.transaction(async (tx) => {
        await tx.insert(teams).values({
          id: team.id,
          name: team.name,
        });

        const participantsData = team.participants.forPersistence();
        if (participantsData.length > 0) {
          await tx.insert(participants).values(
            participantsData.map((participant) => ({
              ...participant,
              teamId: team.id,
            })),
          );
        }

        const createdTeamRows = await tx
          .select()
          .from(teams)
          .where(eq(teams.id, team.id));

        const createdTeamRow = createdTeamRows.at(0);
        if (!createdTeamRow) {
          return err(
            new TeamRepositoryCreateError("Team not found after creation"),
          );
        }

        const createdParticipantRows = await tx
          .select()
          .from(participants)
          .where(eq(participants.teamId, team.id));

        return Team.reconstruct({
          id: createdTeamRow.id,
          name: createdTeamRow.name,
          participants: toPlainParticipants(createdParticipantRows),
        }).mapErr((error) => new TeamRepositoryCreateError(error.message));
      });

      return result;
    } catch (error) {
      return err(
        new TeamRepositoryCreateError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  async function update(
    id: ITeam["id"],
    team: Partial<Omit<ITeam, "id">>,
  ): Promise<Result<ITeam, TeamRepositoryUpdateError>> {
    try {
      const result = await database.transaction(async (tx) => {
        const teamData = team.name ? { name: team.name } : {};

        const updatedTeamRows = await tx
          .update(teams)
          .set(teamData)
          .where(eq(teams.id, id))
          .returning();

        const updatedTeamRow = updatedTeamRows.at(0);
        if (!updatedTeamRow) {
          return err(new TeamRepositoryUpdateError("Team not found"));
        }

        if (team.participants) {
          await tx.delete(participants).where(eq(participants.teamId, id));

          const participantsData = team.participants.forPersistence();
          if (participantsData.length > 0) {
            await tx.insert(participants).values(
              participantsData.map((participant) => ({
                ...participant,
                teamId: id,
              })),
            );
          }
        }

        const updatedParticipantRows = await tx
          .select()
          .from(participants)
          .where(eq(participants.teamId, id));

        return Team.reconstruct({
          id: updatedTeamRow.id,
          name: updatedTeamRow.name,
          participants: toPlainParticipants(updatedParticipantRows),
        }).mapErr((error) => new TeamRepositoryUpdateError(error.message));
      });

      return result;
    } catch (error) {
      return err(
        new TeamRepositoryUpdateError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  async function remove(
    id: ITeam["id"],
  ): Promise<Result<void, TeamRepositoryDeleteError>> {
    try {
      const result = await database.transaction(async (tx) => {
        await tx.delete(participants).where(eq(participants.teamId, id));

        const deletedTeamRows = await tx
          .delete(teams)
          .where(eq(teams.id, id))
          .returning({ id: teams.id });

        if (deletedTeamRows.length === 0) {
          return err(new TeamRepositoryDeleteError("Team not found"));
        }

        return ok(undefined);
      });

      return result;
    } catch (error) {
      return err(
        new TeamRepositoryDeleteError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  return {
    list,
    findById,
    create,
    update,
    delete: remove,
  };
};
