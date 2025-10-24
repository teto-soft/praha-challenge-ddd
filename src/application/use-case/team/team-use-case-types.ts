import type {ITeam} from "../../../domain/entities/team/team";

export type TeamUseCaseParticipantPayload = {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
};

export type TeamUseCasePayload = {
  id: string;
  name: string;
  participants: TeamUseCaseParticipantPayload[];
};

export const toTeamUseCasePayload = (team: ITeam): TeamUseCasePayload => ({
  id: team.id,
  name: team.name,
  participants: team.participants.forPersistence().map(
    (participant) =>
      ({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        enrollmentStatus: participant.enrollmentStatus,
      }) satisfies TeamUseCaseParticipantPayload,
  ),
});
