const {
  BOT_TOKEN,
  CHAT_ID,
  VISA_PASSWORD,
  VISA_URL,
  VISA_USER,
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
  chatId: CHAT_ID as string,
  visa: {
    email: VISA_USER as string,
    password: VISA_PASSWORD as string,
    url: VISA_URL as string,
  },
}

export default config
