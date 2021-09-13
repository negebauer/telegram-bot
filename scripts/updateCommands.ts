/* eslint-disable no-console */
import { Telegram } from 'telegraf'
import config from '../src/config'
import loadCommands from '../src/loadCommands'

async function updateCommands() {
  const commands = loadCommands()
  const telegram = new Telegram(config.botToken)
  await telegram.setMyCommands(Object.values(commands))

  const msg = 'Commands updated'
  if (config.env.isProd)
    console.log(msg, '\n', JSON.stringify(commands, null, 4))
  else console.log(msg, Object.keys(commands))
}

updateCommands().catch((error) => {
  console.error(error)
  process.exit(1)
})
