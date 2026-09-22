# SiliconCity

SiliconCity is an independent architectural teaching atlas with two experiences:

| Open | Current scope |
| --- | --- |
| [Logic Lab](https://eoinjordan.github.io/SiliconCity/) | Seven source-linked component, CPU/ISA, MCU, MPU, NPU, and FPGA examples with executable subsystem logic |

The root opens the SiliconCity Logic Lab; `/logic.html` remains a compatible alias.
The lab's architecture link opens `/hexagon.html`, and the Hexagon toolbar links
back to the lab. Native shells continue to open the Hexagon view explicitly. These views
do not execute complete chips, reconstruct physical die layouts, or measure
silicon performance. Optional native/runtime measurements are separate.

## Specification-Driven Logic Lab

![Seven Logic Lab examples: truth tables, unknown behavior, interrupt conditions, and clocked FPGA state](docs/media/logic-lab.gif)

- Expand and collapse subsystem diagrams, including nested groups.
- Filter the reference catalog by device class, from discrete logic to FPGA.
- Inspect equations, source references, evidence classifications, assumptions,
  and explicitly unmodeled boundaries.
- Expand local Boolean truth tables into components inside the logic diagram.
- Change inputs, replay independent validation vectors, inspect event-step traces,
  and import/export data-only JSON specifications.
- Pulse explicit clocks and separate evaluated signals from source-linked
  architectural connections that do not execute.
- Use a shared Boolean/state engine and graph for both 3D and logic views.

| Class | Reference example | Executable scope |
| --- | --- | --- |
| Component | TI NE555 | Nominal comparator, reset/trigger, and retained output logic |
| Component | TI SN74HC00 | Four independent NAND gates |
| CPU / ISA | Generic RV32I | BEQ/BNE decode and branch decision |
| MCU | STM32F103C8 | EXTI selection, masks, and bounded exception eligibility |
| MPU | NXP i.MX 6ULL | GIC forwarding and effective priority-mask comparison |
| NPU | NVIDIA NVDLA v1 | CSB request/bank contracts and interrupt masking |
| FPGA | AMD Artix 7 primitive network | LUT6, clock-enabled registers, carry chain, and example route mux |

They are scoped functional abstractions, not electrical simulators or complete
chip/ISA implementations. Larger models retain memory, compute, peripheral,
configuration, and I/O context as explicitly unexecuted boundaries. FPGA
primitive equations use a fingerprinted open-source implementation; no vendor
bitstream or hardware timing is simulated. Unspecified startup state and
unsupported behavior remain `X`. The requested `QC 477M` product identity has
not been verified.

```bash
npm ci
npm run dev
# Open / on the printed local URL.
npm run validate:specs
npm run test:logic
```

Start with [AGENTS.md](AGENTS.md) to extend the atlas with an agent, and the
[model authoring and verification guide](docs/logic-lab.md) for the schema,
semantics, provenance rules, limitations, and validation workflow. The agent
transcribes and verifies primary sources; the browser does not automatically
convert a datasheet PDF into a proven chip implementation.

The [cross-vendor roadmap](README.md.txt) separates the implemented foundation
from proposed full-device maps. Its older research section contains unresolved
source placeholders and is not a verified source ledger. Use the examples'
source records and [authoring guide](docs/logic-lab.md) for current contracts.
NOTICE](NOTICE) for trademarks and the model disclaimer.
