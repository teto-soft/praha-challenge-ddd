import {err, ok, type Result} from "neverthrow";
import {z} from "zod";

export type ProgressStatus = string & { readonly __brand: unique symbol };

export class InvalidProgressStatusError extends Error {
  constructor(progressStatus: string) {
    super(`Invalid progressStatus: ${progressStatus}`);
    this.name = "InvalidProgressStatusError";
  }
}

export function createProgressStatus(
  progressStatus: string,
): Result<ProgressStatus, InvalidProgressStatusError> {
  const result = progressStatusSchema.safeParse(progressStatus);

  return result.success
    ? ok(result.data)
    : err(new InvalidProgressStatusError(progressStatus));
}

const progressStatusSchema = z
  .enum(["未着手", "取組中", "レビュー待ち", "完了"])
  .transform((value): ProgressStatus => value as ProgressStatus);
