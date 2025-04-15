import {beforeEach, describe, expect, it, vi} from "vitest";
import {Task} from "./task";
import * as idModule from "../../value-objects/id";
import * as titleModule from "../../value-objects/title";
import * as bodyModule from "../../value-objects/body";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";

describe("Task", () => {
  const validId = ulid();
  const validTitle = "Implement authentication";
  const validBody = "Create login page with form validation";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a task with valid props", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(titleModule, "createTitle").mockReturnValue(
        ok(validTitle as titleModule.Title),
      );
      vi.spyOn(bodyModule, "createBody").mockReturnValue(
        ok(validBody as bodyModule.Body),
      );

      const result = Task.create({ title: validTitle, body: validBody });

      expect(result.isOk()).toBe(true);
      result.map((task) => {
        expect(task.id).toBe(validId);
        expect(task.title).toBe(validTitle);
        expect(task.body).toBe(validBody);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(1);
      expect(titleModule.createTitle).toHaveBeenCalledWith(validTitle);
      expect(bodyModule.createBody).toHaveBeenCalledWith(validBody);
    });

    it("returns an error when id creation fails", () => {
      const error = new idModule.InvalidIdError("Some ID error");
      vi.spyOn(idModule, "createId").mockReturnValue(err(error));

      const titleSpy = vi.spyOn(titleModule, "createTitle");
      const bodySpy = vi.spyOn(bodyModule, "createBody");

      const result = Task.create({ title: validTitle, body: validBody });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(titleSpy).not.toHaveBeenCalled();
      expect(bodySpy).not.toHaveBeenCalled();
    });

    it("returns an error when title creation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const error = new titleModule.InvalidTitleError("Some title error");
      vi.spyOn(titleModule, "createTitle").mockReturnValue(err(error));

      const bodySpy = vi.spyOn(bodyModule, "createBody");

      const result = Task.create({ title: "Invalid Title", body: validBody });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(bodySpy).not.toHaveBeenCalled();
    });

    it("should correctly chain the creation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId as idModule.Id);
      });

      vi.spyOn(titleModule, "createTitle").mockImplementation(() => {
        executionOrder.push("createTitle");
        return ok(validTitle as titleModule.Title);
      });

      vi.spyOn(bodyModule, "createBody").mockImplementation(() => {
        executionOrder.push("createBody");
        return ok(validBody as bodyModule.Body);
      });

      Task.create({ title: validTitle, body: validBody });

      expect(executionOrder).toEqual(["createId", "createTitle", "createBody"]);
    });
  });

  describe("reconstruct", () => {
    it("reconstructs a task with valid props", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(titleModule, "createTitle").mockReturnValue(
        ok(validTitle as titleModule.Title),
      );

      vi.spyOn(bodyModule, "createBody").mockReturnValue(
        ok(validBody as bodyModule.Body),
      );

      const result = Task.reconstruct({
        id: validId,
        title: validTitle,
        body: validBody,
      });

      expect(result.isOk()).toBe(true);
      result.map((task) => {
        expect(task.id).toBe(validId);
        expect(task.title).toBe(validTitle);
        expect(task.body).toBe(validBody);
      });

      expect(idModule.createId).toHaveBeenCalledWith(validId);
      expect(titleModule.createTitle).toHaveBeenCalledWith(validTitle);
      expect(bodyModule.createBody).toHaveBeenCalledWith(validBody);
    });

    it("returns an error when id validation fails", () => {
      const invalidId = "invalid-id";

      const error = new idModule.InvalidIdError(`Invalid id: ${invalidId}`);
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === invalidId) return err(error);
        return ok(validId as idModule.Id);
      });

      const titleSpy = vi.spyOn(titleModule, "createTitle");
      const bodySpy = vi.spyOn(bodyModule, "createBody");

      const result = Task.reconstruct({
        id: invalidId,
        title: validTitle,
        body: validBody,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(titleSpy).not.toHaveBeenCalled();
      expect(bodySpy).not.toHaveBeenCalled();
    });

    it("returns an error when title validation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const invalidTitle = "";
      const error = new titleModule.InvalidTitleError(
        `Invalid title: ${invalidTitle}`,
      );
      vi.spyOn(titleModule, "createTitle").mockImplementation(
        (title: string) => {
          if (title === invalidTitle) return err(error);
          return ok(validTitle as titleModule.Title);
        },
      );

      const bodySpy = vi.spyOn(bodyModule, "createBody");

      const result = Task.reconstruct({
        id: validId,
        title: invalidTitle,
        body: validBody,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(bodySpy).not.toHaveBeenCalled();
    });

    it("should correctly chain the validation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId as idModule.Id);
      });

      vi.spyOn(titleModule, "createTitle").mockImplementation(() => {
        executionOrder.push("createTitle");
        return ok(validTitle as titleModule.Title);
      });

      vi.spyOn(bodyModule, "createBody").mockImplementation(() => {
        executionOrder.push("createBody");
        return ok(validBody as bodyModule.Body);
      });

      Task.reconstruct({ id: validId, title: validTitle, body: validBody });

      expect(executionOrder).toEqual(["createId", "createTitle", "createBody"]);
    });
  });
});
