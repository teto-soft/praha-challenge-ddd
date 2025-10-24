import {describe, expect, it, vi} from "vitest";
import {ok, err} from "neverthrow";
import {CreateTeamUseCase, CreateTeamUseCaseError} from "./create-team-use-case";
import type {TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import {TeamRepositoryCreateError} from "../../../domain/entities/team/team-repository";
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

describe("CreateTeamUseCase", () => {
  it("チームを作成して返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.create = vi.fn().mockResolvedValue(ok(team));
    const useCase = new CreateTeamUseCase(repository);

    const result = await useCase.invoke({
      name: "チームA",
      participants: [
        { name: "参加者1", email: "member1@example.com", enrollmentStatus: "在籍中" },
        { name: "参加者2", email: "member2@example.com", enrollmentStatus: "在籍中" },
      ],
    });

    expect(repository.create).toHaveBeenCalled();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: team.id,
      name: team.name,
      participants: team.participants.forPersistence(),
    });
  });

  it("ドメイン生成に失敗した場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const useCase = new CreateTeamUseCase(repository);

    const result = await useCase.invoke({
      name: "",
      participants: [
        { name: "参加者1", email: "member1@example.com", enrollmentStatus: "在籍中" },
        { name: "参加者2", email: "member2@example.com", enrollmentStatus: "在籍中" },
      ],
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CreateTeamUseCaseError);
  });

  it("リポジトリの作成処理が失敗した場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    repository.create = vi
      .fn()
      .mockResolvedValue(err(new TeamRepositoryCreateError("create failed")));
    const useCase = new CreateTeamUseCase(repository);

    const result = await useCase.invoke({
      name: "チームA",
      participants: [
        { name: "参加者1", email: "member1@example.com", enrollmentStatus: "在籍中" },
        { name: "参加者2", email: "member2@example.com", enrollmentStatus: "在籍中" },
      ],
    });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(CreateTeamUseCaseError);
    expect(error.message).toBe("CreateTeamUseCaseError: create failed");
  });
});
