import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {type ITask, Task} from "../../domain/entities/task/task";
import {tasks} from "../../libs/drizzle/schema";
import {and, eq} from "drizzle-orm";
import {err, ok} from "neverthrow";
import {
  TaskRepositoryFindByIdError,
  TaskRepositoryFindManyByError,
  TaskRepositorySaveError,
} from "../../domain/entities/task/task-repository";
import {createPostgresqlTaskRepository} from "./postgresql-task-repository";
import {createId, type Id} from "../../domain/value-objects/id";
import {createTitle} from "../../domain/value-objects/title";
import {createBody} from "../../domain/value-objects/body";

describe("PostgresqlTaskRepository", () => {
  const mockDatabase = {
    select: vi.fn(),
    insert: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
  } as any;
  const taskRepository = createPostgresqlTaskRepository(mockDatabase);

  const mockIdResult = createId();
  if (mockIdResult.isErr()) throw mockIdResult.error;

  const mockTask = {
    id: mockIdResult.value,
    title: "新しいタスク",
    body: "新しいタスクの内容",
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("save", () => {
    let valuesMock: Mock;
    let onConflictDoUpdateMock: Mock;
    let returningMock: Mock;
    let task: ITask;

    const taskResult = Task.reconstruct(mockTask);
    if (taskResult.isErr()) throw taskResult.error;

    beforeEach(() => {
      valuesMock = vi.fn().mockReturnThis();
      onConflictDoUpdateMock = vi.fn().mockReturnThis();
      returningMock = vi.fn().mockResolvedValue([mockTask]);

      mockDatabase.insert.mockReturnValue({
        values: valuesMock,
        onConflictDoUpdate: onConflictDoUpdateMock,
        returning: returningMock,
      });

      task = taskResult.value;
    });

    it("成功時：保存されたタスクを返すこと", async () => {
      Task.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await taskRepository.save(task);

      expect(mockDatabase.insert).toHaveBeenCalledWith(tasks);
      expect(valuesMock).toHaveBeenCalledWith(mockTask);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
      expect(returningMock).toHaveBeenCalledWith({
        id: tasks.id,
        title: tasks.title,
        body: tasks.body,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTask);
    });

    it("保存結果が空の場合：TaskRepositorySaveErrorを返すこと", async () => {
      returningMock.mockResolvedValue([]);

      const result = await taskRepository.save(task);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TaskRepositorySaveError);
      expect(result._unsafeUnwrapErr().message).toBe("Failed to save a task");
    });

    it("データベースエラー時：TaskRepositorySaveErrorを返すこと", async () => {
      returningMock.mockRejectedValue(new Error("DB保存エラー"));

      const result = await taskRepository.save(task);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TaskRepositorySaveError);
      expect(result._unsafeUnwrapErr().message).toBe("DB保存エラー");
    });

    it("Task.reconstructエラー時：TaskRepositorySaveErrorを返すこと", async () => {
      Task.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("タスク再構築エラー")));

      const result = await taskRepository.save(task);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(TaskRepositorySaveError);
      expect(result._unsafeUnwrapErr().message).toBe("タスク再構築エラー");
    });
  });

  describe("findById", () => {
    let fromMock: Mock;
    let whereMock: Mock;
    let id: Id;

    beforeEach(() => {
      fromMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockResolvedValue([mockTask]);

      mockDatabase.select.mockReturnValue({
        from: fromMock,
        where: whereMock,
      });

      const idResult = createId();
      if (idResult.isErr()) throw idResult.error;
      id = idResult.value;
    });

    it("成功時：指定したIDのタスクを返すこと", async () => {
      Task.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await taskRepository.findById(id);

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(tasks);
      expect(whereMock).toHaveBeenCalledWith(eq(tasks.id, id));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockTask);
    });

    it("タスクが見つからない場合：TaskRepositoryFindByIdErrorを返すこと", async () => {
      whereMock.mockResolvedValue([]);

      const result = await taskRepository.findById(id);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TaskRepositoryFindByIdError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("Task not found");
    });

    it("データベースエラー時：TaskRepositoryFindByIdErrorを返すこと", async () => {
      whereMock.mockRejectedValue(new Error("DB検索エラー"));

      const result = await taskRepository.findById(id);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TaskRepositoryFindByIdError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB検索エラー");
    });

    it("Task.reconstructエラー時：TaskRepositoryFindByIdErrorを返すこと", async () => {
      Task.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("タスク再構築エラー")));

      const result = await taskRepository.findById(id);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TaskRepositoryFindByIdError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("タスク再構築エラー");
    });
  });

  describe("findManyBy", () => {
    let fromMock: Mock;
    let whereMock: Mock;

    beforeEach(() => {
      fromMock = vi.fn().mockReturnThis();
      whereMock = vi.fn().mockResolvedValue([mockTask]);

      mockDatabase.select.mockReturnValue({
        from: fromMock,
        where: whereMock,
      });
    });

    it("成功時：条件に一致するタスクの配列を返すこと", async () => {
      Task.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const titleResult = createTitle("test task");
      if (titleResult.isErr()) throw titleResult.error;

      const result = await taskRepository.findManyBy({
        title: titleResult.value,
      });

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(tasks);
      expect(whereMock).toHaveBeenCalledWith(and(eq(tasks.title, "test task")));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([mockTask]);
    });

    it("条件なしの場合：全てのタスクを返すこと", async () => {
      Task.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const result = await taskRepository.findManyBy();

      expect(mockDatabase.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(tasks);
      expect(whereMock).toHaveBeenCalledWith(and());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([mockTask]);
    });

    it("複数条件での検索：正しい条件でクエリが実行されること", async () => {
      Task.reconstruct = vi.fn().mockImplementation((data) => ok(data));

      const titleResult = createTitle("test title");
      if (titleResult.isErr()) throw titleResult.error;
      const bodyResult = createBody("test body");
      if (bodyResult.isErr()) throw bodyResult.error;

      const result = await taskRepository.findManyBy({
        title: titleResult.value,
        body: bodyResult.value,
      });

      expect(whereMock).toHaveBeenCalledWith(
        and(eq(tasks.title, "test title"), eq(tasks.body, "test body")),
      );
      expect(result.isOk()).toBe(true);
    });

    it("データベースエラー時：TaskRepositoryFindManyByErrorを返すこと", async () => {
      whereMock.mockRejectedValue(new Error("DB検索エラー"));

      const result = await taskRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TaskRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("DB検索エラー");
    });

    it("Task.reconstructエラー時：TaskRepositoryFindManyByErrorを返すこと", async () => {
      Task.reconstruct = vi
        .fn()
        .mockImplementation(() => err(new Error("タスク再構築エラー")));

      const result = await taskRepository.findManyBy();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TaskRepositoryFindManyByError,
      );
      expect(result._unsafeUnwrapErr().message).toBe("タスク再構築エラー");
    });
  });
});
