import {beforeEach, describe, expect, it, vi} from "vitest";
import {Team} from "./team";
import * as idModule from "../../value-objects/id";
import {createId} from "../../value-objects/id";
import * as nameModule from "../../value-objects/name";
import {createName} from "../../value-objects/name";
import {createEmail} from "../../value-objects/email";
import {createEnrollmentStatus} from "../../value-objects/participant/enrollmentStatus";
import * as participantModule from "../participant/participant";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";
import {TeamValidationError} from "./team-error";

describe("Team", () => {
  const validId = createId(ulid())._unsafeUnwrap();
  const validName = createName("チームA")._unsafeUnwrap();

  const participant1Id = createId(ulid())._unsafeUnwrap();
  const participant2Id = createId(ulid())._unsafeUnwrap();
  const participant1Name = createName("参加者1")._unsafeUnwrap();
  const participant2Name = createName("参加者2")._unsafeUnwrap();
  const participant1Email = createEmail(
    "participant1@example.com",
  )._unsafeUnwrap();
  const participant2Email = createEmail(
    "participant2@example.com",
  )._unsafeUnwrap();
  const enrollmentStatus = createEnrollmentStatus("在籍中")._unsafeUnwrap();

  const validParticipants = [
    {
      name: "参加者1",
      email: "participant1@example.com",
      enrollmentStatus: "在籍中",
    },
    {
      name: "参加者2",
      email: "participant2@example.com",
      enrollmentStatus: "在籍中",
    },
  ];

  const validParticipantsWithId1 = {
    id: participant1Id,
    name: participant1Name,
    email: participant1Email,
    enrollmentStatus,
  };

  const validParticipantsWithId2 = {
    id: participant2Id,
    name: participant2Name,
    email: participant2Email,
    enrollmentStatus,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a team with valid props", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));
      vi.spyOn(participantModule.Participant, "create")
        .mockReturnValueOnce(ok(validParticipantsWithId1))
        .mockReturnValueOnce(ok(validParticipantsWithId2));

      const result = Team.create({
        name: "チームA",
        participants: validParticipants,
      });

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.id).toBe(validId);
        expect(team.name).toBe(validName);
        expect(team.participants).toHaveLength(2);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(1);
      expect(nameModule.createName).toHaveBeenCalledWith("チームA");
      expect(participantModule.Participant.create).toHaveBeenCalledTimes(2);
    });

    it("returns an error when participant count is less than 2", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      const singleParticipant = validParticipants[0]
        ? [validParticipants[0]]
        : [];

      const result = Team.create({
        name: "チームA",
        participants: singleParticipant,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "チームの参加者は2人以上4人以下でなければなりません",
        );
      });
    });

    it("returns an error when participant count is more than 4", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      const tooManyParticipants = [
        {
          name: "参加者1",
          email: "participant1@example.com",
          enrollmentStatus: "在籍中",
        },
        {
          name: "参加者2",
          email: "participant2@example.com",
          enrollmentStatus: "在籍中",
        },
        {
          name: "参加者3",
          email: "participant3@example.com",
          enrollmentStatus: "在籍中",
        },
        {
          name: "参加者4",
          email: "participant4@example.com",
          enrollmentStatus: "在籍中",
        },
        {
          name: "参加者5",
          email: "participant5@example.com",
          enrollmentStatus: "在籍中",
        },
      ];

      const result = Team.create({
        name: "チームA",
        participants: tooManyParticipants,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "チームの参加者は2人以上4人以下でなければなりません",
        );
      });
    });

    it("returns an error when participant creation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      const participantError = new Error("Participant creation failed");
      vi.spyOn(participantModule.Participant, "create").mockReturnValue(
        err(participantError),
      );

      const result = Team.create({
        name: "チームA",
        participants: validParticipants,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(participantError);
      });
    });

    it("should correctly chain the creation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName);
      });

      vi.spyOn(participantModule.Participant, "create").mockImplementation(
        () => {
          executionOrder.push("createParticipant");
          return ok(validParticipantsWithId1);
        },
      );

      Team.create({
        name: "チームA",
        participants: validParticipants,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createName",
        "createParticipant",
        "createParticipant",
      ]);
    });
  });

  describe("reconstruct", () => {
    it("reconstructs a team with valid props", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      vi.spyOn(participantModule.Participant, "reconstruct")
        .mockReturnValueOnce(ok(validParticipantsWithId1))
        .mockReturnValueOnce(ok(validParticipantsWithId2));

      const validParticipantsPlain = [
        {
          id: participant1Id,
          name: participant1Name,
          email: participant1Email,
          enrollmentStatus,
        },
        {
          id: participant2Id,
          name: participant2Name,
          email: participant2Email,
          enrollmentStatus,
        },
      ];

      const result = Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsPlain,
      });

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.id).toBe(validId);
        expect(team.name).toBe(validName);
        expect(team.participants).toHaveLength(2);
      });

      expect(idModule.createId).toHaveBeenCalledWith(validId);
      expect(nameModule.createName).toHaveBeenCalledWith(validName);
      expect(participantModule.Participant.reconstruct).toHaveBeenCalledTimes(
        2,
      );
    });

    it("returns an error when participant count validation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      const singleParticipant = [
        {
          id: participant1Id,
          name: participant1Name,
          email: participant1Email,
          enrollmentStatus,
        },
      ];

      const result = Team.reconstruct({
        id: validId,
        name: validName,
        participants: singleParticipant,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "チームの参加者は2人以上4人以下でなければなりません",
        );
      });
    });

    it("returns an error when participant reconstruction fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(ok(validId));
      vi.spyOn(nameModule, "createName").mockReturnValue(ok(validName));

      const participantError = new Error("Participant reconstruction failed");
      vi.spyOn(participantModule.Participant, "reconstruct").mockReturnValue(
        err(participantError),
      );

      const validParticipantsPlain = [
        {
          id: participant1Id,
          name: participant1Name,
          email: participant1Email,
          enrollmentStatus,
        },
        {
          id: participant2Id,
          name: participant2Name,
          email: participant2Email,
          enrollmentStatus,
        },
      ];

      const result = Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsPlain,
      });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(participantError);
      });
    });

    it("should correctly chain the validation of value objects", () => {
      const executionOrder: string[] = [];

      vi.spyOn(idModule, "createId").mockImplementation(() => {
        executionOrder.push("createId");
        return ok(validId);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName);
      });

      vi.spyOn(participantModule.Participant, "reconstruct").mockImplementation(
        () => {
          executionOrder.push("reconstructParticipant");
          return ok(validParticipantsWithId1);
        },
      );

      const validParticipantsPlain = [
        {
          id: participant1Id,
          name: participant1Name,
          email: participant1Email,
          enrollmentStatus,
        },
        {
          id: participant2Id,
          name: participant2Name,
          email: participant2Email,
          enrollmentStatus,
        },
      ];

      Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsPlain,
      });

      expect(executionOrder).toEqual([
        "createId",
        "createName",
        "reconstructParticipant",
        "reconstructParticipant",
      ]);
    });
  });
});
