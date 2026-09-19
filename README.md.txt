# SiliconCity: Current Roadmap and Historical Atlas Research

## Current Status (2026-09-19)

This document contains an older research proposal below. It is not a description
of the complete shipped product and its unresolved `citeturn...` tokens are not
usable citations. Recheck primary documents before adopting any proposed device
facts. The [README](README.md) and [Logic Lab guide](docs/logic-lab.md) describe
the current implementation; each model in `specs/` carries its own source ledger.

| Area | Implemented now | Still proposed |
| --- | --- | --- |
| Hexagon city | Illustrative workloads, source-linked districts, inspection, tour, native/runtime interfaces kept separate | Migration of the city into a common whole-device architecture schema |
| Data and provenance | Validated data-only specs, evidence categories, source-linked properties, hierarchy and unexecuted architectural boundaries | Complete vendor maps or independently verified physical geometry |
| Executable models | Seven bounded examples: NE555, SN74HC00, RV32I branch slice, STM32F103C8, i.MX 6ULL, NVDLA v1, Artix 7 primitive network | Complete CPUs, SoCs, vendor toolchains, analog dynamics or silicon timing |
| Views | Shared City/Logic graph, nested expansion, local truth tables, event traces, vector reports, JSON import/export | Chiplet/package, board, thermal, memory-traffic and scale-out views |
| Verification | 111 source tests and 34 desktop/mobile browser checks; schema and independent declared-vector validation | Full-device conformance, exhaustive accessibility or measured native-device performance |

The current i.MX **6ULL** example is not an i.MX **95** map; the NVDLA example
is not a TPU or Hexagon emulator; the configured Artix 7 network is not a full
FPGA or a loaded vendor bitstream. GPU and SoC schema classifications do not
mean those complete models are bundled. `QC 477M` remains an unverified identity.

## Next Delivery Steps

1. Extend one bounded subsystem with independently transcribed vectors and an
  appropriate external oracle before expanding device coverage.
2. Audit primary sources for proposed TPU v4 and i.MX 95 logical maps. Keep
  unavailable execution behavior and physical placement explicitly unknown.
3. Add hierarchy/package or trace views only when they share validated model
  state and provenance; do not duplicate chip behavior inside a renderer.
4. Preserve the current Hexagon/native boundaries and all web/native CI gates.
  Pages publishes both web entry points only after successful `main` CI.

No delivery dates or complete vendor maps are committed by this roadmap. The
candidate devices and visual ideas in the historical research are proposals,
not current capabilities or verified hardware specifications.

## Historical Research

## Executive summary

SiliconCity is best understood not as a simulator of Qualcomm silicon, but as an **interactive architectural teaching model**. Its central design move is to translate an NPU into a navigable city: Vector Tightly-Coupled Memory (VTCM) occupies the centre; scalar, vector and matrix engines become surrounding “districts”; micro-tiling becomes a scheduling yard; and CPU, GPU and sensing components sit at the periphery as wider-system context. Data movement is animated with particles, component activity is reflected in buildings and HUD metrics, and workload/precision selectors change a deliberately synthetic behavioural model. The project explicitly states that its geometry, lane counts, throughput, utilisation and power are illustrative rather than measurements or a physical die floorplan. citeturn21view0turn21view2

Technically, the site is a strong foundation for a broader series. The application is built as a TypeScript/Vite/Three.js WebGL project with a WebGL canvas, a CSS2D label layer and conventional DOM HUD layers. The source tree cleanly separates simulation, rendering, world geometry and UI, while the existing automated test suite covers unit/integration tests, Playwright browser tests and production-app tests. citeturn21view1turn21view3turn22view0 That separation is exactly what a multi-vendor architecture atlas needs: the renderer can remain common while each processor becomes a declarative architecture dataset plus vendor-specific presentation rules.

The most important finding is that future maps should **not all imitate the same four-district NPU layout**. Different architectures call for different spatial grammars. A Google TPU v4 naturally supports both chip-level and 3D-pod topology views; NVIDIA H100 suits a hierarchy from GPU → GPC/TPC/SM → Tensor/Core/memory; AMD MI300X demands a chiplet/package map; NXP i.MX 95 is ideal for a heterogeneous domain-oriented MPU map; Arm Ethos-U55 and STM32N6 are better explained as edge/MCU pipelines; AMD Versal naturally becomes a tiled NoC city; and Cerebras demands a wafer-scale map. Google publishes particularly rich TPU-v4 information, including two TensorCores per chip, four MXUs per TensorCore, HBM, power data and a 4,096-chip 3D network, making it arguably the strongest first non-Qualcomm demonstrator. citeturn20search1 NXP similarly publishes a detailed i.MX 95 block diagram exposing CPU, MCU, memory, security, multimedia, NPU and I/O domains, which makes it an unusually good exemplar for an MPU/system map. citeturn23view0turn24view0

I recommend prioritising the portfolio primarily by **source quality and architectural distinctiveness**, not by current market share or benchmark performance. The first wave should be Google TPU v4, NVIDIA H100, AMD MI300X, NXP i.MX 95, Arm Cortex-M55 + Ethos-U55, AMD Versal AI Edge, and STM32N6. These collectively exercise tensor ASICs, conventional GPUs, chiplet GPUs, MPUs, microNPUs, adaptive SoCs and MCUs while having comparatively good official/public documentation. NVIDIA has both vendor architecture material and an original published H100 architecture paper; AMD publishes ROCm microarchitecture material for MI300 and a Hot Chips treatment; Arm publicly documents Ethos-U55 as a microNPU for Cortex-M-class systems; and AMD documents Versal as a heterogeneous architecture comprising processing, programmable and AI engines. citeturn10search12turn10search8turn18search4turn10search5turn10search3turn18search1

A second wave should cover Intel Core Ultra 200V, Qualcomm Snapdragon X-series SoCs, Tenstorrent Wormhole, SiFive X390, Apple M4, MediaTek Dimensity 9400/9400+, Samsung Exynos 2400 and Huawei Ascend. These are highly valuable but the public evidence increasingly stops at functional blocks rather than cache topology, interconnect implementation, power domains or physical placement. For Apple, for example, first-party material gives an unusually clear top-level CPU/GPU/Neural Engine/media/unified-memory story, but not a sufficiently complete public physical microarchitecture to justify a die-accurate city. citeturn25search0 MediaTek publishes substantially more CPU-cache, GPU, memory and NPU information for Dimensity 9400/9400+, whereas public Samsung and Huawei material is less complete for detailed floorplan reconstruction. citeturn25search1turn25search2turn25search3

