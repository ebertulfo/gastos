import { Period } from "@/enums/Period"; // Correct import for Period enum
import { DateRange } from "@/types";

export const convertPeriodToDateRange = (period: Period): DateRange => {
  console.log(period);
  const now = new Date();
  switch (period) {
    case Period.Today: // Updated to use Period enum
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case Period.ThisWeek:
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    case Period.ThisMonth:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case Period.ThisYear:
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    default:
      throw new Error("Invalid period");
  }
};

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(date.getDate() - date.getDay());
  return start;
}

function endOfWeek(date: Date): Date {
  const end = endOfDay(date);
  end.setDate(date.getDate() + (6 - date.getDay()));
  return end;
}

function startOfMonth(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(1);
  return start;
}

function endOfMonth(date: Date): Date {
  const end = startOfMonth(date);
  end.setMonth(date.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfYear(date: Date): Date {
  const start = startOfDay(date);
  start.setMonth(0, 1);
  return start;
}

function endOfYear(date: Date): Date {
  const end = startOfYear(date);
  end.setFullYear(date.getFullYear() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
}
