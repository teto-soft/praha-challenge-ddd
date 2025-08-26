import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {Team} from "../../domain/entities/team/team";
import {participants, teams} from "../../libs/drizzle/schema";
import {eq} from "drizzle-orm";
import {err, ok} from "neverthrow";
import {TeamRepositoryListError, TeamRepositoryUpdateError,} from "../../domain/entities/team/team-repository";
import {createPostgresqlTeamRepository} from "./postgresql-team-repository";
import {createId, type Id} from "../../domain/value-objects/id";
import {createName, type Name} from "../../domain/value-objects/name";
import {createEmail} from "../../domain/value-objects/email";
import {createEnrollmentStatus} from "../../domain/value-objects/participant/enrollmentStatus";
import {TeamParticipants} from "../../domain/entities/team/team-participants";
import {ulid} from "ulid";
import type {IParticipant} from "../../domain/entities/participant/participant";

// テスト用のヘルパー関数
const createMockParticipants = (): IParticipant[] => {
  const id1 = createId(ulid())._unsafeUnwrap();
  const id2 = createId(ulid())._unsafeUnwrap();
  const name1 = createName("参加者1")._unsafeUnwrap();
  const name2 = createName("参加者2")._unsafeUnwrap();
  const email1 = createEmail("participant1@example.com")._unsafeUnwrap();
  const email2 = createEmail("participant2@example.com")._unsafeUnwrap();
  const status = createEnrollmentStatus("在籍中")._unsafeUnwrap();

  return [
    {
      id: id1,
      name: name1,
      email: email1,
      enrollmentStatus: status,
    },
    {
      id: id2,
      name: name2,
      email: email2,
      enrollmentStatus: status,
    },
  ];
};

describe("PostgresqlTeamRepository", () => {
  const mockDatabase = {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
  } as any;
  const teamRepository = createPostgresqlTeamRepository(mockDatabase);

  const mockTeams = [
    {
      id: "team-1",
      name: "チームA",
    },
  ];

  const mockParticipants = [
    {
      id: "participant-1",
      name: "参加者1",
      email: "participant1@example.com",
      enrollmentStatus: "在籍中",
      teamId: "team-1",
    },
    {
      id: "participant-2",
      name: "参加者2",
      email: "participant2@example.com",
      enrollmentStatus: "在籍中",
      teamId: "team-1",
    },
  ];

  let whereMock: Mock;

  beforeEach(() => {
    whereMock = vi.fn().mockResolvedValue(mockParticipants);
    mockDatabase.select.mockReturnValue({
      from: vi.fn().mockImplementation((table) => {
        if (table === teams) {
          return Promise.resolve(mockTeams);
        }
        if (table === participants) {
          return { where: whereMock };
        }
        return Promise.resolve([]);
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("list", () => {
    it("成功時：チームの一覧を返すこと", async () => {
      const mockParticipantsList = createMockParticipants();
      const mockTeamWithParticipants = {
        ...mockTeams[0],
        participants: TeamParticipants.create(mockParticipantsList)._unsafeUnwrap(),
      };

      Team.reconstruct = vi
        .fn()
        .mockImplementation(() => ok(mockTeamWithParticipants));

      const result = await teamRepository.list();

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([mockTeamWithParticipants]);
    });

    it("データベースエラー時：TeamRepositoryListErrorを返すこと", async () => {
      mockDatabase.select.mockReturnValue({
        from: vi.fn().mockRejectedValue(new Error("DB接続エラー")),
      });

      const result = await teamRepository.list();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TeamRepositoryListError);
      expect(result._unsafeUnwrapErr().message).toBe("DB接続エラー");
    });

    it("Team.reconstructエラー時：TeamRepositoryListErrorを返すこと", async () => {
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
    let updateWhereMock = vi.fn();
    let returningMock = vi.fn();
    let id: Id;
    let teamName: Name;

    const idResult = createId();
    if (idResult.isErr()) throw idResult.error;
    const teamNameResult = createName("teamA");
    if (teamNameResult.isErr()) throw teamNameResult.error;

    beforeEach(() => {
      setMock = vi.fn().mockReturnThis();
      updateWhereMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([updatedTeam]);

      mockDatabase.update.mockReturnValue({
        set: setMock,
        where: updateWhereMock,
        returning: returningMock,
      });

      whereMock = vi.fn().mockResolvedValue(mockParticipants);
      mockDatabase.select.mockReturnValue({
        from: vi.fn().mockReturnValue({ where: whereMock }),
      });

      id = idResult.value;
      teamName = teamNameResult.value;
    });

    it("成功時：更新されたチームを返すこと", async () => {
      const teamId = createId(ulid())._unsafeUnwrap();
      const updatedName = createName("teamA")._unsafeUnwrap();
      const mockParticipantsList = createMockParticipants();

      const mockUpdatedTeam = {
        id: teamId,
        name: updatedName,
        participants: TeamParticipants.create(mockParticipantsList)._unsafeUnwrap(),
      };

      const originalReconstruct = Team.reconstruct;
      Team.reconstruct = vi.fn().mockImplementation(() => ok(mockUpdatedTeam));

      const result = await teamRepository.update(id, {
        name: teamName,
      });

      expect(mockDatabase.update).toHaveBeenCalledWith(teams);
      expect(setMock).toHaveBeenCalledWith({ name: teamName });
      expect(updateWhereMock).toHaveBeenCalledWith(eq(teams.id, id));
      expect(returningMock).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockUpdatedTeam);

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
        where: updateWhereMock,
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
