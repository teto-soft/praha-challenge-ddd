import { describe, expect, it } from "vitest";
import { type IsDone, createIsDone } from "./isDone";

function assertType<T>(_value: T) {
  return true;
}

describe("createIsDone", () => {
  it("creates IsDone from true", () => {
    const isDone = createIsDone(true);
    expect(isDone).toBe(true);
  });

  it("creates IsDone from false", () => {
    const isDone = createIsDone(false);
    expect(isDone).toBe(false);
  });

  it("should have correct type", () => {
    const isDone = createIsDone(true);
    expect(assertType<IsDone>(isDone)).toBe(true);
  });
});
