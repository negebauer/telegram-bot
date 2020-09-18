import puppeteer from 'puppeteer'
import config from './config'
import { BotContext } from '.'

const MAX_TRIES = 5
const url =
  'https://ais.usvisa-info.com/es-cl/niv/schedule/31589460/continue_actions'

function retry(
  ctx: BotContext,
  next: unknown,
  tryNumber: number,
  error?: Error,
) {
  // eslint-disable-next-line no-use-before-define
  if (tryNumber < MAX_TRIES) return visa(ctx, next, tryNumber + 1)

  if (!error) return ctx.reply('Try again')
  return ctx.reply(error.toString())
}

async function visa(
  ctx: BotContext,
  next: unknown,
  tryNumber = 1,
): Promise<unknown> {
  try {
    // eslint-disable-next-line no-console
    console.log(`visa check #${tryNumber}`)
    if (tryNumber === 1) ctx.reply(`Checking visa appointment info`)

    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

    if (page.url() !== url) return retry(ctx, next, tryNumber)

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
      if (typeof text !== 'string') return false
      return text.trim() === 'Reprogramar cita'
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

    await changeAppointmentButton.click()
    await page.waitForNavigation()

    // check next appointment
    await page.click('#appointments_consulate_appointment_date')
    if (new Date().getMonth() === 8) await page.click('a[title="Next"]')
    const screenshotBuffer = await page.screenshot({ encoding: 'binary' })
    return ctx.replyWithPhoto({ source: screenshotBuffer })
  } catch (error) {
    return retry(ctx, next, tryNumber, error)
  }
}

export default visa
