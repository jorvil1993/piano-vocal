// Subir o bajar el tono de una canción.
//
// Dos cosas tienen que moverse a la vez o esto no sirve de nada: el NOMBRE
// de los acordes y el AUDIO. Transportar solo los nombres te haría tocar Fa
// mientras suena Mi, que es peor que no tener la herramienta. Del audio se
// encarga el servidor (tono.py, con rubberband); aquí se mueven los nombres,
// la tonalidad y las notas del rollo de piano.
//
// Nada de esto se guarda en el cancion.json: el tono es cómo te sientas a
// tocar hoy, no un dato de la canción. Al guardar, app.js devuelve los
// acordes a su sitio restando lo mismo que sumó.
//
// Todo se escribe con sostenidos porque el resto de la aplicación no conoce
// otra cosa: bajar Sol un semitono da Fa#, no Solb.

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};
const DE_LATIN = {};
for (const k of Object.keys(LATIN)) DE_LATIN[LATIN[k]] = k;

// Más de seis semitonos no tiene sentido pedirlos: a +7 estás más cerca
// bajando 5. Mismo límite que en tono.py.
export const LIMITE = 6;

// Aquí NO se calcula de qué carpeta bajar el audio transportado: esa
// ruta la devuelve el servidor en /api/tono, y el nombre lo decide
// tono.py. Estuvo aquí un rato como segunda copia de la regla y es
// justo el tipo de cosa que se desincroniza en silencio: cambias el
// nombre en Python y el navegador se queda pidiendo carpetas que ya
// no existen, sin un error que lo diga.

// '+2', '−1', '0'. El menos es el signo de verdad (U+2212), que a este
// tamaño se distingue del guion.
export function nombreTono(semis) {
  semis = semis | 0;
  if (!semis) return '0';
  return semis > 0 ? '+' + semis : '−' + Math.abs(semis);
}

function moverAnglo(nota, semis) {
  const i = CLASES.indexOf(nota);
  return i < 0 ? nota : CLASES[(i + (semis % 12) + 12) % 12];
}

function moverLatino(nota, semis) {
  const a = DE_LATIN[nota];
  return a === undefined ? nota : LATIN[moverAnglo(a, semis)];
}

// Un acorde, en su sitio. Se cambia el objeto que ya existe en vez de
// devolver uno nuevo porque app.js guarda referencias a estos acordes (el
// que suena ahora, el que estás corrigiendo) y crear copias las dejaría
// apuntando a acordes viejos.
export function transportarAcorde(a, semis) {
  semis = semis | 0;
  if (!semis || !a || !a.anglo || !a.etiqueta || a.etiqueta === 'N') return a;
  const partes = a.etiqueta.split(':');
  const viejaRaiz = partes[0];
  const nuevaRaiz = moverAnglo(viejaRaiz, semis);
  if (nuevaRaiz === viejaRaiz) return a;

  // El sufijo se recorta del nombre en vez de reconstruirlo desde la
  // calidad: así sobrevive cualquier adorno que el motor sepa escribir y
  // esta función no, sin tener que mantener aquí una segunda lista.
  const restoAnglo = a.anglo.slice(viejaRaiz.length);
  const viejaLat = LATIN[viejaRaiz] || viejaRaiz;
  const restoLat = (a.latino || '').slice(viejaLat.length);

  partes[0] = nuevaRaiz;
  a.etiqueta = partes.join(':');
  a.anglo = nuevaRaiz + restoAnglo;
  a.latino = (LATIN[nuevaRaiz] || nuevaRaiz) + restoLat;
  if (a.notas) a.notas = a.notas.map((n) => moverAnglo(n, semis));
  if (a.notas_latinas) a.notas_latinas = a.notas_latinas.map((n) => moverLatino(n, semis));
  // El bajo de un acorde con barra (Sol/Fa#) viaja con el acorde
  if (a.bajo) a.bajo = moverAnglo(a.bajo, semis);
  if (a.bajo_latino) a.bajo_latino = moverLatino(a.bajo_latino, semis);
  return a;
}

export function transportarTonalidad(ton, semis) {
  semis = semis | 0;
  if (!semis || !ton || !ton.raiz) return ton;
  ton.raiz = moverAnglo(ton.raiz, semis);
  ton.nombre = (LATIN[ton.raiz] || ton.raiz) + ' ' + (ton.modo || '');
  return ton;
}

// Las notas del rollo de piano. Los nombres se rehacen desde el número
// MIDI y no se tocan a mano: es el mismo número el que manda en el dibujo.
export function transportarNotasPiano(notas, semis) {
  semis = semis | 0;
  if (!semis || !notas) return notas;
  for (const n of notas) {
    if (typeof n.midi !== 'number') continue;
    n.midi += semis;
    const clase = CLASES[((n.midi % 12) + 12) % 12];
    const octava = Math.floor(n.midi / 12) - 1;
    n.nombre = clase + octava;
    n.latino = (LATIN[clase] || clase) + octava;
  }
  return notas;
}

// Mueve la canción entera. `semis` es el SALTO desde donde está ahora, no
// el tono absoluto: así app.js no necesita guardar una copia intacta, y
// como el transporte es aritmética exacta de doce clases, +2 y luego −2
// devuelve exactamente lo que había.
export function transportarCancion(c, semis) {
  semis = semis | 0;
  if (!semis || !c) return c;
  for (const a of c.acordes || []) transportarAcorde(a, semis);
  transportarTonalidad(c.tonalidad, semis);
  transportarNotasPiano(c.piano_notas, semis);
  return c;
}
