import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type EnrollmentStatus = string & { readonly __brand: unique symbol };

export class InvalidEnrollmentStatusError extends Error {
  constructor(enrollmentStatus: string) {
    super(`Invalid enrollmentStatus: ${enrollmentStatus}`);
    this.name = "InvalidEnrollmentStatusError";
  }
}

export function createEnrollmentStatus(
  enrollmentStatus: string,
): Result<EnrollmentStatus, InvalidEnrollmentStatusError> {
  const result = enrollmentStatusSchema.safeParse(enrollmentStatus);

  return result.success
    ? ok(result.data)
    : err(new InvalidEnrollmentStatusError(enrollmentStatus));
}

const enrollmentStatusSchema = z
  .enum(["在籍中", "休会中", "退会済"])
  .transform((value) => value as EnrollmentStatus);