The most significant enhancement should therefore be a **provenance/confidence system**. Every geometry and metric should be machine-labelled as one of: *published physical*, *published logical*, *derived*, *secondary-source inference*, or *illustrative*. SiliconCity already establishes the ethical basis for this by separating public architectural facts from synthetic model values and explicitly warning that particles and rails are conceptual rather than measured buses. citeturn21view2 Making that distinction visible would transform a collection of attractive processor visualisations into a rigorous, auditable architecture atlas.

The recommended end-state is a single reusable visualisation engine with at least four scales:

```mermaid
flowchart LR
    A["Instruction / operator<br/>MAC, vector op, DMA"] --> B["Execution block<br/>core, SM, MXU, NPU engine"]
    B --> C["Chip / SoC<br/>caches, NoC, memory, I/O"]
    C --> D["Package / board<br/>HBM, DRAM, PMIC, PCIe"]
    D --> E["System / cluster<br/>server, phone, robot, pod"]
    E --> F["Software + workload<br/>compiler, runtime, model, trace"]

    G["Provenance layer"] -. "published / derived / illustrative" .-> A
    G -.-> B
    G -.-> C
    G -.-> D
    G -.-> E
    G -.-> F
```

That architecture would preserve the approachable “city” metaphor while allowing each processor family to express what is genuinely distinctive about it.

## Historical Hexagon-Only Audit

The audit below predates the seven-example Logic Lab and must not be used to infer current deployment status or complete product scope. It describes the earlier Hexagon view, not the reusable specification engine and cross-vendor subsystem models now shipped. Its source placeholders have not been resolved into a verified ledger.

**Visualisation catalogue**

| Visualisation or interaction | What the site does | Mapping convention and analytical interpretation |
|---|---|---|
| **Three-dimensional architecture “city”** | Represents the Hexagon NPU as spatial districts surrounding shared memory. The user can orbit, zoom and pan the scene. citeturn21view0 | Space is **semantic**, not a silicon floorplan. Relative positions communicate relationships rather than transistor-level placement. Verification explicitly says district dimensions are visual metaphors. citeturn21view2 |
| **Central shared-memory district** | VTCM is placed at the centre in violet. citeturn21view0 | Centrality communicates data locality and sharing between engines; it must not be read as evidence that physical VTCM lies at the geometric die centre. citeturn21view2 |
| **Scalar district** | The scalar accelerator is positioned north and coloured blue, representing control/orchestration and non-matrix portions of workloads. citeturn21view0 | Blue is a semantic identity, consistently distinct from vector/tensor compute. |
| **HVX/vector district** | HVX is positioned west and coloured green; it represents SIMD/vector processing including activation, normalisation and element-wise work. citeturn21view0 | “West” is pedagogical rather than physical; green consistently means vector compute. |
| **HMX/tensor district** | HMX is positioned east and coloured amber and is presented as the matrix/tensor engine. citeturn21view0 | Amber consistently communicates matrix-heavy compute. The visible array/cell count is expressly not an operation count. citeturn21view2 |
| **Micro-tile scheduling yard** | A southern/cyan area visualises the splitting of larger operations into smaller tiles. citeturn21view0 | This is intentionally a **conceptual scheduling metaphor**, not a claimed standalone hardware block. citeturn21view2 |
| **Animated dataflow particles** | Activations and weights move visibly through the scene; the README identifies cyan with activations and orange with weights. citeturn21view0 | Particle trajectories illustrate logical flow. Verification states that paths/rails are not measured bus topology. citeturn21view2 |
| **Activity/utilisation animation** | LLM decode, vision/convolution and idle modes drive different apparent activity in scalar, HVX and HMX regions and their utilisation bars. citeturn21view0 | This is a deterministic teaching model, not telemetry from Hexagon hardware. citeturn21view0turn21view2 |
| **Precision/quantisation comparative view** | A selector changes INT4, INT8, INT16 and FP16 modes and correspondingly alters HMX TOPS and token-rate displays. citeturn21view0 | The selector changes illustrative coefficients; it does not quantise or execute a model. The repository separately verifies affine integer quantisation semantics. citeturn21view2 |
| **HUD metrics** | The interface exposes utilisation plus synthetic throughput, token-rate and power-style indicators. citeturn21view2 | Current coefficients are explicitly synthetic. The documented illustrative power model is `0.4 + 0.6·scalar + 1.1·vector + 2.4·tensor`; the resulting values are not Qualcomm specifications. citeturn21view2 |
| **Interactive inspection** | Clicking a district opens inspection information; CSS2D labels sit over the WebGL canvas. citeturn21view0turn21view1 | Provides semantic drill-down without changing the underlying architecture model. |
| **Guided architectural tour** | `T` launches a guided tour; the application also has an establishing shot and reset/pause controls. citeturn21view0 | Useful as an authored explanatory narrative layered over a freely navigable model. |
| **System-context districts** | Host CPU, Adreno GPU and sensing hub appear at the corners/periphery. citeturn21view0 | They are intentionally quieter/dashed and explicitly **outside the depicted NPU**; they are not shown as VTCM clients. citeturn21view0turn21view2 |
| **Day/night thematic mode** | `N` toggles day/night presentation. citeturn21view0 | Primarily a presentation layer rather than a different architecture dataset. |
| **Legend/help layer** | `?` opens the key map and colour legend. citeturn21view0 | Critical because colour is deliberately semantic rather than decorative. |
| **Measured-runtime panel** | Separate local/native integrations can show ONNX Runtime CPU/QNN or Ollama/llama.cpp/LM Studio timings. citeturn22view1 | The project makes a strong distinction between these measured timings and the synthetic city metrics; measured runtime values never overwrite synthetic engine utilisation/power. citeturn22view1 |

The strongest convention is therefore **“semantic geography”**: districts correspond to architectural roles, road/particle systems to conceptual data movement, height/illumination/activity to workload behaviour, and peripheral geography to system context. It is not a die-photo reconstruction.

The effective layout is:

