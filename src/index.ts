import fs from 'fs'
import path from 'path'
import { Telegraf, Context, Stage, BaseScene } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import { SceneContextMessageUpdate } from '../node_modules/telegraf/typings/stage.d'
import config from './config'

const allowList = fs
  .readFileSync(path.join(__dirname, 'allowList.txt'), { encoding: 'utf8' })
  .split('\n')

// types
interface Session {
  user: {
    username: string
    firstName: string
    lastName: string
    chatId: number
    userId: number
  }
  soccer?: {
    weight: number
  }
}

type i = Context & SceneContextMessageUpdate

interface BotContext extends i {
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
  ctx.session.user = {
    userId: userId as number,
    username: username as string,
    firstName: firstName as string,
    lastName: lastName as string,
    chatId: chatId as number,
  }
  return next()
})

// soccer scene
const soccerScene = new BaseScene<BotContext>('soccer')
soccerScene.enter(ctx => {
  // eslint-disable-next-line no-console
  console.log(ctx.message)
})
soccerScene.leave(ctx => {
  ctx.reply('bye')
})
soccerScene.hears('hi', ctx => ctx.scene.enter('soccer'))
soccerScene.on('message', ctx => ctx.replyWithMarkdown('Send `hi`'))
soccerScene.command('back', ctx => ctx.scene.leave())

// bot
const stage = new Stage<BotContext>([soccerScene], { ttl: 10 })
bot.use(stage.middleware())

bot.command('soccer', ctx => ctx.scene.enter('soccer'))

// start
bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
