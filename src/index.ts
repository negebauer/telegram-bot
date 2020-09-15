import fs from 'fs'
import path from 'path'
import { Telegraf, Context } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import { SceneContextMessageUpdate } from '../node_modules/telegraf/typings/stage.d'
import config from './config'
import loadCommands from './loadCommands'

const allowList = fs
  .readFileSync(path.join(__dirname, 'allowList.txt'), { encoding: 'utf8' })
  .split('\n')

// types
interface Session {
  username: string
  firstName: string
  lastName: string
  chatId: number
  userId: number
  weight?: number
}

type BaseBotContext = Context & SceneContextMessageUpdate

interface BotContext extends BaseBotContext {
  session: Session
}

// init
const bot = new Telegraf<BotContext>(config.botToken)
const session = new LocalSession<BotContext>({
  database: config.databaseFileName,
})

// middlewares
bot.use((ctx, next) => {
  const { username } = ctx.from || {}
  const authorized = allowList.includes(username as string)
  if (!authorized) return ctx.reply('This bot is private')
  return next()
})

bot.use(session.middleware())

bot.use((ctx, next) => {
  const { id: userId, username, first_name: firstName, last_name: lastName } =
    ctx.from || {}
  const { id: chatId } = ctx.chat || {}
  Object.assign(ctx.session, {
    userId: userId as number,
    username: username as string,
    firstName: firstName as string,
    lastName: lastName as string,
    chatId: chatId as number,
  })
  return next()
})

function soccerCalories(weight: number, minutes: number) {
  return Math.floor(((7 * weight * 3.5) / 200) * minutes)
}

bot.command('soccer', ctx => {
  let { text } = ctx.message || {}
  if (!text) return

  text = text.replace('/soccer', '').trim()
  ctx.reply(`${soccerCalories(85.1, 60)}`)
  ctx.reply(text)
})

bot.help(ctx => {
  const commands = loadCommands()
  const markdown = commands.map(
    ({ command, description, details }) =>
      `/${command}\n${description}\n${details}`,
  )

  ctx.replyWithMarkdown(markdown.join('\n\n'))
})

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
