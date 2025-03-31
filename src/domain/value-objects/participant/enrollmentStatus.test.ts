import {describe, expect, it} from "vitest";
import {createEnrollmentStatus, InvalidEnrollmentStatusError} from "./enrollmentStatus";

describe("createEnrollmentStatus", () => {
  it("accepts valid enrollmentStatus values", () => {
    const validStatuses = ["在籍中", "休会中", "退会済"];

    for (const status of validStatuses) {
      const result = createEnrollmentStatus(status);
      expect(result.isOk(), `Should accept ${status}`).toBe(true);

      result.map((value) => {
        expect(value).toBe(status);
      });
    }
  });

  it("rejects invalid enrollmentStatus values", () => {
    const invalidStatuses = [
      { input: "", description: "empty string" },
      { input: "無効なステータス", description: "not in enum" },
      { input: "在籍", description: "partial match" },
    ];

    for (const { input, description } of invalidStatuses) {
      const result = createEnrollmentStatus(input);
      expect(result.isErr(), `Should reject ${description}`).toBe(true);

      result.mapErr((error) => {
        expect(error).toBeInstanceOf(InvalidEnrollmentStatusError);
        expect(error.message).toBe(`Invalid enrollmentStatus: ${input}`);
      });
    }
  });
});
