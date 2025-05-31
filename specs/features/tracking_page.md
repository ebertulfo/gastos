# 📄 Track Page Spec — Gastos

## Purpose
The **Track Page** is the core screen where users view their daily expense activity. It is designed to build awareness, reinforce habit formation, and give the user a sense of ownership over their daily spending behavior.

---

## 🧠 Philosophy
> “You can improve what you can measure.”

This page makes measurement effortless by:
- Grouping expenses **per day**
- Highlighting **totals per day**
- Showing **empty days** to encourage consistency
- Reinforcing streaks and visibility of behavior

---

## 🏗️ Layout Overview

### Top Section
- Optional sticky streak/summary:
  - Example: `₱1,530 tracked this week · 3-day streak 🔥`

### Main Section
- An **Accordion-style list**, grouped by day (newest to oldest)
- Each group contains:
  - **Date Header** (e.g. “May 23”)
  - **Total Spent that Day** (e.g. “💰 Total: ₱120”)
  - **List of Expenses**
    - Format:
      ```
      🍗 Popeyes — ₱120
      (Food)
      ```
  - OR:
    - _“📭 No spendings recorded.”_
    - Button: `[ + Log a spending ]` (opens Add Expense modal)

---

## ✅ Features

### Grouped by Day
- Each date section collapsible/expandable (`AccordionItem`)
- Sorted descending (today at top)

### Daily Totals
- Computed from that day’s expenses
- Shown next to the date header

### Empty State for No Spending Days
- Clear visual cue for days with no logs
- Includes a “Log a spending” button as a call-to-action

### Interactivity
- Each expense entry:
  - Clickable 3-dot menu for:
    - ✏️ Edit
    - 🗑️ Delete
- Edited items may show a subtle icon (`🖊️`)

### Tags
- Shown under description
- Styled as muted/secondary text
- Can be emojis (e.g. `🍜`, `🚌`, `🏥`) or text (“Transport”)

---

## 🔧 Components (ShadCN / Tailwind)

- `Accordion` – for date groupings
- `Card` – for each expense entry
- `Button` – to trigger log modal or add spending
- `DropdownMenu` – for edit/delete
- `Badge` – for tag display (optional)
- `Dialog` / `Sheet` – for editing entries
- `AlertDialog` – for confirming deletions

---

## 🧪 Optional Enhancements (Future)
- Auto-scroll or sticky “Today” section
- Swipe-to-edit on mobile
- Highlight today's date section in brand color
- Show streak recovery suggestions (e.g. “Start logging again?”)

---

## 🔄 Dynamic Updates
When a new expense is logged:
- If it's for **today**, update the “Today” group in real-time
- If editing date of an expense → move entry between groups
- If deleting the **only** entry in a date group → show empty state

---

## 📦 Example Data Structure

```ts
type Expense = {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: string; // ISO format
  tags: string[]; // e.g., ["Food", "Delivery"]
};

type DailyExpenses = {
  date: string;
  entries: Expense[];
};
