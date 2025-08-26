import {describe, expect, it} from "vitest";
import {TeamParticipants} from "./team-participants";
import {TeamValidationError} from "./team-error";
import {ulid} from "ulid";
import {createId} from "../../value-objects/id";
import {createName} from "../../value-objects/name";
import {createEmail} from "../../value-objects/email";
import {createEnrollmentStatus} from "../../value-objects/participant/enrollmentStatus";

describe("TeamParticipants", () => {
  const createParticipant = (email: string, name = "参加者") => {
    const idResult = createId(ulid());
    const nameResult = createName(name);
    const emailResult = createEmail(email);
    const statusResult = createEnrollmentStatus("在籍中");

    if (
      !idResult.isOk() ||
      !nameResult.isOk() ||
      !emailResult.isOk() ||
      !statusResult.isOk()
    ) {
      throw new Error("Failed to create test participant");
    }

    return {
      id: idResult.value,
      name: nameResult.value,
      email: emailResult.value,
      enrollmentStatus: statusResult.value,
    };
  };

  const validParticipant1 = createParticipant("user1@example.com", "参加者1");
  const validParticipant2 = createParticipant("user2@example.com", "参加者2");

  const validParticipants = [validParticipant1, validParticipant2];

  describe("create", () => {
    it("2人の参加者でチームを作成できる", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.length).toBe(2);
        expect(team.value).toHaveLength(2);
      });
    });

    it("3人の参加者でチームを作成できる", () => {
      const participants = [
        ...validParticipants,
        createParticipant("user3@example.com", "参加者3"),
      ];
      const result = TeamParticipants.create(participants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.length).toBe(3);
      });
    });

    it("4人の参加者でチームを作成できる", () => {
      const participants = [
        ...validParticipants,
        createParticipant("user3@example.com", "参加者3"),
        createParticipant("user4@example.com", "参加者4"),
      ];
      const result = TeamParticipants.create(participants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.length).toBe(4);
      });
    });

    it("1人の参加者ではエラーになる", () => {
      const result = TeamParticipants.create([validParticipant1]);

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "チームの参加者は2人以上4人以下でなければなりません",
        );
        expect(err.message).toContain("現在の参加者数: 1");
      });
    });

    it("5人の参加者ではエラーになる", () => {
      const participants = [
        ...validParticipants,
        createParticipant("user3@example.com", "参加者3"),
        createParticipant("user4@example.com", "参加者4"),
        createParticipant("user5@example.com", "参加者5"),
      ];
      const result = TeamParticipants.create(participants);

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "チームの参加者は2人以上4人以下でなければなりません",
        );
        expect(err.message).toContain("現在の参加者数: 5");
      });
    });

    it("同じメールアドレスの参加者が含まれる場合はエラーになる", () => {
      const participants = [
        createParticipant("duplicate@example.com", "参加者1"),
        createParticipant("duplicate@example.com", "参加者2"),
      ];
      const result = TeamParticipants.create(participants);

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
        expect(err.message).toContain(
          "同じメールアドレスの参加者が複数存在します",
        );
        expect(err.message).toContain("duplicate@example.com");
      });
    });
  });

  describe("reconstruct", () => {
    it("有効な参加者リストで再構築できる", () => {
      const result = TeamParticipants.reconstruct(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.length).toBe(2);
      });
    });

    it("再構築時も同じバリデーションが適用される", () => {
      const result = TeamParticipants.reconstruct([validParticipant1]);

      expect(result.isErr()).toBe(true);
      result.mapErr((err) => {
        expect(err).toBeInstanceOf(TeamValidationError);
      });
    });
  });

  describe("value getter", () => {
    it("参加者の配列のコピーを返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const value = team.value;
        expect(value).toHaveLength(2);
        expect(value).not.toBe(validParticipants); // 別の配列インスタンスであること
        expect(value[0]).toEqual(validParticipant1);
        expect(value[1]).toEqual(validParticipant2);
      });
    });
  });

  describe("length getter", () => {
    it("参加者の人数を返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.length).toBe(2);
      });
    });
  });

  describe("add", () => {
    it("新しい参加者を追加できる", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const newParticipant = createParticipant(
          "user3@example.com",
          "参加者3",
        );
        const addResult = team.add(newParticipant);

        expect(addResult.isOk()).toBe(true);
        addResult.map((newTeam) => {
          expect(newTeam.length).toBe(3);
          expect(newTeam.contains(newParticipant.id)).toBe(true);
        });
      });
    });

    it("4人のチームに参加者を追加するとエラーになる", () => {
      const fourParticipants = [
        ...validParticipants,
        createParticipant("user3@example.com", "参加者3"),
        createParticipant("user4@example.com", "参加者4"),
      ];
      const result = TeamParticipants.create(fourParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const newParticipant = createParticipant(
          "user5@example.com",
          "参加者5",
        );
        const addResult = team.add(newParticipant);

        expect(addResult.isErr()).toBe(true);
        addResult.mapErr((err) => {
          expect(err).toBeInstanceOf(TeamValidationError);
          expect(err.message).toContain("現在の参加者数: 5");
        });
      });
    });

    it("同じメールアドレスの参加者を追加するとエラーになる", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const duplicateEmailParticipant = createParticipant(
          "user1@example.com",
          "新参加者",
        );
        const addResult = team.add(duplicateEmailParticipant);

        expect(addResult.isErr()).toBe(true);
        addResult.mapErr((err) => {
          expect(err).toBeInstanceOf(TeamValidationError);
          expect(err.message).toContain(
            "同じメールアドレスの参加者が複数存在します",
          );
        });
      });
    });
  });

  describe("remove", () => {
    it("参加者を削除できる", () => {
      const threeParticipants = [
        ...validParticipants,
        createParticipant("user3@example.com", "参加者3"),
      ];
      const result = TeamParticipants.create(threeParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const removeResult = team.remove(validParticipant1.id);

        expect(removeResult.isOk()).toBe(true);
        removeResult.map((newTeam) => {
          expect(newTeam.length).toBe(2);
          expect(newTeam.contains(validParticipant1.id)).toBe(false);
        });
      });
    });

    it("2人のチームから参加者を削除するとエラーになる", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const removeResult = team.remove(validParticipant1.id);

        expect(removeResult.isErr()).toBe(true);
        removeResult.mapErr((err) => {
          expect(err).toBeInstanceOf(TeamValidationError);
          expect(err.message).toContain("現在の参加者数: 1");
        });
      });
    });

    it("存在しない参加者IDで削除しても元のチームと同じ", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const removeResult = team.remove("non-existent-id");

        expect(removeResult.isOk()).toBe(true);
        removeResult.map((newTeam) => {
          expect(newTeam.length).toBe(2);
        });
      });
    });
  });

  describe("contains", () => {
    it("参加者が含まれている場合はtrueを返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.contains(validParticipant1.id)).toBe(true);
        expect(team.contains(validParticipant2.id)).toBe(true);
      });
    });

    it("参加者が含まれていない場合はfalseを返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        expect(team.contains("non-existent-id")).toBe(false);
      });
    });
  });

  describe("findByEmail", () => {
    it("メールアドレスで参加者を検索できる", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const participant = team.findByEmail("user1@example.com");
        expect(participant).toEqual(validParticipant1);
      });
    });

    it("存在しないメールアドレスの場合はundefinedを返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const participant = team.findByEmail("nonexistent@example.com");
        expect(participant).toBeUndefined();
      });
    });
  });

  describe("forPersistence", () => {
    it("永続化用のプレーンオブジェクトを返す", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const plainData = team.forPersistence();

        expect(plainData).toHaveLength(2);
        expect(plainData[0]).toEqual({
          id: validParticipant1.id,
          name: validParticipant1.name,
          email: validParticipant1.email,
          enrollmentStatus: validParticipant1.enrollmentStatus,
        });
        expect(plainData[1]).toEqual({
          id: validParticipant2.id,
          name: validParticipant2.name,
          email: validParticipant2.email,
          enrollmentStatus: validParticipant2.enrollmentStatus,
        });
      });
    });

    it("返されたデータは元の参加者配列とは独立している", () => {
      const result = TeamParticipants.create(validParticipants);

      expect(result.isOk()).toBe(true);
      result.map((team) => {
        const plainData1 = team.forPersistence();
        const plainData2 = team.forPersistence();

        expect(plainData1).not.toBe(plainData2); // 別のインスタンス
        expect(plainData1).toEqual(plainData2); // 内容は同じ
      });
    });
  });
});
