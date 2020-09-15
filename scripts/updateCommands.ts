import { Telegram } from 'telegraf'
import config from '../src/config'
import loadCommands from '../src/loadCommands'

const commands = loadCommands()
const telegram = new Telegram(config.botToken)
telegram.setMyCommands(Object.values(commands))
// eslint-disable-next-line no-console
console.log('Commands updated')
// eslint-disable-next-line no-console
console.log(JSON.stringify(commands, null, 4))
