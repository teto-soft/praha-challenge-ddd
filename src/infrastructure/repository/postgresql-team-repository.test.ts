import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {Team} from "../../domain/entities/team/team";
import {teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";
import {err, ok} from "neverthrow";
import {TeamRepositoryListError, TeamRepositoryUpdateError,} from "../../domain/entities/team/team-repository";
import {createPostgresqlTeamRepository} from "./postgresql-team-repository";
import {createId, type Id} from "../../domain/value-objects/id";
import {createTeamName, type TeamName} from "../../domain/value-objects/team/teamName";

describe("PostgresqlTeamRepository", () => {
  const mockDatabase = {
    select: vi.fn(),
    update: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
  } as any;
  const teamRepository = createPostgresqlTeamRepository(mockDatabase);

  const mockTeams = [
    {
      id: "team-1",
      name: "チームA",
      description: "テストチーム",
    },
  ];

  let fromMock: Mock;

  beforeEach(() => {
    fromMock = vi.fn().mockReturnThis();
    mockDatabase.select.mockReturnValue({ from: fromMock });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("list", () => {
    it("成功時：チームの一覧を返すこと", async () => {
      fromMock.mockResolvedValue(mockTeams);

      Team.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await teamRepository.list();

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(teams);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTeams);
    });

    it("データベースエラー時：TeamRepositoryListErrorを返すこと", async () => {
      fromMock.mockRejectedValue(new Error("DB接続エラー"));

      const result = await teamRepository.list();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TeamRepositoryListError);
      expect(result._unsafeUnwrapErr().message).toBe("DB接続エラー");
    });

    it("Team.reconstructエラー時：TeamRepositoryListErrorを返すこと", async () => {
      fromMock.mockResolvedValue(mockTeams);

      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("チーム再構築エラー")));

      const result = await teamRepository.list();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TeamRepositoryListError);
      expect(result._unsafeUnwrapErr().message).toBe("チーム再構築エラー");
    });
  });

  describe("update", () => {
    const updatedTeam = { ...mockTeams[0], name: "teamA" };
    let setMock = vi.fn();
    let whereMock = vi.fn();
    let returningMock = vi.fn();
    let id: Id;
    let teamName: TeamName;

    const idResult = createId();
    if (idResult.isErr()) throw idResult.error;
    const teamNameResult = createTeamName("teamA");
    if (teamNameResult.isErr()) throw teamNameResult.error;

    beforeEach(() => {
      setMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([updatedTeam]);

      mockDatabase.update.mockReturnValue({
        set: setMock,
        where: whereMock,
        returning: returningMock,
      });

      id = idResult.value;
      teamName = teamNameResult.value;
    });

    it("成功時：更新されたチームを返すこと", async () => {
      const originalReconstruct = Team.reconstruct;
      Team.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await teamRepository.update(id, {
        name: teamName,
      });

      expect(mockDatabase.update).toHaveBeenCalledWith(teams);
      expect(setMock).toHaveBeenCalledWith({ name: teamName });
      expect(whereMock).toHaveBeenCalledWith(eq(teams.id, id));
      expect(returningMock).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedTeam);

      Team.reconstruct = originalReconstruct;
    });

    it("チームが見つからない場合：TeamRepositoryUpdateErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);
      const result = await teamRepository.update(id, {
        name: teamName,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TeamRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("Team not found");
    });

    it("データベースエラー時：TeamRepositoryUpdateErrorを返すこと", async () => {
      const returningMock = vi
        .fn()
        .mockRejectedValue(new Error("DB更新エラー"));

      mockDatabase.update.mockReturnValue({
        set: setMock,
        where: whereMock,
        returning: returningMock,
      });

      const result = await teamRepository.update(id, {
        name: teamName,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TeamRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB更新エラー");
    });

    it("Team.reconstructエラー時：TeamRepositoryUpdateErrorを返すこと", async () => {
      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("チーム再構築エラー")));

      const result = await teamRepository.update(id, {
        name: teamName,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TeamRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("チーム再構築エラー");
    });
  });
});
