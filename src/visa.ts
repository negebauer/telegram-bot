import { exec } from 'child_process'
import puppeteer from 'puppeteer'
import { Telegram } from 'telegraf'
import dayjs from 'dayjs'
import config from './config'
import { BotContext } from '.'

const MAX_TRIES = 5
const RESCHEDULE_APPOINTMENT_TEXTS = [
  'Reprogramar cita',
  'Reschedule Appointment',
]

interface ReplyContext {
  replyWithPhoto: BotContext['replyWithPhoto']
  replyWithMarkdown: BotContext['replyWithMarkdown'] | (() => void)
  reply: BotContext['reply']
}

async function getTextContext(
  element: puppeteer.ElementHandle | puppeteer.JSHandle,
): Promise<string> {
  const textContext = await element
    .getProperty('textContent')
    .then((textContent) => textContent.jsonValue())
  return String(textContext)
}

async function checkForEarliestAppointment(
  ctx: ReplyContext,
  page: puppeteer.Page,
  currentDayMonth: string,
): Promise<void> {
  const screenshotBuffer = await page.screenshot({ encoding: 'binary' })
  try {
    const dayElement = await page.$('a.ui-state-default')
    if (!dayElement) return
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
    const caption = `${day} ${month}`
    if (dayjs(caption) < dayjs(`${currentDayMonth} ${dayjs().year()}`)) {
      await ctx.replyWithPhoto({ source: screenshotBuffer }, { caption })
    }
  } catch (error) {
    // do nothing
  }
}

async function visa(
  ctx: ReplyContext,
  next: unknown = null,
  tryNumber = 1,
): Promise<unknown> {
  // eslint-disable-next-line no-console
  console.log(`visa check #${tryNumber}`)
  if (tryNumber === 1)
    ctx.replyWithMarkdown(`Checking [visa appointment](${config.visa.url})`, {
      disable_notification: true,
    })

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(config.visa.url)

  async function retry(error?: Error) {
    await page.close()
    await browser.close()
    // eslint-disable-next-line no-use-before-define
    if (tryNumber < MAX_TRIES) return visa(ctx, next, tryNumber + 1)

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
    await page.waitForNavigation()

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
    await page.goBack()

    // check appointment not canceled
    const liElements = await page.$$('li.accordion-item > a > h5')
    const textContext = await Promise.all(liElements.map(getTextContext))
    const changeAppointmentButtonIndex = textContext.findIndex((text) => {
      if (typeof text !== 'string') return false
      const expectedTexts = RESCHEDULE_APPOINTMENT_TEXTS
      return expectedTexts.includes(text.trim())
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

    // check next appointment
    await page.click('#appointments_consulate_appointment_date')
    // September and October
    await checkForEarliestAppointment(ctx, page, currentDayMonth)
    await page.click('a[title="Next"]')
    // November
    await checkForEarliestAppointment(ctx, page, currentDayMonth)
    await page.close()
    await browser.close()
    return undefined
  } catch (error) {
    return retry(error)
  }
}

if (require.main === module) {
  exec('killall Chromium')
  const telegram = new Telegram(config.botToken)
  visa({
    replyWithPhoto: (...params) => telegram.sendPhoto(config.chatId, ...params),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    replyWithMarkdown: () => {},
    reply: (...params) => telegram.sendMessage(config.chatId, ...params),
  })
}

export default visa
