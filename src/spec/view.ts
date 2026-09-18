import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createElement, ChevronRight, Table2 } from 'lucide'
import { truthTable, type Diagram, type DiagramNode, type TruthTable } from './diagram'
import { type ChipSpec, type Value } from './schema'

export const formatValue = (value: Value | undefined): string => value === true ? '1' : value === false ? '0' : value === undefined || value === 'X' ? 'X' : Number(value.toFixed(4)).toString()
export const valueClass = (value: Value | undefined): string => value === true ? 'high' : value === false ? 'low' : typeof value === 'number' ? 'analog' : 'unknown'
const valueColor = (value: Value | undefined): string => value === true ? '#348b68' : value === false ? '#81919c' : typeof value === 'number' ? '#368db5' : '#c18a26'
const colors: Record<string, string> = { subsystem: '#598ea1', input: '#6babcd', gate: '#79b998', lut: '#6d9ba5', comparator: '#ddb769', latch: '#b990b2', dff: '#94a9dc', boundary: '#a4a6a5', output: '#93b1b0' }

export function tableElement(table: TruthTable): HTMLElement {
  const container = document.createElement('div')
  container.className = 'truth-table'
  if (!table.available) { container.textContent = table.note; return container }
  const element = document.createElement('table')
  const head = element.createTHead().insertRow()
  for (const name of [...table.columns, 'Result']) {
    const cell = document.createElement('th'); cell.textContent = name; cell.title = name; head.append(cell)
  }
  const body = element.createTBody()
  for (const row of table.rows) {
    const cells = body.insertRow()
    for (const value of [...row.inputs, row.output]) { const cell = cells.insertCell(); cell.textContent = formatValue(value); cell.className = valueClass(value) }
  }
  container.append(element)
  return container
}

interface Callbacks { select: (id: string) => void; expand: (group: string) => void; table: (id: string) => void }
const svgNamespace = 'http://www.w3.org/2000/svg'
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(svgNamespace, tag)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value))
  return element
}

