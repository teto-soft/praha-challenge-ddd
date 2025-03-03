import {describe, expect, it} from "vitest";
import {createBody} from "./body";

describe("createBody", () => {
  it("accepts valid body", () => {
    const body = "Hello, World";
    const result = createBody(body);
    expect(result.isOk()).toBe(true);
    result.map((value) => {
      expect(value).toBe(body);
    });
  });
});
