import {describe, expect, it, vi} from "vitest";
import {ok, err} from "neverthrow";
import {FindManyTeamsUseCase, FindManyTeamsUseCaseError} from "./find-many-teams-use-case";
import type {TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import {TeamRepositoryListError} from "../../../domain/entities/team/team-repository";
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

describe("FindManyTeamsUseCase", () => {
  it("チーム一覧をpayloadとして返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.list = vi.fn().mockResolvedValue(ok([team]));
    const useCase = new FindManyTeamsUseCase(repository);

    const result = await useCase.invoke();

    expect(repository.list).toHaveBeenCalled();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([
      {
        id: team.id,
        name: team.name,
        participants: team.participants.forPersistence(),
      },
    ]);
  });

  it("リポジトリエラーを変換する", async () => {
    const repository = createRepositoryMock();
    repository.list = vi
      .fn()
      .mockResolvedValue(err(new TeamRepositoryListError("repository error")));
    const useCase = new FindManyTeamsUseCase(repository);

    const result = await useCase.invoke();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(FindManyTeamsUseCaseError);
    expect(error.message).toBe("FindManyTeamsUseCaseError: repository error");
  });
});
