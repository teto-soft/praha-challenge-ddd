import {describe, expect, it} from "vitest";
import {createTeamName, InvalidTeamNameError} from "./teamName";

describe("createTeamName", () => {
  it("accepts valid team names", () => {
    const validNames = [
      "Team1",
      "チームA",
      "開発部",
      "エンジニアチーム",
      "DevTeam2023",
      "プロジェクトX",
      "山田太郎",
      "ABCチーム",
    ];

    for (const name of validNames) {
      const result = createTeamName(name);
      expect(result.isOk(), `Should accept "${name}"`).toBe(true);
      result.map((value) => {
        expect(value).toBe(name);
      });
    }
  });

  it("rejects invalid inputs", () => {
    const cases = [
      { input: "", description: "empty string" },
      {
        input: "a".repeat(101),
        description: "too long (101 characters)",
      },
      {
        input: "Team@123",
        description: "contains special characters (@)",
      },
      {
        input: "Team Name",
        description: "contains spaces",
      },
      {
        input: "チーム_開発",
        description: "contains underscore",
      },
      {
        input: "Team-1",
        description: "contains hyphen",
      },
      {
        input: "팀이름",
        description: "contains non-Japanese characters (Korean)",
      },
    ];

    for (const { input, description } of cases) {
      const result = createTeamName(input);
      expect(result.isErr(), `Should reject ${description}`).toBe(true);

      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidTeamNameError);
      });
    }
  });
});
