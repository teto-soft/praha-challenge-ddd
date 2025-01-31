import { type Result, err, ok } from "neverthrow";
import { ulid } from "ulid";
import { z } from "zod";

export type Id = string & { readonly __brand: unique symbol };

export class InvalidIdError extends Error {
  constructor(id: string) {
    super(`Invalid id: ${id}`);
    this.name = "InvalidIdError";
  }
}

export function createId(id?: string): Result<Id, InvalidIdError> {
  if (typeof id === "undefined") {
    return createId(ulid());
  }

  const result = ulidSchema.safeParse(id);

  return result.success ? ok(result.data) : err(new InvalidIdError(id));
}

const ulidSchema = z
  .string()
  .length(26)
  .regex(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i)
  .refine((value) => {
    const timestamp = Number.parseInt(value.substring(0, 10), 32);
    return !isNaN(timestamp);
  }, "Invalid ULID timestamp")
  .transform((value): Id => value as Id);
