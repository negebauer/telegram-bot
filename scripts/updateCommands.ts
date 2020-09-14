import { Telegram } from 'telegraf'
import config from '../src/config'

const telegram = new Telegram(config.botToken)
telegram.setMyCommands([
  {
    command: 'test',
    description: 'a test command'
  }
])
