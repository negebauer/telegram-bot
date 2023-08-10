const { exec } =require( 'child_process')
const fs =require( 'fs')
const puppeteer = require('puppeteer')
// import { Telegram } from 'telegraf'
const pkg = require('telegraf');
const { Telegram } = pkg;
const dayjs  = require('dayjs')
// import { BotContext } from '.'

const {
  BOT_TOKEN,
  CHAT_ID,
  VISA_PASSWORD,
  VISA_URL,
  VISA_USER,
  VISA_START_DATE,
  NODE_ENV = 'development',
} = process.env

const isDev = NODE_ENV === 'development'
const isProd = NODE_ENV === 'production'
const isTest = NODE_ENV === 'test'

const config = {
  env: {
    isDev,
    isProd,
    isTest,
  },
  botToken: BOT_TOKEN,
  chatId: CHAT_ID,
  visa: {
    email: VISA_USER,
    password: VISA_PASSWORD,
    url: VISA_URL,
    startDate: VISA_START_DATE
  },
}

const MAX_TRIES = 5
const RESCHEDULE_APPOINTMENT_TEXTS = [
  'Reprogramar cita',
  'Reschedule Appointment',
]

// interface ReplyContext {
//   replyWithPhoto: BotContext['replyWithPhoto']
//   replyWithMarkdown: BotContext['replyWithMarkdown'] | (() => void)
//   reply: BotContext['reply']
// }

async function getTextContext(
  element
) {
  const textContext = await element
    .getProperty('textContent')
    .then((textContent) => textContent.jsonValue())
  return String(textContext)
}

async function checkForEarliestAppointment(
  ctx,//: ReplyContext,
  page,//: puppeteer.Page,
)
// : Promise<string | undefined>
{
  const dayElement = await page.$('a.ui-state-default')
  if (!dayElement) return undefined
  const day = await getTextContext(dayElement)
  const monthElement = await dayElement
    .getProperty('parentElement')
    .then((element) => element.getProperty('parentElement'))
    .then((element) => element.getProperty('parentElement'))
    .then((element) => element.getProperty('parentElement'))
    .then((element) => element.getProperty('parentElement'))
    .then((element) => element.getProperty('firstElementChild'))
    .then((element) => element.getProperty('lastElementChild'))
  const month = await getTextContext(monthElement)
  const caption = `${day} ${month.split(' ').join(' ')}`
  return caption
}