```mermaid
flowchart TB
    CPU["Host CPU<br/>system context"]
    S["Scalar accelerator<br/>North · blue"]
    GPU["Adreno GPU<br/>system context"]

    H["HVX vector engine<br/>West · green"]
    V["VTCM shared local memory<br/>Centre · violet"]
    M["HMX matrix engine<br/>East · amber"]

    SH["Sensing hub<br/>system context"]
    T["Micro-tile scheduling<br/>South · cyan<br/>(concept, not separate block)"]
    DRAM["External / platform memory"]

    S <--> V
    H <--> V
    M <--> V
    T -. "tile scheduling" .-> V

    DRAM -. "orange: weights" .-> V
    V -. "cyan: activations" .-> H
    V -. "cyan: activations" .-> M

    CPU -. "context only" .- S
    GPU -. "context only" .- M
    SH -. "context only" .- T
```

This reconstruction follows the repository's explicit north/west/east/south/centre mapping and colour legend; the dashed context relationships above should likewise be interpreted conceptually. citeturn21view0turn21view2

**Page composition is itself layered.** The HTML contains a `stage` with separate WebGL canvas and label roots, followed by a HUD with top, left, right and bottom regions, an inspector, guided-tour layer and help overlay. citeturn21view1 The source tree mirrors that separation: `sim/` contains the behavioural model, `engine/` rendering/camera/labels/dataflow/picking, `world/` architectural geometry and `ui/` the HUD, inspector, tour and keyboard controls. citeturn22view0 This is a very good decomposition to preserve.

**Existing data/source hierarchy**

| Source layer | Material used | Role in the site |
|---|---|---|
| Qualcomm architecture | Qualcomm Hexagon NPU and Qualcomm AI Engine public materials | Basis for the scalar/vector/tensor/shared-memory and heterogeneous-system model. citeturn22view0 |
| Qualcomm surrounding IP | Oryon CPU, Adreno GPU and Qualcomm AI materials | Provides wider CPU/GPU/NPU context rather than internal NPU geometry. citeturn22view0 |
| Product-level specifications | Snapdragon X Elite page and product brief | Used to establish cited platform facts such as the named product's advertised Hexagon-NPU performance and LPDDR bandwidth, not the simulator's synthetic per-format coefficients. citeturn21view2 |
| Qualcomm AI tooling | AI Hub quantisation and profiling documentation | Supports statements about quantisation workflow and device/runtime caveats; it is not treated as a universal capability matrix. citeturn21view2 |
| Standards | ONNX `QuantizeLinear` / `DequantizeLinear` semantics | Basis for separately verified integer affine quantisation examples. citeturn22view0 |
| Local/runtime APIs | ONNX Runtime QNN plus Ollama, llama.cpp and LM Studio interfaces | Allows optional measured runtime experiments outside the synthetic visual model. citeturn22view1 |
| Internal synthetic model | `src/sim/` fixed-step deterministic behaviour | Drives visible utilisation/throughput/power behaviour; values are pedagogical and are not sourced from Qualcomm silicon measurements. citeturn21view0turn21view2 |

A particularly good practice worth carrying into every future map is the repository's **trust boundary**. For example, the verification document distinguishes the published 45-TOPS Snapdragon X Elite claim from simulated INT4/INT8/INT16/FP16 coefficients and explicitly warns that VTCM has not been modelled as a CPU/GPU-shared cache, that paths are conceptual, and that visible block sizes are not silicon dimensions. citeturn21view2

The implementation is similarly straightforward to generalise. The current dependencies are Three.js, TypeScript and Vite, with CSS/fonts/icons around them; Playwright, jsdom and coverage tooling support testing. citeturn21view3 There is consequently no architectural need to rewrite the project into a heavier UI framework simply to support multiple vendors.

## Prioritised vendor and device portfolio

The ranking below is a **visualisation-development priority**, not a ranking of processor performance. I would score candidate maps against five factors: approximately 35% quality/depth of primary architectural evidence, 25% architectural distinctiveness, 15% ability to connect chip and real-world system views, 15% audience relevance and 10% expected IP/licensing cleanliness.

The target portfolio deliberately spans GPUs, standalone accelerators, NPUs, MCU-class processors, MPUs, mobile/client SoCs and adaptive SoCs.

