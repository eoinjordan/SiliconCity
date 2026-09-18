# Logic Lab: Models, Evidence, And Extension

The Logic Lab is the first reusable specification layer of SiliconCity. It complements the existing Hexagon city instead of reinterpreting its illustrative workload counters as a gate-level chip model. Open `logic.html` through the Vite server or production build; the architecture city has a **Logic Lab** link.

The [recorded preview](media/logic-lab.gif) is captured from the actual browser app. To regenerate it with Playwright Chromium and FFmpeg installed, start the local server and run `node tools/record-logic.mjs http://127.0.0.1:4180/`. Capture frames are temporary and are removed after encoding; the generated GIF is validated and a decoded check frame is placed in the system temporary directory.

## Current Examples

| Example | Implemented contract | Evidence | Deliberately absent |
| --- | --- | --- | --- |
| TI NE555 | Nominal comparators, reset/trigger priority, state retention, output logic, discharge conduction | SLFS022K, Table 6-1, page 13, March 2026 | RC waveform solver, oscillator frequency, voltage/current/timing tolerances, CONT modulation |
| TI SN74HC00 | Four independent two-input NAND functions | SCLS181H, Table 8-1, page 10, August 2021 | CMOS electrical thresholds, drive/load behavior, delay, package wiring validation |
| Generic RV32I branch slice | BEQ/BNE field decode and equality-based branch decision | RISC-V v20260120, RV32I 2.1 and instruction listings | Complete CPU/ISA execution, targets/traps, vendor microarchitecture, buses/peripherals |
| STM32F103C8 MCU | EXTI edge selection, event/interrupt masking, bounded exception eligibility | ST product page and official EXTI LL implementation; Arm CMSIS register documentation | Firmware execution, automatic pending-bit capture/clear races, complete NVIC arbitration, peripheral timing |
| i.MX 6ULL MPU | GIC interrupt forwarding and effective digital priority/mask comparison | NXP product page and official Linux BSP device trees; Arm CMSIS GIC documentation | Cortex-A7 execution, MMU/cache/DDR behavior, full GIC acknowledge/active-state arbitration |
| NVDLA v1 NPU | CSB request acceptance/response obligations, selected register-bank protection, interrupt masking | NVDLA v1 hardware architecture and integration guides | Tensor arithmetic, scheduling/latency, actual memory transfers, performance estimates |
| Artix 7 FPGA primitive network | Configured LUT6, two enabled synchronous registers, four carry stages, example route mux | AMD family page and fingerprinted Yosys LUT6/CARRY4/FDRE functional definitions | Full CLB/device, vendor bitstreams, synthesis/place-and-route, BRAM/DSP behavior, timing/electrical validation |

The 555 has 22 declared assertions covering five requirements. The quad NAND has 24 assertions covering two requirements, plus an independent test of all 256 Boolean input combinations. The branch slice has 12 assertions covering three requirements, plus all 2,048 opcode/function/equality combinations.

The MCU has 25 assertions across three requirements and all 1,024 Boolean combinations. The MPU has 18 assertions across three requirements, all 64 enable combinations, and all 65,536 effective priority/mask pairs; equality fails the digital priority comparison, rather than becoming `X`. Here MPU means microprocessor, not Memory Protection Unit. The NPU has 44 assertions across four requirements, 128 request/bank combinations, and 16 interrupt-lane combinations. Its response outputs describe obligations, not same-cycle completion pulses. Pending, enable, and status inputs in these models are explicit snapshots; omitted state machines are not silently executed.

The FPGA has 60 assertions across four requirements, all 64 configured LUT addresses, all 1,024 carry select/data/seed combinations, and register edge/enable/reset tests. The example parity function, two-stage pipeline, and route mux are authored design choices, not fixed features of an unconfigured device. No particular Artix 7 SKU or physical resource count is implied.

Implementation references are identified as such. The STM32 behavior uses ST's accessible low-layer EXTI implementation, the i.MX architectural map uses NXP's BSP, and FPGA primitive equations use Yosys. Unavailable vendor manual pages were not treated as verified evidence. Some implementation URLs track branches; the ledger records revisions and content fingerprints where obtained, not immutable vendor certification.

These are finite checks of declared abstractions. They do not prove that a chip, board, complete ISA, or electrical implementation conforms. The requested `QC 477M` part number is unverified; no similarly named Qualcomm device has been silently substituted.

## Two Views, One Model

**City** renders the model as an original architectural metaphor. **Logic** renders its dependency graph with directed connections. Subsystems can be expanded or collapsed, including nested groups. Both use the same `buildDiagram` result and the same settled signal values.

The device-class selector groups the catalog into components, CPU/ISA, MCU, MPU, NPU, and FPGA examples. Models with more than 18 inputs plus blocks start with collapsed subsystems. Selecting a nested component opens its ancestors without changing engine state. The header distinguishes executable blocks from unexecuted architectural boundaries.

