const {
  VISA_USER,
  VISA_PASSWORD,
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
  visa: {
    email: VISA_USER as string,
    password: VISA_PASSWORD as string,
  },
}

export default config