| Priority | Vendor and representative device | Device class | Why it should become a “city” |
|---|---|---|---|
| **P1** | **Google TPU v4** | NPU/ASIC accelerator | Probably the strongest first expansion: Google publishes the two-TensorCore chip hierarchy, MXUs/vector/scalar units, HBM capacity/bandwidth, measured power and a 4,096-chip 3D interconnect. It supports maps from compute unit through entire pod. citeturn20search1 |
| **P1** | **NVIDIA H100 / Hopper** | GPU + tensor accelerator | Ideal canonical GPU map: SM hierarchy, conventional GPU execution, Tensor Cores, on-chip memory, HBM, NVLink and scale-out system context. NVIDIA provides a detailed architecture treatment and H100 is also described in an original architecture publication. citeturn10search12turn10search8 |
| **P1** | **AMD Instinct MI300X / CDNA 3** | GPU accelerator, chiplet package | Adds something H100 cannot: chiplet/package geography. AMD's ROCm documentation exposes MI300 microarchitecture and states that MI300X contains eight XCDs; Hot Chips material provides another primary architecture source. citeturn18search4turn20search0turn10search5 |
| **P1** | **NXP i.MX 95** | MPU/heterogeneous SoC + NPU | Exceptionally suitable system map. The 2026 datasheet exposes six Cortex-A55s, real-time and low-power MCU domains, Neutron NPU, GPU, memory, security enclave and rich I/O, along with explicit power-domain information and module frequencies. citeturn23view0turn24view0turn24view1 |
| **P1** | **Arm Cortex-M55 + Ethos-U55** | MCU-class CPU IP + microNPU | A clean counterpoint to data-centre accelerators: show how a microNPU integrates beside a Cortex-M-class processor and local memory in a constrained embedded system. Arm explicitly positions Ethos-U55 as a microNPU for embedded/IoT use. citeturn10search3turn10search7 |
| **P1** | **AMD Versal AI Edge / AI Edge Gen 2** | Adaptive SoC / accelerator | Its Scalar/Adaptable/AI Engine concept is almost tailor-made for a city. Programmable logic, AI-engine tiles, processing-system CPUs, NoC and I/O can become physically different districts. AMD documents the heterogeneous roles and, for Gen 2, device-level AI performance classes. citeturn18search1turn18search5turn18search14 |
| **P1** | **STMicroelectronics STM32N6** | MCU/SoC + NPU | Brings the project into deeply embedded edge AI. ST documentation identifies STM32N6 as the first STM32 MCU family with the Neural-ART accelerator and provides extensive hardware-development material. citeturn17search0turn16search0 |
| **P2** | **Qualcomm Snapdragon X Elite, whole-SoC view** | Client SoC: CPU + GPU + NPU | A natural extension of the current NPU map: zoom outward to Oryon CPU, Adreno GPU, Hexagon NPU, memory and I/O while reusing already curated Qualcomm sources. The existing project already cites the product brief and architecture material. citeturn21view2turn22view0 |
| **P2** | **Intel Core Ultra 200V / Lunar Lake** | Client SoC: CPU + GPU + NPU | Important heterogeneous PC comparison: CPU, Arc GPU, NPU and platform memory/power behaviour can be related to the same classes of client workloads used in Snapdragon maps. Intel maintains first-party Core Ultra 200V material. citeturn10search22turn18search7 |
| **P2** | **Tenstorrent Wormhole** | AI accelerator + RISC-V control | Excellent for a tiled many-core/NoC view and unusually strong software integration. Current Tenstorrent documentation exposes TT-Metalium, visualisation tooling, Wormhole hardware and simulation of Wormhole/Blackhole RISC-V cores/system devices. citeturn16search3turn16search6 |
| **P2** | **SiFive Intelligence X390** | RISC-V CPU/vector AI IP | Creates a core-level rather than whole-SoC map. SiFive describes X390 as an eight-stage, dual-issue in-order superscalar processor with dual vector processing, making pipeline/vector visualisation particularly appropriate. citeturn17search2 |
| **P2** | **Apple M4** | Consumer SoC: CPU + GPU + NPU | High educational value because CPU, GPU, Neural Engine, media engines and unified-memory concepts coexist in one SoC. Apple publicly identifies a 16-core Neural Engine rated at 38 trillion operations/s, but deeper physical/cache topology is less open. citeturn25search0 |
| **P2** | **MediaTek Dimensity 9400 / 9400+** | Mobile SoC + NPU | Particularly good mobile map: all-big-core CPU, explicit cache levels, 12-core Arm GPU, NPU 890, LPDDR5X, ISP and connectivity form several clear districts. MediaTek exposes CPU cache sizes and a relatively detailed feature set in first-party material. citeturn25search1turn25search4 |
| **P3** | **Samsung Exynos 2400** | Mobile SoC + NPU/GPU | Important vendor representation and useful comparison with MediaTek/Qualcomm. Samsung publicly specifies a deca-core Arm CPU and Xclipse 940 GPU, but detailed NPU/interconnect/floorplan disclosure is thinner, so the first release should remain logical rather than die-accurate. citeturn25search2 |
| **P3** | **Cerebras WSE-3 / CS-3** | Wafer-scale AI accelerator | Radically different visual grammar: instead of a few districts, the wafer itself becomes the city and defect-tolerant routing, local SRAM/compute and system connectivity become the story. Cerebras identifies WSE-3 as the engine used by CS-3; public WSE material provides the broader wafer-scale architectural lineage. citeturn18search6turn18search2 |
| **P3** | **Huawei Ascend 910C** | AI accelerator | Strategically important to include, but should be confidence-labelled aggressively. Huawei publishes product/system context such as Atlas 900 A3 configurations using Ascend 910C, whereas English first-party material exposing internal block-level topology is markedly more limited than for TPU/H100/MI300. citeturn25search3turn25search9 |

This selection covers every requested class:

| Class | Representative maps |
|---|---|
| **GPU** | NVIDIA H100; AMD MI300X; Intel Arc component of Core Ultra; Apple/MediaTek/Samsung integrated GPUs |
| **NPU** | Hexagon; Google TPU; Arm Ethos-U55; Intel NPU; Apple Neural Engine; MediaTek NPU 890; Samsung NPU; NXP Neutron; STM32 Neural-ART |
| **MCU** | STM32N6; Cortex-M55/Ethos-U55 system; i.MX 95 real-time MCU domains |
| **MPU** | NXP i.MX 95 |
| **SoC** | Snapdragon X Elite; Core Ultra 200V; Apple M4; Dimensity 9400; Exynos 2400; Versal AI Edge |
| **Accelerator** | H100, MI300X, TPU v4, Wormhole, Cerebras WSE, Ascend 910C, Versal AI engines |

No additional unnamed vendor has been silently inferred. Any future candidate for which vendor, generation or SKU cannot be established from a primary source should literally be stored and displayed as **“Unspecified”**, rather than guessed. The same rule should apply to unpublished sub-block counts, process variants, clock domains and floorplan locations.

The prioritisation also deliberately chooses some devices that are no longer the newest generation. That is a feature rather than a defect: **visualisability and provenance are more important than recency**. A well-documented TPU v4 or Hopper map can teach more architecture than a newer product for which only marketing TOPS figures are available.

## Architectural data model and source feasibility

A common schema should exist across all maps. At minimum it should support: compute units and their hierarchy; clusters/tiles; private/shared caches; scratchpads/TCM/SRAM; external memory; interconnects; DMA; specialised accelerators; power domains; clock domains; I/O; security/management blocks; process technology; package/chiplets; and, separately, physical floorplan geometry.

Crucially, **logical topology and physical floorplan must be separate fields**. A device may have excellent documentation for the former and no trustworthy public source for the latter.

I recommend these feasibility definitions:

**High** means public primary material is sufficient for a detailed and defensible logical map, usually supplemented by architecture manuals/papers, although literal transistor-level floorplans may still be unavailable. **Medium** means major blocks are known but deeper cache, NoC, clocks, power or physical-placement details require omissions or clearly labelled secondary evidence. **Low** means an attractive detailed map would otherwise invite substantial inference; only a conservative high-level diagram should be published.

