// Hoja de cifrado: la letra con cada acorde encima de la silaba donde entra.
// Se puede porque la letra guarda el segundo de CADA palabra, no solo el de
// la linea: sin eso el acorde caeria aproximado y la hoja no serviria.

const LAT = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};

// Version sencilla: se cae todo lo que adorna y queda la triada. Un Dosus4
// se toca Do y suena bien; lo que estorba para acompanar es tener que parar
// a pensar que era un sus4. Lo que NO se toca es el disminuido: cambiarlo
// por mayor o menor seria ensenar un acorde equivocado.
const SIMPLE = {min: 'm', m7: 'm', m6: 'm', m9: 'm', dim: 'dim', 'm7b5': 'dim'};

// Hueco entre lineas a partir del cual se ve como parrafo aparte
const PARRAFO = 2.6;
// Un acorde que arranca justo antes de la linea es el de su primera palabra
const ANTES = 0.35;
// Mas lejos que esto de cualquier palabra, el acorde no es de nadie
const LEJOS = 1.5;
// Si la silaba siguiente entra dentro de este margen del cambio de acorde,
// es el mismo momento y el acorde va encima de ella. Medido sobre las seis
// canciones: con 0.15 solo 58 acordes quedan escritos tarde (mediana 0.08 s)
// frente a 110 con 0.35 (mediana 0.18 s), y el lado temprano no empeora.
const JUNTOS = 0.15;
// Un acorde en un hueco mas corto que esto antes de la linea se dibuja en
// la MISMA fila de acordes, a la izquierda. Solo un hueco mas largo es un
// instrumental de verdad y se lleva su propia fila.
const HUECO = 5.0;

// Que notas tiene cada tipo de acorde, en semitonos desde la fundamental.
// Se calcula aqui en vez de fiarse de las notas que guardo el detector:
// al simplificar un Dosus4 a Do las notas cambian, y tienen que cambiar.
export const INTERVALOS = {
  maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
  maj7: [0, 4, 7, 11], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10],
  sus4: [0, 5, 7], sus2: [0, 2, 7], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9],
  m9: [0, 3, 7, 10, 14], 'm7b5': [0, 3, 6, 10], 9: [0, 4, 7, 10, 14],
};

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// -------- estas tres las comparten la hoja y el entrenador de acordes.
// Una sola definicion: si el criterio de "sencillo" cambia, cambia en los dos.

export function claveAcorde(a, simple) {
  const p = (a.etiqueta || '').split(':');
  if (!simple) return a.etiqueta || '';
  const cal = p[1] || 'maj';
  return p[0] + '|' + (SIMPLE[cal] !== undefined ? SIMPLE[cal] : '');
}

// La calidad que queda tras simplificar: 'maj', 'min' o 'dim'
export function calidadSimple(cal) {
  const suf = SIMPLE[cal] !== undefined ? SIMPLE[cal] : '';
  return suf === 'm' ? 'min' : (suf === 'dim' ? 'dim' : 'maj');
}

export function nombreAcorde(a, {simple = true, notacion = 'latino',
                                 tapado = false} = {}) {
  if (!a || !a.anglo) return null;                 // 'N' = sin acorde
  if (tapado) return '?';
  if (!simple) return notacion === 'latino' ? a.latino : a.anglo;
  const p = (a.etiqueta || '').split(':');
  const raiz = p[0], cal = p[1] || 'maj';
  const suf = SIMPLE[cal] !== undefined ? SIMPLE[cal] : '';
  return (notacion === 'latino' ? (LAT[raiz] || raiz) : raiz) + suf;
}

// El nombre en cifrado anglosajon, que es lo que entiende la guitarra
export function angloAcorde(a, simple) {
  if (!a || !a.anglo) return null;
  if (!simple) return a.anglo;
  const p = (a.etiqueta || '').split(':');
  const suf = SIMPLE[p[1] || 'maj'] !== undefined ? SIMPLE[p[1] || 'maj'] : '';
  return p[0] + suf;
}

