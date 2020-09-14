import { Telegraf, Context } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import config from './config'

const bot = new Telegraf(config.botToken)
const session = new LocalSession({ database: 'db.json' })

bot.use(session.middleware())

interface ContextWithSession extends Context {
  session: {
    counter: number
  }
}

bot.on('text', (ctx1, next) => {
  const ctx = ctx1 as ContextWithSession
  ctx.session.counter = ctx.session.counter || 0
  // eslint-disable-next-line no-plusplus
  ctx.session.counter++
  ctx.replyWithMarkdown(
    `Counter updated, new value: \`${ctx.session.counter}\``,
  )
  return next()
})

bot.command('oldschool', ctx => ctx.reply('Hello'))
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
