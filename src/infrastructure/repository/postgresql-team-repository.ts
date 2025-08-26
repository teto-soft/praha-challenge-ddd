import type {Database} from "../../libs/drizzle/get-database";
import {
  type TeamRepositoryInterface,
  TeamRepositoryListError,
  TeamRepositoryUpdateError,
} from "../../domain/entities/team/team-repository";
import {err, Result} from "neverthrow";
import {type ITeam, Team} from "../../domain/entities/team/team";
import {participants, teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";
import type {StripAllBrands} from "../../domain/value-objects/types/type";
import type {IParticipant} from "../../domain/entities/participant/participant";

export const createPostgresqlTeamRepository = (
  database: Database,
): TeamRepositoryInterface => {
  async function list(): Promise<Result<ITeam[], TeamRepositoryListError>> {
    try {
      const teamsData = await database.select().from(teams);

      const teamResults = await Promise.all(
        teamsData.map(async (teamRow) => {
          const teamParticipants = await database
            .select()
            .from(participants)
            .where(eq(participants.teamId, teamRow.id));

          const plainParticipants = teamParticipants.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            enrollmentStatus: p.enrollmentStatus,
          })) as StripAllBrands<IParticipant>[];

          return Team.reconstruct({
            id: teamRow.id,
            name: teamRow.name,
            participants: plainParticipants,
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

  async function update(
    id: ITeam["id"],
    team: Partial<Omit<ITeam, "id">>,
  ): Promise<Result<ITeam, TeamRepositoryUpdateError>> {
    try {
      const teamData = team.name ? { name: team.name } : {};

      const updatedTeamRows = await database
        .update(teams)
        .set(teamData)
        .where(eq(teams.id, id))
        .returning();

      const updatedTeamRow = updatedTeamRows.at(0);
      if (!updatedTeamRow) {
        return err(new TeamRepositoryUpdateError("Team not found"));
      }

      if (team.participants) {
        await database.delete(participants).where(eq(participants.teamId, id));

        const participantsData = team.participants.toPersistenceData();
        if (participantsData.length > 0) {
          await database.insert(participants).values(
            participantsData.map((p) => ({
              ...p,
              teamId: id,
            })),
          );
        }
      }

      const teamParticipants = await database
        .select()
        .from(participants)
        .where(eq(participants.teamId, id));

      const plainParticipants = teamParticipants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        enrollmentStatus: p.enrollmentStatus,
      })) as StripAllBrands<IParticipant>[];

      return Team.reconstruct({
        id: updatedTeamRow.id,
        name: updatedTeamRow.name,
        participants: plainParticipants,
      }).mapErr((error) => new TeamRepositoryUpdateError(error.message));
    } catch (error) {
      return err(
        new TeamRepositoryUpdateError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }

  return { list, update };
};
