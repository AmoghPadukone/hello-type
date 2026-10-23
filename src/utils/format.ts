/** Millimetres for display: one decimal below 10 mm, whole numbers above. */
export const formatMM = (n: number) => n.toFixed(n < 10 ? 1 : 0);
