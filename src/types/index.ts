import { Periods } from "@/enums/Period";

export type APIResponse<T = object> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Period = `${Periods}`;

export type DateRange = {
  start: Date;
  end: Date;
};

export type SearchFilters = {
  period: Period;
};
