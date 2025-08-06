import {beforeEach, describe, expect, it, vi} from "vitest";
import {Assignment} from "./assignment";
import * as idModule from "../../value-objects/id";
import * as progressStatusModule from "../../value-objects/assignment/progressStatus";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";

describe("Assignment", () => {
  const validId = ulid();
  const validTaskId = ulid();
  const validParticipantId = ulid();
  const validProgressStatus = "IN_PROGRESS";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates an assignment with valid props", () => {
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(ok(validTaskId as idModule.Id))
        .mockReturnValueOnce(ok(validParticipantId as idModule.Id));

      vi.spyOn(progressStatusModule, "createProgressStatus").mockReturnValue(
        ok(validProgressStatus as progressStatusModule.ProgressStatus),
      );

      const result = Assignment.create({
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isOk()).toBe(true);
      result.map((assignment) => {
        expect(assignment.id).toBe(validId);
        expect(assignment.taskId).toBe(validTaskId);
        expect(assignment.participantId).toBe(validParticipantId);
        expect(assignment.progressStatus).toBe(validProgressStatus);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(3);
      expect(idModule.createId).toHaveBeenNthCalledWith(1);
      expect(idModule.createId).toHaveBeenNthCalledWith(2, validTaskId);
      expect(idModule.createId).toHaveBeenNthCalledWith(3, validParticipantId);
      expect(progressStatusModule.createProgressStatus).toHaveBeenCalledWith(
        validProgressStatus,
      );
    });

    it("returns an error when id creation fails", () => {
      const error = new idModule.InvalidIdError("Some ID error");
      vi.spyOn(idModule, "createId").mockReturnValue(err(error));

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.create({
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when taskId creation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValueOnce(
        ok(validId as idModule.Id),
      );

      const error = new idModule.InvalidIdError("Some task ID error");
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(err(error));

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.create({
        taskId: "invalid-task-id",
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when participantId creation fails", () => {
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(ok(validTaskId as idModule.Id));

      const error = new idModule.InvalidIdError("Some participant ID error");
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(ok(validTaskId as idModule.Id))
        .mockReturnValueOnce(err(error));

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.create({
        taskId: validTaskId,
        participantId: "invalid-participant-id",
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when progressStatus creation fails", () => {
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(ok(validTaskId as idModule.Id))
        .mockReturnValueOnce(ok(validParticipantId as idModule.Id));

      const error = new progressStatusModule.InvalidProgressStatusError(
        "Some progress status error",
      );
      vi.spyOn(progressStatusModule, "createProgressStatus").mockReturnValue(
        err(error),
      );

      const result = Assignment.create({
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: "INVALID_STATUS",
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });

    it("should correctly chain the creation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (!id) {
          executionOrder.push("createId");
          return ok(validId as idModule.Id);
        }
        if (id === validTaskId) {
          executionOrder.push("createTaskId");
          return ok(validTaskId as idModule.Id);
        }
        if (id === validParticipantId) {
          executionOrder.push("createParticipantId");
          return ok(validParticipantId as idModule.Id);
        }
        return err(new idModule.InvalidIdError("Invalid id"));
      });

      vi.spyOn(progressStatusModule, "createProgressStatus").mockImplementation(
        () => {
          executionOrder.push("createProgressStatus");
          return ok(validProgressStatus as progressStatusModule.ProgressStatus);
        },
      );

      Assignment.create({
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createTaskId",
        "createParticipantId",
        "createProgressStatus",
      ]);
    });
  });

  describe("reconstruct", () => {
    it("reconstructs an assignment with valid props", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        if (id === validTaskId) return ok(validTaskId as idModule.Id);
        if (id === validParticipantId)
          return ok(validParticipantId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(progressStatusModule, "createProgressStatus").mockReturnValue(
        ok(validProgressStatus as progressStatusModule.ProgressStatus),
      );

      const result = Assignment.reconstruct({
        id: validId,
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isOk()).toBe(true);
      result.map((assignment) => {
        expect(assignment.id).toBe(validId);
        expect(assignment.taskId).toBe(validTaskId);
        expect(assignment.participantId).toBe(validParticipantId);
        expect(assignment.progressStatus).toBe(validProgressStatus);
      });

      expect(idModule.createId).toHaveBeenCalledWith(validId);
      expect(idModule.createId).toHaveBeenCalledWith(validTaskId);
      expect(idModule.createId).toHaveBeenCalledWith(validParticipantId);
      expect(progressStatusModule.createProgressStatus).toHaveBeenCalledWith(
        validProgressStatus,
      );
    });

    it("returns an error when id validation fails", () => {
      const invalidId = "invalid-id";

      const error = new idModule.InvalidIdError(`Invalid id: ${invalidId}`);
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === invalidId) return err(error);
        return ok(validId as idModule.Id);
      });

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.reconstruct({
        id: invalidId,
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when taskId validation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValueOnce(
        ok(validId as idModule.Id),
      );

      const invalidTaskId = "invalid-task-id";
      const error = new idModule.InvalidIdError(`Invalid id: ${invalidTaskId}`);
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        if (id === invalidTaskId) return err(error);
        return ok(validTaskId as idModule.Id);
      });

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.reconstruct({
        id: validId,
        taskId: invalidTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when participantId validation fails", () => {
      vi.spyOn(idModule, "createId")
        .mockReturnValueOnce(ok(validId as idModule.Id))
        .mockReturnValueOnce(ok(validTaskId as idModule.Id));

      const invalidParticipantId = "invalid-participant-id";
      const error = new idModule.InvalidIdError(
        `Invalid id: ${invalidParticipantId}`,
      );
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        if (id === validTaskId) return ok(validTaskId as idModule.Id);
        if (id === invalidParticipantId) return err(error);
        return ok(validParticipantId as idModule.Id);
      });

      const progressStatusSpy = vi.spyOn(
        progressStatusModule,
        "createProgressStatus",
      );

      const result = Assignment.reconstruct({
        id: validId,
        taskId: validTaskId,
        participantId: invalidParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(progressStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when progressStatus validation fails", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        if (id === validTaskId) return ok(validTaskId as idModule.Id);
        if (id === validParticipantId)
          return ok(validParticipantId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      const invalidProgressStatus = "INVALID_STATUS";
      const error = new progressStatusModule.InvalidProgressStatusError(
        `Invalid progress status: ${invalidProgressStatus}`,
      );
      vi.spyOn(progressStatusModule, "createProgressStatus").mockImplementation(
        (status: string) => {
          if (status === invalidProgressStatus) return err(error);
          return ok(validProgressStatus as progressStatusModule.ProgressStatus);
        },
      );

      const result = Assignment.reconstruct({
        id: validId,
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: invalidProgressStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });

    it("should correctly chain the validation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) {
          executionOrder.push("createId");
          return ok(validId as idModule.Id);
        }
        if (id === validTaskId) {
          executionOrder.push("createTaskId");
          return ok(validTaskId as idModule.Id);
        }
        if (id === validParticipantId) {
          executionOrder.push("createParticipantId");
          return ok(validParticipantId as idModule.Id);
        }
        return err(new idModule.InvalidIdError("Invalid id"));
      });

      vi.spyOn(progressStatusModule, "createProgressStatus").mockImplementation(
        () => {
          executionOrder.push("createProgressStatus");
          return ok(validProgressStatus as progressStatusModule.ProgressStatus);
        },
      );

      Assignment.reconstruct({
        id: validId,
        taskId: validTaskId,
        participantId: validParticipantId,
        progressStatus: validProgressStatus,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createTaskId",
        "createParticipantId",
        "createProgressStatus",
      ]);
    });
  });
});
