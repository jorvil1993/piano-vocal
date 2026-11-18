# Contexto para quien siga este proyecto

Lee esto entero antes de tocar nada. Está escrito para que otro agente no
rompa cosas que costaron medirse. Complementa a `LEEME.md` (cómo se usa) y
`COLA.md` (qué se pidió y qué se descartó, con motivos).

Responde siempre en español y **de tú, nunca de vos** (regla de la raíz
`CLAUDE CODE\CLAUDE.md`, no es preferencia de estilo).

---

## Qué es

Un atril de ensayo casero. Le pasas un link de YouTube y te devuelve los
acordes con su tiempo real, la letra sincronizada palabra por palabra, seis
pistas separadas y varios modos de estudio. El dueño es Jorge: piano
Yamaha P-515, 15 años tocando a ratos, quiere aprender a tocar de oído para
acompañar momentos de oración. Toca desde el celular (Galaxy S25 Ultra) por
Wi-Fi contra el servidor de su PC.

```
python procesar.py "https://youtube.com/watch?v=..."   # analiza una canción
python revisar.py                                       # OBLIGATORIO después
python servidor.py                                      # http 8300 / https 8443
python reletra.py <slug>                                # rehace SOLO la letra
```

**Procesar una canción son dos pasos, no uno.** `procesar.py` termina sin
quejarse aunque la transcripción se haya dejado media canción o el tempo
salga al doble; nada de eso aparece en el log. `revisar.py` lo mide y te
dice qué hacer. Nunca des una canción por buena sin pasarlo — la tabla de
avisos está en `LEEME.md`.

Entra por **https://<ip>:8443** desde el celular: el Wake Lock (impedir que
se apague la pantalla) solo funciona en contexto seguro.

---

## Regla número uno del proyecto: medir, no suponer

Casi todos los bugs de este proyecto se resolvieron midiendo, y varios se
habían "arreglado" antes a ojo sin arreglarse. Antes de afirmar que algo
funciona, mídelo y enseña el número. Ejemplos reales:

- El desfase de acordes resultó ser **exactamente un pulso** (`librosa.util.sync`
  con `pad=True`); se comprobó con la mediana de 60 acordes.
- El doble tempo se resolvió midiendo que la batería da 69.84 BPM
  independientemente de `start_bpm`.
- El retardo del encoder MP3 se midió en 0.0 ms y se descartó como causa.

## Regla número dos: cambio en el código = cambio en el HTML

Tres veces se rompió algo por tocar solo un lado. Después de cada cambio,
comprueba **los dos sentidos**:

```bash
python -c "
import re
js=open('app/app.js',encoding='utf-8').read(); h=open('app/index.html',encoding='utf-8').read()
ids=set(re.findall(r\"\\\$\('([a-z0-9\-]+)'\)\", js))
cre=('val-','fader-','m-','s-','vista-')
print([i for i in sorted(ids) if not i.startswith(cre) and ('id=\"%s\"'%i) not in h] or 'ninguno')"
```

Hoy son 66 identificadores y ninguno huérfano. Si sale algo, lo rompiste.

## Regla número tres: un motor, no copias

`cifrado.js` exporta `claveAcorde`, `nombreAcorde`, `angloAcorde`,
`notasAcorde`, `midisAcorde` y `calidadSimple`. **`practicar.js` las
importa, no las reimplementa.** Si cambia el criterio de "sencillo", cambia
en los dos sitios a la vez. Ya se quitó un duplicado (`--solo-letra` en
`procesar.py` repetía lo de `reletra.py`, y encima peor: pisaba las líneas
corregidas a mano).

---

## Cómo se prueba sin navegador

El JS de la app es ES modules puros. Se pueden correr en Node con un DOM
simulado de veinte líneas y verificar de verdad, no de vista. Así se
comprobaron las 168 hojas de cifrado y las 42 pantallas del entrenador.

```js
class El{constructor(t){this.tag=t;this.hijos=[];this.className="";this._t="";
 this.style={cssText:""};this.dataset={};
 this.classList={add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false};}
 appendChild(c){this.hijos.push(c);return c;} append(...c){c.forEach(x=>this.hijos.push(x));}
 set textContent(v){this._t=v;this.hijos=[];} get textContent(){return this._t;}
 set innerHTML(v){this._h=v;this.hijos=[];} get innerHTML(){return this._h||"";}
 remove(){} scrollTo(){} addEventListener(){} querySelectorAll(){return [];}
 getBoundingClientRect(){return {width:this._t.length*8,top:0};}
 get clientWidth(){return 380;} get clientHeight(){return 300;} get scrollTop(){return 0;}}
globalThis.document={createElement:t=>new El(t),getElementById:()=>new El("div"),
  querySelectorAll:()=>[],createTextNode:s=>({_t:s,hijos:[]})};
globalThis.window={addEventListener:()=>{}};
```

Y siempre `node --check <fichero>.js` después de editar.

---

