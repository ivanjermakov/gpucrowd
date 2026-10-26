import { cp, mkdir, readFile, writeFile } from 'fs/promises'
import { load } from 'cheerio'

const survey: Record<string, { share: number, score?: number }> = {}
{
    const surveyHtml = (await readFile('resource/Steam Hardware & Software Survey.html')).toString()
    const $survey = load(surveyHtml);
    const substats = $survey('#sub_stats').eq(0)
    const startIdx = substats.children('.substats_col_month_last_chg').index()
    const rows = substats.children('.substats_row').slice(startIdx)
    for (const row of rows) {
        const name = $survey(row).find('.substats_col_left').text()
        const key = name.toUpperCase()
            .replace('(R)', '')
            .replace('(TM)', '')
            .replace('GEFORCE ', '')
            .replace(' GRAPHICS', '')
            .replace('RADEON ', '')
            .replace('XE GRAPHICS', 'XE')
            .replace('-XT', ' XT')
            .replace('1650 TI', '1650 TI (MOBILE)')
        const share = Number.parseFloat($survey(row).find('.substats_col_month_last_pct').text())
        survey[key] = { share }
        if (name === 'Other') break
    }
}

{
    for (let i = 1; i <= 10; i++) {
        const benchHtml = (await readFile(`resource/GPU UserBenchmarks - 453 Graphics Cards Compared${i}.html`)).toString()
        const $bench = load(benchHtml);
        const rows = $bench('#tableDataForm tr').slice(2)
        for (const row of rows) {
            const brand = $bench(row).find('td').eq(1).find('span.semi-strongs').contents().eq(2).text().trim()
            const name = $bench(row).find('td').eq(1).find('span a').text()
            const key = `${brand} ${name}`.toUpperCase()
                .replace('RADEON ', '')
                .replace(' GRAPHICS', '')
                .replace('-TI', ' TI')
                .replace('-S (SUPER)', ' SUPER')
                .replace('S (SUPER)', ' SUPER')
                .replace('-TS (TI-SUPER)', ' TI SUPER')
                .replace(/\-\d+GB/, '')
                .replace('-XT', ' XT')
                .replace(' (LAPTOP)', ' LAPTOP GPU')
                .replace(' (MOBILE KABY LAKE R)', '')
                .replace(' (DESKTOP COFFEE LAKE I5 I7)', '')
            const score = Number.parseFloat($bench(row).find('td').eq(4).find('div div').contents().eq(0).text())
            const e = survey[key]
            if (e) {
                e.score = score
            } else {
                // console.warn('key not found', key)
            }
        }
    }
}
// const unmatched = Object.entries(survey).filter(e => !e[1].score)
// console.log(unmatched, unmatched.map(e => e[1].share).reduce((a, b) => a + b, 0))
// console.log('matched %', 100 * Object.values(survey).filter(e => e.score).length / Object.values(survey).length)
console.log(survey)
const entries = Object.entries(survey)
    .map(([name, e]) => ({ name, ...e, better: undefined as number | undefined }))
    .toSorted((a, b) => (a.score ?? Number.MAX_VALUE) - (b.score ?? Number.MAX_VALUE))
{
    var share = 0
    for (const entry of entries) {
        if (entry.score) {
            entry.better = share
            share += entry.share
        }
    }
}

const dist = 'dist'
await mkdir(dist, { recursive: true })

cp('favicon.svg', `${dist}/favicon.svg`)

const template = (await readFile('index.html')).toString()
const body = `
<table>
<thead>
<tr>
<th>Name</th>
<th class="right"><a href="https://gpu.userbenchmark.com/">Perf score<a></th>
<th class="right">Share (%)</th>
<th class="right">Slower than (%)</th>
<th class="right">Faster than (%)</th>
</tr>
</thead>
<tbody>
${entries.map((e) => `
<tr>
<td>${e.name}</td>
<td class="right">${e.score ?? 'N/A'}</td>
<td class="right">${e.share}</td>
<td class="right">${e.better !== undefined ? (share - e.better).toFixed() : 'N/A'}</td>
<td class="right">${e.better !== undefined ? e.better.toFixed() : 'N/A'}</td>
</tr>
`).join('\n')}
</tbody>
</table>
`
const html = template.replace('{body}', body)
await writeFile(`${dist}/index.html`, html)