// Las notas que hay que tocar, ya simplificadas si toca
export function notasAcorde(a, simple, notacion = 'latino') {
  if (!a || !a.anglo) return [];
  const p = (a.etiqueta || '').split(':');
  const raiz = CLASES.indexOf(p[0]);
  if (raiz < 0) return [];
  const cal = simple ? calidadSimple(p[1] || 'maj') : (p[1] || 'maj');
  const iv = INTERVALOS[cal] || INTERVALOS.maj;
  return iv.map((n) => {
    const c = CLASES[(raiz + n) % 12];
    return notacion === 'latino' ? (LAT[c] || c) : c;
  });
}

// Las mismas notas en numeros MIDI, en estado fundamental desde el Do central
export function midisAcorde(a, simple) {
  if (!a || !a.anglo) return [];
  const p = (a.etiqueta || '').split(':');
  const raiz = CLASES.indexOf(p[0]);
  if (raiz < 0) return [];
  const cal = simple ? calidadSimple(p[1] || 'maj') : (p[1] || 'maj');
  const iv = INTERVALOS[cal] || INTERVALOS.maj;
  const base = 48 + raiz;                    // octava del Do central hacia abajo
  return iv.map((n) => base + n);
}

export class Cifrado {
  constructor(contenedor, {alSaltar} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.alSaltar = alSaltar;
    this.simple = true;
    this.notacion = 'latino';
    this.tapado = false;
    this.cancion = null;
    this.filas = [];
    this.marcas = [];
    this.filaActiva = -1;
    this.acActivo = -1;
    this.usuarioMueve = false;

    // El autoscroll dispara 'scroll', asi que detectar al usuario con ese
    // evento hace que la hoja se bloquee sola a la primera. Ya paso una vez
    // con la cinta de acordes: se escucha la MANO, no el resultado.
    for (const ev of ['wheel', 'touchstart', 'pointerdown']) {
      this.cont.addEventListener(ev, () => {
        this.usuarioMueve = true;
        clearTimeout(this.reloj);
        this.reloj = setTimeout(() => { this.usuarioMueve = false; }, 3500);
      }, {passive: true});
    }

    let esperando;
    window.addEventListener('resize', () => {
      clearTimeout(esperando);
      esperando = setTimeout(() => this.construir(), 220);
    });
  }

  // ------------------------------------------------ nombres de acorde

  clave(a) { return claveAcorde(a, this.simple); }

  nombre(a) {
    return nombreAcorde(a, {simple: this.simple, notacion: this.notacion,
                            tapado: this.tapado});
  }

  // Acordes ya juntados: Do, Dosus4, Do seguidos son UN Do en la sencilla
  bloques() {
    const out = [];
    for (const a of (this.cancion.acordes || [])) {
      const n = this.nombre(a);
      if (!n) continue;
      const k = this.clave(a);
      const ult = out[out.length - 1];
      if (ult && ult.k === k && Math.abs(ult.fin - a.inicio) < 0.06) {
        ult.fin = a.fin;
        continue;
      }
      out.push({k, nombre: n, inicio: a.inicio, fin: a.fin});
    }
    return out;
  }

  // ------------------------------------------------ colocar en la letra

  // En que caracter del texto empieza cada palabra cronometrada
  posiciones(linea) {
    const txt = linea.texto || '';
    const res = [];
    let desde = 0;
    for (const p of (linea.palabras || [])) {
      const w = (p.w || '').trim();
      if (!w) continue;
      const i = txt.indexOf(w, desde);
      if (i < 0) continue;
      res.push({t: p.t, col: i});
      desde = i + w.length;
    }
    return res;
  }

