import dagre from '@dagrejs/dagre'
import { evaluate } from './engine'
import { blockRule, references, type ChipSpec, type Logic } from './schema'

export interface TruthTable {
  available: boolean
  note: string
  columns: string[]
  rows: { inputs: boolean[]; output: Logic }[]
}

export function truthTable(spec: ChipSpec, id: string): TruthTable {
  const block = spec.blocks.find((entry) => entry.id === id)
  const unavailable = (note: string): TruthTable => ({ available: false, note, columns: [], rows: [] })
  if (!block || block.kind === 'boundary') return unavailable('No executable Boolean contract for this component.')
  const expression = blockRule(block)
  const dependencies = block.kind === 'lut' ? [...new Set(block.inputs)] : references(expression)
  if (dependencies.some((reference) => spec.inputs.some((input) => input.id === reference && input.kind === 'number'))) return unavailable('Numeric inputs require boundary vectors, not an exhaustive Boolean truth table.')
  if (dependencies.some((reference) => spec.blocks.some((entry) => entry.id === reference && entry.kind === 'boundary'))) return unavailable('An unsupported dependency must remain X; use the declared test vectors.')
  const variables = [...dependencies]
  if (block.kind === 'dff' && !variables.includes(block.id)) variables.push(block.id)
  const clockColumns = block.kind === 'dff' ? ['CLK[t]', 'CLK[t+1]'] : []
  if (variables.length + clockColumns.length > 6) return unavailable('More than 6 local Boolean inputs; use targeted vectors to avoid a misleading truncated table.')
  const columns = variables.map((reference) => reference === block.id ? `${reference}[t]` : reference).concat(clockColumns)
  const rows = Array.from({ length: 2 ** columns.length }, (_, combination) => {
    const inputs = columns.map((_, index) => Boolean(combination & (1 << (columns.length - index - 1))))
    const environment = Object.fromEntries(variables.map((reference, index) => [reference, inputs[index]]))
    const next = evaluate(expression, environment)
    const output = block.kind === 'dff' && (inputs[variables.length] || !inputs[variables.length + 1]) ? environment[block.id] : next
    return { inputs, output }
  })
  return { available: true, columns, rows, note: block.kind === 'lut' ? 'Configured LUT truth table. inputs[0] is address bit 0; init[0] is the output for address zero. No propagation delay or bitstream loader is modeled.' : block.kind === 'dff' ? 'Local next-state table: sample only on a rising edge. No setup/hold or metastability model.' : block.kind === 'latch' ? 'Local next-state function. Prior state is an input; this is not a reachable-state proof.' : 'Local Boolean function. Dependency signals are treated independently; not a full-chip truth table.' }
}

export interface DiagramNode {
  id: string
  label: string
  kind: string
  description: string
  signals: string[]
  group?: string
  x: number
  y: number
  width: number
  height: number
}
export interface DiagramEdge {
  id: string; from: string; to: string; signals: string[]; points: { x: number; y: number }[]
  kind: 'signal' | 'architecture'; labels: string[]; sourceRefs: string[]
}

export function buildDiagram(spec: ChipSpec, expanded: ReadonlySet<string>, tables: ReadonlySet<string> = new Set()) {
  const nodes = new Map<string, DiagramNode>()
  const drivers = [...spec.inputs, ...spec.blocks]
  function owner(groupId: string, leaf: string): string {
    const chain: string[] = []
    let current = spec.groups.find((group) => group.id === groupId)
    while (current) { chain.unshift(current.id); current = spec.groups.find((group) => group.id === current!.parent) }
    const collapsed = chain.find((group) => !expanded.has(group))
    return collapsed ? `group:${collapsed}` : leaf
  }
  for (const driver of drivers) {
    const id = owner(driver.group, driver.id)
    if (nodes.has(id)) { nodes.get(id)!.signals.push(driver.id); continue }
    if (id.startsWith('group:')) {
      const group = spec.groups.find((entry) => `group:${entry.id}` === id)!
      nodes.set(id, { id, label: group.label, description: group.description, kind: 'subsystem', group: group.id, signals: [driver.id], x: 0, y: 0, width: 216, height: 88 })
    } else {
      const kind = spec.inputs.some((input) => input.id === driver.id) ? 'input' : driver.kind
      const table = tables.has(id) ? truthTable(spec, id) : undefined
      const height = table?.available ? 125 + Math.min(8, table.rows.length) * 21 : 94
      const width = table?.available ? Math.max(230, table.columns.reduce((sum, name) => sum + Math.max(45, Math.min(120, name.length * 5.3 + 14)), 74)) : 216
      nodes.set(id, { id, label: driver.label, description: driver.description, kind, group: driver.group, signals: [id], x: 0, y: 0, width, height })
    }
  }
  for (const output of spec.outputs) nodes.set(`output:${output.id}`, { id: `output:${output.id}`, label: output.label, description: output.description, kind: 'output', signals: [output.signal], x: 0, y: 0, width: 186, height: 76 })
  const edges = new Map<string, DiagramEdge>()
  function connect(from: string, to: string, signal: string) {
    if (from === to && from.startsWith('group:')) return
    const key = `signal:${from}->${to}`
    const edge = edges.get(key)
    if (edge) { if (!edge.signals.includes(signal)) edge.signals.push(signal); return }
    edges.set(key, { id: key, from, to, signals: [signal], points: [], kind: 'signal', labels: [], sourceRefs: [] })
  }
  for (const block of spec.blocks) if (block.kind !== 'boundary') {
    const dependencies = references(blockRule(block))
    if (block.kind === 'dff' && !dependencies.includes(block.clock)) dependencies.push(block.clock)
    for (const dependency of dependencies) {
      const driver = drivers.find((entry) => entry.id === dependency)!
      connect(owner(driver.group, driver.id), owner(block.group, block.id), dependency)
    }
  }
  for (const output of spec.outputs) {
    const driver = drivers.find((entry) => entry.id === output.signal)!
    connect(owner(driver.group, driver.id), `output:${output.id}`, output.signal)
  }
  for (const connection of spec.connections) {
    const source = drivers.find((driver) => driver.id === connection.from)!
    const target = drivers.find((driver) => driver.id === connection.to)!
    const from = owner(source.group, source.id)
    const to = owner(target.group, target.id)
    if (from === to) continue
    const key = `architecture:${from}->${to}`
    const edge = edges.get(key)
    if (edge) {
      edge.labels.push(connection.label)
      edge.sourceRefs = [...new Set([...edge.sourceRefs, ...connection.sourceRefs])]
    } else edges.set(key, { id: key, from, to, kind: 'architecture', signals: [], labels: [connection.label], sourceRefs: [...connection.sourceRefs], points: [] })
  }
  const graph = new dagre.graphlib.Graph({ multigraph: true }).setGraph({ rankdir: 'LR', ranksep: 110, nodesep: 48, edgesep: 20, marginx: 40, marginy: 45 }).setDefaultEdgeLabel(() => ({}))
  for (const node of nodes.values()) graph.setNode(node.id, { width: node.width, height: node.height })
  for (const edge of edges.values()) graph.setEdge(edge.from, edge.to, {}, edge.id)
  dagre.layout(graph)
  for (const node of nodes.values()) { const position = graph.node(node.id); node.x = position.x; node.y = position.y }
  for (const edge of edges.values()) edge.points = graph.edge(edge.from, edge.to, edge.id).points
  return { nodes: [...nodes.values()], edges: [...edges.values()], width: graph.graph().width!, height: graph.graph().height! }
}

export type Diagram = ReturnType<typeof buildDiagram>