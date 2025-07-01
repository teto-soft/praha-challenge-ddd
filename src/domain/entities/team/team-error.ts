export class TeamError extends Error {
  constructor(message: string) {
    super(`Invalid team: ${message}`);
    this.name = "TeamError";
  }
}

export class TeamValidationError extends TeamError {
  constructor(message: string) {
    super(message);
    this.name = "TeamValidationError";
  }
}
