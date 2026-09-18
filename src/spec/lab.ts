import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import './lab.css'
import { Timer } from 'three'
import { createElement, Cpu, Upload, Download, Play, Pause, RotateCcw, Focus, ZoomIn, ZoomOut, Sun, Moon, Route, ChevronRight, ChevronLeft, ChevronsLeftRight, ChevronsRightLeft, Table2, X, SkipForward, type IconNode } from 'lucide'
import { parseSpecText, expressionText, references, type ChipSpec, type Value } from './schema'
import { LogicEngine, validateVectors } from './engine'
import { buildDiagram, truthTable } from './diagram'
import { createCityView, createLogicView, formatValue, valueClass, tableElement } from './view'

const glyph = (icon: IconNode) => createElement(icon, { width: '17', height: '17', 'aria-hidden': 'true', 'stroke-width': '1.7' }).outerHTML
const tool = (id: string, title: string, icon: IconNode) => `<button id="${id}" class="icon-button" title="${title}" aria-label="${title}">${glyph(icon)}</button>`
const app = document.querySelector<HTMLDivElement>('#logic-app')!
app.innerHTML = `
  <header class="lab-header"><a class="lab-brand" href="./">${glyph(Cpu)}<span>SiliconCity<small>LOGIC LAB</small></span></a><div class="catalog-fields"><label class="family-field"><span>DEVICE CLASS</span><select id="device-class" aria-label="Device class"><option value="all">All classes</option></select></label><label class="device-field"><span>REFERENCE MODEL</span><select id="device" aria-label="Reference model"></select></label></div><nav><a class="atlas-link" href="./">Architecture city</a><button id="import" class="command" aria-label="Import spec" title="Import spec">${glyph(Upload)}<span>Import spec</span></button>${tool('download-spec', 'Download chip specification', Download)}${tool('theme', 'Switch to night view', Moon)}</nav><input id="spec-file" type="file" accept="application/json,.json" hidden></header>
  <div id="import-error" role="alert" hidden></div>
  <main class="lab-workspace">
    <aside class="input-rail" aria-label="Model inputs and hierarchy"><section class="rail-section"><div class="section-title"><h2>Subsystems</h2><div>${tool('expand-all', 'Expand all subsystems', ChevronsLeftRight)}${tool('collapse-all', 'Collapse all subsystems', ChevronsRightLeft)}</div></div><div id="groups" class="groups"></div></section><section class="rail-section"><h2>Input stimulus</h2><div id="clock-controls"></div><div id="inputs"></div></section><section class="rail-section"><h2>Logical outputs</h2><div id="outputs"></div></section></aside>
    <section class="lab-stage" aria-label="Specification explorer"><div class="lab-status"><div><span>VECTOR ASSERTIONS</span><strong id="check-count"></strong></div><div><span>REQUIREMENTS EXERCISED</span><strong id="coverage-count"></strong></div><div><span>UNKNOWN SIGNALS</span><strong id="unknown-count"></strong></div><div><span>EVENT STEP</span><strong id="step-count">0</strong></div></div><div class="view-header"><div><p class="eyebrow" id="part"></p><h1 id="model-name"></h1><span id="abstraction" class="abstraction"></span></div><div class="view-actions"><div class="segmented" role="group" aria-label="Representation"><button data-view="city" aria-pressed="true">City</button><button data-view="logic" aria-pressed="false">Logic</button></div><button id="tour-start" class="command">${glyph(Route)}<span>Tour</span></button></div></div>
      <div class="drawing-area"><div id="city-view"></div><div id="logic-view" hidden></div><div class="drawing-tools">${tool('fit', 'Fit the complete diagram', Focus)}${tool('zoom-in', 'Zoom in', ZoomIn)}${tool('zoom-out', 'Zoom out', ZoomOut)}</div><div class="signal-legend"><span><i class="high"></i>1 / high</span><span><i class="low"></i>0 / low</span><span><i class="unknown"></i>X / unknown</span><span><i class="analog"></i>Numeric</span><span><i class="architecture-key"></i>Architecture only</span></div><section class="lab-tour" id="tour" aria-label="Subsystem tour" hidden><div class="section-title"><span id="tour-count" class="eyebrow"></span>${tool('tour-close', 'End tour', X)}</div><h2 id="tour-title"></h2><p id="tour-copy"></p><div class="tour-steps">${tool('tour-prev', 'Previous subsystem', ChevronLeft)}${tool('tour-next', 'Next subsystem', ChevronRight)}</div></section></div>
      <div class="trace-section"><div class="section-title"><span class="eyebrow">SETTLED SIGNAL TRACE / EVENT STEPS, NOT TIME</span>${tool('download-trace', 'Download signal trace', Download)}</div><canvas id="signal-trace" aria-label="Signal history by event step"></canvas></div>
      <div class="playback"><div>${tool('replay', 'Play selected vector', Play)}${tool('next-step', 'Apply next vector step', SkipForward)}${tool('reset', 'Reset initial conditions', RotateCcw)}</div><label>VECTOR<select id="vector" aria-label="Test vector"></select></label><span id="vector-progress">0 / 0</span></div>
      <p class="scope-note">Functional abstraction only. Geometry is illustrative; physical placement is unspecified.</p>
    </section>
    <aside class="detail-rail" aria-label="Component inspection and evidence"><div class="tabs" role="tablist" aria-label="Detail panels"><button role="tab" id="tab-inspect" data-tab="inspect" aria-selected="true" aria-controls="panel-inspect">Inspect</button><button role="tab" id="tab-validation" data-tab="validation" aria-selected="false" aria-controls="panel-validation" tabindex="-1">Validation</button><button role="tab" id="tab-evidence" data-tab="evidence" aria-selected="false" aria-controls="panel-evidence" tabindex="-1">Evidence</button></div><div class="detail-body"><div id="panel-inspect" role="tabpanel" aria-labelledby="tab-inspect"><section id="inspector" class="detail-section"></section><section class="detail-section"><h2>Components</h2><div id="component-index"></div></section></div><div id="panel-validation" role="tabpanel" aria-labelledby="tab-validation" hidden><section class="detail-section"><div class="section-title"><h2>Declared vectors</h2>${tool('download-report', 'Download validation report', Download)}</div><p class="boundary-copy">A pass covers the declared functional vectors. It is not electrical validation, source-authenticity verification, or proof of full-device conformance.</p><div id="validation-results"></div></section></div><div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" hidden><section class="detail-section"><h2>Source ledger</h2><div id="sources"></div></section><section class="detail-section"><h2>Assumptions</h2><ul id="assumptions"></ul></section><section class="detail-section"><h2>Outside modeled scope</h2><ul id="omissions"></ul></section></div></div><footer>Independent architectural teaching model</footer></aside>
  </main><div id="notice" role="status" aria-live="polite"></div>`

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node
}
function sourceLink(source: ChipSpec['sources'][number]) {
  const link = element('a', source.title); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link
}
const raw = import.meta.glob('/specs/*.json', { eager: true, query: '?raw', import: 'default' })
const catalog = new Map<string, ChipSpec>()
for (const [path, text] of Object.entries(raw)) if (!path.endsWith('/chip.schema.json')) {
  const spec = parseSpecText(text as string); catalog.set(spec.id, spec)
}
const classLabels: Record<ChipSpec['deviceClass'], string> = { component: 'Components', cpu: 'CPU / ISA', mcu: 'MCU', mpu: 'MPU', npu: 'NPU', gpu: 'GPU', fpga: 'FPGA', soc: 'SoC' }
let deviceClass = 'all'
function populateCatalog() {
  const families = get<HTMLSelectElement>('device-class')
  families.replaceChildren(new Option('All classes', 'all'))
  const picker = get<HTMLSelectElement>('device'); picker.replaceChildren()
  for (const [family, label] of Object.entries(classLabels)) {
    const models = [...catalog.entries()].filter(([, entry]) => entry.deviceClass === family)
    if (!models.length) continue
    families.add(new Option(label, family))
    if (deviceClass !== 'all' && deviceClass !== family) continue
    const group = element('optgroup'); group.label = label
    for (const [id, entry] of models) group.append(new Option(`${entry.name}${id.startsWith('imported-') ? ' / imported' : ''}`, id))
    picker.append(group)
  }
  families.value = deviceClass
}
function initialExpansion(model: ChipSpec): Set<string> {
  return new Set(model.inputs.length + model.blocks.length > 18 ? [] : model.groups.map((group) => group.id))
}
let spec = catalog.get('ne555') ?? [...catalog.values()][0]
let engine = new LogicEngine(spec)
let report = validateVectors(spec)
let expanded = initialExpansion(spec)
let tables = new Set<string>()
let diagram = buildDiagram(spec, expanded, tables)
let selected = spec.blocks[0].id
let mode: 'city' | 'logic' = 'city'
let tab = 'inspect'
let vectorIndex = 0
let vectorStep = 0
let playing = false
let playbackTime = 0
let tourIndex: number | null = null
let day = true
let importSequence = 0
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let city: ReturnType<typeof createCityView> | null = null
const logic = createLogicView(get('logic-view'), { select, expand: toggleGroup, table: toggleTable })
try { city = createCityView(get<HTMLDivElement>('city-view'), select) }
catch { get('city-view').append(element('p', 'WebGL2 unavailable. The logic diagram and validator remain available.', 'webgl-error')); mode = 'logic' }

