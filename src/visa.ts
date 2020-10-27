import puppeteer from 'puppeteer'
import config from './config'
import { BotContext } from '.'

const MAX_TRIES = 5

async function checkForEarliestAppointment(
  ctx: BotContext,
  page: puppeteer.Page,
): Promise<void> {
  const screenshotBuffer = await page.screenshot({ encoding: 'binary' })
  let caption = ''
  try {
    const dayElement = await page.$('a.ui-state-default')
    if (!dayElement) return
    const day = await dayElement
      .getProperty('textContent')
      .then((textContent) => textContent.jsonValue())
    const month = await dayElement
      .getProperty('parentElement')
      .then((element) => element.getProperty('parentElement'))
      .then((element) => element.getProperty('parentElement'))
      .then((element) => element.getProperty('parentElement'))
      .then((element) => element.getProperty('parentElement'))
      .then((element) => element.getProperty('firstElementChild'))
      .then((element) => element.getProperty('lastElementChild'))
      .then((element) => element.getProperty('textContent'))
      .then((textContent) => textContent.jsonValue())
    caption = `${day} ${month}`
  } catch (error) {
    // do nothing
  }
  await ctx.replyWithPhoto({ source: screenshotBuffer }, { caption })
}

async function visa(
  ctx: BotContext,
  next: unknown,
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

    if (page.url() !== config.visa.url) return retry()

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
    if (new Date().getMonth() === 8) {
      await checkForEarliestAppointment(ctx, page)
      await page.click('a[title="Next"]')
    }
    await checkForEarliestAppointment(ctx, page)
    await page.close()
    await browser.close()
    return undefined
  } catch (error) {
    return retry(error)
  }
}

export default visa
