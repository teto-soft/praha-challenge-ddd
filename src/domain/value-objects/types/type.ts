type StripBrand<T> = T extends string & { readonly __brand: unique symbol }
  ? string
  : T;

export type StripAllBrands<T> = {
  [K in keyof T]: StripBrand<T[K]>;
};
