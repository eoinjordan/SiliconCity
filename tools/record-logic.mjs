import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, rm, stat, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('..', import.meta.url))
const url = new URL('logic.html', process.argv[2] ?? 'http://127.0.0.1:4180/').href
const includeCity = process.argv.includes('--city')
const work = await mkdtemp(join(tmpdir(), 'siliconcity-logic-'))
const media = join(root, 'docs/media')
await mkdir(media, { recursive: true })
function execute(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`)
  return result.stdout
}
const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const recordings = []
execute('npm', ['run', 'build'])
const inputs = execute('git', ['ls-files', '-z', '--', 'src', 'specs', 'public', 'index.html', 'logic.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts']).split('\0').filter(Boolean).sort()
const sourceHash = createHash('sha256')
for (const file of inputs) sourceHash.update(file).update('\0').update(await readFile(join(root, file))).update('\0')
const provenance = {
  schema: 'siliconcity-recordings/v1',
  kind: 'educational-preview-recordings',
  sourceCommit: execute('git', ['rev-parse', 'HEAD']).trim(),
  sourceInputSha256: sourceHash.digest('hex'),
  buildIndexSha256: sha256(await readFile(join(root, 'dist/index.html'))),
  buildLogicSha256: sha256(await readFile(join(root, 'dist/logic.html'))),
  recorderSha256: sha256(await readFile(fileURLToPath(import.meta.url))),
  timing: 'Edited model progression, not wall-clock silicon performance',
  nativeDeviceExecution: false,
}
async function encode(name, frames, fps, scenario, observations) {
  const output = join(media, `${name}.gif`)
  execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', join(work, `${name}-%03d.png`), '-filter_complex', '[0:v]scale=960:-2:flags=lanczos,split[frames][colors];[colors]palettegen=max_colors=160[palette];[frames][palette]paletteuse=dither=bayer', '-loop', '0', output])
  const metadata = JSON.parse(execute('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_read_frames,duration', '-of', 'json', output])).streams[0]
  assert.equal(metadata.width, 960)
  assert.equal(metadata.height, 600)
  assert.equal(Number(metadata.nb_read_frames), frames)
  const decodedFrame = join(tmpdir(), `siliconcity-${name}-preview.png`)
  execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', output, '-vf', 'select=eq(n\\,20)', '-frames:v', '1', decodedFrame])
  const record = { file: `${name}.gif`, frames, playbackFramesPerSecond: fps, ...metadata, bytes: (await stat(output)).size, sha256: sha256(await readFile(output)), scenario, observations }
  recordings.push(record)
  console.log(`${name}: ${frames} frames, ${metadata.width}x${metadata.height}, validated states; check frame ${decodedFrame}`)
}
async function selectDevice(page, family, device) {
  await page.locator('#device-class').selectOption(family)
  if (device) await page.locator('#device').selectOption(device)
  await page.locator('[data-view="city"]').click()
}
async function recordCity(browser, name) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  const errors = []
  const observations = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(new URL('./', url).href)
    await page.locator('#boot').waitFor({ state: 'hidden' })
    await page.evaluate(() => document.fonts.ready)
    const initialTheme = await page.locator('html').getAttribute('data-theme')
    for (let frame = 0; frame < 24; frame += 1) {
      if (name === 'overview' && frame === 12) {
        await page.keyboard.press('n')
        assert.notEqual(await page.locator('html').getAttribute('data-theme'), initialTheme)
      }
      if (name === 'tour') {
        if (frame === 0) await page.keyboard.press('t')
        else if (frame % 3 === 0) await page.locator('#tour-layer').getByRole('button', { name: /^Next/ }).click()
        await expect(page.locator('#tour-layer')).toHaveClass(/show/)
      }
      if (name === 'quantization' && frame % 6 === 0) {
        const precision = ['INT4', 'INT8', 'INT16', 'FP16'][frame / 6]
        await page.locator('#precision').selectOption(precision)
        await expect(page.locator('#hud-bottom')).toContainText(precision)
      }
      if (name === 'workloads' && frame % 8 === 0) {
        const [workload, label] = [['llm-decode', 'LLM'], ['vision-conv', 'Vision'], ['idle', 'Idle']][frame / 8]
        await page.locator('#workload').selectOption(workload)
        await expect(page.locator('#hud-bottom')).toContainText(label)
      }
      await page.mouse.move(2, 2)
      await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame) })
      if (frame % 3 === 0) observations.push(await page.evaluate((index) => ({ frame: index, theme: document.documentElement.dataset.theme, workload: document.querySelector('#workload').value, precision: document.querySelector('#precision').value, status: document.querySelector('#hud-bottom').textContent, tour: document.querySelector('#tour-layer h2')?.textContent ?? null }), frame))
      await page.screenshot({ path: join(work, `${name}-${String(frame).padStart(3, '0')}.png`) })
    }
    assert.deepEqual(errors, [])
    assert.notEqual(sha256(await readFile(join(work, `${name}-000.png`))), sha256(await readFile(join(work, `${name}-023.png`))))
    await encode(name, 24, 3, `Hexagon city ${name}: illustrative activity only; no native runtime connected.`, observations)
  } finally { await page.close() }
}
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  const errors = []
  const observations = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  await page.locator('#city-view[data-rendered="true"]').waitFor()
  await page.evaluate(() => document.fonts.ready)
  for (let index = 0; index < 84; index += 1) {
    if (index === 3) { await page.locator('#vector').selectOption('1'); await page.locator('#next-step').click(); await expect(page.locator('[data-output="out_pin"] strong')).toHaveText('1') }
    if (index === 6) { await page.locator('[data-inspect="latch_q"]').click(); await page.getByRole('button', { name: 'Expand table in diagram' }).click() }
    if (index === 12) { await page.locator('#device').selectOption('sn74hc00'); await page.locator('[data-inspect="y1"]').click(); await page.getByRole('button', { name: 'Expand table in diagram' }).click() }
    if (index === 18) { await page.locator('#input-a1').check(); await page.locator('#input-b1').check(); await expect(page.locator('[data-output="out1"] strong')).toHaveText('0') }
    if (index === 24) await selectDevice(page, 'cpu', 'rv32i_branch')
    if (index === 30) { await page.locator('#input-funct3').fill('4'); await page.locator('#input-funct3').press('Tab'); await expect(page.locator('[data-output="taken_output"] strong')).toHaveText('X') }
    if (index === 36) await selectDevice(page, 'mcu')
    if (index === 39) { await page.locator('#input-pending').check(); await expect(page.locator('[data-output="core_output"] strong')).toHaveText('1') }
    if (index === 43) { await page.locator('#input-primask').check(); await expect(page.locator('[data-output="core_output"] strong')).toHaveText('0') }
    if (index === 48) await selectDevice(page, 'mpu')
    if (index === 51) await page.locator('#input-pending').check()
    if (index === 55) { await page.locator('#input-priority').fill('128'); await page.locator('#input-priority').press('Tab'); await expect(page.locator('[data-output="priority_output"] strong')).toHaveText('0') }
    if (index === 60) await selectDevice(page, 'npu')
    if (index === 63) { await page.locator('#input-status0').check(); await expect(page.locator('[data-output="irq_output"] strong')).toHaveText('1') }
    if (index === 67) { await page.locator('#input-mask0').check(); await expect(page.locator('[data-output="irq_output"] strong')).toHaveText('0') }
    if (index === 72) await selectDevice(page, 'fpga')
    if (index === 75) { await page.locator('#input-i0').check(); await expect(page.locator('[data-output="lut_output"] strong')).toHaveText('1') }
    if (index === 78) { await page.locator('[data-clock="clk"]').click(); await expect(page.locator('[data-output="register_output"] strong')).toHaveText('1'); await expect(page.locator('[data-output="pipeline_output"] strong')).toHaveText('0') }
    if (index === 81) { await page.locator('[data-clock="clk"]').click(); await expect(page.locator('[data-output="pipeline_output"] strong')).toHaveText('1') }
    if (index === 82) { await page.locator('[data-inspect="lut_result"]').click(); await page.getByRole('button', { name: 'Expand table in diagram' }).click(); await expect(page.locator('.logic-node[data-node="lut_result"] .truth-table tbody tr')).toHaveCount(64) }
    await expect(page.locator('#check-count')).toHaveAttribute('data-result', 'pass')
    await page.mouse.move(2, 2)
    await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame) })
    if (index % 6 === 0 || index === 83) observations.push(await page.evaluate((frame) => ({ frame, device: document.querySelector('#device').value, checks: document.querySelector('#check-count').textContent, coverage: document.querySelector('#coverage-count').textContent, outputs: [...document.querySelectorAll('.output-row')].map((element) => element.textContent) }), index))
    await page.screenshot({ path: join(work, `logic-lab-${String(index).padStart(3, '0')}.png`) })
  }
  await page.screenshot({ path: join(tmpdir(), 'siliconcity-logic-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.locator('#city-view[data-rendered="true"]').waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: join(tmpdir(), 'siliconcity-logic-mobile.png'), fullPage: true })
  assert.deepEqual(errors, [])
  await encode('logic-lab', 84, 6, 'Seven examples: 555 and NAND truth tables, unsupported branch X, MCU/MPU/NPU interrupt conditions, then FPGA LUT and two explicit clock pulses.', observations)
  await page.close()
  if (includeCity) for (const name of ['overview', 'tour', 'quantization', 'workloads']) await recordCity(browser, name)
  await writeFile(join(media, 'recording.json'), JSON.stringify({ ...provenance, recordedAt: new Date().toISOString(), pageErrors: 0, logicMobileOverflow: false, recordings }, null, 2) + '\n')
} finally {
  await browser.close()
  await rm(work, { recursive: true, force: true })
}