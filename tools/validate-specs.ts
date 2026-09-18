import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { chipSchema, parseSpecText } from '../src/spec/schema.ts'
import { validateVectors } from '../src/spec/engine.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
if (process.argv.includes('--schema')) {
  const schema = z.toJSONSchema(chipSchema, { target: 'draft-2020-12', unrepresentable: 'throw' })
  await writeFile(resolve(root, 'specs/chip.schema.json'), `${JSON.stringify(schema, null, 2)}\n`)
  console.log('Generated specs/chip.schema.json; semantic validation still requires validate:specs.')
} else {
  const requested = process.argv.slice(2)
  const files = requested.length ? requested.map((file) => resolve(file)) : (await readdir(resolve(root, 'specs'))).filter((name) => name.endsWith('.json') && name !== 'chip.schema.json').map((name) => resolve(root, 'specs', name))
  let failed = false
  const reports = []
  for (const file of files) {
    try {
      const spec = parseSpecText(await readFile(file, 'utf8'))
      const report = validateVectors(spec)
      reports.push({ file: basename(file), id: spec.id, status: report.status, assertions: report.checks.length, covered: report.covered.length, requirements: spec.requirements.length, failures: report.failed, errors: report.errors, uncovered: report.uncovered, omissions: spec.omissions, scope: report.scope })
      if (report.status !== 'pass') failed = true
    } catch (error) {
      failed = true
      reports.push({ file: basename(file), status: 'invalid', error: error instanceof Error ? error.message : String(error) })
    }
  }
  if (!files.length) { failed = true; reports.push({ status: 'invalid', error: 'No specifications found' }) }
  console.log(JSON.stringify({ kind: 'functional-vector-report', reports }, null, 2))
  process.exitCode = failed ? 1 : 0
}