| Vendor/device | Key architectural attributes to visualise | Required source packet | Feasibility |
|---|---|---|---|
| **Google TPU v4** | Two TensorCores; four MXUs per TensorCore; scalar/vector units; common/on-chip memory where documented; 32-GiB HBM interface; DMA/host connection; chip-to-chip links; chip → slice → 4,096-chip pod hierarchy; 3D mesh/torus; measured power; physical chip/package geometry only where explicitly sourced. Google exposes chip and pod specifications directly. citeturn20search1 | Google Cloud TPU architecture docs; original TPU-v4 paper linked by Google; accelerator/compiler papers; package photos only as secondary evidence; patents only for missing mechanisms, not as proof that every patented design shipped. | **High** for logical chip and pod topology; **Medium** for exact physical die floorplan. |
| **NVIDIA H100** | GPC/TPC/SM hierarchy; CUDA/FP/Tensor execution; warp scheduling; register files; shared-memory/L1 and L2 hierarchy; HBM; Tensor Memory Accelerator/data movement where applicable; NVLink/PCIe; security/confidential-compute blocks; power/clock regions if public; package/die boundaries. NVIDIA describes its GPU model as arrays of SMs and supplies Hopper architecture material. citeturn19search7turn10search12 | H100/Hopper whitepaper; CUDA/PTX guides; original H100 architecture publication; NVLink documentation; product/server docs; die photograph only when appropriately licensed and corroborated. | **High** logical; **Medium** physical floorplan/power domains. |
| **AMD MI300X** | Eight XCDs; compute-unit/compute-complex hierarchy; L0/L1/L2/L3 where documented; I/O dies; HBM stacks/controllers; Infinity Fabric paths; package/chiplet placement; host/PCIe/Infinity Fabric I/O; clocks/power telemetry; security. AMD ROCm documentation explicitly exposes MI300 microarchitecture and the eight-XCD configuration. citeturn18search4turn20search0 | ROCm architecture/ISA docs; CDNA 3 whitepaper; MI300 product docs; Hot Chips presentation; package diagrams; public performance-counter documentation. | **High** logical/package level; **Medium** fine-grained die floorplan. |
| **NXP i.MX 95** | Six Cortex-A55 application CPUs/cache hierarchy; Cortex-M7 real-time MCU; Cortex-M33 low-power/safety domain; Neutron N3 NPU; GPU/VPU/ISP; OCRAM/LPDDR; EdgeLock secure enclave; DMA; low/high-speed I/O; explicit real-time, application, low-power and flex domains; clock frequencies; package differences. The official block diagram is exceptionally useful. citeturn23view0turn24view0turn24view1 | Datasheet; reference manual; NXP ML/Neutron guide; clock/power manuals; EVK schematics; BSP/device tree; security documentation. Silicon floorplan only if NXP publishes one. | **High** logical/domain/I/O map; **Medium** literal die floorplan. |
| **Arm Cortex-M55 + Ethos-U55** | Cortex-M pipeline/cache/TCM; Ethos-U command/control, MAC/storage blocks where TRM permits; memory paths; bus interfaces; interrupt/control flow; security via TrustZone-capable system context where appropriate; CPU/NPU scheduling; deployment software. Ethos-U55 is publicly positioned as a microNPU paired with Cortex-M systems. citeturn10search3turn10search7 | Arm TRMs and product briefs; CMSIS-NN/Ethos-U software docs; Corstone reference-system manuals; open reference implementations where licensed; academic papers on Ethos-U deployment. | **High** IP-level logical map; **Low/not applicable** for a universal physical floorplan because licensees implement the IP differently. |
| **AMD Versal AI Edge / Gen 2** | Processing-system CPUs; Scalar Engines; programmable/adaptable logic; AI Engine/AIE-ML tile arrays; NoC; local tile memories; DMA; DDR interfaces; programmable/high-speed I/O; security/safety/management; AI-engine clock regions; physical columns/edges only where documented. AMD explicitly documents the heterogeneous processing roles. citeturn18search1turn18search5turn18search14 | Architecture manuals; device data sheets; AIE programming guides; NoC manuals; packaging/pinout manuals; Vitis/Vivado placement reports from example designs; first-party block diagrams. | **High**; one of the best candidates for a semi-physical tiled map. |
| **STM32N6** | Cortex-M CPU subsystem; Neural-ART NPU; memory hierarchy/embedded RAM and external-memory paths; camera/ISP interfaces; DMA; security; peripherals; clock tree; voltage/power domains; package pins; sensor-to-NPU pipeline. ST identifies Neural-ART as integrated into STM32N6. citeturn17search0turn16search0 | STM32N6 datasheet; reference manual; hardware-development/application notes; Neural-ART programming material; Cube/Edge-AI tooling; development-board schematics. | **High–Medium** logical; **Low–Medium** physical die map. |
| **Qualcomm Snapdragon X Elite — full SoC** | Oryon CPU clusters/cache levels where published; Adreno GPU; Hexagon NPU/VTCM; memory controller; ISP/media/display; PCIe/USB/connectivity; security; system fabric; clock/power islands; package context. Existing SimCity references already establish the CPU/GPU/NPU heterogeneous model and product brief. citeturn22view0turn21view2 | Qualcomm product brief; CPU/GPU/NPU architecture pages; developer/AI Hub documentation; OS/ACPI/device information; patents and academic work only as secondary corroboration. | **Medium**. High-level heterogeneous map is defensible; detailed interconnect/floorplan is not. |
| **Intel Core Ultra 200V** | P-core/E-core clusters; cache hierarchy; integrated Arc GPU/Xe cores; NPU; memory subsystem; media/display; I/O; fabric; package/tile organisation where public; clock/power domains and low-power island; security. Intel maintains first-party Series 2/200V documentation. citeturn10search22turn18search7 | Intel architecture presentations; processor datasheets; optimisation manuals; NPU/OpenVINO docs; graphics documentation; packaging presentations; patent material only to fill conceptual gaps. | **Medium–High** logical/package; **Medium** physical. |
| **Tenstorrent Wormhole** | Tensix-core grid; RISC-V control processors; per-core local memories; NoC routers; DRAM controllers; Ethernet/scale-out links; command queues; tensor movement; multi-card topology; TT-Metalium software mapping. Tenstorrent exposes both low-level software and Wormhole/Blackhole simulation tooling. citeturn16search3turn17search3 | Tenstorrent hardware and TT-Metalium docs; public open-source repositories; simulator source; card specifications; architecture talks/papers. | **High–Medium** logical; **Medium** physical. |
| **SiFive Intelligence X390** | Instruction pipeline; scalar issue; vector pipelines; vector register file; caches/TCM and bus interfaces; interrupts/debug; RISC-V ISA extensions; possible multicore/SoC integration as a separate contextual layer. SiFive specifies an eight-stage dual-issue superscalar design with dual vector processing. citeturn17search2 | Product brief; SiFive manuals; RISC-V ISA specifications; compiler/LLVM material; development-platform docs; RTL only if an explicitly open core is used instead of proprietary X390 RTL. | **High** for core-level conceptual map; **Low/not applicable** for implementation-specific floorplan. |
| **Apple M4** | Performance/efficiency CPU clusters; private/shared cache where officially stated; GPU and Dynamic Caching concept; Neural Engine; unified-memory interface; media engines; display/I/O; Secure Enclave/security; package; power domains. Apple publicly documents the Neural Engine and high-level SoC engines, but many deeper structures remain undisclosed. citeturn25search0 | Apple technical/newsroom material; developer GPU/Metal documentation; platform/security guides; original academic work where relevant; third-party die analysis only as a separately labelled secondary layer. | **Medium** high-level; **Low** for authoritative physical/internal-NoC map. |
| **MediaTek Dimensity 9400/9400+** | Cortex-X925/X4/A720 CPU groups; per-core L2, shared L3 and SLC; 12-core Immortalis-G925 GPU; NPU 890; LPDDR5X; Imagiq ISP; modem/Wi-Fi; display/video; scheduling/power systems. MediaTek provides unusually useful CPU-cache and NPU/GPU specifications. citeturn25search1turn25search4 | MediaTek product pages/briefs; Arm CPU/GPU manuals; developer/AI SDK documentation; TSMC node information where explicitly confirmed; patents/die analyses only as secondary layers. | **Medium–High** topological; **Low–Medium** physical. |
| **Samsung Exynos 2400** | Arm CPU cluster arrangement; Xclipse 940 GPU; NPU; system cache/memory if officially documented; ISP/media/display; 5G modem; security; interconnect; power/clock domains; package. Samsung's public semiconductor page confirms the deca-core CPU and Xclipse 940, but does not expose enough detail to assume every deeper block. citeturn25search2 | Samsung Semiconductor product material; Samsung developer docs; Arm documentation; foundry/process disclosure; patents; conference papers; licensed die imagery only as secondary corroboration. | **Medium–Low**. Use “unspecified” liberally below the major-block level. |
| **Cerebras WSE-3** | Wafer-scale tile/core lattice; local SRAM; compute units; routing fabric; redundancy/defect bypass where generation-specific evidence exists; wafer I/O; CS-3 system interfaces; cooling/power; multi-system clustering. CS-3 is publicly associated with WSE-3. citeturn18search6 | Cerebras architecture/CS-3 material; WSE papers and conference presentations; generation-specific product docs; patents only when clearly distinguished from implemented features. | **Medium–High** for the wafer-level concept; **Medium** for detailed WSE-3 internals. |
| **Huawei Ascend 910C** | Compute-engine hierarchy only where officially disclosed; local/on-chip memory; external memory; chip interconnect; host I/O; multi-accelerator topology; power/thermal; software/MindSpore/CANN mapping; package. Huawei's current first-party material is much clearer about system-level Ascend deployments than fine-grained 910C internals. citeturn25search3turn25search9 | Huawei/Ascend developer docs; product/system manuals; first-party research papers; standards/conference presentations; patents; secondary teardown material strictly confidence-labelled. | **Low** for detailed city; **Medium** for system-level accelerator/topology map. |