function setTab(next: string) {
  tab = next
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
    const active = button.dataset.tab === next
    button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; get(`panel-${button.dataset.tab}`).hidden = !active
  }
}
function showMode(next: 'city' | 'logic') {
  mode = next; get('city-view').hidden = next !== 'city'; get('logic-view').hidden = next !== 'logic'
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === next))
  if (next === 'logic') logic.fit(); else city?.fit()
}
function rebuild() {
  diagram = buildDiagram(spec, expanded, tables); logic.set(spec, diagram, tables); city?.set(diagram)
  if (!diagram.nodes.some((node) => node.id === selected)) selected = diagram.nodes[0].id
  get('groups').replaceChildren(...spec.groups.map((group) => {
    const row = element('div', '', 'group-row')
    const button = element('button', group.label); button.dataset.group = group.id; button.setAttribute('aria-expanded', String(expanded.has(group.id)))
    button.prepend(createElement(ChevronRight, { width: '14', height: '14' })); button.addEventListener('click', () => toggleGroup(group.id)); row.append(button)
    if (group.parent) row.classList.add('nested')
    return row
  }))
  update(new Set())
}
function toggleGroup(id: string) {
  let group = spec.groups.find((entry) => entry.id === id)
  const chain: string[] = []
  while (group) { chain.push(group.id); group = spec.groups.find((entry) => entry.id === group!.parent) }
  if (chain.every((group) => expanded.has(group))) expanded.delete(id)
  else for (const group of chain) expanded.add(group)
  rebuild()
}
function expandAncestors(id: string) {
  const driver = [...spec.inputs, ...spec.blocks].find((entry) => entry.id === id)
  let group = spec.groups.find((entry) => entry.id === driver?.group)
  while (group) { expanded.add(group.id); group = spec.groups.find((entry) => entry.id === group!.parent) }
}
function toggleTable(id: string) {
  if (!truthTable(spec, id).available) return
  expandAncestors(id); if (tables.has(id)) tables.delete(id); else tables.add(id)
  selected = id; showMode('logic'); rebuild(); logic.focus(id)
}
function select(id: string) {
  selected = id
  if (!diagram.nodes.some((node) => node.id === id)) { expandAncestors(id); rebuild() }
  setTab('inspect'); update(new Set())
}

