import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { z } from 'zod'
import { chipSchema, parseSpecText } from './schema.ts'
import { LogicEngine, validateVectors } from './engine.ts'
import { buildDiagram, truthTable } from './diagram.ts'

const directory = new URL('../../specs/', import.meta.url)
const load = (name) => parseSpecText(readFileSync(new URL(name, directory), 'utf8'))

test('generated JSON Schema matches the authoring schema', () => {
  const generated = JSON.parse(readFileSync(new URL('chip.schema.json', directory), 'utf8'))
  assert.deepEqual(generated, z.toJSONSchema(chipSchema, { target: 'draft-2020-12', unrepresentable: 'throw' }))
})

for (const name of readdirSync(directory).filter((name) => name.endsWith('.json') && name !== 'chip.schema.json')) {
  test(`${name}: every declared requirement is exercised and every vector passes`, () => {
    const report = validateVectors(load(name))
    assert.equal(report.status, 'pass', JSON.stringify(report))
    assert.deepEqual(report.uncovered, [])
  })
}

test('all 256 quad NAND input combinations agree with the independent truth table', () => {
  const engine = new LogicEngine(load('sn74hc00.json'))
  for (let mask = 0; mask < 256; mask += 1) {
    const inputs = Object.fromEntries(engine.spec.inputs.map((input, index) => [input.id, Boolean(mask & (1 << index))]))
    engine.apply(inputs)
    for (let channel = 1; channel <= 4; channel += 1) assert.equal(engine.signals[`y${channel}`], !(inputs[`a${channel}`] && inputs[`b${channel}`]))
  }
})

test('RV32I scope guard exhaustively covers opcode, funct3, and equality combinations', () => {
  const engine = new LogicEngine(load('rv32i_branch.json'))
  for (let opcode = 0; opcode < 128; opcode += 1) for (let funct3 = 0; funct3 < 8; funct3 += 1) for (const equal of [false, true]) {
    engine.apply({ opcode, funct3, operands_equal: equal })
    const supported = opcode === 99 && (funct3 === 0 || funct3 === 1)
    assert.equal(engine.signals.supported, supported)
    assert.equal(engine.signals.take_branch, supported ? (funct3 === 0 ? equal : !equal) : 'X')
  }
})

test('NAND tables are complete and a latch table distinguishes previous state', () => {
  const nand = truthTable(load('sn74hc00.json'), 'y1')
  assert.equal(nand.available, true)
  assert.deepEqual(nand.columns, ['a1', 'b1'])
  assert.deepEqual(nand.rows.map((row) => row.output), [true, true, true, false])
  const timer = load('ne555.json')
  const latch = truthTable(timer, 'latch_q')
  assert.equal(latch.rows.length, 16)
  assert.ok(latch.columns.includes('latch_q[t]'))
  assert.equal(truthTable(timer, 'trigger_low').available, false)
  assert.equal(truthTable(timer, 'rc_network').available, false)
})

test('expanding subsystems reveals real dependency edges and embedded truth tables', () => {
  const spec = load('ne555.json')
  const collapsed = buildDiagram(spec, new Set())
  assert.ok(collapsed.nodes.some((node) => node.id === 'group:comparators'))
  const expanded = buildDiagram(spec, new Set(spec.groups.map((group) => group.id)), new Set(['latch_q']))
  assert.ok(expanded.nodes.some((node) => node.id === 'latch_q' && node.height > 94))
  assert.ok(expanded.edges.some((edge) => edge.from === 'trigger_low' && edge.to === 'latch_q'))
  assert.ok(expanded.edges.some((edge) => edge.from === 'latch_q' && edge.to === 'latch_q'))
  for (const edge of expanded.edges) assert.ok(edge.points.length >= 2)
  assert.ok(expanded.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)))
})

