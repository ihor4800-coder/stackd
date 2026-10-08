export type Finish = "glass" | "metal" | "ceramic" | "gloss" | "satin";

export interface CatalogAsset {
  ticker: string;
  name: string;
  color: string;
  color2: string;
  finish: Finish;
  material: string;
}

export interface StackAsset extends CatalogAsset {
  id: string;
  /** allocation in basis points, 10000 = 100% */
  bp: number;
  custom?: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  /** planned budget in whole US cents */
  budgetCents: number;
  assets: StackAsset[];
  updatedAt: number;
}