function renderInspector() {
  const node = diagram.nodes.find((entry) => entry.id === selected)
  if (!node) return
  const panel = get('inspector'); panel.replaceChildren()
  panel.append(element('p', `${node.kind.toUpperCase()} / LOGICAL REPRESENTATION`, 'eyebrow'), element('h2', node.label), element('p', node.description, 'description'))
  const values = element('div', '', 'inspection-values')
  for (const signal of node.signals) {
    const button = element('button'); button.append(element('code', signal), element('strong', formatValue(engine.signals[signal]), valueClass(engine.signals[signal])))
    button.addEventListener('click', () => select(signal)); values.append(button)
  }
  panel.append(values)
  const connections = spec.connections.filter((connection) => node.signals.includes(connection.from) || node.signals.includes(connection.to))
  if (connections.length) {
    const details = element('details', '', 'architecture-context')
    details.append(element('summary', `Architectural connections / ${connections.length}`), element('p', 'Structural context only; these links do not execute or drive logic signals.', 'fine-print'))
    for (const connection of connections) {
      const item = element('div', '', 'connection-entry')
      item.append(element('strong', connection.label), element('code', `${connection.from} > ${connection.to}`), element('p', connection.description, 'fine-print'), element('p', `${connection.kind} / ${connection.evidence.replaceAll('_', ' ')}`, 'source-locator'))
      for (const id of connection.sourceRefs) item.append(sourceLink(spec.sources.find((source) => source.id === id)!))
      details.append(item)
    }
    panel.append(details)
  }
  if (node.kind === 'subsystem') {
    const button = element('button', 'Expand subsystem', 'command'); button.addEventListener('click', () => toggleGroup(node.group!)); panel.append(button); return
  }
  const driver = [...spec.inputs, ...spec.blocks].find((entry) => entry.id === node.id)
  if (driver && ('rule' in driver || driver.kind === 'lut')) {
    panel.append(element('h3', driver.kind === 'latch' || driver.kind === 'dff' ? 'Next-state function' : driver.kind === 'lut' ? 'LUT configuration' : 'Boolean function'))
    const formula = driver.kind === 'lut' ? `Inputs (LSB first): ${driver.inputs.join(', ')}\nINIT (MSB first): 0x${BigInt(`0b${[...driver.init].reverse().join('')}`).toString(16).padStart(Math.ceil(driver.init.length / 4), '0')}` : expressionText(driver.rule)
    const code = element('code', formula); const pre = element('pre'); pre.append(code); panel.append(pre)
    const local = truthTable(spec, driver.id)
    const details = element('details'); const summary = element('summary', local.available ? `Truth table / ${local.rows.length} rows` : 'Validation boundary'); details.append(summary, tableElement(local), element('p', local.note, 'fine-print')); panel.append(details)
    if (local.available) {
      const pin = element('button', tables.has(driver.id) ? 'Collapse inline table' : 'Expand table in diagram', 'command table-command'); pin.prepend(createElement(Table2, { width: '15', height: '15' })); pin.addEventListener('click', () => toggleTable(driver.id)); panel.append(pin)
    }
  }
  if (driver && driver.kind === 'boundary') panel.append(element('p', driver.reason, 'boundary-copy'))
  if (driver) {
    const facts = element('dl', '', 'facts')
    for (const [name, value] of [[driver.kind === 'boundary' ? 'Architecture evidence' : 'Behavior evidence', driver.evidence.replaceAll('_', ' ')], ['Architecture category', driver.category], ['Scale', driver.scale], ['Displayed geometry', 'Logical / illustrative'], ['Physical placement', 'Unspecified']]) {
      const row = element('div'); row.append(element('dt', name), element('dd', value)); facts.append(row)
    }
    for (const fact of driver.properties) {
      const row = element('div'); row.append(element('dt', fact.name), element('dd', `${fact.value ?? 'Unspecified'} ${fact.unit ?? ''} / ${fact.evidence.replaceAll('_', ' ')}`)); facts.append(row)
    }
    panel.append(facts, element('h3', 'Evidence'))
    for (const id of driver.sourceRefs) {
      const source = spec.sources.find((entry) => entry.id === id)!; panel.append(sourceLink(source), element('p', `${source.revision} / ${source.locator}`, 'source-locator'))
    }
  }
}

