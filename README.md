# Utility Ledger

A local-first web application for tracking factory utility consumption and costs from invoices.

## ✨ Features

- Track multiple utilities:
  - Electricity (kWh, peak demand kW)
  - Water (gallons)
  - Natural Gas (MMBtu)
  - Trash / other utilities

- Flexible cost structure:
  - Usage-based costs
  - Demand charges
  - Fixed fees
  - Taxes and miscellaneous charges

- Automatic calculations:
  - Total cost
  - Unit cost ($/kWh, $/MMBtu, etc.)

- Local-only storage:
  - Data saved to JSON file
  - No cloud dependencies

- Future-ready:
  - AI invoice parsing support (planned)

---

## 🧱 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Local JSON storage (Node.js fs)
