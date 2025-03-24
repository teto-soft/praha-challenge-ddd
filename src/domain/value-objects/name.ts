import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type Name = string & { readonly __brand: unique symbol };

export class InvalidNameError extends Error {
  constructor(name: string) {
    super(`Invalid name: ${name}`);
    this.name = "InvalidNameError";
  }
}

export function createName(name: string): Result<Name, InvalidNameError> {
  const result = nameSchema.safeParse(name);

  return result.success ? ok(result.data) : err(new InvalidNameError(name));
}

// 英数字と日本語（ひらがな、カタカナ、漢字）のみを許可する正規表現
const validCharsRegex = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々]+$/;

const nameSchema = z
  .string()
  .min(1, "Name must not be empty")
  .max(100, "Name must be less than 100 characters")
  .refine(
    (value) => validCharsRegex.test(value),
    "チーム名には英数字と日本語（ひらがな、カタカナ、漢字）のみ使用できます",
  )
  .transform((value): Name => value as Name);
