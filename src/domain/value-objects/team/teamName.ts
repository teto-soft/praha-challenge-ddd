import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type TeamName = string & { readonly __brand: unique symbol };

export class InvalidTeamNameError extends Error {
  constructor(teamName: string) {
    super(`Invalid teamName: ${teamName}`);
    this.name = "InvalidTeamNameError";
  }
}

export function createTeamName(
  teamName: string,
): Result<TeamName, InvalidTeamNameError> {
  const result = teamNameSchema.safeParse(teamName);

  return result.success
    ? ok(result.data)
    : err(new InvalidTeamNameError(teamName));
}

// 英文字のみを許可する正規表現
const validCharsRegex = /^[a-zA-Z]+$/;

const teamNameSchema = z
  .string()
  .min(1, "TeamName must not be empty")
  .max(100, "TeamName must be less than 100 characters")
  .refine(
    (value) => validCharsRegex.test(value),
    "チーム名には英文字のみ使用できます",
  )
  .transform((value): TeamName => value as TeamName);
