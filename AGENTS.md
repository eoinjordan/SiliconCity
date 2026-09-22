# SiliconCity Agent Guide

## Scope And Architecture

SiliconCity is a source-aware architectural teaching atlas, not a silicon emulator. Preserve the distinction between published facts, derived behavior, illustrative presentation, and separately measured runtime data.

- `index.html`, the compatible `logic.html` alias, and `src/spec/lab.ts` contain the specification-driven Logic Lab, the default SiliconCity experience. Its models are data-only JSON in `specs/`, discovered automatically at build time.
- `hexagon.html` and `src/{core,sim,engine,world,ui}/` contain the existing Hexagon architecture city. Preserve its controls, tours, native/runtime interfaces, and explicit illustrative metrics. Native shells open this entry explicitly.
- `src/spec/schema.ts` owns the Zod schema and semantic validation. `specs/chip.schema.json` is generated, not hand-edited.
- `src/spec/engine.ts` owns Boolean evaluation, explicit state, unknown propagation, event traces, and vector reports. It uses JSON Logic; do not introduce `eval`, arbitrary JavaScript, or dynamic code loading from specifications.
- `src/spec/diagram.ts` derives hierarchy, connections, and local truth tables from the validated model. `src/spec/view.ts` renders that same graph in Three.js and SVG. Do not duplicate device behavior in the renderer.
- Read [the authoring and validation contract](docs/logic-lab.md) before adding a model. [README.md.txt](README.md.txt) is the atlas roadmap, not a verified source ledger; its `citeturn...` placeholders are not usable citations.

## Add Or Extend An Example

1. Establish the exact vendor, part, revision, and intended abstraction. If an identity or subsystem is not verified, use **Unspecified**. Do not guess a similarly named chip. The requested `QC 477M` identifier remains unresolved; the generic RV32I example is not a substitute for that SoC.
2. Read primary datasheets, reference manuals, ISA specifications, or explicitly licensed implementation sources. Record publisher, revision, URL, section/page/table, review date, redistribution policy, and a content SHA-256 when available. Do not treat an ISA as evidence of a vendor microarchitecture or a patent as evidence of a shipping feature.
3. Define the smallest defensible subsystem contract. List inputs, outputs, reset/clock behavior, assumptions, and omissions before implementing logic. Use `boundary` blocks returning `X` when executable behavior is unavailable. Analog dynamics need an appropriate analog solver and separately checked fixtures; never fabricate timing from gate counts.
4. Add one `specs/<id>.json`, reusing an existing example's structure. Set `deviceClass` and add nested groups for chip/execution/package/system context as needed. Use source-linked `connections` for architectural relationships, not invented executable drivers. New examples should not require device-specific branches in the UI or engine.
5. Attach evidence to component behavior and individual properties. Non-illustrative properties need source references. Unspecified properties use `null`. Keep logical topology separate from geometry; physical coordinates need published primary evidence. The current views always use illustrative logical layout, even if a future spec carries physical metadata.
6. Transcribe expected vectors independently from the source truth/function table. Do not generate the expected results by calling the implementation being tested. Cover reset priority, state retention, simultaneous conditions, boundaries, unsupported inputs, and clock edges where relevant. Enumerate small Boolean domains exhaustively.
7. Run `npm run validate:specs -- specs/<id>.json`, then the gates below. Inspect the source ledger, scope warnings, collapsed/expanded diagrams, local truth tables, and live outputs on desktop and mobile.
8. Report what is checked and what is not. A green vector report is not proof of electrical, timing, analog, full-ISA, or full-device conformance. For larger models, require differential tests against an appropriate trusted HDL/ISA/analog reference and human domain review before stronger claims.

## Build And Test

Use the selected repository root, not a sibling SimCity repository.

```bash
npm ci
npm run typecheck
npm test
npm run validate:specs
npm run build
npx playwright install chromium
npm run test:logic
```

- Focused model tests: `node --import tsx --test 'src/spec/*.test.mjs'`.
- Regenerate the schema after schema changes: `npm run spec:schema`. The tests compare it with the schema source.
- If shared Hexagon UI or rendering changes: run `npm run test:browser` and `npm run test:app` too. CI also runs coverage and native checks; do not weaken those jobs to make new examples pass.
- Preview: `npm run dev -- --host 127.0.0.1`, then open `/` (or `/logic.html`) for the lab and `/hexagon.html` for the architecture city. Respect the relative Pages base and all three Vite HTML entries.
- Browser tests use production assets under `/__pages_test__/`, check real canvas pixels and framing, and run desktop/mobile projects. A successful build alone is not visual validation.

## Engine And UI Constraints

- Preserve deterministic settled-event semantics, simultaneous DFF commits, and atomic rejection of invalid input updates. Clocked blocks currently require a Boolean external clock input.
- Preserve `X` for unknown state, unsupported behavior, and exact nominal comparator equality. Do not silently choose a convenient initial state or coerce unknowns to false.
- Digital comparisons belong in `gate` expressions: priority-mask equality, for example, is false for `lt`, not an analog comparator's `X` boundary.
- Truth tables are local Boolean functions, limited to six inputs. State tables include prior state/clock conditions. Numeric and unsupported dependencies use declared vectors instead. Never present a truncated table as exhaustive.
- LUT `inputs[0]` is the address LSB and `init[0]` is the result at address zero; see the authoring guide before translating MSB-first HDL literals. Reuse `blockRule` so evaluation, diagrams, and tables cannot diverge.
- Keep graph expansion independent from model execution. Expanding, collapsing, inspecting, or changing views must not change the chip's state.
- Architectural links never execute or pulse. A sourced architectural boundary still returns `X`; its evidence describes the resource, not implemented behavior. Keep configured teaching networks distinct from fixed silicon functions and full-device claims.
- Treat imported JSON and labels as untrusted data. Use text DOM APIs, HTTPS-only source links, size/depth limits, strict operators, identifier validation, and graph checks. Do not add network fetches or execute scripts from imports.
- Keep animation tied to actual logical transitions. Event steps are not nanoseconds. Geometry, relative position, component height, and travel speed are illustrative unless separately sourced and explicitly represented otherwise.
- Follow existing TypeScript/Vite/Three.js modules, local fonts, Lucide icons, and `.test.mjs` tests through `tsx`. Avoid unnecessary UI frameworks, device-specific rendering forks, or unrelated native changes.

## Evidence And Licensing

Use `primary_published`, `primary_derived`, `open_source_implementation`, `secondary_inference`, `illustrative`, or `unspecified`. Missing provenance must not be promoted automatically. Revise or downgrade claims when sources change.

Use vendor/part names as identifiers, not endorsement. Draw original representations of facts; do not redistribute vendor diagrams, PDFs, die photographs, or logos without permission. Preserve LICENSE and NOTICE. Record relevant dependency licenses in [the logic dependency ledger](docs/logic-dependencies.json); source documents remain link-only unless their license is verified.

Native/runtime timings are separate from both the Hexagon teaching coefficients and Logic Lab vectors. Browser WebGL, Apple Metal, CPU, or other-host measurements must never be labelled Qualcomm/NVIDIA silicon measurements.