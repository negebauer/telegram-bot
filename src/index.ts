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
  ctx.session.user = {
    userId: userId as number,
    username: username as string,
    firstName: firstName as string,
    lastName: lastName as string,
    chatId: chatId as number,
  }
  return next()
})

function soccerCalories(weight: number, minutes: number) {
  return Math.floor(((7 * weight * 3.5) / 200) * minutes)
}

// soccer scene
function handleSoccer(ctx: BotContext) {
  let { text } = ctx.message || {}
  if (!text) return

  text = text.replace('/soccer', '').trim()
  ctx.reply(`${soccerCalories(85.1, 60)}`)
  ctx.reply(text)
}

const soccerScene = new BaseScene<BotContext>('soccer')
soccerScene.enter(handleSoccer)
soccerScene.on('text', handleSoccer)
soccerScene.command('back', ctx => ctx.scene.leave())

// bot
const stage = new Stage<BotContext>([soccerScene])
bot.use(stage.middleware())

bot.command('soccer', ctx => ctx.scene.enter('soccer'))

// start
bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
