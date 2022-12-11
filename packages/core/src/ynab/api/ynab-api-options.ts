import { API } from 'ynab'

/** Options shared by all YNAB queries */
export interface YnabApiOptions {
  /** API instance used to make YNAB requests */
  ynab: API
}
