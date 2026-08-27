// Piano de muestras reales.
//
// Las dos versiones anteriores eran síntesis —osciladores imitando cuerdas—
// y sonaban a juguete. La razón es de fondo: un piano tiene dos o tres
// cuerdas por nota, ligeramente desafinadas entre sí, resonancia de tabla
// armónica, cuerdas vecinas que vibran por simpatía y ruido de macillo y de
// apagador. Nada de eso se imita con ocho senoidales.
//
// Así que aquí no se imita: se reproduce un piano de verdad. Las muestras
// son del Salamander Grand Piano (un Yamaha C5 multimuestreado, dominio
// público desde 2022), una cada tres semitonos. Las notas intermedias se
// obtienen cambiando la velocidad de reproducción, que como mucho supone
// un semitono de desplazamiento: inaudible como artificio.
//
// Si las muestras no cargan, queda un sintetizador de respaldo para que la
// aplicación nunca se quede muda.

const RUTA = 'muestras/';

// Nombre del archivo -> nota MIDI
const MUESTRAS = {
  C1: 24, Ds1: 27, Fs1: 30, A1: 33,
  C2: 36, Ds2: 39, Fs2: 42, A2: 45,
  C3: 48, Ds3: 51, Fs3: 54, A3: 57,
  C4: 60, Ds4: 63, Fs4: 66, A4: 69,
  C5: 72, Ds5: 75, Fs5: 78, A5: 81,
  C6: 84, Ds6: 87,
};

let ctx = null;
let maestro = null;
const buffers = new Map();      // midi de la muestra -> AudioBuffer
let cargando = null;
let hayMuestras = false;

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ctx.createGain();
    maestro.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3.5;
    maestro.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Se cargan al primer toque, no al abrir la página: son 1.8 MB y no tiene
// sentido gastarlos si el usuario solo viene a leer.
export function despertar() {
  audio();
  if (!cargando) cargando = cargarMuestras();
  return cargando;
}

async function cargarMuestras() {
  const a = audio();
  const tareas = Object.entries(MUESTRAS).map(async ([nombre, midi]) => {
    try {
      const r = await fetch(RUTA + nombre + '.mp3');
      if (!r.ok) throw new Error(r.status);
      buffers.set(midi, await a.decodeAudioData(await r.arrayBuffer()));
    } catch (e) {
      // una muestra suelta que falle no rompe el resto
    }
  });
  await Promise.all(tareas);
  hayMuestras = buffers.size > 0;
  if (!hayMuestras) {
    console.warn('no se cargaron las muestras: se usa el sintetizador');
  }
  return hayMuestras;
}

export function listo() { return hayMuestras; }

function muestraMasCercana(midi) {
  let mejor = null, dist = Infinity;
  for (const m of buffers.keys()) {
    const d = Math.abs(m - midi);
    if (d < dist) { dist = d; mejor = m; }
  }
  return mejor;
}

// Cuánto dura naturalmente una nota según su altura: grave larga, aguda corta
function duracionNatural(midi) {
  return Math.max(0.7, 10.0 * Math.pow(0.5, (midi - 21) / 22));
}

export function tocarNota(midi, {duracion = null, volumen = 0.6} = {}) {
  const a = audio();
  if (!cargando) despertar();

  if (!hayMuestras) return sintetizar(midi, duracion, volumen);

  const base = muestraMasCercana(midi);
  if (base === null) return sintetizar(midi, duracion, volumen);

  const fuente = a.createBufferSource();
  fuente.buffer = buffers.get(base);
  // Semitonos de diferencia con la muestra: como mucho uno y medio
  fuente.playbackRate.value = Math.pow(2, (midi - base) / 12);

  const g = a.createGain();
  const t0 = a.currentTime;
  const largo = duracion || duracionNatural(midi);

  g.gain.setValueAtTime(volumen, t0);
  // El apagador cae al soltar: no es un corte seco
  g.gain.setValueAtTime(volumen, t0 + Math.max(0.05, largo - 0.35));
  g.gain.exponentialRampToValueAtTime(0.0005, t0 + largo);

  fuente.connect(g);
  g.connect(maestro);
  fuente.start(t0);
  fuente.stop(t0 + largo + 0.1);
  return fuente;
}

// ------------------------------------------------------- respaldo

// Solo se usa si las muestras no cargaron. Suena a síntesis, y está bien:
// es preferible a que la aplicación se quede muda.
function sintetizar(midi, duracion, volumen) {
  const a = audio();
  const t0 = a.currentTime;
  const f0 = 440 * Math.pow(2, (midi - 69) / 12);
  const largo = duracion || duracionNatural(midi);
  const salida = a.createGain();
  salida.gain.value = volumen * 0.4;
  salida.connect(maestro);

  const parciales = [[1, 1], [2, 0.45], [3, 0.25], [4, 0.15], [5, 0.09],
                     [6, 0.06], [7, 0.04], [8, 0.025]];
  for (const [n, amp] of parciales) {
    const f = f0 * n * Math.sqrt(1 + 0.0004 * n * n);
    if (f > 16000) continue;
    const osc = a.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = a.createGain();
    const dur = largo * Math.pow(0.8, n);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.08, dur));
    osc.connect(g); g.connect(salida);
    osc.start(t0); osc.stop(t0 + largo + 0.05);
  }
  return null;
}

// --------------------------------------------------------- conjuntos

export function tocarAcorde(midis, opciones = {}) {
  // Un pianista no baja las teclas exactamente a la vez
  const desfase = opciones.desfase ?? 9;
  midis.forEach((m, i) => setTimeout(() => tocarNota(m, opciones), i * desfase));
}

export function arpegiar(midis, paso = 0.18, opciones = {}) {
  midis.forEach((m, i) => setTimeout(
    () => tocarNota(m, opciones), i * paso * 1000));
}

// eventos: [{t, notas, duracion, volumen}] con t en segundos
export function reproducir(eventos, alSonar = null) {
  despertar();
  const temporizadores = [];
  for (const e of eventos) {
    temporizadores.push(setTimeout(() => {
      tocarAcorde(e.notas, {volumen: e.volumen ?? 0.6,
                            duracion: e.duracion ?? null});
      if (alSonar) alSonar(e);
    }, e.t * 1000));
  }
  return () => temporizadores.forEach(clearTimeout);
}
