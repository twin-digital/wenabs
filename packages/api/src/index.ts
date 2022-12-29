import path from 'node:path'

export interface LambdaAsset {
  /** absolute path to the directory containing the lambda */
  directory: string

  /** name of the Javascript file (without the .js extension) containing the handler */
  fileName: string

  /** name of the export function to use as the lambda handler */
  functionName: string
}

const createAsset = ({
  directory = path.join(__dirname, '..', 'dist'),
  fileName = 'index',
  functionName = 'handler',
}: Partial<LambdaAsset>): LambdaAsset => ({ fileName, functionName, directory })

export const LambdaAssets: Record<string, LambdaAsset> = {
  authorizer: createAsset({
    fileName: 'authorizer',
    functionName: 'handler',
  }),
  getBudget: createAsset({
    fileName: 'budgets',
    functionName: 'getBudget',
  }),
  getGoalsCsv: createAsset({
    fileName: 'goals',
    functionName: 'getGoalsCsv',
  }),
  getYnabAccount: createAsset({
    fileName: 'accounts',
    functionName: 'getYnabAccount',
  }),
  listBudgets: createAsset({
    fileName: 'budgets',
    functionName: 'listBudgets',
  }),
}
