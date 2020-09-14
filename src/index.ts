import fs from 'fs'
import path from 'path'
import { Telegraf, Context as TelegrafContext } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import config from './config'

const allowList = fs
  .readFileSync(path.join(__dirname, 'allowList.txt'), { encoding: 'utf8' })
  .split('\n')

interface Session {
  counter?: number
}

interface BotContext extends TelegrafContext {
  session: Session
}

const bot = new Telegraf<BotContext>(config.botToken)
const session = new LocalSession({ database: config.databaseFileName })

bot.use((ctx, next) => {
  const { username } = ctx.from || {}
  const authorized = allowList.includes(username as string)
  if (!authorized) return ctx.reply('This bot is private')
  return next()
})

bot.use(session.middleware())

bot.use((ctx, next) => {
  // eslint-disable-next-line camelcase
  const { id: userId, username, first_name, last_name } = ctx.from || {}
  const { id: chatId } = ctx.chat || {}
  Object.assign(ctx.session, {
    userId,
    username,
    first_name,
    last_name,
    chatId,
  })
  return next()
})

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
