export function formatDateUTC(dateInput: string | Date): string {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  
    // Use UTC parts so "date-only" values don't shift in local time
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
  
    // Format like "Jan 27, 2026" without date-fns timezone issues
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${monthNames[Number(m) - 1]} ${day}, ${y}`;
  }