import assert from 'node:assert/strict'
import test from 'node:test'
import { LogicEngine, evaluate, validateVectors } from './engine.ts'
import { parseSpec, parseSpecText } from './schema.ts'
import { truthTable } from './diagram.ts'

const reference = { id: 'logic', title: 'Test fixture contract', url: 'https://www.jsonlogic.com/operations.html', revision: 'fixture', locator: 'Boolean operations', reviewed: '2026-09-18' }
const common = { group: 'core', description: 'Test fixture, not a physical chip', sourceRefs: ['logic'] }

function fixture() {
  return parseSpec({
    format: 'silicon-city/v1', id: 'fixture', name: 'Test fixture', part: 'No physical part', revision: '1', summary: 'Engine regression fixture', abstraction: 'boolean-functional', sources: [reference],
    groups: [{ id: 'core', label: 'Core', description: 'Test gates' }],
    inputs: [{ ...common, id: 'a', label: 'A', kind: 'boolean', default: false }, { ...common, id: 'b', label: 'B', kind: 'boolean', default: false }, { ...common, id: 'clk', label: 'Clock', kind: 'boolean', default: false }],
    blocks: [{ ...common, id: 'nand', label: 'NAND', kind: 'gate', rule: { op: 'not', args: [{ op: 'and', args: [{ var: 'a' }, { var: 'b' }] }] } }],
    outputs: [{ id: 'out', label: 'Output', signal: 'nand', description: 'NAND output', sourceRefs: ['logic'] }],
    requirements: [{ id: 'nand_truth', text: 'NAND operation', signals: ['nand'], sourceRefs: ['logic'] }],
    vectors: [{ id: 'truth', label: 'All input pairs', requirements: ['nand_truth'], steps: [
      { set: { a: false, b: false }, expect: { nand: true } }, { set: { a: false, b: true }, expect: { nand: true } },
      { set: { a: true, b: false }, expect: { nand: true } }, { set: { a: true, b: true }, expect: { nand: false } },
    ] }], assumptions: ['Ideal Boolean levels'], omissions: ['No physical timing'],
  })
}

test('declared NAND vectors execute without chip-specific code', () => {
  const report = validateVectors(fixture())
  assert.equal(report.status, 'pass')
  assert.equal(report.checks.length, 4)
})

test('unknowns are conservative, but controlling values resolve logic', () => {
  assert.equal(evaluate({ op: 'and', args: [{ var: 'missing' }, false] }, { missing: 'X' }), false)
  assert.equal(evaluate({ op: 'or', args: [{ var: 'missing' }, true] }, { missing: 'X' }), true)
  assert.equal(evaluate({ op: 'xor', args: [{ var: 'missing' }, false] }, { missing: 'X' }), 'X')
})

test('latches settle and preserve state when inputs release', () => {
  const spec = fixture()
  spec.blocks = [{ ...common, id: 'nand', label: 'Latch', kind: 'latch', initial: 'X', rule: { op: 'if', args: [{ var: 'a' }, true, { op: 'if', args: [{ var: 'b' }, false, { var: 'nand' }] }] } }]
  const engine = new LogicEngine(spec)
  assert.equal(engine.signals.nand, 'X')
  engine.apply({ a: true }); assert.equal(engine.signals.nand, true)
  engine.apply({ a: false }); assert.equal(engine.signals.nand, true)
  engine.apply({ b: true }); assert.equal(engine.signals.nand, false)
  engine.reset(); assert.equal(engine.signals.nand, 'X')
})

test('DFFs sample on a rising edge and commit simultaneously', () => {
  const spec = fixture()
  spec.blocks = [
    { ...common, id: 'nand', label: 'First DFF', kind: 'dff', initial: false, clock: 'clk', rule: { var: 'a' } },
    { ...common, id: 'second', label: 'Second DFF', kind: 'dff', initial: false, clock: 'clk', rule: { var: 'nand' } },
  ]
  const engine = new LogicEngine(spec)
  engine.apply({ a: true }); assert.equal(engine.signals.nand, false)
  engine.apply({ clk: true }); assert.equal(engine.signals.nand, true); assert.equal(engine.signals.second, false)
  engine.apply({ a: false }); assert.equal(engine.signals.nand, true)
  engine.apply({ clk: false }); engine.apply({ clk: true })
  assert.equal(engine.signals.nand, false); assert.equal(engine.signals.second, true)
})

test('schema rejects unknown operators, missing references, multiple drivers, and cycles', () => {
  const missing = fixture(); missing.outputs[0].signal = 'absent'
  assert.throws(() => parseSpec(missing), /unknown signal/)
  const duplicate = fixture(); duplicate.inputs.push(duplicate.inputs[0])
  assert.throws(() => parseSpec(duplicate), /Multiple drivers/)
  const cycle = fixture(); cycle.blocks[0] = { ...common, id: 'nand', label: 'Loop', kind: 'gate', rule: { var: 'nand' } }
  assert.throws(() => parseSpec(cycle), /Combinational loop/)
  const unsupported = fixture()
  unsupported.code = 'eval("arbitrary")'
  assert.throws(() => parseSpec(unsupported))
  assert.throws(() => parseSpecText('{"__proto__":{}}'), /Reserved property/)
})