export function createLogicView(host: HTMLElement, callbacks: Callbacks) {
  const canvas = svg('svg', { role: 'img', 'aria-label': 'Expandable Boolean logic diagram', tabindex: '0' })
  canvas.classList.add('logic-canvas')
  const definitions = svg('defs')
  const marker = svg('marker', { id: 'logic-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' })
  marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'context-stroke' })); definitions.append(marker)
  canvas.append(definitions)
  const edgeLayer = svg('g'); const nodeLayer = svg('g'); canvas.append(edgeLayer, nodeLayer); host.append(canvas)
  let diagram: Diagram | null = null
  const signalLabels = new Map<string, HTMLElement>()
  const nodeElements = new Map<string, HTMLElement>()
  const edges = new Map<string, { path: SVGPathElement; label: SVGTextElement }>()
  let box = { x: 0, y: 0, width: 1000, height: 600 }
  let focusedId: string | null = null
  let start: { x: number; y: number; left: number; top: number } | null = null
  function applyBox() { canvas.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`) }
  function fit() {
    focusedId = null
    if (!diagram) return
    const aspect = Math.max(0.3, host.clientWidth / Math.max(1, host.clientHeight))
    const width = Math.max(diagram.width, diagram.height * aspect) * 1.06
    box = { x: (diagram.width - width) / 2, y: (diagram.height - width / aspect) / 2, width, height: width / aspect }; applyBox()
  }
  function focus(id: string) {
    const node = diagram?.nodes.find((entry) => entry.id === id)
    if (!node) return
    focusedId = id
    const aspect = Math.max(0.3, host.clientWidth / Math.max(1, host.clientHeight))
    const width = Math.max(node.width + 200, (node.height + 160) * aspect)
    box = { x: node.x - width / 2, y: node.y - width / aspect / 2, width, height: width / aspect }; applyBox()
  }
  function zoom(direction: number) {
    focusedId = null
    const amount = direction > 0 ? 0.8 : 1.25
    const width = Math.max(200, Math.min(12000, box.width * amount))
    const height = box.height * width / box.width
    box = { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }; applyBox()
  }
  canvas.addEventListener('pointerdown', (event) => {
    if ((event.target as Element).closest('foreignObject')) return
    focusedId = null
    start = { x: event.clientX, y: event.clientY, left: box.x, top: box.y }; canvas.setPointerCapture(event.pointerId)
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!start) return
    box.x = start.left - (event.clientX - start.x) / Math.max(1, host.clientWidth) * box.width
    box.y = start.top - (event.clientY - start.y) / Math.max(1, host.clientHeight) * box.height; applyBox()
  })
  canvas.addEventListener('pointerup', () => { start = null })
  canvas.addEventListener('pointercancel', () => { start = null })
  canvas.addEventListener('wheel', (event) => {
    if ((event.target as Element).closest('.truth-table')) return
    event.preventDefault(); zoom(event.deltaY < 0 ? 1 : -1)
  }, { passive: false })
  const observer = new ResizeObserver(() => { if (focusedId) focus(focusedId); else fit() }); observer.observe(host)

  function set(spec: ChipSpec, next: Diagram, tables: ReadonlySet<string>) {
    diagram = next; nodeLayer.replaceChildren(); edgeLayer.replaceChildren(); signalLabels.clear(); edges.clear(); nodeElements.clear()
    for (const edge of next.edges) {
      const path = svg('path', { d: edge.points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' '), fill: 'none', 'stroke-width': 2, 'marker-end': 'url(#logic-arrow)' })
      path.dataset.kind = edge.kind
      const title = svg('title')
      title.textContent = edge.kind === 'architecture' ? `Architecture only: ${edge.labels.join('; ')}. Sources: ${edge.sourceRefs.join(', ')}` : `Signal dependency: ${edge.signals.join(', ')}`
      path.append(title)
      const middle = edge.points[Math.floor(edge.points.length / 2)]
      const label = svg('text', { x: middle.x, y: middle.y - 9, 'text-anchor': 'middle', class: 'edge-label' })
      edgeLayer.append(path, label); edges.set(edge.id, { path, label })
    }
    for (const node of next.nodes) {
      const foreign = svg('foreignObject', { x: node.x - node.width / 2, y: node.y - node.height / 2, width: node.width, height: node.height })
      const element = document.createElement('div'); element.className = 'logic-node'; element.dataset.node = node.id; element.style.setProperty('--component', colors[node.kind] ?? colors.gate)
      const header = document.createElement('div'); header.className = 'logic-node-header'
      const title = document.createElement('button'); title.className = 'node-select'; title.textContent = node.label; title.title = node.description; title.addEventListener('click', () => callbacks.select(node.id))
      const indicator = document.createElement('strong'); indicator.className = 'signal-indicator'; signalLabels.set(node.id, indicator)
      header.append(title, indicator)
      const kind = document.createElement('span'); kind.className = 'node-kind'; kind.textContent = node.kind === 'subsystem' ? `${node.signals.length} signals / expandable` : node.kind === 'boundary' ? 'UNMODELED / X' : node.kind.toUpperCase()
      const tools = document.createElement('div'); tools.className = 'node-actions'
      const inspect = document.createElement('button'); inspect.textContent = 'Inspect'; inspect.addEventListener('click', () => callbacks.select(node.id)); tools.append(inspect)
      if (node.kind === 'subsystem') {
        const expand = document.createElement('button'); expand.title = `Expand ${node.label}`; expand.setAttribute('aria-label', expand.title); expand.append(createElement(ChevronRight, { width: '15', height: '15' })); expand.addEventListener('click', () => callbacks.expand(node.group!)); tools.append(expand)
      } else if (truthTable(spec, node.id).available) {
        const toggle = document.createElement('button'); toggle.title = `Truth table for ${node.label}`; toggle.setAttribute('aria-label', toggle.title); toggle.setAttribute('aria-pressed', String(tables.has(node.id))); toggle.append(createElement(Table2, { width: '15', height: '15' })); toggle.addEventListener('click', () => callbacks.table(node.id)); tools.append(toggle)
      }
      element.append(header, kind, tools)
      if (tables.has(node.id)) element.append(tableElement(truthTable(spec, node.id)))
      foreign.append(element); nodeLayer.append(foreign); nodeElements.set(node.id, element)
    }
    host.dataset.nodes = String(next.nodes.length); fit()
  }
  function update(values: Readonly<Record<string, Value>>, selected: string) {
    if (!diagram) return
    for (const node of diagram.nodes) {
      const value = node.signals.length === 1 ? values[node.signals[0]] : undefined
      const indicator = signalLabels.get(node.id)!
      indicator.textContent = node.kind === 'subsystem' ? `${node.signals.filter((id) => values[id] === 'X').length}X` : formatValue(value)
      indicator.className = `signal-indicator ${valueClass(value)}`
      nodeElements.get(node.id)!.classList.toggle('selected', node.id === selected)
    }
    for (const edge of diagram.edges) {
      const entry = edges.get(edge.id)!
      if (edge.kind === 'architecture') {
        entry.path.setAttribute('stroke', '#75879a')
        entry.path.setAttribute('stroke-dasharray', '2 5')
        entry.label.textContent = `${edge.labels[0]}${edge.labels.length > 1 ? ` +${edge.labels.length - 1}` : ''} / architecture`
        continue
      }
      const value = edge.signals.length === 1 ? values[edge.signals[0]] : edge.signals.some((id) => values[id] === 'X') ? 'X' : true
      entry.path.setAttribute('stroke', valueColor(value))
      entry.path.setAttribute('stroke-dasharray', value === 'X' ? '6 4' : '')
      entry.label.textContent = edge.signals.slice(0, 2).map((id) => `${id}=${formatValue(values[id])}`).join(', ') + (edge.signals.length > 2 ? ` +${edge.signals.length - 2}` : '')
    }
  }
  return { set, update, fit, focus, zoom, dispose() { observer.disconnect(); host.replaceChildren() } }
}

interface Building { node: DiagramNode; root: THREE.Group; lamp: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>; outline: THREE.Box3Helper; label: HTMLButtonElement }
export function createCityView(host: HTMLDivElement, onSelect: (id: string) => void) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eff1')
  const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.setAttribute('aria-label', 'Specification-driven logic city'); renderer.domElement.tabIndex = 0; host.append(renderer.domElement)
  const labelLayer = document.createElement('div'); labelLayer.className = 'city-labels'; host.append(labelLayer)
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = true; controls.minZoom = 0.3; controls.maxZoom = 5; controls.maxPolarAngle = Math.PI * .45
  scene.add(new THREE.HemisphereLight(0xffffff, 0x83918e, 2.5))
  const sun = new THREE.DirectionalLight(0xffffff, 3.1); sun.position.set(-15, 30, 15); scene.add(sun)
  const world = new THREE.Group(); scene.add(world)
  const cube = new THREE.BoxGeometry(1, 1, 1)
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const buildings: Building[] = []
  const wires: { signals: string[]; architecture: boolean; material: THREE.MeshStandardMaterial; curve: THREE.CurvePath<THREE.Vector3>; pulse: THREE.Mesh; age: number }[] = []
  let width = 25; let depth = 15
  let diagram: Diagram | null = null
  let selected = ''
  let positionGoal: { target: THREE.Vector3; position: THREE.Vector3; zoom: number } | null = null
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  function mat(color: string) { const material = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: .12 }); materials.push(material); return material }
  function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.MeshStandardMaterial) {
    const mesh = new THREE.Mesh(cube, material); mesh.scale.set(...size); mesh.position.set(...position); parent.add(mesh); return mesh
  }
  function clear() {
    for (const building of buildings) { building.label.remove(); building.outline.geometry.dispose(); (building.outline.material as THREE.Material).dispose() }
    for (const geometry of geometries) geometry.dispose()
    for (const material of materials) material.dispose()
    geometries.length = 0; materials.length = 0; buildings.length = 0; wires.length = 0; world.clear()
  }
  function fit() {
    positionGoal = null; camera.zoom = 1; controls.target.set(0, 0, 0)
    camera.position.copy(new THREE.Vector3(.28, 1, .8).normalize().multiplyScalar(Math.max(width, depth) * 3)); camera.lookAt(controls.target); camera.updateMatrixWorld()
    const bounds = new THREE.Box3(new THREE.Vector3(-width / 2, -.5, -depth / 2), new THREE.Vector3(width / 2, 3, depth / 2))
    const viewBounds = bounds.clone().applyMatrix4(camera.matrixWorldInverse)
    const size = viewBounds.getSize(new THREE.Vector3())
    const aspect = Math.max(.3, host.clientWidth / Math.max(1, host.clientHeight))
    const height = Math.max(size.y, size.x / aspect) * 1.16
    camera.left = -height * aspect / 2; camera.right = height * aspect / 2; camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix()
  }
  function set(next: Diagram) {
    clear(); diagram = next; width = next.width / 70 + 3; depth = next.height / 70 + 3
    box(world, [width, .35, depth], [0, -.35, 0], mat('#b5c3c9'))
    box(world, [width - .3, .05, depth - .3], [0, -.14, 0], mat('#d8e1e3'))
    for (const node of next.nodes) {
      const root = new THREE.Group(); root.position.set((node.x - next.width / 2) / 70, 0, (node.y - next.height / 2) / 70); root.userData.nodeId = node.id; world.add(root)
      const color = colors[node.kind] ?? colors.gate
      const body = mat(color); const trim = mat('#d9e6e6')
      box(root, [2.75, .2, 1.55], [0, .02, 0], mat('#718a91'))
      if (node.kind === 'subsystem') {
        for (let index = 0; index < Math.min(8, node.signals.length); index += 1) box(root, [.48, .75 + (index % 3) * .2, .46], [(index % 4 - 1.5) * .62, .65, Math.floor(index / 4) * .6 - .3], body)
      } else if (node.kind === 'lut') {
        box(root, [2.2, .6, 1.2], [0, .5, 0], body)
        for (let cell = 0; cell < 8; cell += 1) box(root, [.35, .3, .33], [(cell % 4 - 1.5) * .49, .94, (Math.floor(cell / 4) - .5) * .5], trim)
      } else if (node.kind === 'comparator') {
        const geometry = new THREE.CylinderGeometry(.65, .85, 1.1, 3); geometries.push(geometry)
        const mesh = new THREE.Mesh(geometry, body); mesh.position.y = .72; mesh.rotation.y = Math.PI / 2; root.add(mesh)
      } else if (node.kind === 'boundary') {
        const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 1.2, 1.2)); geometries.push(geometry)
        const lineMaterial = new THREE.LineBasicMaterial({ color: '#ac842f' }); materials.push(lineMaterial)
        const frame = new THREE.LineSegments(geometry, lineMaterial); frame.position.y = .8; root.add(frame)
      } else {
        const layers = node.kind === 'latch' || node.kind === 'dff' ? 3 : 1
        for (let layer = 0; layer < layers; layer += 1) box(root, [2.1, .3, 1.1], [0, .4 + layer * .38, 0], body)
        for (const side of [-1, 1]) for (let pin = 0; pin < 4; pin += 1) box(root, [.14, .15, .4], [(pin - 1.5) * .5, .25, side * .65], trim)
      }
      const lamp = box(root, [1.9, .09, .17], [0, 1.6, .48], mat('#85978b'))
      root.updateWorldMatrix(true, true)
      const outline = new THREE.Box3Helper(new THREE.Box3().setFromObject(root).expandByScalar(.1), new THREE.Color('#416770')); outline.visible = false; world.add(outline)
      const label = document.createElement('button'); label.className = 'city-label'; label.dataset.node = node.id; label.style.setProperty('--component', color); label.setAttribute('aria-label', `Inspect ${node.label}`)
      const title = document.createElement('strong'); title.textContent = node.label
      const value = document.createElement('span'); label.append(title, value); label.addEventListener('click', () => onSelect(node.id)); labelLayer.append(label)
      buildings.push({ node, root, lamp, outline, label })
    }
    for (const edge of next.edges) {
      const curve = new THREE.CurvePath<THREE.Vector3>()
      for (let index = 1; index < edge.points.length; index += 1) {
        const first = edge.points[index - 1]; const second = edge.points[index]
        const start = new THREE.Vector3((first.x - next.width / 2) / 70, .28, (first.y - next.height / 2) / 70)
        const end = new THREE.Vector3((second.x - next.width / 2) / 70, .28, (second.y - next.height / 2) / 70)
        if (start.distanceTo(end) > .0001) curve.add(new THREE.LineCurve3(start, end))
      }
      if (!curve.curves.length) continue
      const architecture = edge.kind === 'architecture'
      const material = mat('#81919c')
      if (architecture) {
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)); geometries.push(geometry)
        const lineMaterial = new THREE.LineDashedMaterial({ color: '#75879a', dashSize: .1, gapSize: .12 }); materials.push(lineMaterial)
        const line = new THREE.Line(geometry, lineMaterial); line.computeLineDistances(); world.add(line)
      } else {
        const geometry = new THREE.TubeGeometry(curve, 32, .035, 5, false); geometries.push(geometry)
        world.add(new THREE.Mesh(geometry, material))
      }
      const pulse = box(world, [.22, .16, .22], [0, 0, 0], mat('#f3d381')); pulse.visible = false
      wires.push({ signals: edge.signals, architecture, material, curve, pulse, age: 1 })
    }
    host.dataset.nodes = String(buildings.length); fit()
  }
  function update(values: Readonly<Record<string, Value>>, nextSelected: string, changed: ReadonlySet<string>) {
    selected = nextSelected
    for (const building of buildings) {
      const value = building.node.signals.length === 1 ? values[building.node.signals[0]] : undefined
      building.lamp.material.color.set(valueColor(value))
      building.label.lastElementChild!.textContent = building.node.kind === 'subsystem' ? `${building.node.signals.length} signals` : `${building.node.kind.toUpperCase()} / ${formatValue(value)}`
      building.label.classList.toggle('selected', building.node.id === selected); building.outline.visible = building.node.id === selected
    }
    for (const wire of wires) {
      if (wire.architecture) continue
      const value = wire.signals.length === 1 ? values[wire.signals[0]] : wire.signals.some((id) => values[id] === 'X') ? 'X' : true
      wire.material.color.set(valueColor(value))
      if (wire.signals.some((id) => changed.has(id))) wire.age = 0
    }
  }
  function focus(id: string) {
    const building = buildings.find((entry) => entry.node.id === id)
    if (!building) return
    const target = building.root.position.clone(); target.y = .5
    const position = target.clone().add(camera.position.clone().sub(controls.target))
    if (reducedMotion.matches) { controls.target.copy(target); camera.position.copy(position); camera.zoom = 2.3; camera.updateProjectionMatrix() }
    else positionGoal = { target, position, zoom: 2.3 }
  }
  const observer = new ResizeObserver(() => {
    renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false); fit()
  }); observer.observe(host)
  const raycaster = new THREE.Raycaster(); let down = new THREE.Vector2()
  renderer.domElement.addEventListener('pointerdown', (event) => { down.set(event.clientX, event.clientY); positionGoal = null })
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (down.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) return
    const bounds = renderer.domElement.getBoundingClientRect()
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), camera)
    let object: THREE.Object3D | null = raycaster.intersectObjects(buildings.map((building) => building.root), true)[0]?.object ?? null
    while (object) { if (object.userData.nodeId) { onSelect(object.userData.nodeId as string); return } object = object.parent }
  })
  controls.addEventListener('start', () => { positionGoal = null })
  function render(delta: number) {
    if (positionGoal) {
      const amount = 1 - Math.exp(-delta * 8)
      camera.position.lerp(positionGoal.position, amount); controls.target.lerp(positionGoal.target, amount)
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, positionGoal.zoom, amount); camera.updateProjectionMatrix()
      if (camera.position.distanceTo(positionGoal.position) < .01) positionGoal = null
    }
    for (const wire of wires) {
      wire.age = Math.min(1, wire.age + delta * 1.7); wire.pulse.visible = wire.age < 1 && !reducedMotion.matches
      if (wire.pulse.visible) wire.pulse.position.copy(wire.curve.getPoint(wire.age))
    }
    controls.update(); renderer.render(scene, camera)
    const rectangles: DOMRect[] = []
    for (const building of [...buildings].sort((first, second) => Number(second.node.id === selected) - Number(first.node.id === selected))) {
      const point = building.root.position.clone().add(new THREE.Vector3(0, 2, 0)).project(camera)
      const left = (point.x * .5 + .5) * host.clientWidth; const top = (.5 - point.y * .5) * host.clientHeight
      const labelWidth = host.clientWidth < 650 ? 108 : 148
      const rect = new DOMRect(left - labelWidth / 2, top - 40, labelWidth, 44)
      const overlap = rectangles.some((other) => rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top)
      building.label.hidden = rect.left < 8 || rect.right > host.clientWidth - 8 || rect.top < 10 || rect.bottom > host.clientHeight - 10 || Math.abs(point.z) > 1 || overlap
      if (!building.label.hidden) { rectangles.push(rect); building.label.style.left = `${left}px`; building.label.style.top = `${top}px` }
    }
    if (diagram) {
      const framed = buildings.filter((building) => {
        for (const offsetX of [-1.45, 1.45]) for (const offsetZ of [-.85, .85]) for (const height of [0, 1.7]) {
          const point = building.root.position.clone().add(new THREE.Vector3(offsetX, height, offsetZ)).project(camera)
          if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || Math.abs(point.z) > 1) return false
        }
        return true
      }).length
      host.dataset.framed = String(framed)
    }
    host.dataset.rendered = 'true'
  }
  return { set, update, focus, fit, render,
    zoom(direction: number) { positionGoal = null; camera.zoom = THREE.MathUtils.clamp(camera.zoom * (direction > 0 ? 1.25 : .8), .3, 5); camera.updateProjectionMatrix() },
    setDay(day: boolean) { scene.background = new THREE.Color(day ? '#e9eff1' : '#182123') },
    dispose() { observer.disconnect(); controls.dispose(); clear(); cube.dispose(); renderer.dispose(); host.replaceChildren() },
  }
}