## Constantes que están medidas: no las toques a ojo

| Dónde | Constante | Valor | Por qué ese |
|---|---|---|---|
| `cifrado.js` | `JUNTOS` | 0.15 s | Barrido sobre las 6 canciones: con 0.15 quedan 58 acordes escritos tarde (mediana 0.08 s); con 0.35 son 110 (mediana 0.18 s) y el lado temprano no mejora |
| `cifrado.js` | `HUECO` | 5.0 s | Más allá, el acorde es instrumental de verdad y no se arrima a ningún verso |
| `cifrado.js` | `LEJOS` | 1.5 s | Más lejos de cualquier palabra, el acorde no es de nadie |
| `procesar.py` | `SILENCIO` | 0.05 | Las alucinaciones de Whisper se quedan todas en ≤0.006 del nivel medio de la voz; la línea cantada más floja está en 0.194. Margen de 18× |
| `analisis.py` | `RANGO_PULSO` | 60–145 BPM | Elige el nivel métrico del tempograma |

---

## Trampas conocidas (todas costaron sangre)

**`librosa.util.sync` necesita `pad=False`.** Con el `pad=True` por defecto
cada acorde cae un pulso tarde. Es el bug más caro que ha tenido esto.

**El pulso se saca de batería+bajo, el cromagrama de bajo+guitarra+piano+resto.**
Dos entradas distintas a propósito. No las unifiques.

**Nunca detectes "el usuario está desplazando" con el evento `scroll`.** Lo
dispara el propio desplazamiento automático y se bloquea solo a la primera.
Se escuchan `wheel`, `touchstart` y `pointerdown`. Está así en `app.js` y en
`cifrado.js`.

**`offsetTop` se mide contra el primer ancestro posicionado**, no contra el
contenedor que hace scroll. `Cifrado.centrar()` resta rectángulos reales. Y
**no le pongas `position` a `.cif-hoja`**: un elemento posicionado se pinta
en una capa posterior y la hoja tapaba la barra de transporte, dejando el
botón de pausa sin poder pulsarse.

**La sincronía del audio se corrige con `playbackRate`, no con `currentTime`.**
Saltar provoca rebuffer y se oyen cortes. Tolerancia 8 ms, corrección de
±1 %, y solo por encima de 50 ms se salta.

**Las pistas silenciadas se quedan en volumen 0.0008**, no en 0. A cero
algunos navegadores dejan de decodificarlas y al reactivarlas van
desincronizadas.

**Whisper necesita `condition_on_previous_text=False`** o entra en bucle
repitiendo la última frase. Y la voz se prepara con `dynaudnorm` **antes**
de `loudnorm`: nivela tramo a tramo, que es lo que rescató 30 s de canto
flojo en "Hasta el final" (24 → 41 líneas).

**Los mp3 se cachean para siempre, el JSON nunca.** El audio no cambia; los
acordes sí, porque se editan en el panel. Con `no-store` en todo, cambiar de
canción volvía a bajar 32 MB cada vez.

---

## Piezas y qué hace cada una

### Análisis (Python)

- `procesar.py` — orquesta todo. Demucs `htdemucs_6s` en CUDA → 6 pistas a
  **96 kbps** → acordes → batería → piano → letra. `quitar_fantasmas()` tira
  las líneas que caen donde la pista de voz está callada.
- `analisis.py` — cromagrama, pulso, tonalidad (Krumhansl-Schmuckler),
  Viterbi con prior diatónico, agrupación en compases.
- `bateria.py` — bombo, caja y platillo por bandas, con vetos espectrales
  relativos a las medianas de cada canción (los umbrales fijos no
  transfieren entre canciones: medido, 0.308 s vs 0.168 s de caída).
- `piano_notas.py` — transcripción a MIDI (ByteDance). Si el piano domina
  (>0.55) transcribe el audio original en vez del stem.
- `tono.py` — sube o baja el audio con `rubberband`, que cambia el tono
  **sin tocar la duración** (medido: deriva 0.000 s en las seis pistas). Por
  eso el transporte no obliga a resincronizar nada y el `cancion.json` se
  queda igual. El caché va a `%LOCALAPPDATA%`, **fuera de OneDrive**: son
  17 MB por tono y por canción, y se rehace en 13 s. `nombre_carpeta()` es
  el **único** sitio donde se decide cómo se llama la carpeta de un tono;
  el navegador no la construye, se la da `/api/tono` en `base`.
- `servidor.py` — HTTP 8300 + HTTPS 8443, `ThreadingTCPServer`, HTTP/1.1
  con keep-alive, rangos, escritura protegida por cabecera `X-Clave`.
  Endpoint `/api/acordes`: solo las secuencias de acordes de toda la
  biblioteca, 27 KB en vez de 870 KB. `/api/tono` lanza el renderizado en
  un hilo y contesta al momento: trece segundos colgado y el navegador da
  la petición por muerta.

### Interfaz (JS, ES modules, sin dependencias)

