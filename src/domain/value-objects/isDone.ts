export type IsDone = boolean & { readonly __brand: unique symbol };

export function createIsDone(isDone: boolean): IsDone {
  return isDone as IsDone;
}
