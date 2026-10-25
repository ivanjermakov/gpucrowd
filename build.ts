import { cp, mkdir, readFile, writeFile } from 'fs/promises'

const dist = 'dist'
await mkdir(dist, { recursive: true })

cp('favicon.svg', `${dist}/favicon.svg`)

const template = (await readFile('index.html')).toString()
const body = `<span>hello</span>`
const html = template.replace('{body}', body)
await writeFile(`${dist}/index.html`, html)