- `app.js` — el atril. Cuatro modos, consola de 6 pistas, transporte,
  editor de acordes. **Cada carga de canción lleva un token**
  (`this.cargaToken`): si vuelves de un `await` y ya no eres la última
  carga, abandonas. Sin eso, cambiar de canción mientras otra cargaba
  dejaba la pantalla en la anterior.
- `transportar.js` — sube o baja los NOMBRES (acordes, tonalidad, notas del
  rollo). Cambia los objetos en su sitio y por saltos relativos, así que no
  hace falta guardar una copia intacta: son las doce clases de nota, y restar
  lo mismo que se sumó devuelve exactamente lo que había (probado: 29
  canciones × 12 saltos, 2594 acordes, 0 fallos). **La regla de oro: si el
  audio no se pudo transportar, los nombres NO se mueven** — tocarías Fa
  mientras suena Mi y mirando la pantalla no habría cómo notarlo.
- `cifrado.js` — la hoja de letra con acordes encima. Ver abajo.
- `practicar.js` — entrenador de acordes en tres pasos.
- `piano.js` — teclado guía. **Siempre estado fundamental, sin
  inversiones**: antes buscaba la inversión más cercana (suena mejor) pero
  este teclado está para ENSEÑAR el acorde que no te sabes, y a uno
  invertido no se le encuentra la tónica de un vistazo. Verificado en las
  108 combinaciones (12 tónicas × 9 tipos) en las dos anchuras.
- `guitarra.js` — diagramas por formas móviles de Mi y La, con tabla de
  acordes abiertos que va primero.
- `sonido.js` — muestras del Salamander Grand Piano (dominio público).
- `metodo.js`, `curriculo.js`, `lecciones*.js` — el método de 66 días y las
  14 lecciones. **Usan su propio teclado**, no el `Piano` del atril: la
  lección de inversiones las enseña a propósito.

---

## La hoja de cifrado (`cifrado.js`) — la regla que más importa

**Nunca un acorde flotando sin texto debajo.** Jorge lo pidió así y tiene
razón: un acorde solo en una fila no dice cuándo entra. Cada acorde busca
dueño:

1. Si suena mientras se canta → encima de esa sílaba.
2. Si cae en un hueco → se arrima al verso más cercano: a la izquierda si el
   hueco es antes, a la derecha pasada la última palabra si es después.
3. Si no hay ningún verso a menos de `HUECO` → forma un tramo instrumental
   **con su rótulo debajo**: `(intro)`, `(instrumental)`, `(final)`.

La sílaba se elige por **la que se está cantando cuando entra el acorde**, no
por la más cercana. Coger la más cercana hacía que a veces fuera la de
después, y entonces al leer la hoja tocas el cambio tarde.

Es monoespaciada a propósito: la alineación depende de que cada carácter
mida lo mismo. `columnas()` mide el ancho real y `partir()` corta entre
palabras conservando las columnas de los acordes.

Comprobación obligatoria tras cualquier cambio (6 canciones × 7 anchos ×
sencilla/completa × Do-Re-Mi/C-D-E = 168 hojas): **0 acordes sin letra
debajo, 0 filas desbordadas, 0 fallos**.

---

## Estado actual

Hecho y verificado en esta tanda:

- Acordes del piano siempre en fundamental (108/108)
- Pulsos 1-2-3-4 también en Teclado, numerados y grandes
- Barra y numerito de cuánto dura el acorde (`— 1 compás`, `— ½ compás`)
- Cabecera plegable (tecla H), modos solo con icono, Synthesia dibujado en SVG
- Hoja de cifrado con Sencillo/Completo y botón de cerrar
- Entrenador de acordes: inventario → aprender → cambios, por canción o
  por toda la biblioteca. Lo que sabe se guarda global, no por canción
- Audio a la mitad (236 → 118 MB), cacheado, HTTP/1.1, servido a trozos
- 9 alucinaciones de Whisper fuera de toda la biblioteca

Seis canciones procesadas. La última: "Así Te Adoraré" (Via Cantus / Ana
Bolívar), Mi mayor, 92.3 BPM.

### Lo que queda

- **Auditar el contenido de las lecciones 2 a 11.** La auditoría hecha fue
  estructural (colores, progresiones), no una lectura línea a línea
  buscando contradicciones. En la lección 1 había una: la rejilla tocaba
  las dos manos en el pulso 1 mientras la comparación de al lado llamaba a
  eso "así no". Busca ese tipo de cosa.
- En `PENDIENTES.md` de la raíz: método de guitarra v2, método de batería
  v2 (Yamaha DD-75), corrección por MIDI dentro de la app.

### Cómo trabaja Jorge

Va probando en el celular y manda audios con lo que encuentra. Pide
explícitamente que **nada se quede a medias**: si llega algo nuevo mientras
trabajas, se pone en cola y se termina lo que estabas haciendo primero. Y
que se le diga lo que se midió, no solo lo que se hizo.
