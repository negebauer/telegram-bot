const { DATABASE_FILE_NAME = 'db.json', BOT_TOKEN, NODE_ENV } = process.env

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
}

export default config