test('numeric comparator equality is unknown and input changes are atomic', () => {
  const spec = fixture()
  spec.inputs.push({ ...common, id: 'voltage', label: 'Voltage', kind: 'number', default: 0, min: 0, max: 1, step: 0.01, integer: false, unit: 'V/VCC' })
  spec.blocks = [{ ...common, id: 'nand', label: 'Threshold', kind: 'comparator', rule: { op: 'gt', args: [{ var: 'voltage' }, 0.5] } }]
  const engine = new LogicEngine(spec)
  engine.apply({ voltage: 0.5 }); assert.equal(engine.signals.nand, 'X')
  engine.apply({ voltage: 0.7 }); assert.equal(engine.signals.nand, true)
  const before = engine.signals
  assert.throws(() => engine.apply({ a: true, voltage: 2 }), /range/)
  assert.deepEqual(engine.signals, before)
})

test('unsupported boundaries stay unknown and asynchronous oscillation is rejected', () => {
  const spec = fixture()
  spec.blocks = [{ ...common, id: 'nand', label: 'Unknown IP', kind: 'boundary', reason: 'No public behavioral specification' }]
  assert.equal(new LogicEngine(spec).signals.nand, 'X')
  spec.blocks = [{ ...common, id: 'nand', label: 'Oscillator', kind: 'latch', initial: false, rule: { op: 'not', args: [{ var: 'nand' }] } }]
  assert.throws(() => new LogicEngine(spec), /oscillating/)
})

test('validation reports failures and untested requirements instead of claiming conformance', () => {
  const spec = fixture()
  spec.vectors[0].steps[0].expect.nand = false
  assert.equal(validateVectors(spec).status, 'fail')
  spec.vectors = []
  assert.equal(validateVectors(spec).status, 'incomplete')
  assert.deepEqual(validateVectors(spec).uncovered, ['nand_truth'])
})

test('provenance cannot promote missing facts or physical geometry without evidence', () => {
  const spec = fixture()
  assert.equal(spec.blocks[0].evidence, 'unspecified')
  assert.equal(spec.blocks[0].geometry.evidence, 'illustrative')
  spec.blocks[0].properties = [{ name: 'Clock', value: 400, unit: 'MHz', evidence: 'primary_published', sourceRefs: [] }]
  assert.throws(() => parseSpec(spec), /lacks a source/)
  spec.blocks[0].properties = [{ name: 'Clock', value: 400, evidence: 'unspecified', sourceRefs: [] }]
  assert.throws(() => parseSpec(spec), /null value/)
  spec.blocks[0].properties = []
  spec.blocks[0].geometry = { kind: 'physical', evidence: 'illustrative', sourceRefs: [] }
  assert.throws(() => parseSpec(spec), /Physical geometry/)
})

test('device classes and architectural links do not invent executable behavior', () => {
  const spec = fixture()
  assert.equal(spec.deviceClass, 'component')
  assert.deepEqual(spec.connections, [])
  spec.deviceClass = 'fpga'
  spec.connections = [{ id: 'routing', from: 'a', to: 'nand', label: 'Routing context', description: 'Structural context, not another signal driver', kind: 'data', evidence: 'illustrative', sourceRefs: ['logic'] }]
  const parsed = parseSpec(spec)
  assert.equal(parsed.deviceClass, 'fpga')
  assert.equal(validateVectors(parsed).status, 'pass')
  spec.connections[0].to = 'absent'
  assert.throws(() => parseSpec(spec), /architectural endpoint/)
  spec.connections[0].to = 'nand'
  spec.connections[0].sourceRefs = ['absent']
  assert.throws(() => parseSpec(spec), /architectural source/)
  spec.connections[0].sourceRefs = ['logic']
  spec.connections.push({ ...spec.connections[0] })
  assert.throws(() => parseSpec(spec), /Duplicate architectural connection/)
})

test('configured LUTs use input zero as the low address bit and derive the same truth table', () => {
  const spec = fixture()
  spec.blocks = [{ ...common, id: 'nand', label: 'LUT2', kind: 'lut', inputs: ['a', 'b'], init: '0100' }]
  const engine = new LogicEngine(spec)
  engine.apply({ a: true, b: false }); assert.equal(engine.signals.nand, true)
  engine.apply({ a: false, b: true }); assert.equal(engine.signals.nand, false)
  assert.deepEqual(truthTable(engine.spec, 'nand').rows.map((row) => row.output), [false, false, true, false])
  spec.blocks[0].init = '011'
  assert.throws(() => parseSpec(spec), /2\^N/)
  spec.blocks[0].init = '0110'; spec.blocks[0].inputs = ['missing', 'b']
  assert.throws(() => parseSpec(spec), /Boolean signal/)
  spec.blocks[0].inputs = ['nand', 'b']
  assert.throws(() => parseSpec(spec), /Combinational loop/)
})

test('LUTs retain unknown inputs only when the configured result is ambiguous', () => {
  const spec = fixture()
  spec.blocks = [
    { ...common, id: 'external', label: 'Unmodeled input', kind: 'boundary', reason: 'No implementation' },
    { ...common, id: 'nand', label: 'Constant LUT', kind: 'lut', inputs: ['a', 'external'], init: '1111' },
  ]
  assert.equal(new LogicEngine(spec).signals.nand, true)
  spec.blocks[1].init = '0011'
  assert.equal(new LogicEngine(spec).signals.nand, 'X')
})