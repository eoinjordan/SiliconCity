import { z } from 'zod'
import dagre from '@dagrejs/dagre'

export type Logic = boolean | 'X'
export type Value = Logic | number
export type Operator = 'not' | 'and' | 'or' | 'xor' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'if'
export type Rule = boolean | number | { var: string } | { op: Operator; args: Rule[] }

const identifier = z.string().regex(/^[a-z][a-z0-9_]{0,47}$/).refine((name) => !['__proto__', 'prototype', 'constructor'].includes(name))
const text = z.string().min(1).max(2000)
const label = z.string().min(1).max(100)
const sourceRefs = z.array(identifier).min(1).max(16)
export const evidenceKinds = ['primary_published', 'primary_derived', 'open_source_implementation', 'secondary_inference', 'illustrative', 'unspecified'] as const
const evidence = z.enum(evidenceKinds)
const property = z.object({ name: label, value: z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]), unit: label.optional(), evidence, sourceRefs: z.array(identifier).max(16) }).strict()
const geometry = z.object({
  kind: z.enum(['logical', 'package', 'physical']), evidence,
  sourceRefs: z.array(identifier).max(16), coordinates: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]).optional(),
}).strict()
const logic = z.union([z.boolean(), z.literal('X')])
const scalar = z.union([logic, z.number().finite()])
const rule: z.ZodType<Rule> = z.lazy(() => z.union([
  z.boolean(), z.number().finite(), z.object({ var: identifier }).strict(),
  z.object({ op: z.enum(['not', 'and', 'or', 'xor', 'eq', 'ne', 'lt', 'le', 'gt', 'ge', 'if']), args: z.array(rule).min(1).max(16) }).strict(),
]))
const common = {
  id: identifier, label, group: identifier, description: text, sourceRefs,
  evidence: evidence.default('unspecified'),
  category: z.enum(['logic', 'compute', 'memory', 'interconnect', 'dma', 'clock', 'power', 'io', 'security', 'software', 'package', 'context']).default('logic'),
  scale: z.enum(['logic', 'execution', 'chip', 'package', 'board', 'system', 'software']).default('logic'),
  properties: z.array(property).max(32).default([]),
  geometry: geometry.default({ kind: 'logical', evidence: 'illustrative', sourceRefs: [] }),
}
const blockSchema = z.discriminatedUnion('kind', [
  z.object({ ...common, kind: z.literal('gate'), rule }).strict(),
  z.object({ ...common, kind: z.literal('lut'), inputs: z.array(identifier).min(1).max(6), init: z.string().regex(/^[01]+$/).min(2).max(64) }).strict(),
  z.object({ ...common, kind: z.literal('comparator'), rule }).strict(),
  z.object({ ...common, kind: z.literal('latch'), initial: logic, rule }).strict(),
  z.object({ ...common, kind: z.literal('dff'), initial: logic, clock: identifier, rule }).strict(),
  z.object({ ...common, kind: z.literal('boundary'), reason: text }).strict(),
])

