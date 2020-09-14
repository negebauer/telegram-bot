import { Telegraf } from 'telegraf'
import config from './config'

const bot = new Telegraf(config.botToken)
bot.command('oldschool', ctx => ctx.reply('Hello'))
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log('Bot started successfully')
})