  // La columna del acorde es la de la palabra que se canta en ese instante.
  // "antes" son los del hueco previo: van arrimados a la izquierda, delante
  // de la primera silaba. "despues" son los del hueco siguiente: van al
  // final, pasada la ultima palabra. Ninguno se queda flotando en una fila
  // sin letra, que no deja ver cuando entra.
  colocar(bloques, linea, antes = [], despues = []) {
    const pos = this.posiciones(linea);
    const largo = (linea.texto || '').length;
    const tope = Math.max(0, largo - 1);
    const marcas = bloques.map((b) => {
      let col = 0;
      if (pos.length) {
        // El acorde cambia en b.inicio. Coger la silaba MAS CERCANA hacia
        // que a veces fuera la de despues, y entonces al leer la hoja
        // tocas el cambio tarde. Se escribe sobre la silaba que se esta
        // cantando cuando entra el acorde; solo si la siguiente arranca
        // practicamente a la vez, va sobre esa.
        let previo = null, siguiente = null;
        for (const o of pos) {
          if (o.t <= b.inicio) previo = o;
          else { siguiente = o; break; }
        }
        let mejor = null;
        if (siguiente && siguiente.t - b.inicio <= JUNTOS) mejor = siguiente;
        else mejor = previo || siguiente;
        col = (!mejor || Math.abs(mejor.t - b.inicio) > LEJOS)
          ? 0 : Math.min(mejor.col, tope);
      }
      return {nombre: b.nombre, col, inicio: b.inicio, fin: b.fin};
    });
    marcas.sort((x, y) => x.col - y.col || x.inicio - y.inicio);

    const todas = [];
    let libre = 0;
    for (const b of antes) {
      todas.push({nombre: b.nombre, col: libre, inicio: b.inicio,
                  fin: b.fin, hueco: true});
      libre += b.nombre.length + 1;
    }
    // Dos acordes sobre la misma silaba se pisarian: se corre el segundo
    for (const m of marcas) {
      if (m.col < libre) m.col = libre;
      todas.push(m);
      libre = m.col + m.nombre.length + 1;
    }
    for (const b of despues) {
      const col = Math.max(libre, largo + 1);
      todas.push({nombre: b.nombre, col, inicio: b.inicio,
                  fin: b.fin, hueco: true});
      libre = col + b.nombre.length + 1;
    }
    return todas;
  }

  // Cuantos caracteres caben de ancho: se mide, no se adivina
  columnas() {
    const regla = document.createElement('span');
    regla.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    regla.textContent = '0'.repeat(80);
    this.cont.appendChild(regla);
    const ancho = regla.getBoundingClientRect().width / 80;
    regla.remove();
    const util = this.cont.clientWidth - 20;
    // Una columna de margen: el nombre del acorde de la ultima palabra
    // sobresale de la letra y sin este hueco se cortaba contra el borde.
    return (ancho > 0 && util > 0)
      ? Math.max(16, Math.floor(util / ancho) - 1) : 40;
  }

  // Parte una linea larga en trozos que quepan, cortando entre palabras
  partir(texto, marcas, cols) {
    const trozos = [];
    let ini = 0;
    do {
      let fin = Math.min(texto.length, ini + cols);
      if (fin < texto.length) {
        const corte = texto.lastIndexOf(' ', fin);
        if (corte > ini) fin = corte;
      }
      const desde = ini, hasta = fin;
      const ultimo = hasta >= texto.length;
      const suyas = marcas
        .filter((m) => m.col >= desde && (m.col < hasta || ultimo))
        .map((m) => ({...m, col: m.col - desde}));
      // El acorde de la ultima palabra sobresale por la derecha: se corre
      // hacia la izquierda lo justo, arrastrando al de atras si hace falta.
      for (let i = suyas.length - 1; i >= 0; i--) {
        const tope = cols - suyas[i].nombre.length;
        if (suyas[i].col > tope) suyas[i].col = Math.max(0, tope);
        if (i > 0) {
          const hueco = suyas[i].col - suyas[i - 1].nombre.length - 1;
          if (suyas[i - 1].col > hueco) suyas[i - 1].col = Math.max(0, hueco);
        }
      }
      trozos.push({texto: texto.slice(desde, hasta), marcas: suyas});
      ini = fin;
      while (texto[ini] === ' ') ini++;
    } while (ini < texto.length);
    return trozos;
  }

