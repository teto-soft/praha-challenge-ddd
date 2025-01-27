import { describe, expect, it } from "vitest";
import { createTitle, InvalidTitleError } from "./title";

describe("createTitle", () => {
  it("accepts valid title", () => {
    const title = "Hello, World";
    const result = createTitle(title);
    expect(result.isOk()).toBe(true);
    result.map((value) => {
      expect(value).toBe(title);
    });
  });

  it("rejects invalid inputs", () => {
    const cases = [
      { input: "", description: "empty string" },
      {
        input: "a".repeat(101),
        description: "too long (101 characters)",
      },
    ];

    cases.forEach(({ input, description }) => {
      const result = createTitle(input);
      expect(result.isErr(), `Should reject ${description}`).toBe(true);

      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidTitleError);
      });
    });
  });
});
