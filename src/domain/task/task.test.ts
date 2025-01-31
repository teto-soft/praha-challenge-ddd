import { describe, expect, it } from "vitest";
import { Task } from "./task";
import { ulid } from "ulid";

describe("Task", () => {
  describe("create", () => {
    it("有効なプロパティで正常にタスクを作成できる", () => {
      const result = Task.create({
        title: "テストタスク",
        isDone: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("テストタスク");
        expect(result.value.isDone).toBe(false);
        expect(result.value.id).toBeDefined();
      }
    });
  });

  describe("reconstruct", () => {
    it("有効なプロパティで正常にタスクを再構築できる", () => {
      const id = ulid();
      const result = Task.reconstruct({
        id,
        title: "テストタスク",
        isDone: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(id);
        expect(result.value.title).toBe("テストタスク");
        expect(result.value.isDone).toBe(true);
      }
    });
  });

  describe("toggleDone", () => {
    it("完了状態を反転できる", async () => {
      const task = Task.create({
        title: "テストタスク",
        isDone: false,
      }).unwrapOr(null);

      expect(task).not.toBeNull();
      if (task) {
        const updatedTask = Task.toggleDone(task);
        expect(updatedTask.isDone).toBe(true);
      }
    });
  });

  describe("updateTitle", () => {
    it("タイトルを正常に更新できる", async () => {
      const task = Task.create({
        title: "元のタイトル",
        isDone: false,
      }).unwrapOr(null);

      expect(task).not.toBeNull();
      if (task) {
        const result = Task.updateTitle(task, "新しいタイトル");

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.title).toBe("新しいタイトル");
          // 他のプロパティは変更されていないことを確認
          expect(result.value.id).toBe(task.id);
          expect(result.value.isDone).toBe(task.isDone);
        }
      }
    });
  });
});