function populate() {
  if (deviceClass !== 'all' && deviceClass !== spec.deviceClass) deviceClass = 'all'
  populateCatalog()
  get<HTMLSelectElement>('device').value = [...catalog.entries()].find(([, entry]) => entry === spec)?.[0] ?? spec.id
  get('part').textContent = `${classLabels[spec.deviceClass]} / ${spec.part}`; get('model-name').textContent = spec.name
  const executable = spec.blocks.filter((block) => block.kind !== 'boundary').length
  get('abstraction').textContent = `${executable} executable blocks / ${spec.blocks.length - executable} architecture boundaries`
  get('abstraction').title = spec.summary
  app.dataset.deviceClass = spec.deviceClass; app.dataset.model = spec.id
  const clocks = [...new Set(spec.blocks.flatMap((block) => block.kind === 'dff' ? [block.clock] : []))]
  get('clock-controls').replaceChildren(...clocks.map((clock) => {
    const button = element('button', `Pulse ${clock}`, 'command clock-pulse'); button.dataset.clock = clock
    button.prepend(createElement(SkipForward, { width: '15', height: '15', 'aria-hidden': 'true' }))
    button.title = 'One rising edge: low, high, low; each is a separate event step'
    button.addEventListener('click', () => {
      stopPlayback()
      try {
        const changed = new Set<string>()
        for (const value of [false, true, false]) { engine.apply({ [clock]: value }, `${clock} ${value ? 'rising edge' : 'low'}`); for (const id of engine.trace.at(-1)!.changed) changed.add(id) }
        update(changed)
      } catch (error) { showError(error); update(new Set()) }
    })
    return button
  }))
  get('inputs').replaceChildren(...spec.inputs.map((input) => {
    const wrapper = element('label', '', 'input-control'); wrapper.htmlFor = `input-${input.id}`
    const top = element('span', '', 'input-caption'); top.append(element('span', input.label)); const value = element('output'); value.id = `input-value-${input.id}`; top.append(value)
    const control = element('input'); control.id = `input-${input.id}`; control.dataset.signal = input.id
    if (input.kind === 'boolean') { control.type = 'checkbox'; control.className = 'logic-toggle'; wrapper.classList.add('boolean-control') }
    else { control.type = 'number'; control.min = String(input.min); control.max = String(input.max); control.step = String(input.step); control.setAttribute('aria-label', `${input.label} (${input.unit})`) }
    control.addEventListener('change', () => {
      stopPlayback()
      try { engine.apply({ [input.id]: input.kind === 'boolean' ? control.checked : control.valueAsNumber }); get('import-error').hidden = true }
      catch (error) { showError(error) }
      update(new Set(engine.trace.at(-1)!.changed))
    })
    wrapper.append(top, control); if (input.kind === 'number') wrapper.append(element('small', `${input.min} to ${input.max} ${input.unit}`))
    return wrapper
  }))
  get('outputs').replaceChildren(...spec.outputs.map((output) => {
    const row = element('button', '', 'output-row'); row.dataset.output = output.id; row.append(element('span', output.label), element('strong')); row.title = output.description; row.addEventListener('click', () => select(`output:${output.id}`)); return row
  }))
  const picker = get<HTMLSelectElement>('vector'); picker.replaceChildren(...spec.vectors.map((vector, index) => new Option(vector.label, String(index)))); picker.disabled = !spec.vectors.length
  get('component-index').replaceChildren(...[...spec.inputs, ...spec.blocks].map((component) => {
    const button = element('button', '', 'component-entry'); button.dataset.inspect = component.id; button.append(element('strong', component.label), element('span', component.kind)); button.addEventListener('click', () => select(component.id)); return button
  }))
  get('sources').replaceChildren(...spec.sources.map((source) => {
    const section = element('div', '', 'source-entry'); section.append(sourceLink(source), element('p', `${source.publisher} / ${source.type}`, 'source-locator'), element('p', `${source.revision} / ${source.locator}`, 'source-locator'), element('p', `Reviewed ${source.reviewed} / ${source.redistribution}`, 'source-locator'))
    if (source.sha256) section.append(element('code', `SHA-256 ${source.sha256}`, 'source-hash'))
    return section
  }))
  for (const [id, entries] of [['assumptions', spec.assumptions], ['omissions', spec.omissions]] as const) get(id).replaceChildren(...entries.map((entry) => element('li', entry)))
  get('validation-results').replaceChildren(...spec.requirements.map((requirement) => {
    const failed = report.failed.some((check) => spec.vectors.find((vector) => vector.id === check.vector)?.requirements.includes(requirement.id))
    const passed = !failed && report.covered.includes(requirement.id)
    const section = element('div', '', 'requirement'); section.append(element('strong', passed ? 'EXERCISED / PASS' : 'FAIL OR UNTESTED', passed ? 'high' : 'unknown'), element('p', requirement.text))
    const vectors = spec.vectors.filter((vector) => vector.requirements.includes(requirement.id))
    for (const vector of vectors) {
      const button = element('button', vector.label, 'vector-link'); button.addEventListener('click', () => { stopPlayback(); engine.reset(); vectorIndex = spec.vectors.indexOf(vector); vectorStep = 0; picker.value = String(vectorIndex); applyVector() }); section.append(button)
    }
    return section
  }))
  for (const error of report.errors) get('validation-results').append(element('p', error, 'boundary-copy'))
  get('check-count').textContent = `${report.checks.length - report.failed.length} / ${report.checks.length}`
  get('check-count').dataset.result = report.status; get('coverage-count').textContent = `${report.covered.length} / ${spec.requirements.length}`
  rebuild()
}

