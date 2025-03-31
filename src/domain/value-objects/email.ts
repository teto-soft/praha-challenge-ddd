import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type Email = string & { readonly __brand: unique symbol };

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
    this.name = "InvalidEmailError";
  }
}

export function createEmail(email: string): Result<Email, InvalidEmailError> {
  const result = emailSchema.safeParse(email);

  return result.success ? ok(result.data) : err(new InvalidEmailError(email));
}

const emailSchema = z
  .string()
  .email()
  .transform((value) => value as Email);
