import fs from 'fs'
import path from 'path'
import { Telegraf, Context } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import dayjs from 'dayjs'
import { SceneContextMessageUpdate } from '../node_modules/telegraf/typings/stage.d'
import config from './config'
import loadCommands, { Command } from './loadCommands'
import visa from './visa'

const allowList = fs
  .readFileSync(path.join(__dirname, 'allowList.txt'), { encoding: 'utf8' })
  .split('\n')

function commandToMarkdown({ command, description, details }: Command) {
  return `/${command}\n${description}${details ? `\n${details}` : ''}`
}

const commands = loadCommands()
const helpMarkdown = Object.values(commands)
  .map(commandToMarkdown)
  .join('\n\n')

interface Session {
  username: string
  firstName: string
  lastName: string
  chatId: number
  userId: number
  weight?: number
}

type BaseBotContext = Context & SceneContextMessageUpdate

export interface BotContext extends BaseBotContext {
  session: Session
}

const bot = new Telegraf<BotContext>(config.botToken)
const session = new LocalSession<BotContext>({
  database: config.databaseFileName,
})

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

bot.command('weight', ctx => {
  const text = ctx.message?.text?.replace('/weight', '').trim()
  if (!text)
    return ctx.replyWithMarkdown(
      `Current is ${ctx.session.weight}\n\n${commandToMarkdown(
        commands.weight,
      )}`,
    )

  const weight = Number(text)
  if (!weight) return ctx.reply(`Weight must be a number, ${text} is invalid`)

  ctx.session.weight = weight
  return ctx.reply(`Saved weight ${weight}kg`)
})

function soccerCalories(weight: number, minutes: number) {
  return Math.floor(((7 * weight * 3.5) / 200) * minutes)
}

bot.command('soccer', ctx => {
  const { weight } = ctx.session
  if (!weight)
    return ctx.replyWithMarkdown(
      `Your first need to add your weight\n\n${commandToMarkdown(
        commands.weight,
      )}`,
    )

  const text = ctx.message?.text?.replace('/soccer', '').trim()
  if (!text) return ctx.replyWithMarkdown(commandToMarkdown(commands.soccer))

  const [startTimeOrTime, endTime] = text.split(' ')
  let totalMinutes
  if (endTime) {
    const [startHour, startMinute = 0] = startTimeOrTime.split(':')
    const [endHour, endMinute = 0] = endTime.split(':')
    const start = dayjs()
      .hour(Number(startHour))
      .minute(Number(startMinute))
    const end = dayjs()
      .hour(Number(endHour))
      .minute(Number(endMinute))
    totalMinutes = end.diff(start, 'minute')
  } else {
    const [hours, minutes] = startTimeOrTime.split('h')
    totalMinutes = Number(hours) * 60 + Number(minutes)
  }

  const calories = soccerCalories(85, totalMinutes)
  return ctx.reply(`You just burnt ${calories} calories`)
})

bot.command('visa', (ctx, next) =>
  visa(ctx, next).catch(error => ctx.reply(error.toString())),
)

bot.help(ctx => ctx.replyWithMarkdown(helpMarkdown))

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
