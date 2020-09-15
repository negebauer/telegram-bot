import fs from 'fs'
import path from 'path'

export interface Command {
  command: string
  description: string
  details: string
}

const commands: Record<string, Command> = {}
const emptyCommand: Command = {
  command: '',
  description: '',
  details: '',
}

function foundCommand(command: Command) {
  // eslint-disable-next-line no-param-reassign
  command.description = command.description.trim()
  // eslint-disable-next-line no-param-reassign
  command.details = command.details.trim()
  commands[command.command] = command
}

function loadCommands(): Record<string, Command> {
  if (Object.values(commands).length > 0) return commands

  const commandsPath = path.join(__dirname, '..', 'COMMANDS.md')
  const commandsText = fs.readFileSync(commandsPath, { encoding: 'utf8' })
  let nextComand = { ...emptyCommand }

  commandsText.split('\n').forEach(line => {
    if (line.substring(0, 2) === '##') {
      if (nextComand.command) foundCommand(nextComand)

      nextComand = { ...emptyCommand }
      nextComand.command = line.replace('## ', '')
    } else if (!nextComand.command) {
      // skip
    } else if (!nextComand.description) {
      nextComand.description = line
    } else {
      nextComand.details = `${nextComand.details}\n${line}`
    }
  })
  foundCommand(nextComand)

  return commands
}

if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(loadCommands())
}

export default loadCommands
