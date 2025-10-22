import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {Team} from "../../domain/entities/team/team";
import {participants, teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";
import {err} from "neverthrow";
import {
  TeamRepositoryCreateError,
  TeamRepositoryDeleteError,
  TeamRepositoryFindByIdError,
  TeamRepositoryListError,
  TeamRepositoryUpdateError,
} from "../../domain/entities/team/team-repository";
import {createPostgresqlTeamRepository} from "./postgresql-team-repository";
import {ulid} from "ulid";

let participantCounter = 0;

const createParticipantRow = (
  overrides: Partial<typeof participants.$inferSelect> = {},
): typeof participants.$inferSelect => {
  participantCounter += 1;
  const index = participantCounter;

  return {
    id: overrides.id ?? ulid(),
    name: overrides.name ?? `参加者${index}`,
    email: overrides.email ?? `participant${index}@example.com`,
    enrollmentStatus: overrides.enrollmentStatus ?? "在籍中",
    teamId: overrides.teamId ?? ulid(),
  } as typeof participants.$inferSelect;
};

const originalTeamReconstruct = Team.reconstruct;

describe("PostgresqlTeamRepository", () => {
  let mockDatabase: {
    select: Mock;
    update: Mock;
    delete: Mock;
    insert: Mock;
    transaction: Mock;
  };
  const repositoryFactory = () =>
    createPostgresqlTeamRepository(mockDatabase as never);

  beforeEach(() => {
    participantCounter = 0;
    mockDatabase = {
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
      transaction: vi.fn(),
    } as never;
  });

  afterEach(() => {
    Team.reconstruct = originalTeamReconstruct;
    vi.resetAllMocks();
  });

  describe("list", () => {
    it("成功時：チーム一覧を返す", async () => {
      const teamId = ulid();
      const teamRow = { id: teamId, name: "チームA" };
      const participantRows = [
        createParticipantRow({ teamId, name: "参加者1" }),
        createParticipantRow({ teamId, name: "参加者2" }),
      ];

      const participantsWhere = vi.fn().mockResolvedValue(participantRows);
      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return Promise.resolve([teamRow]);
          }
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));

      const repository = repositoryFactory();
      const result = await repository.list();

      expect(result.isOk()).toBe(true);
      const teamsResult = result._unsafeUnwrap();
      expect(teamsResult).toHaveLength(1);
      expect(teamsResult[0]?.id).toBe(teamRow.id);
      expect(teamsResult[0]?.name).toBe(teamRow.name);
      expect(teamsResult[0]?.participants.length).toBe(2);
    });

    it("selectが失敗した場合：TeamRepositoryListErrorを返す", async () => {
      mockDatabase.select.mockReturnValue({
        from: vi.fn().mockRejectedValue(new Error("DB接続エラー")),
      });

      const repository = repositoryFactory();
      const result = await repository.list();

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryListError);
      expect(error.message).toBe("DB接続エラー");
    });

    it("Team.reconstructが失敗した場合：TeamRepositoryListErrorを返す", async () => {
      const participantsWhere = vi.fn().mockResolvedValue([]);
      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return Promise.resolve([{ id: "team-1", name: "invalid" }]);
          }
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));

      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("reconstruct error")));

      const repository = repositoryFactory();
      const result = await repository.list();

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryListError);
      expect(error.message).toBe("reconstruct error");
    });
  });

  describe("findById", () => {
    it("成功時：単一チームを返す", async () => {
      const teamId = ulid();
      const teamRow = { id: teamId, name: "チームA" };
      const participantRows = [
        createParticipantRow({ teamId, name: "参加者1" }),
        createParticipantRow({ teamId, name: "参加者2" }),
      ];

      const teamWhere = vi.fn().mockResolvedValue([teamRow]);
      const participantsWhere = vi.fn().mockResolvedValue(participantRows);

      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return { where: teamWhere };
          }
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));

      const repository = repositoryFactory();
      const result = await repository.findById(teamId as never);

      expect(result.isOk()).toBe(true);
      const team = result._unsafeUnwrap();
      expect(team.id).toBe(teamId);
      expect(team.participants.length).toBe(2);
    });

    it("存在しない場合：TeamRepositoryFindByIdErrorを返す", async () => {
      const teamWhere = vi.fn().mockResolvedValue([]);
      const missingTeamId = ulid();

      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return { where: teamWhere };
          }
          return Promise.resolve([]);
        },
      }));

      const repository = repositoryFactory();
      const result = await repository.findById(missingTeamId as never);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TeamRepositoryFindByIdError,
      );
    });

    it("selectが失敗した場合：TeamRepositoryFindByIdErrorを返す", async () => {
      const teamId = ulid();
      mockDatabase.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DBエラー")),
        }),
      });

      const repository = repositoryFactory();
      const result = await repository.findById(teamId as never);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryFindByIdError);
      expect(error.message).toBe("DBエラー");
    });

    it("Team.reconstructが失敗した場合：TeamRepositoryFindByIdErrorを返す", async () => {
      const teamId = ulid();
      const teamWhere = vi
        .fn()
        .mockResolvedValue([{ id: teamId, name: "invalid" }]);
      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return { where: teamWhere };
          }
          if (table === participants) {
            return { where: vi.fn().mockResolvedValue([]) };
          }
          return Promise.resolve([]);
        },
      }));

      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("reconstruct error")));

      const repository = repositoryFactory();
      const result = await repository.findById(teamId as never);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryFindByIdError);
      expect(error.message).toBe("reconstruct error");
    });
  });

  describe("create", () => {
    it("成功時：作成したチームを返す", async () => {
      const participantsData = [
        {
          name: "参加者1",
          email: "member1@example.com",
          enrollmentStatus: "在籍中",
        },
        {
          name: "参加者2",
          email: "member2@example.com",
          enrollmentStatus: "在籍中",
        },
      ];
      const teamResult = Team.create({
        name: "チームA",
        participants: participantsData,
      });
      if (teamResult.isErr()) throw teamResult.error;
      const team = teamResult.value;

      const insertTeamValues = vi.fn().mockResolvedValue(undefined);
      const insertParticipantValues = vi.fn().mockResolvedValue(undefined);

      mockDatabase.insert.mockImplementation((table: unknown) => {
        if (table === teams) {
          return { values: insertTeamValues };
        }
        if (table === participants) {
          return { values: insertParticipantValues };
        }
        return { values: vi.fn() };
      });

      const teamWhere = vi
        .fn()
        .mockResolvedValue([{ id: team.id, name: team.name }]);
      const participantsWhere = vi.fn().mockResolvedValue(
        team.participants.forPersistence().map((participant) => ({
          ...participant,
          teamId: team.id,
        })),
      );

      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return { where: teamWhere };
          }
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));

      mockDatabase.transaction.mockImplementation(
        async (callback: (db: unknown) => unknown) => callback(mockDatabase),
      );

      const repository = repositoryFactory();
      const result = await repository.create(team);

      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(insertTeamValues).toHaveBeenCalledWith({
        id: team.id,
        name: team.name,
      });
      expect(insertParticipantValues).toHaveBeenCalledWith(
        team.participants.forPersistence().map((participant) => ({
          ...participant,
          teamId: team.id,
        })),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(team.id);
    });

    it("Team.reconstructが失敗した場合：TeamRepositoryCreateErrorを返す", async () => {
      const teamResult = Team.create({
        name: "チームA",
        participants: [
          {
            name: "参加者1",
            email: "member1@example.com",
            enrollmentStatus: "在籍中",
          },
          {
            name: "参加者2",
            email: "member2@example.com",
            enrollmentStatus: "在籍中",
          },
        ],
      });
      if (teamResult.isErr()) throw teamResult.error;
      const team = teamResult.value;

      mockDatabase.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const teamWhere = vi
        .fn()
        .mockResolvedValue([{ id: team.id, name: team.name }]);
      const participantsWhere = vi.fn().mockResolvedValue(
        team.participants.forPersistence().map((participant) => ({
          ...participant,
          teamId: team.id,
        })),
      );
      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === teams) {
            return { where: teamWhere };
          }
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));
      mockDatabase.transaction.mockImplementation(
        async (callback: (db: unknown) => unknown) => callback(mockDatabase),
      );

      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("reconstruct error")));

      const repository = repositoryFactory();
      const result = await repository.create(team);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryCreateError);
      expect(error.message).toBe("reconstruct error");
    });

    it("トランザクション中に例外が発生した場合：TeamRepositoryCreateErrorを返す", async () => {
      const teamResult = Team.create({
        name: "チームA",
        participants: [
          {
            name: "参加者1",
            email: "member1@example.com",
            enrollmentStatus: "在籍中",
          },
          {
            name: "参加者2",
            email: "member2@example.com",
            enrollmentStatus: "在籍中",
          },
        ],
      });
      if (teamResult.isErr()) throw teamResult.error;
      const team = teamResult.value;

      mockDatabase.transaction.mockRejectedValue(new Error("DBエラー"));

      const repository = repositoryFactory();
      const result = await repository.create(team);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryCreateError);
      expect(error.message).toBe("DBエラー");
    });
  });

  describe("update", () => {
    let participantsWhere: Mock;
    let updateSet: Mock;
    let updateWhere: Mock;
    let updateReturning: Mock;
    let teamId: string;

    beforeEach(() => {
      teamId = ulid();
      participantsWhere = vi
        .fn()
        .mockResolvedValue([
          createParticipantRow({ teamId, name: "参加者1" }),
          createParticipantRow({ teamId, name: "参加者2" }),
        ]);
      updateSet = vi.fn().mockReturnThis();
      updateWhere = vi.fn().mockReturnThis();
      updateReturning = vi
        .fn()
        .mockResolvedValue([{ id: teamId, name: "チームB" }]);

      mockDatabase.update.mockReturnValue({
        set: updateSet,
        where: updateWhere,
        returning: updateReturning,
      });

      mockDatabase.select.mockImplementation(() => ({
        from: (table: unknown) => {
          if (table === participants) {
            return { where: participantsWhere };
          }
          return Promise.resolve([]);
        },
      }));

      mockDatabase.transaction.mockImplementation(
        async (callback: (db: unknown) => unknown) => callback(mockDatabase),
      );
    });

    it("成功時：更新後のチームを返す", async () => {
      const repository = repositoryFactory();

      const result = await repository.update(teamId as never, {
        name: "チームB" as never,
      });

      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(mockDatabase.update).toHaveBeenCalledWith(teams);
      expect(updateSet).toHaveBeenCalledWith({ name: "チームB" });
      expect(updateWhere).toHaveBeenCalledWith(eq(teams.id, teamId));
      expect(updateReturning).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      const team = result._unsafeUnwrap();
      expect(team.name).toBe("チームB");
      expect(team.participants.length).toBe(2);
    });

    it("存在しない場合：TeamRepositoryUpdateErrorを返す", async () => {
      updateReturning.mockResolvedValue([]);
      const missingTeamId = ulid();

      const repository = repositoryFactory();
      const result = await repository.update(missingTeamId as never, {});

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TeamRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("Team not found");
    });

    it("トランザクション中に例外が発生した場合：TeamRepositoryUpdateErrorを返す", async () => {
      mockDatabase.transaction.mockRejectedValue(new Error("DB更新エラー"));

      const repository = repositoryFactory();
      const result = await repository.update(teamId as never, {});

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryUpdateError);
      expect(error.message).toBe("DB更新エラー");
    });

    it("Team.reconstructが失敗した場合：TeamRepositoryUpdateErrorを返す", async () => {
      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("reconstruct error")));

      const repository = repositoryFactory();
      const result = await repository.update(teamId as never, {});

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryUpdateError);
      expect(error.message).toBe("reconstruct error");
    });
  });

  describe("delete", () => {
    let deleteParticipantsWhere: Mock;
    let deleteTeamWhere: Mock;
    let deleteTeamReturning: Mock;
    let teamId: string;

    beforeEach(() => {
      teamId = ulid();
      deleteParticipantsWhere = vi.fn().mockResolvedValue(undefined);
      deleteTeamReturning = vi.fn().mockResolvedValue([{ id: teamId }]);
      deleteTeamWhere = vi
        .fn()
        .mockReturnValue({ returning: deleteTeamReturning });

      mockDatabase.delete.mockImplementation((table: unknown) => {
        if (table === participants) {
          return { where: deleteParticipantsWhere };
        }
        if (table === teams) {
          return { where: deleteTeamWhere };
        }
        return { where: vi.fn() };
      });

      mockDatabase.transaction.mockImplementation(
        async (callback: (db: unknown) => unknown) => callback(mockDatabase),
      );
    });

    it("成功時：voidを返す", async () => {
      const repository = repositoryFactory();
      const result = await repository.delete(teamId as never);

      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(deleteParticipantsWhere).toHaveBeenCalledWith(
        eq(participants.teamId, teamId),
      );
      expect(deleteTeamWhere).toHaveBeenCalledWith(eq(teams.id, teamId));
      expect(deleteTeamReturning).toHaveBeenCalledWith({ id: teams.id });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it("存在しない場合：TeamRepositoryDeleteErrorを返す", async () => {
      deleteTeamReturning.mockResolvedValue([]);
      const missingTeamId = ulid();

      const repository = repositoryFactory();
      const result = await repository.delete(missingTeamId as never);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryDeleteError);
      expect(error.message).toBe("Team not found");
    });

    it("トランザクション中に例外が発生した場合：TeamRepositoryDeleteErrorを返す", async () => {
      mockDatabase.transaction.mockRejectedValue(new Error("DB削除エラー"));

      const repository = repositoryFactory();
      const result = await repository.delete(teamId as never);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TeamRepositoryDeleteError);
      expect(error.message).toBe("DB削除エラー");
    });
  });
});
