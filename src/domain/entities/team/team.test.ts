import {beforeEach, describe, expect, it, vi} from "vitest";
import {Team} from "./team";
import * as idModule from "../../value-objects/id";
import * as teamNameModule from "../../value-objects/team/teamName";
import {err, ok} from "neverthrow";
import {ulid} from "ulid";

describe("Team", () => {
  const validId = ulid();
  const validName = "Frontend Team";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a team with valid props", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );
      vi.spyOn(teamNameModule, "createTeamName").mockReturnValue(
        ok(validName as teamNameModule.TeamName),
      );

      const result = Team.create({ name: validName });

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.id).toBe(validId);
        expect(team.name).toBe(validName);
      });

      expect(idModule.createId).toHaveBeenCalledTimes(1);
      expect(teamNameModule.createTeamName).toHaveBeenCalledWith(validName);
    });

    it("returns an error when id creation fails", () => {
      const error = new idModule.InvalidIdError("Some ID error");
      vi.spyOn(idModule, "createId").mockReturnValue(err(error));

      const result = Team.create({ name: validName });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });

    it("returns an error when team name creation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const error = new teamNameModule.InvalidTeamNameError("Some name error");
      vi.spyOn(teamNameModule, "createTeamName").mockReturnValue(err(error));

      const result = Team.create({ name: "Invalid Name" });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });
  });

  describe("reconstruct", () => {
    it("reconstructs a team with valid props", () => {
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === validId) return ok(validId as idModule.Id);
        return err(new idModule.InvalidIdError(`Invalid id: ${id}`));
      });

      vi.spyOn(teamNameModule, "createTeamName").mockReturnValue(
        ok(validName as teamNameModule.TeamName),
      );

      const result = Team.reconstruct({ id: validId, name: validName });

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.id).toBe(validId);
        expect(team.name).toBe(validName);
      });

      expect(idModule.createId).toHaveBeenCalledWith(validId);
      expect(teamNameModule.createTeamName).toHaveBeenCalledWith(validName);
    });

    it("returns an error when id validation fails", () => {
      const invalidId = "invalid-id";

      const error = new idModule.InvalidIdError(`Invalid id: ${invalidId}`);
      vi.spyOn(idModule, "createId").mockImplementation((id?: string) => {
        if (id === invalidId) return err(error);
        return ok(validId as idModule.Id);
      });

      const result = Team.reconstruct({ id: invalidId, name: validName });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });

    it("returns an error when team name validation fails", () => {
      vi.spyOn(idModule, "createId").mockReturnValue(
        ok(validId as idModule.Id),
      );

      const invalidName = "";
      const error = new teamNameModule.InvalidTeamNameError(
        `Invalid team name: ${invalidName}`,
      );
      vi.spyOn(teamNameModule, "createTeamName").mockImplementation(
        (name: string) => {
          if (name === invalidName) return err(error);
          return ok(validName as teamNameModule.TeamName);
        },
      );

      const result = Team.reconstruct({ id: validId, name: invalidName });

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBe(error);
      });
    });
  });
});
