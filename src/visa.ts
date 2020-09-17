import puppeteer from 'puppeteer'
import config from './config'
import { BotContext } from '.'

const MAX_TRIES = 3
const url =
  'https://ais.usvisa-info.com/es-cl/niv/schedule/31589460/continue_actions'

async function visa(
  ctx: BotContext,
  next: unknown,
  tryNumber = 1,
): Promise<unknown> {
  ctx.reply(`Checking visa appointment info, try ${tryNumber}`)

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    slowMo: 50,
  })
  const page = await browser.newPage()
  await page.goto(url)

  // login
  const [, ok] = await page.$$('button > span.ui-button-text')
  await ok.click()
  // await page.click('a.down-arrow.bounce')
  await page.click('input[type="email"]')
  await page.keyboard.type(config.visa.email, { delay: 4 })
  await page.click('input[type="password"]')
  await page.keyboard.type(config.visa.password, { delay: 4 })
  await page.click('input[type="checkbox"]')
  await page.click('input[type="submit"]')
  await page.waitForNavigation()

  const inPage = (await page.url()) === url
  if (!inPage) {
    if (tryNumber <= MAX_TRIES) return visa(ctx, next, tryNumber + 1)
    return ctx.reply('FAILED')
  }

  // check appointment not canceled
  const liElements = await page.$$('li.accordion-item > a > h5')
  const textContext = await Promise.all(
    liElements.map((element) =>
      element
        .getProperty('textContent')
        .then((textContent) => textContent.jsonValue()),
    ),
  )
  const changeAppointmentButtonIndex = textContext.findIndex((text) => {
    if (typeof text === 'string') {
      return text.trim() === 'Reprogramar cita'
    }
    return false
  })
  if (changeAppointmentButtonIndex === -1) return ctx.reply('CANCELED')

  // go to change appointment page
  const changeAppointmentShowButton = liElements[changeAppointmentButtonIndex]
  await changeAppointmentShowButton.click()
  const changeAppointmentButton = await changeAppointmentShowButton
    .getProperty('parentElement')
    .then((e1) => e1.getProperty('parentElement'))
    .then((e2) => e2.getProperty('lastElementChild'))
    .then((e3) => e3.asElement()?.$('a'))
  if (!changeAppointmentButton) return 'changeAppointmentButton notFound'

  await changeAppointmentButton.click()
  await page.waitForNavigation()

  // check next appointment
  await page.click('#appointments_consulate_appointment_date')
  const screenshotBuffer = await page.screenshot({ encoding: 'binary' })
  return ctx.replyWithPhoto({ source: screenshotBuffer })
}

export default visa
