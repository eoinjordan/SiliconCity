import { defineConfig } from '@playwright/test'

const app = process.env.TEST_APP === '1'
const logic = process.env.TEST_LOGIC === '1'
const production = app || logic
const suite = logic ? 'logic' : app ? 'app' : 'engine'
const port = Number(process.env.PLAYWRIGHT_PORT ?? (logic ? 4182 : 4179))
const base = '/__pages_test__/'
const baseURL = `http://127.0.0.1:${port}${base}`

export default defineConfig({
  testDir: './tests/browser',
  testMatch: `${suite}.spec.mjs`,
  outputDir: `test-results/${suite}`,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: production ? 60_000 : 30_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: `playwright-report/${suite}` }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npm run ${production ? 'preview' : 'dev'} -- --host 127.0.0.1 --port ${port} --strictPort --base ${base}`,
    url: production ? baseURL : `${baseURL}tests/fixtures/scene.html`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})