import {describe, expect, it, vi} from "vitest";
import {ok, err} from "neverthrow";
import {DeleteTeamUseCase, DeleteTeamUseCaseError} from "./delete-team-use-case";
import type {TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import {TeamRepositoryDeleteError} from "../../../domain/entities/team/team-repository";
import {Team, type ITeam} from "../../../domain/entities/team/team";

const createTeam = (): ITeam => {
  const result = Team.create({
    name: "チームA",
    participants: [
      { name: "参加者1", email: "member1@example.com", enrollmentStatus: "在籍中" },
      { name: "参加者2", email: "member2@example.com", enrollmentStatus: "在籍中" },
    ],
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value;
};

const createRepositoryMock = (): TeamRepositoryInterface =>
  ({
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as TeamRepositoryInterface);

describe("DeleteTeamUseCase", () => {
  it("チームを削除する", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.delete = vi.fn().mockResolvedValue(ok(undefined));
    const useCase = new DeleteTeamUseCase(repository);

    const result = await useCase.invoke({ id: team.id });

    expect(repository.delete).toHaveBeenCalledWith(team.id);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeUndefined();
  });

  it("IDが不正な場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const useCase = new DeleteTeamUseCase(repository);

    const result = await useCase.invoke({ id: "invalid" });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(DeleteTeamUseCaseError);
  });

  it("リポジトリ削除が失敗した場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.delete = vi
      .fn()
      .mockResolvedValue(err(new TeamRepositoryDeleteError("delete failed")));
    const useCase = new DeleteTeamUseCase(repository);

    const result = await useCase.invoke({ id: team.id });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(DeleteTeamUseCaseError);
    expect(error.message).toBe("DeleteTeamUseCaseError: delete failed");
  });
});