  // ------------------------------------------------------- construir

  construir() {
    if (!this.cont || !this.cancion) return;
    const cols = this.columnas();
    this.cont.innerHTML = '';
    this.filas = [];
    this.marcas = [];
    this.filaActiva = -1;
    this.acActivo = -1;

    const lineas = (this.cancion.letra || []).filter((l) => (l.texto || '').trim());
    const bl = this.bloques();

    if (!bl.length) {
      this.cont.innerHTML =
        '<p class="cif-vacio">Esta canción todavía no tiene acordes.</p>';
      return;
    }

    // Cada acorde busca dueno. Regla: NUNCA un acorde flotando en una fila
    // sin nada debajo, porque asi no se ve cuando entra. O cae sobre la
    // silaba que se canta, o se arrima al verso vecino mas cercano, o —si
    // no hay ninguno cerca— forma un bloque instrumental que lleva su
    // propio rotulo debajo.
    const duenos = lineas.map((ln) => ({ln, antes: [], dentro: [], despues: []}));
    const sueltos = new Map();
    const apartar = (b, j) => {
      if (!sueltos.has(j)) sueltos.set(j, []);
      sueltos.get(j).push(b);
    };

    let i = 0;
    for (const b of bl) {
      while (i < lineas.length && b.inicio >= lineas[i].fin) i++;
      if (i < lineas.length && b.inicio >= lineas[i].inicio - ANTES) {
        duenos[i].dentro.push(b);
        continue;
      }
      const prev = i > 0 ? duenos[i - 1] : null;
      const sig = i < lineas.length ? duenos[i] : null;
      const dPrev = prev ? b.inicio - prev.ln.fin : Infinity;
      const dSig = sig ? sig.ln.inicio - b.inicio : Infinity;
      if (Math.min(dPrev, dSig) > HUECO) apartar(b, i);
      else if (dPrev <= dSig) prev.despues.push(b);
      else sig.antes.push(b);
    }

    for (let j = 0; j <= lineas.length; j++) {
      if (j > 0 && j < lineas.length &&
          lineas[j].inicio - lineas[j - 1].fin > PARRAFO) this.hueco();
      if (sueltos.has(j)) {
        this.filaInstrumental(sueltos.get(j), cols,
          j === 0 ? '(intro)' : (j === lineas.length ? '(final)' : '(instrumental)'));
      }
      if (j === lineas.length) break;

      const d = duenos[j];
      const marcas = this.colocar(d.dentro, d.ln, d.antes, d.despues);
      const trozos = this.partir(d.ln.texto || '', marcas, cols);
      const pos = this.posiciones(d.ln);
      trozos.forEach((tr, n) => {
        const t0 = n === 0 ? d.ln.inicio
          : (tr.marcas[0] ? tr.marcas[0].inicio : (pos[0] ? pos[0].t : d.ln.inicio));
        this.filaLetra(tr, t0, d.ln.fin);
      });
    }

    this.filas.sort((a, b) => a.inicio - b.inicio);
    this.marcas.sort((a, b) => a.inicio - b.inicio);
  }

  hueco() {
    const d = document.createElement('div');
    d.className = 'cif-hueco';
    this.cont.appendChild(d);
  }