The i.MX 95 example illustrates why the provenance distinction matters. NXP's published diagram genuinely supports separate real-time, application, low-power and flex domains, an EdgeLock enclave, memory, NPU, GPU, ISP and I/O. citeturn24view0 Its datasheet also explicitly publishes multiple power domains and module-frequency ranges, including separate NPU, GPU, ISP and CPU clocks. citeturn23view0turn24view1 Those can safely become interactive layers. By contrast, the diagram does **not** establish the physical area or coordinates of those blocks on the die, so drawing the same rectangles as literal floorplan polygons would cross the evidence boundary.

The data model should therefore attach provenance to individual properties rather than to a device as a whole:

```text
component
  id
  class
  parent
  logical_connections[]
  caches[]
  memories[]
  clock_domain
  power_domain
  process_node
  package
  geometry
    kind: logical | package | physical
    source_id
    confidence
  properties[]
    value
    unit
    source_id
    evidence_kind:
      primary_published
      primary_derived
      open_source_implementation
      secondary_inference
      illustrative
```

That distinction would directly solve the hardest cross-vendor problem: a TPU could have a highly sourced topology while an Apple or Huawei map could still be useful without pretending to possess equivalent physical knowledge.

## New visualisation designs

The present Three.js/TypeScript/Vite stack should remain the default renderer. The existing application already uses Three.js for the 3D scene and separate CSS2D/DOM layers for annotation and HUD, so most of the proposed views can be added incrementally rather than through a rewrite. citeturn21view1turn21view3 D3 is a good complementary choice for 2D axes, traces, trees and Sankey-like views; Web Workers are appropriate for trace aggregation; and a GIS-like tile model becomes useful for very large wafer, PCB or rack spaces. MapLibre GL JS, for example, uses WebGL to render interactive vector-tile maps, providing a useful conceptual model for zoom-dependent architectural layers even when actual geographical coordinates are not involved. citeturn26search23

