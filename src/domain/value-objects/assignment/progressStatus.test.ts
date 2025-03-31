import {describe, expect, it} from "vitest";
import {createProgressStatus, InvalidProgressStatusError,} from "./progressStatus";

describe("createProgressStatus", () => {
  it("accepts valid progressStatus", () => {
    const validStatuses = ["未着手", "取組中", "レビュー待ち", "完了"];

    for (const status of validStatuses) {
      const result = createProgressStatus(status);
      expect(result.isOk(), `Should accept "${status}"`).toBe(true);

      result.map((value) => {
        expect(value).toBe(status);
      });
    }
  });

  it("rejects invalid inputs", () => {
    const cases = [
      { input: "", description: "empty string" },
      { input: "Hello, World", description: "non-enum value" },
      { input: "進行中", description: "similar but invalid value" },
    ];

    for (const { input, description } of cases) {
      const result = createProgressStatus(input);
      expect(result.isErr(), `Should reject ${description}`).toBe(true);

      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidProgressStatusError);
      });
    }
  });
});