export const chipSchema = z.object({
  format: z.literal('silicon-city/v1'),
  id: identifier,
  name: label,
  part: label,
  deviceClass: z.enum(['component', 'cpu', 'mcu', 'mpu', 'npu', 'gpu', 'fpga', 'soc']).default('component'),
  revision: label,
  summary: text,
  abstraction: z.enum(['boolean-functional', 'mixed-signal-behavioral', 'subsystem-contract']),
  sources: z.array(z.object({
    id: identifier, title: text, url: z.url().refine((url) => url.startsWith('https://')),
    revision: label, locator: text, reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    publisher: label.default('Unspecified'), type: z.enum(['datasheet', 'specification', 'manual', 'implementation', 'secondary', 'unspecified']).default('unspecified'),
    redistribution: z.enum(['link-only', 'licensed', 'unspecified']).default('link-only'),
  }).strict()).min(1).max(24),
  groups: z.array(z.object({ id: identifier, label, description: text, parent: identifier.optional() }).strict()).min(1).max(32),
  inputs: z.array(z.discriminatedUnion('kind', [
    z.object({ ...common, kind: z.literal('boolean'), default: z.boolean(), pin: label.optional() }).strict(),
    z.object({ ...common, kind: z.literal('number'), default: z.number().finite(), min: z.number().finite(), max: z.number().finite(), step: z.number().positive(), unit: label, integer: z.boolean().default(false), pin: label.optional() }).strict(),
  ])).min(1).max(64),
  blocks: z.array(blockSchema).min(1).max(128),
  connections: z.array(z.object({
    id: identifier, from: identifier, to: identifier, label, description: text,
    kind: z.enum(['data', 'control', 'memory', 'clock', 'configuration']),
    evidence, sourceRefs,
  }).strict()).max(256).default([]),
  outputs: z.array(z.object({ id: identifier, label, signal: identifier, description: text, pin: label.optional(), sourceRefs }).strict()).min(1).max(64),
  requirements: z.array(z.object({ id: identifier, text, signals: z.array(identifier).min(1).max(32), sourceRefs }).strict()).max(128),
  vectors: z.array(z.object({
    id: identifier, label, requirements: z.array(identifier).min(1).max(32),
    steps: z.array(z.object({ set: z.record(identifier, z.union([z.boolean(), z.number().finite()])), expect: z.record(identifier, scalar) }).strict()).min(1).max(64),
  }).strict()).max(512),
  assumptions: z.array(text).min(1).max(32),
  omissions: z.array(text).min(1).max(32),
}).strict()

export type ChipSpec = z.infer<typeof chipSchema>
export type Block = ChipSpec['blocks'][number]

export function blockRule(block: Exclude<Block, { kind: 'boundary' }>): Rule {
  if (block.kind !== 'lut') return block.rule
  const { init, inputs } = block
  function select(bit: number, offset: number): Rule {
    if (bit < 0) return init[offset] === '1'
    return { op: 'if', args: [{ var: inputs[bit] }, select(bit - 1, offset + 2 ** bit), select(bit - 1, offset)] }
  }
  return select(inputs.length - 1, 0)
}

export function references(expression: Rule): string[] {
  if (typeof expression !== 'object') return []
  if ('var' in expression) return [expression.var]
  return [...new Set(expression.args.flatMap(references))]
}

