import type {Database} from "../../libs/drizzle/get-database";
import {
  type TeamRepositoryInterface,
  TeamRepositoryListError,
  TeamRepositoryUpdateError,
} from "../../domain/entities/team/team-repository";
import {err, Result} from "neverthrow";
import {type ITeam, Team} from "../../domain/entities/team/team";
import {teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";

export const createPostgresqlTeamRepository = (
  database: Database,
): TeamRepositoryInterface => {
  async function list(): Promise<Result<ITeam[], TeamRepositoryListError>> {
    return database
      .select()
      .from(teams)
      .then((rows) => 
        Result.combine(
          rows.map(row => 
            Team.reconstruct({
              ...row,
              participants: [] // TODO: Load participants from participants table if needed
            })
          )
        ).mapErr((error) => new TeamRepositoryListError(error.message))
      )
      .catch((error) =>
        err(
          new TeamRepositoryListError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  async function update(
    id: ITeam["id"],
    team: Partial<Omit<ITeam, "id">>,
  ): Promise<Result<ITeam, TeamRepositoryUpdateError>> {
    return database
      .update(teams)
      .set(team)
      .where(eq(teams.id,id))
      .returning()
      .then((rows) => {
        const row = rows.at(0);
        if (!row) {
          return err(new TeamRepositoryUpdateError("Team not found"));
        }
        return Team.reconstruct({
          ...row,
          participants: [] // TODO: Load participants from participants table if needed
        }).mapErr(
          (error) => new TeamRepositoryUpdateError(error.message)
        );
      })
      .catch((error) =>
        err(
          new TeamRepositoryUpdateError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        ),
      );
  }

  return { list, update };
};
