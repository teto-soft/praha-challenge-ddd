// まず交差型かどうかを確認し、文字列との交差型なら string を返す
type UnBrand<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;

// 再帰的にブランド型を除去
export type StripAllBrands<T> = T extends readonly (infer U)[]
  ? readonly StripAllBrands<U>[]
  : T extends (...args: unknown[]) => unknown
    ? T
    : T extends object
      ? { readonly [K in keyof T]: UnBrand<T[K]> }
      : UnBrand<T>;