Component inspection exposes equations, state, sources, evidence classifications, and omissions. Small Boolean components can expand a truth table inside the logic diagram. The inspector also offers a scrollable table. Numeric comparators and unsupported blocks do not receive fabricated Boolean tables.

Solid signal paths reflect evaluated dependencies. Dotted architectural links carry descriptions, evidence classifications, and source references, but never drive signals or animate logical transitions. A published architectural block can still have unmodeled behavior and therefore an `X` output.

Input controls drive the actual engine. Vector playback applies the declared input steps; reset restores initial conditions, including unknown state. For each external DFF clock, a pulse control applies low, high, low as three separate event steps, producing one rising edge. A signal trace records event steps, not physical time. Downloads provide the model, validation report, or trace as JSON. Import validates data before replacing the active model and does not execute JavaScript or fetch remote model code.

## Specification Structure

The source of truth is [src/spec/schema.ts](../src/spec/schema.ts). The generated [JSON Schema](../specs/chip.schema.json) supports editor completion and structural validation. The CLI also applies semantic checks that JSON Schema alone cannot establish.

Each `silicon-city/v1` model contains:

- Identity, device class, revision, summary, and an abstraction level.
- A source ledger with publisher, revision, locator, HTTPS URL, review date, redistribution policy, and optional content fingerprint.
- Hierarchical subsystem groups, external inputs, executable blocks, and outputs.
- Evidence classifications, architectural categories/scales, optional property-level facts, and separate geometry metadata.
- Optional source-linked architectural `connections`, separate from executable dependencies.
- Requirements linked to sources and observed signals.
- Test vectors linked to requirements, with input patches and independent expected values.
- Explicit assumptions and omissions.

Use lowercase underscore-separated IDs. Signals have one driver. Groups may have a parent but cannot form a hierarchy cycle. Output aliases do not introduce new executable drivers.

`deviceClass` accepts `component` (the default), `cpu`, `mcu`, `mpu`, `npu`, `gpu`, `fpga`, or `soc`. This is catalog metadata, not a promise that a complete device is executed. GPU and SoC are supported classifications, not additional bundled examples.

The vocabulary supports `logic`, `compute`, `memory`, `interconnect`, `dma`, `clock`, `power`, `io`, `security`, `software`, `package`, and `context` categories. Scales cover logic, execution blocks, chip, package, board, system, and software. These are metadata and hierarchy, not automatic implementations of a cache, NoC, PLL, or processor.

## Boolean Expressions

Expressions use a deliberately small typed AST, compiled into JSON Logic. Examples:

```json
{ "op": "not", "args": [{ "var": "enable_n" }] }
```

```json
{
  "op": "and",
  "args": [{ "var": "request" }, { "var": "ready" }]
}
```

Operators are `not`, `and`, `or`, `xor`, `eq`, `ne`, `lt`, `le`, `gt`, `ge`, and `if`. Boolean operators require Boolean operands; comparisons use numeric operands; equality requires matching types. There is no arbitrary JavaScript, function registration, dynamic import, native call, or remote include in a model.

| Block | Meaning |
| --- | --- |
| `gate` | Boolean expression evaluated in topological order |
| `lut` | One to six Boolean address inputs select a configured bit; evaluated through the same expression engine |
| `comparator` | Numeric threshold decision; exact equality returns `X` by model policy |
| `latch` | Explicit asynchronous next-state expression and initial state |
| `dff` | Explicit next-state expression, initial state, and external Boolean rising-edge clock |
| `boundary` | Unsupported subsystem; always outputs `X` with a reason |

For the 555, comparator voltages are normalized to fixed VCC. RESET is an already-classified valid Boolean level. Reset overrides all other conditions. With reset released and CONT nominal, active trigger sets the state regardless of threshold; inactive trigger and high threshold reset it; otherwise the state holds. These priorities are derived from the source function table, not a generic SR-latch assumption.

### Configured LUTs

A `lut` block supplies `inputs` and `init` instead of `rule`. `inputs[0]` is the least significant address bit. `init` is a binary string of exactly `2^inputs.length` characters, with **address zero first**. For example, `"inputs": ["a", "b"], "init": "0100"` is true only when `a` is true and `b` is false. This order is intentionally different from an MSB-first binary literal.

The inspector displays conventional MSB-first hexadecimal by reversing the address-ordered string. `blockRule` converts the configuration into a mux-expression tree used by the engine, dependency checks, and local truth table. All 64 rows of a LUT6 remain available by scrolling. Unknown addresses resolve only when every possible selected bit agrees. These are logical configuration bits; there is no vendor bitstream parser or implicit routing configuration.

## Event Semantics

1. Validate the entire input patch before mutating state.
2. Evaluate combinational dependencies and settle explicit asynchronous latches.
3. Sample all rising-edge DFF inputs from the same pre-commit state, then commit them together.
4. Settle asynchronous/combinational consequences and record the resulting signal snapshot.

