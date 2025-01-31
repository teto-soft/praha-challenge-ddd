import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { InvalidIdError, createId } from "./id";

describe("createId", () => {
  it("generates valid ULID", () => {
    const result = createId();
    expect(result.isOk()).toBe(true);
    result.map((id) => {
      expect(id).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i);
    });
  });

  it("accepts valid ULID", () => {
    const validId = ulid();
    const result = createId(validId);
    expect(result.isOk()).toBe(true);
    result.map((id) => {
      expect(id).toBe(validId);
    });
  });

  it("rejects invalid inputs", () => {
    const cases = [
      "123",
      "01ARZ3NDEKTSV4RRFFQ69G5FAO", // Invalid char 'O'
      "ZZZZZZZZZZ3NDEKTSV4RRFFQ69", // Invalid timestamp
      "",
      "01ARZ3NDEKTSV4RRFFQ69G5FAVA", // Too long
    ];

    for (const invalidId of cases) {
      const result = createId(invalidId);
      expect(result.isErr()).toBe(true);
      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidIdError);
        expect(error.message).toBe(`Invalid id: ${invalidId}`);
      });
    }
  });
});
