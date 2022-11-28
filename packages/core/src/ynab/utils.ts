/** Converts YNAB's milliunits format to a currency value with two decimals  */
export const fromMilliunits = (amount: number): number =>
  Math.round(amount / 10) / 100
