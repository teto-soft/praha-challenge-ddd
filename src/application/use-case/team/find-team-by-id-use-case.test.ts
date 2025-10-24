import {describe, expect, it, vi} from "vitest";
import {ok, err} from "neverthrow";
import {FindTeamByIdUseCase, FindTeamByIdUseCaseError} from "./find-team-by-id-use-case";
import type {TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import {TeamRepositoryFindByIdError} from "../../../domain/entities/team/team-repository";
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

describe("FindTeamByIdUseCase", () => {
  it("指定IDのチームを返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.findById = vi.fn().mockResolvedValue(ok(team));
    const useCase = new FindTeamByIdUseCase(repository);

    const result = await useCase.invoke({ id: team.id });

    expect(repository.findById).toHaveBeenCalledWith(team.id);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: team.id,
      name: team.name,
      participants: team.participants.forPersistence(),
    });
  });

  it("IDが不正な場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const useCase = new FindTeamByIdUseCase(repository);

    const result = await useCase.invoke({ id: "invalid" });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(FindTeamByIdUseCaseError);
  });

  it("リポジトリエラーを変換する", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.findById = vi
      .fn()
      .mockResolvedValue(err(new TeamRepositoryFindByIdError("not found")));
    const useCase = new FindTeamByIdUseCase(repository);

    const result = await useCase.invoke({ id: team.id });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(FindTeamByIdUseCaseError);
    expect(error.message).toBe("FindTeamByIdUseCaseError: not found");
  });
});