  // Tramo sin canto. Los acordes van encima de un rotulo —(intro),
  // (instrumental), (final)— en vez de solos: asi tampoco aqui hay una
  // fila de acordes sin nada debajo.
  filaInstrumental(bloques, cols, rotulo) {
    let linea = [], largo = 0;
    const soltar = () => {
      if (!linea.length) return;
      const fila = document.createElement('div');
      fila.className = 'cif-fila cif-solo';
      const fa = document.createElement('div');
      fa.className = 'cif-acordes';
      linea.forEach((b, n) => {
        if (n) fa.appendChild(document.createTextNode('   '));
        fa.appendChild(this.spanAcorde(b));
      });
      const fl = document.createElement('div');
      fl.className = 'cif-letra cif-rotulo';
      fl.textContent = rotulo;
      const primero = linea[0];
      fl.onclick = () => this.alSaltar && this.alSaltar(primero.inicio);
      fila.append(fa, fl);
      this.cont.appendChild(fila);
      this.filas.push({inicio: primero.inicio,
                       fin: linea[linea.length - 1].fin, el: fila});
      linea = []; largo = 0;
    };
    for (const b of bloques) {
      const n = b.nombre.length + 3;
      if (largo + n > cols) soltar();
      linea.push(b); largo += n;
    }
    soltar();
  }

  spanAcorde(m) {
    const s = document.createElement('span');
    s.className = 'cif-ac' + (m.antes ? ' antes' : '');
    s.textContent = m.nombre;
    s.onclick = () => this.alSaltar && this.alSaltar(m.inicio);
    this.marcas.push({inicio: m.inicio, fin: m.fin, el: s});
    return s;
  }

  filaLetra(trozo, inicio, fin) {
    const fila = document.createElement('div');
    fila.className = 'cif-fila';

    const fa = document.createElement('div');
    fa.className = 'cif-acordes';
    let col = 0;
    for (const m of trozo.marcas) {
      const hueco = Math.max(col ? 1 : 0, m.col - col);
      if (hueco) fa.appendChild(document.createTextNode(' '.repeat(hueco)));
      col += hueco;
      fa.appendChild(this.spanAcorde(m));
      col += m.nombre.length;
    }
    if (!trozo.marcas.length) fa.className += ' vacia';

    const fl = document.createElement('div');
    fl.className = 'cif-letra';
    fl.textContent = trozo.texto || ' ';
    fl.onclick = () => this.alSaltar && this.alSaltar(inicio);

    fila.append(fa, fl);
    this.cont.appendChild(fila);
    this.filas.push({inicio, fin, el: fila});
  }

  // --------------------------------------------------------- seguir

  seguir(t) {
    if (!this.filas.length) return;

    let fila = -1;
    for (let i = 0; i < this.filas.length; i++) {
      if (this.filas[i].inicio <= t) fila = i; else break;
    }
    if (fila >= 0 && t > this.filas[fila].fin + 1.2) fila = -1;

    if (fila !== this.filaActiva) {
      if (this.filas[this.filaActiva]) {
        this.filas[this.filaActiva].el.classList.remove('ahora');
      }
      if (fila >= 0) {
        this.filas[fila].el.classList.add('ahora');
        this.centrar(this.filas[fila].el);
      }
      this.filaActiva = fila;
    }

    let ac = -1;
    for (let i = 0; i < this.marcas.length; i++) {
      if (this.marcas[i].inicio <= t) ac = i; else break;
    }
    if (ac !== this.acActivo) {
      if (this.marcas[this.acActivo]) {
        this.marcas[this.acActivo].el.classList.remove('ahora');
      }
      if (ac >= 0) this.marcas[ac].el.classList.add('ahora');
      this.acActivo = ac;
    }
  }

  centrar(el) {
    if (this.usuarioMueve) return;
    const c = this.cont;
    // offsetTop se mide contra el primer ancestro POSICIONADO, no contra la
    // hoja. Como la hoja empieza a media pantalla, el destino salia sumado
    // a esa distancia y el cursor se iba muy por debajo del verso que toca.
    // Restando las dos posiciones reales sale bien este con la hoja donde
    // este.
    const dest = c.scrollTop + el.getBoundingClientRect().top
               - c.getBoundingClientRect().top - c.clientHeight * 0.38;
    c.scrollTo({top: Math.max(0, dest), behavior: 'smooth'});
  }
}