function update(changed: ReadonlySet<string>) {
  const values = engine.signals
  get('unknown-count').textContent = String(Object.values(values).filter((value) => value === 'X').length); get('step-count').textContent = String(engine.step)
  for (const input of spec.inputs) {
    const control = get<HTMLInputElement>(`input-${input.id}`)
    if (input.kind === 'boolean') control.checked = values[input.id] === true; else control.value = String(values[input.id])
    get(`input-value-${input.id}`).textContent = formatValue(values[input.id])
  }
  for (const row of get('outputs').children) {
    const output = spec.outputs.find((entry) => entry.id === (row as HTMLElement).dataset.output)!
    row.lastElementChild!.textContent = formatValue(values[output.signal]); row.lastElementChild!.className = valueClass(values[output.signal])
  }
  for (const button of get('component-index').children) button.setAttribute('aria-pressed', String((button as HTMLElement).dataset.inspect === selected))
  logic.update(values, selected); city?.update(values, selected, changed)
  get('vector-progress').textContent = `${vectorStep} / ${spec.vectors[vectorIndex]?.steps.length ?? 0}`
  get<HTMLButtonElement>('replay').disabled = !spec.vectors.length; get<HTMLButtonElement>('next-step').disabled = !spec.vectors.length
  renderInspector(); drawTrace()
}

