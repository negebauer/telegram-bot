const { BOT_TOKEN, NODE_ENV } = process.env

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
}

export default config