test('nested subsystem expansion does not bypass a collapsed ancestor', () => {
  const spec = load('ne555.json')
  spec.groups.push({ id: 'chip', label: 'Entire chip', description: 'Top-level subsystem' })
  for (const group of spec.groups) if (group.id !== 'chip') group.parent = 'chip'
  const collapsed = buildDiagram(spec, new Set(['comparators']))
  assert.deepEqual(collapsed.nodes.filter((node) => node.kind === 'subsystem').map((node) => node.id), ['group:chip'])
  const opened = buildDiagram(spec, new Set(['chip', 'comparators']))
  assert.ok(opened.nodes.some((node) => node.id === 'trigger_low'))
  assert.ok(opened.nodes.some((node) => node.id === 'group:storage'))
})

test('architecture connections stay separate from Boolean dependencies at every expansion level', () => {
  const spec = load('ne555.json')
  spec.connections = [{ id: 'external_timing', from: 'rc_network', to: 'trigger', label: 'External timing context', description: 'No RC equation is introduced', kind: 'data', evidence: 'illustrative', sourceRefs: ['ti_555'] }]
  const engine = new LogicEngine(spec)
  assert.equal(engine.signals.out_high, 'X')
  for (const groups of [new Set(), new Set(spec.groups.map((group) => group.id))]) {
    const diagram = buildDiagram(spec, groups)
    const structural = diagram.edges.filter((edge) => edge.kind === 'architecture')
    assert.equal(structural.length, 1)
    assert.deepEqual(structural[0].signals, [])
    assert.deepEqual(structural[0].sourceRefs, ['ti_555'])
    assert.ok(structural[0].points.length >= 2)
    assert.ok(diagram.edges.some((edge) => edge.kind === 'signal'))
  }
})

test('NVDLA CSB and mask contracts agree with independent Boolean definitions', () => {
  const engine = new LogicEngine(load('nvdla_v1.json'))
  for (let mask = 0; mask < 128; mask += 1) {
    const [valid, ready, write, nonposted, producer, enable0, enable1] = Array.from({ length: 7 }, (_, bit) => Boolean(mask & (1 << bit)))
    engine.apply({ valid, ready, write, nonposted, producer, enable0, enable1 })
    const actual = engine.signals
    const accepted = valid && ready
    const protectedBank = producer ? enable1 : enable0
    assert.equal(actual.accepted, accepted)
    assert.equal(actual.read_expected, accepted && !write)
    assert.equal(actual.write_expected, accepted && write && nonposted)
    assert.equal(actual.posted_write, accepted && write && !nonposted)
    assert.equal(actual.write_allowed, accepted && write && !protectedBank)
    assert.equal(actual.write_ignored, accepted && write && protectedBank)
  }
  for (let mask = 0; mask < 16; mask += 1) {
    const [status0, mask0, status1, mask1] = Array.from({ length: 4 }, (_, bit) => Boolean(mask & (1 << bit)))
    engine.apply({ status0, mask0, status1, mask1 })
    assert.equal(engine.signals.host_irq, (status0 && !mask0) || (status1 && !mask1))
    assert.equal(engine.signals.cmac, 'X')
  }
})

test('STM32 EXTI and Cortex-M masks exhaustively preserve independent event/interrupt semantics', () => {
  const engine = new LogicEngine(load('stm32f103_mcu.json'))
  const names = ['rising', 'falling', 'rtsr', 'ftsr', 'pending', 'imr', 'emr', 'nvic_enabled', 'primask', 'priority_ok']
  for (let combination = 0; combination < 1024; combination += 1) {
    const input = Object.fromEntries(names.map((name, bit) => [name, Boolean(combination & (1 << bit))]))
    engine.apply(input)
    const edge = (input.rising && input.rtsr) || (input.falling && input.ftsr)
    assert.equal(engine.signals.edge_selected, edge)
    assert.equal(engine.signals.event_request, edge && input.emr)
    assert.equal(engine.signals.irq_request, input.pending && input.imr)
    assert.equal(engine.signals.exception_eligible, input.pending && input.imr && input.nvic_enabled && !input.primask && input.priority_ok)
    assert.equal(engine.signals.pending, input.pending)
    assert.equal(engine.signals.cortex_m3, 'X')
  }
})