| Proposed view | Architectural value / rationale | Required input data | Recommended implementation | Complexity |
|---|---|---|---|---|
| **Power and thermal “weather map”** | Overlay temperature, estimated/measured power density and power-state boundaries on the city. This teaches why “fastest block” and “always active block” are different concepts and makes DVFS/thermal throttling intelligible. | Sensor telemetry where available; package TDP/power limits; power-domain membership; DVFS states; optional thermal-RC model; floorplan coordinates only if sourced. For synthetic mode, all estimates must be labelled modelled. | Existing Three.js geometry + GPU heat-map texture; D3 legend; Web Worker for thermal-model updates; optional WebGL render target for diffusion-style simulation. | **L** |
| **Latency and bandwidth heatmap** | Colour roads/interconnect edges by latency, utilisation or available bandwidth and buildings by stall pressure. Excellent for explaining locality, NoC congestion and CPU/GPU/NPU trade-offs. | Link topology; bandwidth; latency; cache hit/miss or queue data; workload traffic matrix; DMA paths; measurement provenance. | Three.js line/mesh instancing; shader-based edge intensity; D3 scales; optional WebGPU compute for very large graphs. | **L** |
| **Dataflow plus buffer-occupancy animation** | Extends today's particles by making tensors change shape, precision and residency while showing SRAM/cache/TCM occupancy. The user sees *why* tiling or fusion reduces DRAM traffic. | Operator DAG; tensor shapes/precision; compiler schedule; memory allocation; tile dimensions; DMA events; lifetime intervals. | Three.js for physical movement; D3 for DAG mini-map; event-driven animation; Web Workers for trace preprocessing; Web Animations API or a small tween layer for deterministic playback. | **L** |
| **Workload execution timeline** | Adds a trace/Gantt view aligned to the 3D scene: CPU preparation, DMA, NPU/GPU kernels, synchronisation, idle gaps and power-state changes. Selecting an interval highlights the active city districts. | Timestamped trace events; engine IDs; kernel/operator names; stream/queue IDs; memory transfers; frequencies/power states. | D3/SVG or Canvas for timeline lanes; virtualisation for long traces; shared event bus with Three.js scene. Export/import Chrome Trace Event or another documented neutral trace schema where possible. | **M** |
| **Software-stack “airspace” overlay** | Visualises model/framework → compiler → runtime → driver → firmware → hardware relationships vertically above the physical city. Essential for understanding why the same model maps differently through CUDA, ROCm, QNN, OpenVINO, Core ML, Vitis AI, TT-Metalium, etc. | Software components; versioned dependency graph; compiler passes; supported execution providers; operator placement; fallback paths. | HTML/CSS2D panels anchored to Three.js; D3 dependency graph; layer toggles. Avoid rendering every package simultaneously; use progressive disclosure. | **M** |
| **Package, PCB and device-context map** | Zooms outward from die → package → memory → PMIC → PCB → sensors/NIC/display/camera. Particularly valuable for MCU/MPU/mobile devices where I/O and power are as educational as compute. | Package dimensions/pin groups; board schematics; memory/PMIC placement; link widths/speeds; PCB/block diagram; sensor/interface data. | Nested coordinate systems in Three.js; level-of-detail tiles; optional MapLibre-style vector-tile scheme for large boards; SVG overlays for connectors. | **M–L** |
| **Memory-residency and cache-pressure view** | Recasts the city as storage districts: register → L1/scratchpad → L2/SLC → HBM/LPDDR/DDR. Animated “population” represents live bytes and misses/evictions become traffic. It teaches arithmetic intensity more directly than TOPS alone. | Memory hierarchy/capacities; tensor/object sizes; cache/memory counters where measurable; read/write volumes; lifetime trace. | Three.js extrusions for occupancy; D3 Sankey/stack charts for flows; shader-based capacity fill levels. | **M** |
| **Scale-out/topology map** | Allows zoom from accelerator to card/server/rack/pod. Particularly compelling for TPU v4's 3D topology, NVIDIA NVLink systems, Tenstorrent Ethernet meshes and Huawei SuperPoD context. Google publicly documents TPU-v4's 3D mesh/pod topology, demonstrating that this scale can be based on primary evidence rather than visual invention. citeturn20search1 | Node count; physical/logical links; bandwidth; topology dimensions; switches; collective traces; rack/card hierarchy. | Three.js instancing; graph-layout preprocessing; level-of-detail aggregation; GIS-like tiling for very large systems; D3 matrix/topology inset. | **L** |
| **Evidence/confidence overlay** | Every component can be switched into an “X-ray provenance” mode: solid = primary physical evidence; hatched = logical public block; stippled = derived; translucent = secondary inference; wireframe = illustrative. This prevents visual polish from being mistaken for factual certainty. | Source ledger; source type; page/figure references; confidence; last-reviewed date; licence status. | Mostly **existing stack**: material/shader variants, iconography and inspector metadata. No new heavyweight framework is necessary. | **S–M** |

The final item is strategically more important than its implementation size suggests. In the current Hexagon project, the difference between a known public architecture relationship and an illustrative road or district dimension exists in documentation. citeturn21view2 In a cross-vendor atlas it should become a **visual primitive**.

A second useful variation is to make layout selectable rather than forcing a single interpretation:

| Layout mode | Best use |
|---|---|
| **Semantic city** | Conceptual teaching; equivalent to current Hexagon map. |
| **Hierarchy** | GPU SMs, CPU clusters, vector pipelines, cache trees. |
| **Tiled grid** | TPU, Versal AIE, Tenstorrent, Cerebras. |
| **Package/chiplet** | MI300X and multi-die products. |
| **Published block diagram** | i.MX 95, MCUs and MPUs with detailed vendor diagrams. |
| **Physical floorplan** | Only when a reliable physical source exists. |
| **System board** | Embedded/mobile/automotive integration. |
| **Topology/network** | Pods, racks, collectives and multi-accelerator systems. |

The architecture schema should be independent of those layouts. A single MI300X dataset, for example, should be renderable as a logical hierarchy, a package/chiplet city, a memory-flow heatmap or a server card without duplicating architectural facts.

## Implementation roadmap, validation and IP

The first reusable data-driven layer is now implemented in the Logic Lab. The
original Hexagon city remains separate; full-device schema migration and the
broader hardware catalogue below are still proposed. Reuse the existing schema,
engine and views before adding another device-specific renderer.

The earlier date-based schedule has been retired. The following phases are a
candidate order subject to source availability, scoped tests and review, not a
release timetable. The Logic Lab has already delivered part of the foundation.