export function expressionText(expression: Rule): string {
  if (typeof expression === 'boolean') return expression ? '1' : '0'
  if (typeof expression === 'number') return String(expression)
  if ('var' in expression) return expression.var
  const args = expression.args.map(expressionText)
  const symbols = { and: ' AND ', or: ' OR ', xor: ' XOR ', eq: ' = ', ne: ' != ', lt: ' < ', le: ' <= ', gt: ' > ', ge: ' >= ' }
  if (expression.op === 'not') return `NOT(${args[0]})`
  if (expression.op === 'if') return `IF ${args[0]} THEN ${args[1]} ELSE ${args[2]}`
  return `(${args.join(symbols[expression.op])})`
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function parseSpec(input: unknown): ChipSpec {
  let nodes = 0
  function bounded(value: unknown, depth = 0): void {
    assert(depth <= 48 && ++nodes <= 60000, 'Specification exceeds nesting or size limits')
    if (value && typeof value === 'object') {
      for (const [name, nested] of Object.entries(value)) {
        assert(!['__proto__', 'prototype', 'constructor'].includes(name), `Reserved property: ${name}`)
        bounded(nested, depth + 1)
      }
    }
  }
  bounded(input)
  const spec = chipSchema.parse(input)
  const sources = new Set(spec.sources.map((source) => source.id))
  assert(sources.size === spec.sources.length, 'Duplicate source IDs')
  const groups = new Set(spec.groups.map((group) => group.id))
  assert(groups.size === spec.groups.length, 'Duplicate group IDs')
  const groupGraph = new dagre.graphlib.Graph()
  for (const group of spec.groups) groupGraph.setNode(group.id)
  for (const group of spec.groups) if (group.parent) {
    assert(groups.has(group.parent), `Unknown parent group: ${group.parent}`)
    groupGraph.setEdge(group.parent, group.id)
  }
  assert(dagre.graphlib.alg.isAcyclic(groupGraph), 'Subsystem hierarchy contains a cycle')
  const signals = new Map<string, 'boolean' | 'number'>()
  for (const driver of [...spec.inputs, ...spec.blocks]) {
    assert(!signals.has(driver.id), `Multiple drivers for signal: ${driver.id}`)
    assert(groups.has(driver.group), `Unknown subsystem: ${driver.group}`)
    signals.set(driver.id, driver.kind === 'number' ? 'number' : 'boolean')
    for (const reference of driver.geometry.sourceRefs) assert(sources.has(reference), `Unknown geometry source: ${reference}`)
    if (driver.geometry.kind === 'physical') {
      assert(driver.geometry.evidence === 'primary_published' && driver.geometry.sourceRefs.length > 0 && driver.geometry.coordinates, `Physical geometry needs published coordinates and a primary source: ${driver.id}`)
      assert(driver.geometry.sourceRefs.every((id) => !['secondary', 'unspecified'].includes(spec.sources.find((source) => source.id === id)!.type)), `Physical geometry lacks a primary document: ${driver.id}`)
    }
    for (const fact of driver.properties) {
      for (const reference of fact.sourceRefs) assert(sources.has(reference), `Unknown property source: ${reference}`)
      if (!['illustrative', 'unspecified'].includes(fact.evidence)) assert(fact.sourceRefs.length > 0, `Factual property lacks a source: ${driver.id}.${fact.name}`)
      if (fact.evidence === 'unspecified') assert(fact.value === null, `Unspecified property must have a null value: ${driver.id}.${fact.name}`)
    }
  }
  for (const input of spec.inputs) if (input.kind === 'number') {
    assert(input.min < input.max && input.default >= input.min && input.default <= input.max, `Invalid range/default: ${input.id}`)
    assert(!input.integer || [input.default, input.min, input.max, input.step].every(Number.isInteger), `Integer input has fractional settings: ${input.id}`)
  }
  function expressionType(expression: Rule, depth = 0): 'boolean' | 'number' {
    assert(depth <= 16, 'Expression exceeds maximum depth of 16')
    if (typeof expression !== 'object') return typeof expression === 'boolean' ? 'boolean' : 'number'
    if ('var' in expression) {
      assert(signals.has(expression.var), `Unknown signal: ${expression.var}`)
      return signals.get(expression.var)!
    }
    const count = expression.args.length
    const operation = expression.op
    assert(operation === 'not' ? count === 1 : operation === 'if' ? count === 3 : operation === 'and' || operation === 'or' ? count >= 2 : count === 2, `Invalid arity: ${operation}`)
    const types = expression.args.map((argument) => expressionType(argument, depth + 1))
    if (['lt', 'le', 'gt', 'ge'].includes(operation)) assert(types.every((type) => type === 'number'), `Numeric comparison requires numeric operands: ${operation}`)
    else if (operation === 'eq' || operation === 'ne') assert(types[0] === types[1], 'Equality operands must have the same type')
    else assert(types.every((type) => type === 'boolean'), `Boolean operands required: ${operation}`)
    return 'boolean'
  }
  const gateGraph = new dagre.graphlib.Graph()
  for (const block of spec.blocks) if (block.kind === 'gate' || block.kind === 'comparator' || block.kind === 'lut') gateGraph.setNode(block.id)
  for (const block of spec.blocks) {
    if (block.kind === 'boundary') continue
    if (block.kind === 'lut') {
      assert(block.init.length === 2 ** block.inputs.length, `LUT needs exactly 2^N configuration bits: ${block.id}`)
      for (const input of block.inputs) assert(signals.get(input) === 'boolean', `LUT address must reference a Boolean signal: ${block.id}.${input}`)
    }
    const expression = blockRule(block)
    assert(expressionType(expression) === 'boolean', `Block must produce a Boolean signal: ${block.id}`)
    if (block.kind === 'comparator') assert(typeof block.rule === 'object' && 'op' in block.rule && ['lt', 'le', 'gt', 'ge'].includes(block.rule.op), 'Comparator requires a numeric comparison at its root')
    if (block.kind === 'dff') assert(spec.inputs.some((input) => input.id === block.clock && input.kind === 'boolean'), `DFF clock must be a Boolean input: ${block.clock}`)
    if (gateGraph.hasNode(block.id)) for (const reference of references(expression)) if (gateGraph.hasNode(reference)) gateGraph.setEdge(reference, block.id)
  }
  assert(dagre.graphlib.alg.isAcyclic(gateGraph), 'Combinational loop: insert an explicit state element or model the block as unsupported')
  const connectionIds = new Set<string>()
  for (const connection of spec.connections) {
    assert(!connectionIds.has(connection.id), `Duplicate architectural connection: ${connection.id}`)
    connectionIds.add(connection.id)
    assert(signals.has(connection.from) && signals.has(connection.to), `Unknown architectural endpoint: ${connection.id}`)
    assert(connection.from !== connection.to, `Architectural self-link is not a signal dependency: ${connection.id}`)
    for (const reference of connection.sourceRefs) assert(sources.has(reference), `Unknown architectural source: ${reference}`)
  }
  const outputIds = new Set<string>()
  for (const output of spec.outputs) {
    assert(signals.has(output.signal), `Output references unknown signal: ${output.signal}`)
    assert(!outputIds.has(output.id) && !signals.has(output.id), `Duplicate output ID: ${output.id}`)
    outputIds.add(output.id)
  }
  const requirementIds = new Set(spec.requirements.map((entry) => entry.id))
  assert(requirementIds.size === spec.requirements.length, 'Duplicate requirement IDs')
  for (const entry of [...spec.inputs, ...spec.blocks, ...spec.outputs, ...spec.requirements]) for (const reference of entry.sourceRefs) assert(sources.has(reference), `Unknown source reference: ${reference}`)
  for (const requirement of spec.requirements) for (const signal of requirement.signals) assert(signals.has(signal), `Requirement references unknown signal: ${signal}`)
  const vectorIds = new Set<string>()
  for (const vector of spec.vectors) {
    assert(!vectorIds.has(vector.id), `Duplicate vector: ${vector.id}`); vectorIds.add(vector.id)
    for (const requirement of vector.requirements) assert(requirementIds.has(requirement), `Unknown requirement: ${requirement}`)
    for (const step of vector.steps) {
      assert(Object.keys(step.expect).length > 0, `Vector has no assertions: ${vector.id}`)
      for (const [id, value] of Object.entries(step.set)) validateInput(spec, id, value)
      for (const [id, expected] of Object.entries(step.expect)) {
        assert(signals.has(id), `Assertion references unknown signal: ${id}`)
        assert(signals.get(id) === 'number' ? typeof expected === 'number' : typeof expected === 'boolean' || expected === 'X', `Assertion has wrong type: ${id}`)
      }
    }
  }
  return spec
}

export function parseSpecText(text: string): ChipSpec {
  if (new TextEncoder().encode(text).byteLength > 262144) throw new Error('Specification exceeds 256 KiB')
  return parseSpec(JSON.parse(text))
}

export function validateInput(spec: ChipSpec, id: string, value: unknown): asserts value is boolean | number {
  const input = spec.inputs.find((entry) => entry.id === id)
  assert(input, `Not a writable input: ${id}`)
  if (input.kind === 'boolean') assert(typeof value === 'boolean', `Expected Boolean input: ${id}`)
  else {
    assert(typeof value === 'number' && Number.isFinite(value) && value >= input.min && value <= input.max && (!input.integer || Number.isInteger(value)), `Input outside declared range: ${id}`)
  }
}

export function gateOrder(spec: ChipSpec): string[] {
  const graph = new dagre.graphlib.Graph()
  for (const block of spec.blocks) if (block.kind === 'gate' || block.kind === 'comparator' || block.kind === 'lut') graph.setNode(block.id)
  for (const block of spec.blocks) if (graph.hasNode(block.id) && block.kind !== 'boundary') for (const reference of references(blockRule(block))) if (graph.hasNode(reference)) graph.setEdge(reference, block.id)
  return dagre.graphlib.alg.topsort(graph)
}