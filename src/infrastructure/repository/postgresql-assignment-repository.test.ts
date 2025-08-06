import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {Assignment, type IAssignment} from "../../domain/entities/assignment/assignment";
import {assignments} from "../../libs/drizzle/schema";
import {and, eq} from "drizzle-orm";
import {err, ok} from "neverthrow";
import {
  AssignmentRepositoryFindManyByError,
  AssignmentRepositorySaveError,
  AssignmentRepositoryUpdateError,
} from "../../domain/entities/assignment/assignment-repository";
import {createPostgresqlAssignmentRepository} from "./postgresql-assignment-repository";
import {createId, type Id} from "../../domain/value-objects/id";
import {createProgressStatus} from "../../domain/value-objects/assignment/progressStatus";

describe("PostgresqlAssignmentRepository", () => {
  const mockDatabase = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
  } as any;
  const assignmentRepository =
    createPostgresqlAssignmentRepository(mockDatabase);

  const mockIdResult = createId();
  if (mockIdResult.isErr()) throw mockIdResult.error;
  const mockTaskIdResult = createId();
  if (mockTaskIdResult.isErr()) throw mockTaskIdResult.error;
  const mockParticipantIdResult = createId();
  if (mockParticipantIdResult.isErr()) throw mockParticipantIdResult.error;

  const mockAssignment = {
    id: mockIdResult.value,
    taskId: mockTaskIdResult.value,
    participantId: mockParticipantIdResult.value,
    progressStatus: "未着手",
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("save", () => {
    let valuesMock: Mock;
    let onConflictDoUpdateMock: Mock;
    let returningMock: Mock;
    let assignment: IAssignment;

    beforeEach(() => {
      valuesMock = vi.fn().mockReturnThis();
      onConflictDoUpdateMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([mockAssignment]);

      mockDatabase.insert.mockReturnValue({
        values: valuesMock,
        onConflictDoUpdate: onConflictDoUpdateMock,
        returning: returningMock,
      });

      const assignmentResult = Assignment.reconstruct(mockAssignment);
      if (assignmentResult.isErr()) throw assignmentResult.error;
      assignment = assignmentResult.value;
    });

    it("成功時：保存されたアサインメントを返すこと", async () => {
      const result = await assignmentRepository.save(assignment);

      expect(mockDatabase.insert).toHaveBeenCalledWith(assignments);
      expect(valuesMock).toHaveBeenCalledWith(assignment);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
      expect(returningMock).toHaveBeenCalledWith({
        id: assignments.id,
        taskId: assignments.taskId,
        participantId: assignments.participantId,
        progressStatus: assignments.progressStatus,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockAssignment);
    });

    it("データが返されない場合：AssignmentRepositorySaveErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);

      const result = await assignmentRepository.save(assignment);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to save a assignment",
      );
    });

    it("データベースエラー時：AssignmentRepositorySaveErrorを返すこと", async () => {
      returningMock.mockRejectedValue(new Error("DB保存エラー"));

      const result = await assignmentRepository.save(assignment);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB保存エラー");
    });

    it("Assignment.reconstructエラー時：AssignmentRepositorySaveErrorを返すこと", async () => {
      returningMock.mockResolvedValue([mockAssignment]);
      Assignment.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("アサインメント再構築エラー")));

      const result = await assignmentRepository.save(assignment);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositorySaveError,
      );
      expect(result._unsafeUnwrapErr().message).toBe(
        "アサインメント再構築エラー",
      );
    });
  });

  describe("findManyBy", () => {
    let fromMock: Mock;
    let whereMock: Mock;

    beforeEach(() => {
      fromMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockResolvedValue([mockAssignment]);

      mockDatabase.select.mockReturnValue({
        from: fromMock,
        where: whereMock,
      });
    });

    it("成功時：アサインメントの一覧を返すこと", async () => {
      Assignment.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await assignmentRepository.findManyBy();

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(assignments);
      expect(whereMock).toHaveBeenCalledWith(and());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([mockAssignment]);
    });

    it("条件指定時：適切な条件で検索すること", async () => {
      Assignment.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const progressStatusResult = createProgressStatus("未着手");
      if (progressStatusResult.isErr()) throw progressStatusResult.error;

      const result = await assignmentRepository.findManyBy({
        taskId: mockTaskIdResult.value,
        participantId: mockParticipantIdResult.value,
        progressStatus: progressStatusResult.value,
      });

      expect(whereMock).toHaveBeenCalledWith(
        and(
          eq(assignments.taskId, mockTaskIdResult.value),
          eq(assignments.participantId, mockParticipantIdResult.value),
          eq(assignments.progressStatus, "未着手"),
        ),
      );
      expect(result.isOk()).toBe(true);
    });

    it("データベースエラー時：AssignmentRepositoryFindManyByErrorを返すこと", async () => {
      whereMock.mockRejectedValue(new Error("DB検索エラー"));

      const result = await assignmentRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB検索エラー");
    });

    it("Assignment.reconstructエラー時：AssignmentRepositoryFindManyByErrorを返すこと", async () => {
      Assignment.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("アサインメント再構築エラー")));

      const result = await assignmentRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe(
        "アサインメント再構築エラー",
      );
    });
  });

  describe("update", () => {
    const updatedAssignment = { ...mockAssignment, progressStatus: "完了" };
    let setMock: Mock;
    let whereMock: Mock;
    let returningMock: Mock;
    let id: Id;
    let updateData: Partial<Omit<IAssignment, "id">>;

    beforeEach(() => {
      setMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([updatedAssignment]);

      mockDatabase.update.mockReturnValue({
        set: setMock,
        where: whereMock,
        returning: returningMock,
      });

      id = mockIdResult.value;
      const progressStatusResult = createProgressStatus("完了");
      if (progressStatusResult.isErr()) throw progressStatusResult.error;
      updateData = { progressStatus: progressStatusResult.value };
    });

    it("成功時：更新されたアサインメントを返すこと", async () => {
      Assignment.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await assignmentRepository.update(id, updateData);

      expect(mockDatabase.update).toHaveBeenCalledWith(assignments);
      expect(setMock).toHaveBeenCalledWith(updateData);
      expect(whereMock).toHaveBeenCalledWith(eq(assignments.id, id));
      expect(returningMock).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedAssignment);
    });

    it("アサインメントが見つからない場合：AssignmentRepositoryUpdateErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);

      const result = await assignmentRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("Assignment not found");
    });

    it("データベースエラー時：AssignmentRepositoryUpdateErrorを返すこと", async () => {
      returningMock.mockRejectedValue(new Error("DB更新エラー"));

      const result = await assignmentRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB更新エラー");
    });

    it("Assignment.reconstructエラー時：AssignmentRepositoryUpdateErrorを返すこと", async () => {
      Assignment.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("アサインメント再構築エラー")));

      const result = await assignmentRepository.update(id, updateData);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AssignmentRepositoryUpdateError,
      );
      expect(result._unsafeUnwrapErr().message).toBe(
        "アサインメント再構築エラー",
      );
    });
  });
});
