import {describe, expect, it, vi} from "vitest";
import {ok, err} from "neverthrow";
import {UpdateTeamUseCase, UpdateTeamUseCaseError} from "./update-team-use-case";
import type {TeamRepositoryInterface} from "../../../domain/entities/team/team-repository";
import {TeamRepositoryUpdateError} from "../../../domain/entities/team/team-repository";
import {Team, type ITeam} from "../../../domain/entities/team/team";
import {TeamParticipants} from "../../../domain/entities/team/team-participants";

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

describe("UpdateTeamUseCase", () => {
  it("チームを更新して返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    const updatedTeamResult = Team.reconstruct({
      id: team.id,
      name: "更新後のチーム",
      participants: team.participants.forPersistence(),
    });
    if (updatedTeamResult.isErr()) throw updatedTeamResult.error;
    const updatedTeam = updatedTeamResult.value;

    repository.update = vi.fn().mockResolvedValue(ok(updatedTeam));
    const useCase = new UpdateTeamUseCase(repository);

    const result = await useCase.invoke({
      id: team.id,
      name: "更新後のチーム",
    });

    expect(repository.update).toHaveBeenCalledWith(team.id, expect.any(Object));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: updatedTeam.id,
      name: updatedTeam.name,
      participants: updatedTeam.participants.forPersistence(),
    });
  });

  it("参加者情報も更新できる", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    const participantRows = team.participants.forPersistence();
    const updateMock = vi
      .fn()
      .mockImplementation(async (_id: ITeam["id"], payload: Partial<Omit<ITeam, "id">>) => {
        expect(payload.participants).toBeInstanceOf(TeamParticipants);
        return ok(team);
      });

    repository.update = updateMock as TeamRepositoryInterface["update"];
    const useCase = new UpdateTeamUseCase(repository);

    const result = await useCase.invoke({
      id: team.id,
      participants: participantRows,
    });

    expect(updateMock).toHaveBeenCalledWith(team.id, expect.any(Object));
    const [, payload] = updateMock.mock.calls.at(-1) ?? [];
    expect(payload.participants).toBeInstanceOf(TeamParticipants);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: team.id,
      name: team.name,
      participants: team.participants.forPersistence(),
    });
  });

  it("IDが不正な場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const useCase = new UpdateTeamUseCase(repository);

    const result = await useCase.invoke({ id: "invalid" });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UpdateTeamUseCaseError);
  });

  it("リポジトリ更新が失敗した場合はエラーを返す", async () => {
    const repository = createRepositoryMock();
    const team = createTeam();
    repository.update = vi
      .fn()
      .mockResolvedValue(err(new TeamRepositoryUpdateError("update failed")));
    const useCase = new UpdateTeamUseCase(repository);

    const result = await useCase.invoke({ id: team.id });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(UpdateTeamUseCaseError);
    expect(error.message).toBe("UpdateTeamUseCaseError: update failed");
  });
});
