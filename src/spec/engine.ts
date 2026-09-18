import jsonLogic from 'json-logic-js'
import { blockRule, gateOrder, parseSpec, references, validateInput, type Block, type ChipSpec, type Logic, type Rule, type Value } from './schema'

const operators = { not: '!', and: 'and', or: 'or', xor: '!==', eq: '===', ne: '!==', lt: '<', le: '<=', gt: '>', ge: '>=', if: 'if' }

function compile(rule: Rule): unknown {
  if (typeof rule !== 'object' || 'var' in rule) return rule
  return { [operators[rule.op]]: rule.args.map(compile) }
}

export function evaluate(rule: Rule, values: Readonly<Record<string, Value>>): Logic {
  const unknowns = references(rule).filter((id) => values[id] === 'X')
  if (unknowns.length > 8) return 'X'
  let resolved: boolean | undefined
  const expression = compile(rule) as Parameters<typeof jsonLogic.apply>[0]
  for (let assignment = 0; assignment < 2 ** unknowns.length; assignment += 1) {
    const environment = { ...values }
    unknowns.forEach((id, index) => { environment[id] = Boolean(assignment & (1 << index)) })
    const result: unknown = jsonLogic.apply(expression, environment)
    if (typeof result !== 'boolean') throw new Error('Expression did not return a Boolean value')
    if (resolved !== undefined && resolved !== result) return 'X'
    resolved = result
  }
  return resolved ?? 'X'
}

export interface TraceEntry { step: number; values: Record<string, Value>; changed: string[]; cause: string }

export class LogicEngine {
  readonly spec: ChipSpec
  private readonly gates: Block[]
  private readonly stateBlocks: Block[]
  private inputs: Record<string, boolean | number> = {}
  private state: Record<string, Logic> = {}
  private values: Record<string, Value> = {}
  step = 0
  trace: TraceEntry[] = []

  constructor(input: unknown) {
    this.spec = parseSpec(input)
    const order = gateOrder(this.spec)
    this.gates = order.map((id) => this.spec.blocks.find((block) => block.id === id)!)
    this.stateBlocks = this.spec.blocks.filter((block) => block.kind === 'latch' || block.kind === 'dff')
    this.reset()
  }

  get signals(): Readonly<Record<string, Value>> { return { ...this.values } }

  reset(): void {
    const inputs = Object.fromEntries(this.spec.inputs.map((input) => [input.id, input.default]))
    const state = Object.fromEntries(this.stateBlocks.map((block) => [block.id, 'initial' in block ? block.initial : 'X']))
    const settled = this.settle(inputs, state)
    this.inputs = inputs; this.state = settled.state; this.values = settled.values; this.step = 0
    this.trace = [{ step: 0, values: { ...this.values }, changed: Object.keys(this.values), cause: 'Initial conditions' }]
  }

  apply(patch: Readonly<Record<string, unknown>>, cause = 'Input change'): void {
    for (const [id, value] of Object.entries(patch)) validateInput(this.spec, id, value)
    const inputs = { ...this.inputs, ...patch } as Record<string, boolean | number>
    let settled = this.settle(inputs, { ...this.state })
    const nextState = { ...settled.state }
    for (const block of this.stateBlocks) if (block.kind === 'dff' && this.inputs[block.clock] === false && inputs[block.clock] === true) nextState[block.id] = evaluate(block.rule, settled.values)
    settled = this.settle(inputs, nextState)
    const changed = Object.keys(settled.values).filter((id) => settled.values[id] !== this.values[id])
    this.inputs = inputs; this.state = settled.state; this.values = settled.values; this.step += 1
    this.trace.push({ step: this.step, values: { ...this.values }, changed, cause })
    if (this.trace.length > 64) this.trace.shift()
  }

  private combinational(inputs: Record<string, boolean | number>, state: Record<string, Logic>): Record<string, Value> {
    const values: Record<string, Value> = { ...inputs, ...state }
    for (const block of this.spec.blocks) if (block.kind === 'boundary') values[block.id] = 'X'
    for (const block of this.gates) if (block.kind !== 'boundary') {
      const expression = blockRule(block)
      if (block.kind === 'comparator' && typeof expression === 'object' && 'args' in expression) {
        const operands = expression.args.map((operand) => typeof operand === 'number' ? operand : typeof operand === 'object' && 'var' in operand ? values[operand.var] : undefined)
        if (operands[0] !== undefined && operands[0] === operands[1]) { values[block.id] = 'X'; continue }
      }
      values[block.id] = evaluate(expression, values)
    }
    return values
  }

  private settle(inputs: Record<string, boolean | number>, initial: Record<string, Logic>) {
    let state = { ...initial }
    const visited = new Set<string>()
    for (let iteration = 0; iteration < 64; iteration += 1) {
      const signature = JSON.stringify(state)
      if (visited.has(signature)) throw new Error('State does not settle: oscillating asynchronous feedback')
      visited.add(signature)
      const values = this.combinational(inputs, state)
      const next = { ...state }
      for (const block of this.stateBlocks) if (block.kind === 'latch') next[block.id] = evaluate(block.rule, values)
      if (Object.keys(next).every((id) => next[id] === state[id])) return { state, values }
      state = next
    }
    throw new Error('Asynchronous state exceeded 64 settling iterations')
  }
}

export interface CheckResult { vector: string; step: number; signal: string; expected: Value; actual: Value; passed: boolean }

export function validateVectors(spec: ChipSpec) {
  const checks: CheckResult[] = []
  const errors: string[] = []
  const covered = new Set<string>()
  for (const vector of spec.vectors) {
    try {
      const engine = new LogicEngine(spec)
      const asserted = new Set<string>()
      for (const [index, step] of vector.steps.entries()) {
        engine.apply(step.set, vector.label)
        for (const [signal, expected] of Object.entries(step.expect)) {
          const actual = engine.signals[signal]
          checks.push({ vector: vector.id, step: index + 1, signal, expected, actual, passed: actual === expected })
          asserted.add(signal)
        }
      }
      for (const id of vector.requirements) {
        const requirement = spec.requirements.find((item) => item.id === id)!
        if (requirement.signals.every((signal) => asserted.has(signal))) covered.add(id)
      }
    } catch (error) { errors.push(`${vector.id}: ${error instanceof Error ? error.message : String(error)}`) }
  }
  const uncovered = spec.requirements.filter((entry) => !covered.has(entry.id)).map((entry) => entry.id)
  const failed = checks.filter((check) => !check.passed)
  const status = failed.length || errors.length ? 'fail' : !checks.length || uncovered.length ? 'incomplete' : 'pass'
  return { status, checks, failed, errors, covered: [...covered], uncovered, scope: 'Declared functional vectors only; not electrical or full-device conformance' }
}