const {
  VISA_USER,
  VISA_PASSWORD,
  DATABASE_FILE_NAME = 'db.json',
  BOT_TOKEN,
  NODE_ENV = 'development',
} = process.env

const isDev = NODE_ENV === 'development'
const isProd = NODE_ENV === 'production'
const isTest = NODE_ENV === 'test'

const config = {
  env: {
    isDev,
    isProd,
    isTest,
  },
  botToken: BOT_TOKEN as string,
  databaseFileName: DATABASE_FILE_NAME,
  visa: {
    email: VISA_USER as string,
    password: VISA_PASSWORD as string,
  },
}

export default config
