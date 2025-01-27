import { err, ok, Result } from "neverthrow";
import { z } from "zod";

export type Title = string & { readonly __brand: unique symbol };

export class InvalidTitleError extends Error {
  constructor(title: string) {
    super(`Invalid title: ${title}`);
    this.name = "InvalidTitleError";
  }
}

export function createTitle(title: string): Result<Title, InvalidTitleError> {
  const result = titleSchema.safeParse(title);

  return result.success ? ok(result.data) : err(new InvalidTitleError(title));
}

const titleSchema = z
  .string()
  .min(1, "Title must not be empty")
  .max(100, "Title must be less than 100 characters")
  .transform((value): Title => value as Title);
