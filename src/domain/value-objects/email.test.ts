import {describe, expect, it} from "vitest";
import {createEmail, InvalidEmailError} from "./email";

describe("createEmail", () => {
  it("accepts valid email", () => {
    const email = "test@example.com";
    const result = createEmail(email);
    expect(result.isOk()).toBe(true);
    result.map((value) => {
      expect(value).toBe(email);
    });
  });

  it("rejects invalid inputs", () => {
    const cases = [
      { input: "", description: "empty string" },
      { input: "Hello, World", description: "not an email format" },
    ];

    for (const { input, description } of cases) {
      const result = createEmail(input);
      expect(result.isErr(), `Should reject ${description}`).toBe(true);

      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidEmailError);
        expect(error.message).toBe(`Invalid email: ${input}`);
      });
    }
  });
});
