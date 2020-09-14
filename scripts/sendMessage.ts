import { Telegram } from 'telegraf'
import config from '../src/config'

const [, , chatId, text] = process.argv

const telegram = new Telegram(config.botToken)
telegram.sendMessage(chatId, text)
