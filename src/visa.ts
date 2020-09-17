import puppeteer from 'puppeteer'
import config from './config'

async function visa() {
  const browser = await puppeteer.launch({
    headless: false,
  })
  const page = await browser.newPage()
  await page.goto(
    'https://ais.usvisa-info.com/es-cl/niv/schedule/31589460/appointment',
  )
  const [, ok] = await page.$$('button > span.ui-button-text')
  await ok.click()
  await page.click('input[type="email"]')
  await page.keyboard.type(config.visa.email)
  await page.click('input[type="password"]')
  await page.keyboard.type(config.visa.password)
  await page.click('input[type="checkbox"]')
  await page.click('input[type="submit"]')
}

visa()

// async function login(page) {
//   await page.goto(LINKEDIN_LOGIN_URL)
//   try {
//     await page.waitFor('#username', { timeout: 500 })
//   } catch (err) {
//     return
//   }
//   await page.click('#username')
//   await page.keyboard.type(linkedIn.username)
//   await page.click('#password')
//   await page.keyboard.type(linkedIn.password)
//   await Promise.all([
//     await page.click('button[type=submit]'),
//     page.waitForNavigation(),
//   ])
// }

// async function getPage() {
//   async function newPage(context) {
//     const page = await context.newPage()
//     await login(page)
//     return page
//   }

//   const browser = await getBrowser()
//   if (isDev) {
//     const oldContexts = await browser.browserContexts()
//     if (oldContexts.length === 1) {
//       const context = await browser.createIncognitoBrowserContext()
//       return newPage(context)
//     }
//     const context = oldContexts[1]
//     const [page] = await context.pages()
//     if (page) await page.close()
//     return newPage(context)
//   }
//   if (isProd) {
//     return newPage(browser)
//   }
//   return undefined
// }

// async function scrapeLinkedInProfiles(profiles) {
//   const data = []
//   const page = await getPage()

//   for (let i = 0; i < profiles.length; i += 1) {
//     if (onlyFirst && i > 0) {
//       // eslint-disable-next-line global-require
//       const util = require('util')
//       // eslint-disable-next-line no-console
//       console.log(util.inspect(data[0], { depth: 2 }))
//       break
//     }

//     // eslint-disable-next-line no-console
//     console.log(`Scrapping ${i + 1}/${profiles.length}...`)
//     const [name, linkedInIdRaw, entrepreneurType, search] = profiles[i]
//     const linkedInId = linkedInIdRaw
//       .replace(LINKEDIN_PROFILE_URL, '')
//       .replace(/\//g, '')
//     // eslint-disable-next-line no-continue
//     if (!linkedInId || Number(search) === 0) continue

//     const linkedIdUrl = `${LINKEDIN_PROFILE_URL}/${linkedInId}`
//     await page.goto(linkedIdUrl)
//     await new Promise(resolve => setTimeout(resolve, 1000))
//     const profileImageElement = await page.$('img[loading="lazy"]')
//     const [profileImageUrl, profileName] = profileImageElement
//       ? await Promise.all([
//           profileImageElement
//             .getProperty('src')
//             .then(property => property.jsonValue()),
//           profileImageElement
//             .getProperty('title')
//             .then(property => property.jsonValue()),
//         ])
//       : [undefined, undefined]
//     await page.waitFor('.pv-highlights-section', { timeout: 500 }).catch(noop)
//     await page.hover('.pv-highlights-section', { timeout: 500 }).catch(noop)
//     await page.waitFor('.pv-about-section', { timeout: 500 }).catch(noop)
//     await page.hover('.pv-about-section', { timeout: 500 }).catch(noop)
//     await page.waitFor('.pab-featured-section', { timeout: 500 }).catch(noop)
//     await page.hover('.pab-featured-section', { timeout: 500 }).catch(noop)
//     await page
//       .waitFor('.pv-recent-activity-section-v2', { timeout: 500 })
//       .catch(noop)
//     await page
//       .hover('.pv-recent-activity-section-v2', { timeout: 500 })
//       .catch(noop)
//     await page.waitFor('#experience-section', { timeout: 500 }).catch(noop)
//     await page.hover('#experience-section', { timeout: 500 }).catch(noop)
//     await page
//       .click('#experience-section button.pv-profile-section__see-more-inline', {
//         timeout: 500,
//       })
//       .catch(noop)
//     const experienceElements = await page.$$('#experience-section > ul > li')
//     const parsedExperiences = await Promise.all(
//       experienceElements.map(async experienceElement => {
//         let summaryElement = await experienceElement.$(
//           '.pv-entity__summary-info',
//         )
//         if (!summaryElement)
//           summaryElement = await experienceElement.$(
//             '.pv-entity__company-details',
//           )
//         const companyName = await summaryElement
//           .$('.pv-entity__secondary-title')
//           .then(
//             possibleP =>
//               possibleP ||
//               summaryElement
//                 .$$('.pv-entity__company-summary-info span')
//                 .then(spans => spans[1]),
//           )
//           .then(p => p.getProperty('textContent'))
//           .then(textContent => textContent.jsonValue())
//           .then(string => string.trim())
//           .then(string => {
//             if (!string.includes('\n')) return string
//             return string.slice(0, string.indexOf('\n'))
//           })
//         const positionElements = await experienceElement.$$(
//           '.pv-entity__position-group li',
//         )
//         const position =
//           positionElements && positionElements.length > 0
//             ? await positionElements[0]
//                 .$$('h3 span')
//                 .then(spans => spans[1])
//                 .then(span => span.getProperty('textContent'))
//                 .then(textContent => textContent.jsonValue())
//             : await summaryElement
//                 .$('h3')
//                 .then(h3 => h3.getProperty('textContent'))
//                 .then(textContent => textContent.jsonValue())
//                 .then(string => string.replace('Company Name', '').trim())
//         const isActive = await (positionElements && positionElements.length > 0
//           ? positionElements[0]
//           : summaryElement
//         )
//           .$('.pv-entity__date-range')
//           .then(possibleH4 => {
//             if (!possibleH4) {
//               // eslint-disable-next-line no-console
//               console.error(`${linkedInId} company ${name} no date found`)
//               return false
//             }
//             return possibleH4
//               .getProperty('textContent')
//               .then(textContent => textContent.jsonValue())
//               .then(string => string.includes('Present'))
//           })

//         return {
//           name: companyName,
//           position,
//           isActive,
//           url: await experienceElement
//             .$('a')
//             .then(anchor => anchor.getProperty('href'))
//             .then(href => href.jsonValue()),
//           linkedInImg: await experienceElement
//             .$('img')
//             .then(image => image.getProperty('src'))
//             .then(src => src.jsonValue()),
//         }
//       }),
//     )

//     const filteredExperiences = parsedExperiences
//       .filter(({ isActive }) => isActive)
//       .slice(0, 1)

//     data.push({
//       name,
//       linkedIn: linkedInId,
//       linkedIdUrl,
//       entrepreneurType,
//       linkedInImg: profileImageUrl,
//       linkedInName: profileName,
//       companies: filteredExperiences,
//     })
//   }
//   if (isProd) {
//     await page.close()
//     const browser = await getBrowser()
//     await browser.close()
//   }
//   return data
// }

// module.exports = scrapeLinkedInProfiles
