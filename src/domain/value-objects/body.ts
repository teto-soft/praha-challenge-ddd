import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type Body = string & { readonly __brand: unique symbol };

export class InvalidBodyError extends Error {
  constructor(body: string) {
    super(`Invalid body: ${body}`);
    this.name = "InvalidBodyError";
  }
}

export function createBody(body: string): Result<Body, InvalidBodyError> {
  const result = bodySchema.safeParse(body);

  return result.success ? ok(result.data) : err(new InvalidBodyError(body));
}

const bodySchema = z.string().transform((value) => value as Body);
