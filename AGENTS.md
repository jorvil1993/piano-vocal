# Reglas del Proyecto para Agentes de IA (musica)

Responde siempre en español.
Tuteo siempre, en todo. Nunca voseo (tienes, puedes, quieres; jamás tenés, podés, querés).
Prohibición absoluta de LaTeX y fórmulas de código en el chat (usa tablas Markdown o listas estándar).

---

## 1. Prompts Completos Siempre
Cuando Jorge pida un prompt (de imagen, video, código o refactorización), entrégalo **entero, en un solo bloque de código, listo para copiar y pegar**. Nunca pidas que edite fragmentos a mano.

---

## 2. Modelos Gratuitos, OpenCode y Delegación Inteligente

Jorge dispone en esta máquina de herramientas de IA gratuitas e ilimitadas configuradas globalmente en Windows:

### A. Herramientas disponibles en el sistema:
- **OpenCode CLI (`opencode`):** Instalado globalmente en Windows.
- **Groq API:** Variable de entorno `GROQ_API_KEY` activa (modelos ultrarrápidos de razonamiento y código: `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`).
- **OpenRouter API:** Variable de entorno `OPENROUTER_API_KEY` activa (modelos de código gratuitos: `cohere/north-mini-code:free`, `google/gemma-4-31b-it:free`, `nvidia/nemotron-3.5-lightning:free`).
- **GPU Local:** NVIDIA GeForce RTX 5070 Ti (16 GB VRAM) con Ollama (`qwen2.5-coder:14b`, `deepseek-r1:14b`).
- **Scripts y ejemplos:** En `c:\Users\devic\OneDrive\CLAUDE CODE\MODELOS-GRATIS\`.

### B. Criterio de Ahorro de Tokens (¿Cuándo resolver y cuándo delegar?):
- **NO delegues** tareas normales, arquitectura o consultas directas donde planificar gaste más tokens que resolver. En esos casos, resuelve tú mismo de inmediato.
- **SÍ delega o apóyate en OpenCode / Groq** cuando:
  1. La tarea sea masiva o repetitiva (generar decenas de archivos, componentes, migraciones, scripts de datos).
  2. Jorge te pida explícitamente: *'hazlo con OpenCode'*, *'usa el modelo gratis'* o *'ahorra tokens'*.
  3. Se agote la cuota de tokens del chat principal y necesites continuar el desarrollo sin coste.

---

## 3. Planificador Central y Pendientes

El centro de mando de todo el trabajo está en `c:\Users\devic\OneDrive\CLAUDE CODE\PLANIFICADOR\`:

- **`TAREAS_PERSONALES.md`**: Cosas que Jorge debe hacer físicamente o a mano.
- **`TAREAS_TOKENS.md`**: Cola de tareas técnicas con prompts listos para copiar y pegar a OpenCode o a cualquier agente.
- **`CODIGOS_PROYECTOS.md`**: Catálogo maestro de identificadores de proyectos (`[CONT]`, `[DEV-SIS]`, `[JOS-ING]`, `[FIN-PER]`, `[FIN-LUC]`, `[MIS-APP]`, etc.).

### Protocolo cuando Jorge pregunte "¿Qué tengo pendiente?":
Responde siempre con dos secciones claras:
1. **📌 Tus Tareas Personales:** Tabla concisa (ID, Proyecto, Tarea, Prioridad).
2. **🤖 Tareas para IA (Cuando Tengas Tokens):** Tareas técnicas con el bloque de código del **prompt listo para copiar y pegar**.