| Phase | Principal milestone | Sample deliverables | Validation gate |
|---|---|---|---|
| **Foundation** | Separate architecture data from renderer code. | `architecture.schema.json`; `sources.json`; component/interconnect/memory schemas; evidence enum; semantic colour tokens; generic camera/layout interface; migration of Hexagon into the new schema. | Existing Hexagon scene reproduces current behaviour; JSON-schema tests; every displayed fact resolves to a source or `illustrative` tag. |
| **Reference maps** | Prove that the schema can represent very different architectures. | TPU-v4 chip + pod map; i.MX95 domain/MPU map; H100 hierarchical GPU map; MI300X chiplet/package map. | Independent comparison against Google/NXP/NVIDIA/AMD primary diagrams; count/topology invariant tests; expert technical review. |
| **Edge and adaptive** | Exercise microNPU, MCU, FPGA/adaptive and RISC-V abstractions. | Ethos-U55/M55 embedded map; STM32N6 sensor-to-NPU map; Versal tiled AI/programmable-logic map; Tenstorrent grid; X390 vector-pipeline map. | Verify that IP blocks are not accidentally presented as fixed silicon floorplans; validate bus/memory names against vendor TRMs/manuals. |
| **Client and mobile** | Build confidence-aware heterogeneous SoCs. | Full Snapdragon map; Intel client SoC; Apple M4 logical map; MediaTek 9400; Exynos; conservative Ascend map. | Automatic failure if a physical geometry or undocumented cache/interconnect relationship is published without an acceptable evidence classification. |
| **Dynamic views** | Move beyond static architecture teaching. | Thermal/power layer; latency/bandwidth layer; trace timeline; buffer/dataflow replay; software overlay; memory-residency view. | Known synthetic traces with expected paths; deterministic replay; numerical invariants; measured and simulated data visually distinct. |
| **System scale** | Connect chips to real products and clusters. | Die/package/PCB zoom; server/card view; TPU pod topology; multi-GPU/multi-accelerator view. | Link-count/topology checks; schematic comparison; LOD/performance tests. |
| **Release hardening** | Treat the atlas as a maintained reference product. | Source audit dashboard; accessibility pass; mobile mode; browser compatibility matrix; provenance export; licence manifest; reproducible builds. | Visual-regression suite; keyboard/screen-reader tests; frame-time budget; source/licence audit; final domain-expert review. |

**Testing should preserve and extend the project's current strengths.** SiliconCity already defines TypeScript type checking, module tests, coverage, Playwright WebGL tests and production-app tests. citeturn21view3 Its broader release workflow also tests browser interactions and pixel output and builds its native Android/Windows components. citeturn22view1 For the atlas, I would add five architecture-specific test categories:

1. **Source invariants.** Every non-illustrative number, topology edge and physical coordinate must have a source ID, review date and evidence type. An orphan factual datum fails CI.

2. **Architecture invariants.** If the source says a TPU v4 chip has two TensorCores and each has four MXUs, schema tests should assert exactly that rather than merely checking that a visually plausible scene renders. Google's current documentation supplies exactly this kind of machine-testable architectural fact. citeturn20search1 Likewise, an i.MX 95 model can test six application CPUs and presence of its M7, M33, NPU, security and I/O domains against the official block diagram. citeturn24view0

3. **Visual regression.** Maintain Playwright screenshots at representative desktop, high-DPI and mobile viewports. Geometry changes should require explicit approval, especially where the shape communicates architectural hierarchy.

4. **Performance budgets.** Test frame time, draw calls, geometry count and memory on an agreed low-end WebGL2 target. Large Cerebras/TPU/Tenstorrent views should rely on instancing and level-of-detail rather than one DOM element or mesh per logical element.

5. **Epistemic regression.** A source update must never silently turn “unspecified” into an inferred value. When documentation is removed, contradicted or superseded, the UI should be capable of downgrading the corresponding confidence state without rewriting scene code.

**Licensing and IP require an explicit gate before each vendor map.** The current code is Apache-2.0, while its NOTICE states that Qualcomm/Snapdragon/Hexagon/Adreno/Oryon marks belong to Qualcomm, disclaims affiliation, and separately notes that “SimCity” is an Electronic Arts trademark. citeturn21view3turn22view2 Extending the project multiplies this trademark surface substantially.

A conservative policy would therefore be:

- Keep the **software engine** under Apache-2.0 unless dependencies force otherwise, while maintaining a machine-readable third-party licence manifest. The current project already declares Apache-2.0. citeturn21view3turn22view2
- Consider giving the multi-vendor programme a vendor-neutral master name such as **Silicon City Atlas**, **Architecture Atlas** or **Compute City**, with “city-style view” as a description. This avoids making a third party's “SimCity” mark the organising brand of an expanded product line; the existing project's NOTICE itself recognises that mark. citeturn22view2
- Use vendor names and part numbers as **identifiers**, not visual branding. Prefer plain text to reproduced corporate logos unless usage rights have been checked.
- Do not paste vendor whitepaper, patent or datasheet diagrams directly into the application merely because they are public. Record them as evidence, then draw an original schematic representation of the architectural facts.
- Treat published silicon photographs, decap photographs and third-party annotated die shots as separately licensed assets. A secondary-source die image should never silently become the foundation for a supposedly official floorplan.
- Keep **patent evidence** distinct from product evidence. A patent can explain a possible mechanism but should not by itself cause the atlas to claim that the feature appears in a particular shipping SKU.
- Record source-level metadata such as publisher, document title/revision, publication/retrieval date, figure/page, URL identifier, evidence type and redistribution status.
- For proprietary IP blocks, distinguish the **IP architecture** from a licensee's physical implementation. This is especially important for Arm and SiFive: a useful M55/U55 or X390 architecture view need not pretend that every customer integrates the cores in the same physical arrangement.
- For vendors with incomplete public disclosure, especially Apple, Samsung and Huawei, omission is preferable to visual inference. An attractive empty/grey “interconnect: unspecified” layer is more rigorous than a fabricated bus.

The release UI should make those rules visible. A proposed inspector could show:

> **NPU → eIQ Neutron N3-1024S**  
> Evidence: primary product datasheet  
> Representation: published logical block  
> Physical die location: **unspecified**  
> Clock domain: primary datasheet  
> Geometry: illustrative  
> Last reviewed: 17 September 2026

That model follows the spirit of SiliconCity's existing verification document but makes provenance part of the product rather than something a user must discover in repository notes. citeturn21view2

The resulting sequence is intentionally asymmetrical: **TPU v4, H100, MI300X and i.MX95 should become the reference implementations**, because together they force the renderer to solve tensor arrays, classic GPU hierarchies, chiplets, memory, heterogeneous embedded domains and system topology using unusually good primary evidence. Google exposes TPU-v4 chip-to-pod topology; AMD exposes MI300 microarchitecture through ROCm; NVIDIA offers both architecture material and published research; and NXP's current datasheet provides an unusually detailed system block diagram, power-domain information and independent module clocks. citeturn20search1turn18search4turn10search12turn10search8turn23view0

Once those four render correctly from one architecture schema, the project has ceased to be a collection of one-off “SimCity” demonstrations. It has become a general framework for comparing **where computation happens, where data lives, how it moves, how software reaches it, how power constrains it, and how confidently each of those things is actually known**.
