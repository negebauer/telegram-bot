import * as fs from 'fs'
import * as path from 'path'
import { Telegram } from 'telegraf'
import config from '../src/config'

interface Command {
  command: string
  description: string
}

const commandsPath = path.join(__dirname, '..', 'COMMANDS.md')
const commandsText = fs.readFileSync(commandsPath, { encoding: 'utf8' })
const commands: Command[] = []
let nextComand: Command = { command: '', description: '' }

function foundCommand(command: Command) {
  // eslint-disable-next-line no-param-reassign
  command.description = command.description.trim()
  commands.push(command)
}

commandsText.split('\n').forEach(line => {
  if (line.substring(0, 2) === '##') {
    if (nextComand.command) foundCommand(nextComand)

    nextComand = {
      command: line.replace('## ', ''),
      description: '',
    }
  } else {
    nextComand.description += ` ${line}`
  }
})
foundCommand(nextComand)

const telegram = new Telegram(config.botToken)
telegram.setMyCommands(commands)
// eslint-disable-next-line no-console
console.log('Commands updated')
// eslint-disable-next-line no-console
console.log(JSON.stringify(commands, null, 4))
