import {beforeEach, describe, expect, it, vi} from "vitest";
import {Participant} from "./participant";
import * as idModule from "../../value-objects/id";
import * as nameModule from "../../value-objects/name";
import * as emailModule from "../../value-objects/email";
import * as enrollmentStatusModule from "../../value-objects/participant/enrollmentStatus";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";

describe("Participant", () => {
  const validId = ulid();
  const validName = "John Doe";
  const validEmail = "john.doe@example.com";
  const validEnrollmentStatus = "ENROLLED";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a participant with valid props", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );
      vi.spyOn(emailModule, "createEmail").mockReturnValue(
        ok(validEmail as emailModule.Email),
      );
      vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      ).mockReturnValue(
        ok(validEnrollmentStatus as enrollmentStatusModule.EnrollmentStatus),
      );

      const result = Participant.create({
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isOk()).toBe(true);
      result.map((participant) => {
        expect(participant.id).toBe(validId);
        expect(participant.name).toBe(validName);
        expect(participant.email).toBe(validEmail);
        expect(participant.enrollmentStatus).toBe(validEnrollmentStatus);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(1);
      expect(nameModule.createName).toHaveBeenCalledWith(validName);
      expect(emailModule.createEmail).toHaveBeenCalledWith(validEmail);
      expect(
        enrollmentStatusModule.createEnrollmentStatus,
      ).toHaveBeenCalledWith(validEnrollmentStatus);
    });

    it("returns an error when id creation fails", () => {
      const error = new idModule.InvalidIdError("Some ID error");
      vi.spyOn(idModule, "createId").mockReturnValue(err(error));

      const nameSpy = vi.spyOn(nameModule, "createName");
      const emailSpy = vi.spyOn(emailModule, "createEmail");
      const enrollmentStatusSpy = vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      );

      const result = Participant.create({
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(nameSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(enrollmentStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when name creation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const error = new nameModule.InvalidNameError("Some name error");
      vi.spyOn(nameModule, "createName").mockReturnValue(err(error));

      const emailSpy = vi.spyOn(emailModule, "createEmail");
      const enrollmentStatusSpy = vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      );

      const result = Participant.create({
        name: "Invalid Name",
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(emailSpy).not.toHaveBeenCalled();
      expect(enrollmentStatusSpy).not.toHaveBeenCalled();
    });

    it("should correctly chain the creation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId as idModule.Id);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName as nameModule.Name);
      });

      vi.spyOn(emailModule, "createEmail").mockImplementation(() => {
        executionOrder.push("createEmail");
        return ok(validEmail as emailModule.Email);
      });

      vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      ).mockImplementation(() => {
        executionOrder.push("createEnrollmentStatus");
        return ok(
          validEnrollmentStatus as enrollmentStatusModule.EnrollmentStatus,
        );
      });

      Participant.create({
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createName",
        "createEmail",
        "createEnrollmentStatus",
      ]);
    });
  });

  describe("reconstruct", () => {
    it("reconstructs a participant with valid props", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      vi.spyOn(emailModule, "createEmail").mockReturnValue(
        ok(validEmail as emailModule.Email),
      );

      vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      ).mockReturnValue(
        ok(validEnrollmentStatus as enrollmentStatusModule.EnrollmentStatus),
      );

      const result = Participant.reconstruct({
        id: validId,
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isOk()).toBe(true);
      result.map((participant) => {
        expect(participant.id).toBe(validId);
        expect(participant.name).toBe(validName);
        expect(participant.email).toBe(validEmail);
        expect(participant.enrollmentStatus).toBe(validEnrollmentStatus);
      });

      expect(idModule.createId).toHaveBeenCalledWith(validId);
      expect(nameModule.createName).toHaveBeenCalledWith(validName);
      expect(emailModule.createEmail).toHaveBeenCalledWith(validEmail);
      expect(
        enrollmentStatusModule.createEnrollmentStatus,
      ).toHaveBeenCalledWith(validEnrollmentStatus);
    });

    it("returns an error when id validation fails", () => {
      const invalidId = "invalid-id";

      const error = new idModule.InvalidIdError(`Invalid id: ${invalidId}`);
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === invalidId) return err(error);
        return ok(validId as idModule.Id);
      });

      const nameSpy = vi.spyOn(nameModule, "createName");
      const emailSpy = vi.spyOn(emailModule, "createEmail");
      const enrollmentStatusSpy = vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      );

      const result = Participant.reconstruct({
        id: invalidId,
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(nameSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(enrollmentStatusSpy).not.toHaveBeenCalled();
    });

    it("returns an error when name validation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const invalidName = "";
      const error = new nameModule.InvalidNameError(
        `Invalid name: ${invalidName}`,
      );
      vi.spyOn(nameModule, "createName").mockImplementation((name: string) => {
        if (name === invalidName) return err(error);
        return ok(validName as nameModule.Name);
      });

      const emailSpy = vi.spyOn(emailModule, "createEmail");
      const enrollmentStatusSpy = vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      );

      const result = Participant.reconstruct({
        id: validId,
        name: invalidName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });

      expect(emailSpy).not.toHaveBeenCalled();
      expect(enrollmentStatusSpy).not.toHaveBeenCalled();
    });

    it("should correctly chain the validation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId as idModule.Id);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName as nameModule.Name);
      });

      vi.spyOn(emailModule, "createEmail").mockImplementation(() => {
        executionOrder.push("createEmail");
        return ok(validEmail as emailModule.Email);
      });

      vi.spyOn(
        enrollmentStatusModule,
        "createEnrollmentStatus",
      ).mockImplementation(() => {
        executionOrder.push("createEnrollmentStatus");
        return ok(
          validEnrollmentStatus as enrollmentStatusModule.EnrollmentStatus,
        );
      });

      Participant.reconstruct({
        id: validId,
        name: validName,
        email: validEmail,
        enrollmentStatus: validEnrollmentStatus,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createName",
        "createEmail",
        "createEnrollmentStatus",
      ]);
    });
  });
});
