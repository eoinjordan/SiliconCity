import { chromium } from '@playwright/test'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('..', import.meta.url))
const url = new URL('logic.html', process.argv[2] ?? 'http://127.0.0.1:4180/').href
const work = await mkdtemp(join(tmpdir(), 'siliconcity-logic-'))
const media = join(root, 'docs/media')
await mkdir(media, { recursive: true })
function execute(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`)
  return result.stdout
}
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  await page.locator('#city-view[data-rendered="true"]').waitFor()
  await page.evaluate(() => document.fonts.ready)
  for (let index = 0; index < 48; index += 1) {
    if (index === 6) { await page.locator('#vector').selectOption('1'); await page.locator('#next-step').click() }
    if (index === 13) { await page.locator('[data-inspect="latch_q"]').click(); await page.getByRole('button', { name: 'Expand table in diagram' }).click() }
    if (index === 25) { await page.locator('#collapse-all').click(); await page.locator('#fit').click() }
    if (index === 32) { await page.locator('#device').selectOption('sn74hc00'); await page.locator('[data-inspect="y1"]').click(); await page.getByRole('button', { name: 'Expand table in diagram' }).click() }
    if (index === 39) { await page.locator('#input-a1').check(); await page.locator('#input-b1').check() }
    await page.mouse.move(2, 2)
    await page.screenshot({ path: join(work, `frame-${String(index).padStart(3, '0')}.png`) })
    await page.waitForTimeout(120)
  }
  if (errors.length) throw new Error(errors.join('\n'))
  const output = join(media, 'logic-lab.gif')
  execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '6', '-i', join(work, 'frame-%03d.png'), '-filter_complex', '[0:v]scale=960:-2:flags=lanczos,split[frames][colors];[colors]palettegen=max_colors=160[palette];[frames][palette]paletteuse=dither=bayer', '-loop', '0', output])
  const metadata = JSON.parse(execute('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_read_frames,duration', '-of', 'json', output])).streams[0]
  if (metadata.width !== 960 || metadata.height !== 600 || Number(metadata.nb_read_frames) !== 48) throw new Error('Encoded preview metadata mismatch')
  const check = join(tmpdir(), 'siliconcity-logic-preview.png')
  execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', output, '-vf', 'select=eq(n\\,20)', '-frames:v', '1', check])
  console.log(JSON.stringify({ output, ...metadata, bytes: (await stat(output)).size, decodedFrame: check }, null, 2))
} finally {
  await browser.close()
  await rm(work, { recursive: true, force: true })
}