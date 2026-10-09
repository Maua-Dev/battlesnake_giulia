import {config} from 'dotenv'
import path from 'path'

config({path: path.join(__dirname, '../.env')})

const envs = {
  PROJECT_NAME: process.env.PROJECT_NAME,
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
  AWS_REGION: process.env.AWS_REGION,
  STACK_NAME: process.env.STACK_NAME,
  REPO_NAME: process.env.REPO_NAME,
  REPO_SLUG: process.env.REPO_SLUG
}

export {envs}

console.log(envs)
