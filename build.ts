import { cp, mkdir, readFile, writeFile } from 'fs/promises'
import { load } from 'cheerio'

const survey: ({name: string, share: number})[] = []
const surveyHtml = (await readFile('resource/Steam Hardware & Software Survey.html')).toString() 
const $survey = load(surveyHtml);
const substats = $survey('#sub_stats').eq(0)
const startIdx = substats.children('.substats_col_month_last_chg').index()
const rows = substats.children('.substats_row').slice(startIdx)
for (const row of rows) {
    const name = $survey(row).find('.substats_col_left').text()
    const share = Number.parseFloat($survey(row).find('.substats_col_month_last_pct').text())
    survey.push({name, share})
    if (name === 'Other') break
}
console.log(survey)

const dist = 'dist'
await mkdir(dist, { recursive: true })

cp('favicon.svg', `${dist}/favicon.svg`)

const template = (await readFile('index.html')).toString()
const body = `<span>hello</span>`
const html = template.replace('{body}', body)
await writeFile(`${dist}/index.html`, html)
