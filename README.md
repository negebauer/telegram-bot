# telegram-bot <!-- omit in TOC -->

![build](https://github.com/negebauer/telegram-bot/workflows/build/badge.svg)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Personal telegram bot

- [Getting started](#getting-started)
  - [Run the complete bot](#run-the-complete-bot)
  - [Run a file](#run-a-file)
- [Bot commands](#bot-commands)

## Getting started

- Clone the repository.
- Run `yarn`.
- Copy the `.envrc.example` file to `.envrc` (`cp .envrc.example .envrc`).
  - You'll need the [direnv](https://direnv.net/) program to load the env variables or source the `.envrc` file manually (`source .envrc`).
  - Check the `.envrc` file for explanations on each env var and how to get it.

### Run the complete bot

- Use `yarn start` to run the complete bot in prod mode.
- Use `yarn dev` to run the complete bot in dev mode.

### Run a file

- Use `yarn r` to run a single file in prod mode.
- Use `yarn d` to run a single file in dev mode.

## Bot commands

Check the commands that the bot supports in [COMMANDS](./COMMANDS.md)