Pure combinational loops are rejected. Asynchronous feedback has a bounded fixed-point evaluation; oscillating or non-settling updates are rejected atomically. Invalid updates preserve the previous state.

`X` means unknown, not false. The engine evaluates Boolean completions for up to eight unknown dependencies; it resolves a known result only when all completions agree. Beyond that bound it conservatively returns `X`. It does not track correlations between different unknown signals or model analog metastability.

Local truth tables enumerate at most six Boolean inputs (64 rows). Latch tables include prior state; DFF tables include previous/current clock conditions. Local dependency variables are independent for table generation; this is not a reachable-state proof or a whole-chip truth table. Numeric or unsupported dependencies require explicit vectors.

There is no high-impedance `Z`, multi-driver resolution, propagation-delay model, HDL scheduler, transistor simulation, analog ODE solver, or electrical tolerance analysis. A larger chip should be decomposed into validated subsystem contracts, with unsupported internals visible as boundaries. Stronger hardware claims require a suitable trusted reference implementation or solver and domain review.

## Adding A Model With An Agent

Start with [AGENTS.md](../AGENTS.md). A useful task is:

> Add a model for this exact part and document revision. First identify the primary sources, modeled subsystem boundary, and unknowns. Transcribe behavior and independently sourced expected vectors into a new spec. Keep physical placement unspecified unless published. Validate it, inspect both views and truth tables, and report the checks and remaining omissions without claiming full-device conformance.

The agent reads or extracts the source document, then authors reviewed JSON. **The browser importer does not automatically turn a PDF into a faithful chip model.** Source authenticity and interpretation still require review. A PDF hash identifies the bytes reviewed; it does not validate their interpretation or make a mutable URL immutable.

Use an existing spec as a structural example, not as expected behavior for a different device. New files under `specs/` are discovered automatically. For browser-only experimentation, import a JSON file; imported models remain session-local until explicitly downloaded and added to the repository.

```bash
npm run validate:specs -- specs/new_model.json
npm run typecheck
npm test
npm run test:logic
```

The validator emits machine-readable JSON and exits nonzero for malformed models, failing assertions, or unexercised requirements. A requirement is exercised only when an associated vector asserts all of its declared signals. This is a coverage check, not a proof that the requirement wording is complete or that all input combinations were tested.

After schema changes:

```bash
npm run spec:schema
node --import tsx --test 'src/spec/*.test.mjs'
```

## Provenance And Layout

Behavior and individual facts use `primary_published`, `primary_derived`, `open_source_implementation`, `secondary_inference`, `illustrative`, or `unspecified`. Missing classification stays unspecified. Non-illustrative facts require source references; unspecified property values must be `null`.

Geometry is a separate contract. Physical coordinates require primary-published evidence and a source reference; secondary or unspecified documents cannot justify them. The current city and logic views still show illustrative logical layout. They do not render a verified physical floorplan merely because a model includes physical metadata.

Signal edges are derived from expression/LUT references and DFF clock connections, not hand-authored animation routes. They represent logical dependencies, not physical wiring, bus bandwidth, capacitance, or delay.

Optional architectural `connections` declare `id`, `from`, `to`, `label`, `description`, `kind`, `evidence`, and `sourceRefs`. Endpoints must be existing input/block drivers, not output aliases; IDs must be unique and self-links are rejected. Kinds are `data`, `control`, `memory`, `clock`, and `configuration`. These edges may form structural cycles because they do not participate in evaluation or change the combinational-cycle rules. The diagram aggregates their labels and references when groups collapse; the inspector retains each underlying connection. An illustrative relationship must be marked illustrative even when its endpoints are published resources.

The broader roadmap's vendor portfolio, chiplet/package views, scale-out topology, and thermal/telemetry layers remain future work. The seven examples provide bounded functional contracts and source-linked context, not complete vendor architecture coverage.

Do not use the unresolved citation tokens in [the roadmap](../README.md.txt) as a source. Obtain the actual primary documents before adding those models.

## Security, Licensing, And Limits

Imported specs are limited to 256 KiB, bounded nesting, 64 inputs, 128 blocks, 32 groups, 256 architectural connections, 512 vectors, and 64 steps per vector. Expressions have a maximum depth of 16; invalid hierarchy/combinational cycles, reserved identifiers, unsupported operators, and out-of-range inputs are rejected. Labels are rendered as text and source links are HTTPS-only. No runtime network fetch occurs during import.

Vendor documents are link-only references unless an explicit redistribution license is verified. No vendor PDFs or diagrams are bundled. Geometry is original. The engine remains under the repository's Apache-2.0 license; additional library licenses are recorded in [logic-dependencies.json](logic-dependencies.json).

The existing Hexagon simulator and optional native/runtime services retain their separate trust boundaries. Logic-vector results never replace hardware telemetry, and browser/CPU/Metal measurements must not be relabelled as another vendor's silicon performance.