test('i.MX MPU GIC gates and all digital priority-mask pairs follow the interface contract', () => {
  const engine = new LogicEngine(load('imx6ull_mpu.json'))
  const names = ['pending', 'irq_enable', 'target_cpu0', 'distributor_enable', 'interface_enable', 'other_checks']
  for (let combination = 0; combination < 64; combination += 1) {
    const input = Object.fromEntries(names.map((name, bit) => [name, Boolean(combination & (1 << bit))]))
    engine.apply(input)
    assert.equal(engine.signals.irq_eligible, names.every((name) => input[name]))
  }
  engine.apply(Object.fromEntries(names.map((name) => [name, true])))
  for (let priority = 0; priority < 256; priority += 1) for (let priority_mask = 0; priority_mask < 256; priority_mask += 1) {
    engine.apply({ priority, priority_mask })
    assert.equal(engine.signals.priority_pass, priority < priority_mask)
    assert.equal(engine.signals.irq_eligible, priority < priority_mask)
  }
  assert.equal(engine.signals.cortex_a7, 'X')
  assert.equal(engine.spec.blocks.find((block) => block.id === 'security').description.includes('removes'), true)
})

test('FPGA LUT6 evaluates every configured address and its inline truth table agrees', () => {
  const engine = new LogicEngine(load('artix7_fpga.json'))
  for (let address = 0; address < 64; address += 1) {
    const input = Object.fromEntries(Array.from({ length: 6 }, (_, bit) => [`i${bit}`, Boolean(address & (1 << bit))]))
    engine.apply(input)
    assert.equal(engine.signals.lut_result, Object.values(input).filter(Boolean).length % 2 === 1)
  }
  const table = truthTable(engine.spec, 'lut_result')
  assert.equal(table.rows.length, 64)
  for (const row of table.rows) assert.equal(row.output, row.inputs.filter(Boolean).length % 2 === 1)
  const changed = load('artix7_fpga.json')
  changed.blocks.find((block) => block.id === 'lut_result').init = '0'.repeat(64)
  assert.equal(validateVectors(changed).status, 'fail')
})

test('FPGA carry chain matches every functional select/data/seed combination', () => {
  const engine = new LogicEngine(load('artix7_fpga.json'))
  for (let combination = 0; combination < 1024; combination += 1) {
    const names = ['i0', 'i1', 'i2', 'i3', 'di0', 'di1', 'di2', 'di3', 'ci', 'cyinit']
    const input = Object.fromEntries(names.map((name, bit) => [name, Boolean(combination & (1 << bit))]))
    engine.apply(input)
    let carry = input.ci || input.cyinit
    for (let stage = 0; stage < 4; stage += 1) {
      const select = input[`i${stage}`]
      assert.equal(engine.signals[`sum${stage}`], select !== carry)
      carry = select ? carry : input[`di${stage}`]
      assert.equal(engine.signals[`co${stage}`], carry)
    }
    assert.equal(engine.signals.bram, 'X')
  }
})

test('FPGA synchronous reset, enable, and simultaneous register commits match the primitive contract', () => {
  const engine = new LogicEngine(load('artix7_fpga.json'))
  engine.apply({ i0: true, clk: true })
  assert.equal(engine.signals.q0, true); assert.equal(engine.signals.q1, false)
  engine.apply({ clk: false }); engine.apply({ clk: true })
  assert.equal(engine.signals.q1, true)
  engine.apply({ reset: true, ce: false })
  assert.equal(engine.signals.q0, true); assert.equal(engine.signals.q1, true)
  engine.apply({ clk: false }); engine.apply({ clk: true })
  assert.equal(engine.signals.q0, false); assert.equal(engine.signals.q1, false)
  engine.apply({ reset: false, clk: false }); engine.apply({ clk: true })
  assert.equal(engine.signals.q0, false)
})