function drawTrace() {
  const canvas = get<HTMLCanvasElement>('signal-trace'); const scale = Math.min(devicePixelRatio, 2)
  const width = Math.max(1, canvas.clientWidth); const height = Math.max(1, canvas.clientHeight)
  if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) { canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale) }
  const context = canvas.getContext('2d')!; context.setTransform(scale, 0, 0, scale, 0, 0); context.clearRect(0, 0, width, height)
  const signals = [...new Set([...spec.outputs.map((output) => output.signal), ...spec.blocks.filter((block) => block.kind === 'latch' || block.kind === 'dff').map((block) => block.id)])].slice(0, 4)
  const trace = engine.trace.slice(-20); const rowHeight = height / Math.max(1, signals.length); const column = Math.max(1, (width - 112) / 20)
  context.font = '10px "IBM Plex Mono", monospace'
  signals.forEach((id, row) => {
    const top = row * rowHeight; context.fillStyle = day ? '#48616a' : '#a8bdc3'; context.fillText(id, 2, top + rowHeight / 2 + 4)
    trace.forEach((entry, index) => {
      const value = entry.values[id]; const horizontal = 108 + index * column
      const vertical = top + (value === true ? 7 : rowHeight - 8)
      context.strokeStyle = value === 'X' ? '#b07d26' : value === true ? '#318967' : '#788b95'; context.lineWidth = 2
      if (value === 'X') { context.fillStyle = '#a77d2b'; context.fillText('X', horizontal + 2, top + rowHeight / 2 + 4) }
      else { context.beginPath(); context.moveTo(horizontal, vertical); context.lineTo(horizontal + column, vertical); context.stroke() }
      if (index > 0 && trace[index - 1].values[id] !== value && value !== 'X' && trace[index - 1].values[id] !== 'X') { context.beginPath(); context.moveTo(horizontal, top + 7); context.lineTo(horizontal, top + rowHeight - 8); context.stroke() }
    })
  })
}

