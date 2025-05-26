import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {type IParticipant, Participant} from "../../domain/entities/participant/participant";
import {participants} from "../../libs/drizzle/schema";
import {and, eq} from "drizzle-orm";
import {err, ok} from "neverthrow";
import {
  ParticipantRepositoryFindManyByError,
  ParticipantRepositorySaveError,
  ParticipantRepositoryUpdateError,
} from "../../domain/entities/participant/participant-repository";
import {createPostgresqlParticipantRepository} from "./postgresql-participant-repository";
import {createId, type Id} from "../../domain/value-objects/id";
import {createName, type Name} from "../../domain/value-objects/name";
import {createEnrollmentStatus} from "../../domain/value-objects/participant/enrollmentStatus";

describe("PostgresqlParticipantRepository", () => {
  const mockDatabase = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
  } as any;
  const participantRepository =
    createPostgresqlParticipantRepository(mockDatabase);

  const mockIdResult = createId();
  if (mockIdResult.isErr()) throw mockIdResult.error;

  const mockParticipant = {
    id: mockIdResult.value,
    name: "田中太郎",
    email: "tanaka@example.com",
    enrollmentStatus: "在籍中",
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("save", () => {
    let valuesMock: Mock;
    let onConflictDoUpdateMock: Mock;
    let returningMock: Mock;
    let participant: IParticipant;

    beforeEach(() => {
      valuesMock = vi.fn().mockReturnThis();
      onConflictDoUpdateMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([mockParticipant]);

      mockDatabase.insert.mockReturnValue({
        values: valuesMock,
        onConflictDoUpdate: onConflictDoUpdateMock,
        returning: returningMock,
      });

      const participantResult = Participant.reconstruct(mockParticipant);
      if (participantResult.isErr()) throw participantResult.error;
      participant = participantResult.value;
    });

    it("成功時：保存された参加者を返すこと", async () => {
      const result = await participantRepository.save(participant);

      expect(mockDatabase.insert).toHaveBeenCalledWith(participants);
      expect(valuesMock).toHaveBeenCalledWith(mockParticipant);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
      expect(returningMock).toHaveBeenCalledWith({
        id: participants.id,
        name: participants.name,
        email: participants.email,
        enrollmentStatus: participants.enrollmentStatus,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockParticipant);
    });

    it("データが返されない場合：ParticipantRepositorySaveErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);

      const result = await participantRepository.save(participant);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to save a participant",
      );
    });

    it("データベースエラー時：ParticipantRepositorySaveErrorを返すこと", async () => {
      returningMock.mockRejectedValue(new Error("DB保存エラー"));

      const result = await participantRepository.save(participant);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB保存エラー");
    });

    it("Participant.reconstructエラー時：ParticipantRepositorySaveErrorを返すこと", async () => {
      returningMock.mockResolvedValue([mockParticipant]);
      Participant.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("参加者再構築エラー")));

      const result = await participantRepository.save(participant);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("参加者再構築エラー");
    });
  });

  describe("findManyBy", () => {
    let fromMock: Mock;
    let whereMock: Mock;

    beforeEach(() => {
      fromMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockResolvedValue([mockParticipant]);

      mockDatabase.select.mockReturnValue({
        from: fromMock,
        where: whereMock,
      });
    });

    it("成功時：参加者の一覧を返すこと", async () => {
      Participant.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await participantRepository.findManyBy();

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(participants);
      expect(whereMock).toHaveBeenCalledWith(and());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([mockParticipant]);
    });

    it("条件指定時：適切な条件で検索すること", async () => {
      Participant.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const nameResult = createName("田中太郎");
      if (nameResult.isErr()) throw nameResult.error;
      const enrollmentStatusResult = createEnrollmentStatus("在籍中");
      if (enrollmentStatusResult.isErr()) throw enrollmentStatusResult.error;

      const result = await participantRepository.findManyBy({
        name: nameResult.value,
        enrollmentStatus: enrollmentStatusResult.value,
      });

      expect(whereMock).toHaveBeenCalledWith(
        and(
          eq(participants.name, "田中太郎"),
          eq(participants.enrollmentStatus, "在籍中"),
        ),
      );
      expect(result.isOk()).toBe(true);
    });

    it("データベースエラー時：ParticipantRepositoryFindManyByErrorを返すこと", async () => {
      whereMock.mockRejectedValue(new Error("DB検索エラー"));

      const result = await participantRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB検索エラー");
    });

    it("Participant.reconstructエラー時：ParticipantRepositoryFindManyByErrorを返すこと", async () => {
      Participant.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("参加者再構築エラー")));

      const result = await participantRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("参加者再構築エラー");
    });
  });

  describe("update", () => {
    const updatedParticipant = { ...mockParticipant, name: "田中次郎" };
    let setMock: Mock;
    let whereMock: Mock;
    let returningMock: Mock;
    let id: Id;
    let name: Name;

    const idResult = createId();
    if (idResult.isErr()) throw idResult.error;
    const nameResult = createName("teamA");
    if (nameResult.isErr()) throw nameResult.error;
    let updateData: { name: Name };

    beforeEach(() => {
      setMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([updatedParticipant]);

      mockDatabase.update.mockReturnValue({
        set: setMock,
        where: whereMock,
        returning: returningMock,
      });

      id = idResult.value;
      name = nameResult.value;
      updateData = { name };
    });

    it("成功時：更新された参加者を返すこと", async () => {
      Participant.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await participantRepository.update(id, updateData);

      expect(mockDatabase.update).toHaveBeenCalledWith(participants);
      expect(setMock).toHaveBeenCalledWith(updateData);
      expect(whereMock).toHaveBeenCalledWith(eq(participants.id, id));
      expect(returningMock).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedParticipant);
    });

    it("参加者が見つからない場合：ParticipantRepositoryUpdateErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);

      const result = await participantRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("Participant not found");
    });

    it("データベースエラー時：ParticipantRepositoryUpdateErrorを返すこと", async () => {
      returningMock.mockRejectedValue(new Error("DB更新エラー"));

      const result = await participantRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB更新エラー");
    });

    it("Participant.reconstructエラー時：ParticipantRepositoryUpdateErrorを返すこと", async () => {
      Participant.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("参加者再構築エラー")));

      const result = await participantRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ParticipantRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("参加者再構築エラー");
    });
  });
});