async function visa(
  ctx,//: ReplyContext,
  next,//: unknown = null,
  tryNumber = 1,
  writeFoundAppointmentsToFilePath = '',
)
//: Promise<unknown>
{
  // eslint-disable-next-line no-console
  console.log(`visa check #${tryNumber}`)
  if (tryNumber === 1)
    ctx.replyWithMarkdown(`Checking [visa appointment](${config.visa.url})`, {
      disable_notification: true,
    })

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(config.visa.url)

  async function retry(error
    // ?: Error
    ) {
    await page.close()
    await browser.close()
    // eslint-disable-next-line no-use-before-define
    if (tryNumber < MAX_TRIES)
      return visa(ctx, next, tryNumber + 1, writeFoundAppointmentsToFilePath)

    if (!error) return ctx.reply('Try again')
    return ctx.reply(error.toString())
  }

  try {
    // login
    const buttons = await page.$$('button')
    const buttonTexts = await Promise.all(buttons.map(getTextContext))
    await buttons[buttonTexts.indexOf('OK')].click()
    // await page.click('a.down-arrow.bounce')
    await page.click('input[type="email"]')
    await page.keyboard.type(config.visa.email, { delay: 4 })
    await page.click('input[type="password"]')
    await page.keyboard.type(config.visa.password, { delay: 4 })
    await page.click('input[type="checkbox"]')
    await page.click('input[type="submit"]')
    try {
      await page.waitForNavigation()
    } catch (error) {
      // skip
    }

    if (page.url() !== config.visa.url) return retry()

    // get current appointment date
    const aElements = await page.$$('a')
    const aTexts = await Promise.all(aElements.map(getTextContext))
    await aElements[aTexts.indexOf('Go Back')].click()
    await page.waitForNavigation()

    const currentDateElement = await page.$('p.consular-appt')
    if (!currentDateElement) return ctx.reply('No pude ver la fecha actual')

    const currentDateText = await getTextContext(currentDateElement)
    const currentDayMonth = currentDateText.split(',')[0].split(':')[1].trim()
    const currentYear = currentDateText.split(',')[1].trim()
    const currentDate = `${currentDayMonth} ${currentYear}`
    await page.goBack()

    // check appointment not canceled
    const liElements = await page.$$('li.accordion-item > a > h5')
    const textContext = await Promise.all(liElements.map(getTextContext))
    const changeAppointmentButtonIndex = textContext.findIndex((text) => {
      if (typeof text !== 'string') return false
      return RESCHEDULE_APPOINTMENT_TEXTS.includes(text.trim())
    })
    if (changeAppointmentButtonIndex === -1) return ctx.reply('Cancelada')

    // go to change appointment page
    const changeAppointmentShowButton = liElements[changeAppointmentButtonIndex]
    await changeAppointmentShowButton.click()
    const changeAppointmentButton = await changeAppointmentShowButton
      .getProperty('parentElement')
      .then((e1) => e1.getProperty('parentElement'))
      .then((e2) => e2.getProperty('lastElementChild'))
      .then((e3) => e3.asElement()?.$('a'))
    if (!changeAppointmentButton) return 'changeAppointmentButton notFound'

    await changeAppointmentButton?.click()
    await page.waitForNavigation()

    // check if appointment group, if press continue
    const continueButton = await page.$('[name=commit]')
    if (continueButton) {
      await continueButton.click()
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
    }

    // check that there are appointments
    const noAppointmentsMessage = await page.$(
      '#consulate_date_time_not_available',
    )
    if (noAppointmentsMessage != null) {
      const style = await page.evaluate('document.querySelector("#consulate_date_time_not_available").getAttribute("style")')
      if (!style.includes('display: none')) {
        if (config.env.isDev) {
          console.log('No appointments available')
        }
        ctx.replyWithMarkdown(`No appointments available`, {
          disable_notification: true,
        })
        await page.close()
        await browser.close()
        return undefined
      }
    }

    // check next appointment
    await page.click('#appointments_consulate_appointment_date')
    let nextAppointment = await checkForEarliestAppointment(ctx, page)
    function checkStartDate() {
      if (nextAppointment != null && config.visa.startDate != null && dayjs(nextAppointment) < dayjs(config.visa.startDate)) {
        if (config.env.isDev) {
          console.log('There\'s one appointment', nextAppointment, 'before start date', config.visa.startDate)
        }
        nextAppointment = null
      }
    }
    checkStartDate()
    while (nextAppointment == null) {
      // eslint-disable-next-line no-await-in-loop
      await page.click('a[title="Next"]')
      // eslint-disable-next-line no-await-in-loop
      await page.click('a[title="Next"]')
      // eslint-disable-next-line no-await-in-loop
      nextAppointment = await checkForEarliestAppointment(ctx, page)
      checkStartDate()
    }
    if (writeFoundAppointmentsToFilePath) {
      const line = `${nextAppointment.split(' ').join(',')}\n`
      fs.appendFile(writeFoundAppointmentsToFilePath, line, () => {
        // do nothing
      })
    }
    const isAppointmentEarlier =
      dayjs(nextAppointment) < dayjs(currentDate)
    if (config.env.isDev) {
      console.log('Current appointment', currentDate)
      console.log('Found appointment', nextAppointment)
      console.log(
        isAppointmentEarlier
          ? 'Appointment is earlier!'
          : 'Appointment is not earlier',
      )
    }
    const screenshotBuffer = await page.screenshot({ encoding: 'binary' })
    if (isAppointmentEarlier) {
      await ctx.replyWithPhoto(
        { source: screenshotBuffer },
        { caption: `${nextAppointment} ${config.visa.url}` },
      )
    }

    await page.close()
    await browser.close()
    return undefined
  } catch (error) {
    if (config.env.isDev) {
      console.log('Error getting appointment', error)
    }
    return retry(error)
  }
}

if (require.main === module) {
  exec('killall Chromium')
  const telegram = new Telegram(config.botToken)
  visa(
    {
      replyWithPhoto: (...params) =>
        telegram.sendPhoto(config.chatId, ...params),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      replyWithMarkdown: () => {},
      reply: (...params) => telegram.sendMessage(config.chatId, ...params),
    },
    null,
    1,
    'appointments.csv',
  )
}

// export default visa