function stopPlayback() { playing = false; get('replay').innerHTML = glyph(Play); get('replay').setAttribute('aria-label', 'Play selected vector') }
function applyVector() {
  const vector = spec.vectors[vectorIndex]; if (!vector) return
  if (vectorStep >= vector.steps.length) { engine.reset(); vectorStep = 0 }
  const step = vector.steps[vectorStep]
  try { engine.apply(step.set, `${vector.id} / step ${vectorStep + 1}`); vectorStep += 1 }
  catch (error) { stopPlayback(); showError(error); return }
  update(new Set(engine.trace.at(-1)!.changed))
  if (vectorStep === vector.steps.length) stopPlayback()
}
function load(next: ChipSpec) {
  const candidate = new LogicEngine(next); const checks = validateVectors(next)
  stopPlayback(); stopTour(); spec = next; engine = candidate; report = checks; expanded = initialExpansion(spec); tables = new Set(); vectorStep = 0; vectorIndex = 0; selected = spec.blocks[0].id
  get('import-error').hidden = true; populate()
}
function showError(error: unknown) {
  get('import-error').textContent = `Specification rejected: ${error instanceof Error ? error.message : String(error)}`; get('import-error').hidden = false
}
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const anchor = element('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function stopTour() { tourIndex = null; get('tour').hidden = true }
function tour(index: number) {
  if (index >= spec.groups.length) { stopTour(); mode === 'city' ? city?.fit() : logic.fit(); return }
  tourIndex = Math.max(0, index); const group = spec.groups[tourIndex]; expanded.delete(group.id)
  let parent = spec.groups.find((entry) => entry.id === group.parent)
  while (parent) { expanded.add(parent.id); parent = spec.groups.find((entry) => entry.id === parent!.parent) }
  selected = `group:${group.id}`; rebuild()
  get('tour').hidden = false; get('tour-count').textContent = `SUBSYSTEM ${tourIndex + 1} / ${spec.groups.length}`; get('tour-title').textContent = group.label; get('tour-copy').textContent = group.description
  get<HTMLButtonElement>('tour-prev').disabled = tourIndex === 0; update(new Set()); mode === 'city' ? city?.focus(selected) : logic.focus(selected)
}

get('device').addEventListener('change', () => load(catalog.get(get<HTMLSelectElement>('device').value)!))
get('device-class').addEventListener('change', () => {
  deviceClass = get<HTMLSelectElement>('device-class').value
  if (deviceClass === 'all' || deviceClass === spec.deviceClass) {
    populateCatalog(); get<HTMLSelectElement>('device').value = [...catalog.entries()].find(([, entry]) => entry === spec)![0]
  } else {
    const next = [...catalog.values()].find((entry) => entry.deviceClass === deviceClass)
    if (next) load(next)
  }
})
get('vector').addEventListener('change', () => { stopPlayback(); engine.reset(); vectorIndex = Number(get<HTMLSelectElement>('vector').value); vectorStep = 0; update(new Set()) })
get('replay').addEventListener('click', () => { if (playing) stopPlayback(); else { playing = true; playbackTime = .7; get('replay').innerHTML = glyph(Pause); get('replay').setAttribute('aria-label', 'Pause vector playback') } })
get('next-step').addEventListener('click', () => { stopPlayback(); applyVector() })
get('reset').addEventListener('click', () => { stopPlayback(); engine.reset(); vectorStep = 0; update(new Set(engine.trace[0].changed)) })
get('expand-all').addEventListener('click', () => { stopTour(); expanded = new Set(spec.groups.map((group) => group.id)); rebuild() })
get('collapse-all').addEventListener('click', () => { stopTour(); expanded.clear(); rebuild() })
get('fit').addEventListener('click', () => { stopTour(); mode === 'city' ? city?.fit() : logic.fit() })
get('zoom-in').addEventListener('click', () => mode === 'city' ? city?.zoom(1) : logic.zoom(1))
get('zoom-out').addEventListener('click', () => mode === 'city' ? city?.zoom(-1) : logic.zoom(-1))
get('tour-start').addEventListener('click', () => tourIndex === null ? tour(0) : stopTour())
get('tour-next').addEventListener('click', () => tour((tourIndex ?? 0) + 1)); get('tour-prev').addEventListener('click', () => tour((tourIndex ?? 0) - 1)); get('tour-close').addEventListener('click', stopTour)
get('theme').addEventListener('click', () => { day = !day; document.documentElement.dataset.theme = day ? 'day' : 'night'; city?.setDay(day); get('theme').innerHTML = glyph(day ? Moon : Sun); get('theme').title = day ? 'Switch to night view' : 'Switch to day view'; get('theme').setAttribute('aria-label', get('theme').title); drawTrace() })
get('import').addEventListener('click', () => get<HTMLInputElement>('spec-file').click())
get('spec-file').addEventListener('change', async () => {
  const file = get<HTMLInputElement>('spec-file').files?.[0]; const request = ++importSequence; if (!file) return
  try {
    if (file.size > 262144) throw new Error('Specification exceeds 256 KiB')
    const parsed = parseSpecText(await file.text()); if (request !== importSequence) return
    new LogicEngine(parsed)
    const key = `imported-${request}`; catalog.set(key, parsed); load(parsed)
  } catch (error) { showError(error) }
  get<HTMLInputElement>('spec-file').value = ''
})
get('download-spec').addEventListener('click', () => download(`${spec.id}.json`, spec))
get('download-report').addEventListener('click', () => download(`${spec.id}.report.json`, { kind: 'declared-functional-vector-report', model: spec.id, revision: spec.revision, sources: spec.sources, omissions: spec.omissions, ...report }))
get('download-trace').addEventListener('click', () => download(`${spec.id}.trace.json`, { kind: 'logic-event-trace-not-measurement', model: spec.id, steps: engine.trace }))
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]')) button.addEventListener('click', () => showMode(button.dataset.view as 'city' | 'logic'))
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
  button.addEventListener('click', () => setTab(button.dataset.tab!))
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault(); const tabs = ['inspect', 'validation', 'evidence']; const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3
    setTab(tabs[index]); get(`tab-${tabs[index]}`).focus()
  })
}
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { stopTour(); stopPlayback() } })
const traceObserver = new ResizeObserver(drawTrace); traceObserver.observe(get('signal-trace'))
populate(); showMode(mode)
const timer = new Timer(); timer.connect(document)
let animationId = 0
function animate(timestamp: number) {
  animationId = requestAnimationFrame(animate); timer.update(timestamp); const delta = Math.max(0, Math.min(.1, timer.getDelta()))
  if (playing) { playbackTime += delta; if (playbackTime >= .7) { playbackTime = 0; applyVector() } }
  if (mode === 'city') city?.render(delta)
}
animationId = requestAnimationFrame(animate)
if (import.meta.hot) import.meta.hot.dispose(() => { cancelAnimationFrame(animationId); timer.dispose(); traceObserver.disconnect(); city?.dispose(); logic.dispose(); clearTimeout(noticeTimer) })