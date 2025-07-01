import {beforeEach, describe, expect, it, vi} from "vitest";
import {Team} from "./team";
import * as idModule from "../../value-objects/id";
import * as nameModule from "../../value-objects/name";
import * as participantModule from "../participant/participant";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";
import {TeamValidationError} from "./team-error";
import type {StripAllBrands} from "../../value-objects/types/type";

describe("Team", () => {
  const validId = ulid();
  const validName = "チームA";
  const validParticipants = [
    {
      name: "参加者1",
      email: "participant1@example.com",
      enrollmentStatus: "ACTIVE",
    },
    {
      name: "参加者2",
      email: "participant2@example.com",
      enrollmentStatus: "ACTIVE",
    },
  ] as Omit<StripAllBrands<participantModule.IParticipant>, "id">[];
  const validParticipantsWithId = [
    {
      id: ulid(),
      name: "参加者1",
      email: "participant1@example.com",
      enrollmentStatus: "ACTIVE",
    },
    {
      id: ulid(),
      name: "参加者2",
      email: "participant2@example.com",
      enrollmentStatus: "ACTIVE",
    },
  ] as StripAllBrands<participantModule.IParticipant>[];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a team with valid props", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );
      vi.spyOn(participantModule.Participant, "create")
        .mockReturnValueOnce(
          ok(validParticipantsWithId[0] as participantModule.IParticipant),
        )
        .mockReturnValueOnce(
          ok(validParticipantsWithId[1] as participantModule.IParticipant),
        );

      const result = Team.create({
        name: validName,
        participants: validParticipants,
      });

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.id).toBe(validId);
        expect(team.name).toBe(validName);
        expect(team.participants).toHaveLength(2);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(1);
      expect(nameModule.createName).toHaveBeenCalledWith(validName);
      expect(participantModule.Participant.create).toHaveBeenCalledTimes(2);
    });

    it("returns an error when participant count is less than 2", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      const singleParticipant = [validParticipants[0]] as Omit<
        StripAllBrands<participantModule.IParticipant>,
        "id"
      >[];

      const result = Team.create({
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

    it("returns an error when participant count is more than 4", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      const tooManyParticipants = [
        {
          name: "参加者1",
          email: "participant1@example.com",
          enrollmentStatus: "ACTIVE",
        },
        {
          name: "参加者2",
          email: "participant2@example.com",
          enrollmentStatus: "ACTIVE",
        },
        {
          name: "参加者3",
          email: "participant3@example.com",
          enrollmentStatus: "ACTIVE",
        },
        {
          name: "参加者4",
          email: "participant4@example.com",
          enrollmentStatus: "ACTIVE",
        },
        {
          name: "参加者5",
          email: "participant5@example.com",
          enrollmentStatus: "ACTIVE",
        },
      ] as Omit<StripAllBrands<participantModule.IParticipant>, "id">[];

      const result = Team.create({
        name: validName,
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
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      const participantError = new Error("Participant creation failed");
      vi.spyOn(participantModule.Participant, "create").mockReturnValue(
        err(participantError),
      );

      const result = Team.create({
        name: validName,
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
        return ok(validId as idModule.Id);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName as nameModule.Name);
      });

      vi.spyOn(participantModule.Participant, "create").mockImplementation(
        () => {
          executionOrder.push("createParticipant");
          return ok(
            validParticipantsWithId[0] as participantModule.IParticipant,
          );
        },
      );

      Team.create({
        name: validName,
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
        if (id === validId) return ok(validId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      vi.spyOn(participantModule.Participant, "reconstruct")
        .mockReturnValueOnce(
          ok(validParticipantsWithId[0] as participantModule.IParticipant),
        )
        .mockReturnValueOnce(
          ok(validParticipantsWithId[1] as participantModule.IParticipant),
        );

      const result = Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsWithId,
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
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      const singleParticipant = [
        validParticipantsWithId[0],
      ] as StripAllBrands<participantModule.IParticipant>[];

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
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(nameModule, "createName").mockReturnValue(
        ok(validName as nameModule.Name),
      );

      const participantError = new Error("Participant reconstruction failed");
      vi.spyOn(participantModule.Participant, "reconstruct").mockReturnValue(
        err(participantError),
      );

      const result = Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsWithId,
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
        return ok(validId as idModule.Id);
      });

      vi.spyOn(nameModule, "createName").mockImplementation(() => {
        executionOrder.push("createName");
        return ok(validName as nameModule.Name);
      });

      vi.spyOn(participantModule.Participant, "reconstruct").mockImplementation(
        () => {
          executionOrder.push("reconstructParticipant");
          return ok(
            validParticipantsWithId[0] as participantModule.IParticipant,
          );
        },
      );

      Team.reconstruct({
        id: validId,
        name: validName,
        participants: validParticipantsWithId,
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
