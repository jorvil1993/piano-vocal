// Hoja de cifrado: la letra con cada acorde encima de la silaba o del espacio
// donde entra. La letra guarda el tiempo de CADA palabra, no solo el de la
// linea, y una correccion manual puede fijar ademas la columna visual exacta.

const LAT = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};

// Version sencilla: se cae todo lo que adorna y queda la triada. Un Dosus4
// se toca Do y suena bien; lo que estorba para acompanar es tener que parar
// a pensar que era un sus4. Lo que NO se toca es el disminuido: cambiarlo
// por mayor o menor seria ensenar un acorde equivocado.
const SIMPLE = {min: 'm', m7: 'm', m6: 'm', m9: 'm', dim: 'dim', 'm7b5': 'dim'};

// Hueco entre lineas a partir del cual se ve como parrafo aparte
const PARRAFO = 2.6;
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
  if (!simple) {
    const n = notacion === 'latino' ? a.latino : a.anglo;
    // La barra solo en la version completa: en la sencilla estorba, un
    // Sol/Fa# se toca Sol y suena bien.
    const b = notacion === 'latino' ? a.bajo_latino : a.bajo;
    return b ? n + '/' + b : n;
  }
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

// ------------------------------------------------ tiempo <-> columna
//
// La armonia tiene un segundo real y la hoja tiene una columna. No son la
// misma cosa: un acorde puede entrar dentro de una palabra o en el silencio
// que hay antes de la siguiente. Estas funciones conservan esa diferencia.

// En que caracteres del texto empieza y termina cada palabra cronometrada.
// Whisper da tambien el final (`f`) en canciones nuevas. Para las antiguas,
// se infiere repartiendo el intervalo hasta la palabra siguiente entre los
// caracteres visibles; asi siguen funcionando sin volver a transcribirlas.
export function posicionesDeLinea(linea) {
  const txt = linea.texto || '';
  const res = [];
  let desde = 0;
  for (const p of (linea.palabras || [])) {
    const w = (p.w || '').trim();
    const t = Number(p.t);
    if (!w || !Number.isFinite(t)) continue;
    const i = txt.indexOf(w, desde);
    if (i < 0) continue;
    const bruto = p.f !== undefined ? Number(p.f) : Number(p.fin);
    res.push({t, f: Number.isFinite(bruto) && bruto >= t ? bruto : null,
              col: i, finCol: i + w.length});
    desde = i + w.length;
  }
  return res;
}

function limiteLinea(linea, posiciones) {
  const ultimo = posiciones[posiciones.length - 1];
  const f = Number(linea.fin);
  return Number.isFinite(f) && (!ultimo || f >= ultimo.t)
    ? f : (ultimo ? (ultimo.f || ultimo.t + 0.6) : Number(linea.inicio) || 0);
}

function finPalabra(linea, posiciones, i) {
  const p = posiciones[i];
  const sig = posiciones[i + 1];
  if (p.f !== null) return sig ? Math.min(p.f, sig.t) : p.f;
  if (!sig) return limiteLinea(linea, posiciones);

  // Archivo antiguo sin final de palabra: se reserva para el espacio la
  // parte temporal que le corresponde como caracter. No es una adivinanza
  // brusca a la palabra anterior o siguiente y, sobre todo, nunca salta al
  // principio de la linea por superar un umbral arbitrario.
  const letras = Math.max(1, p.finCol - p.col);
  const visibles = Math.max(letras, sig.col - p.col);
  return p.t + (sig.t - p.t) * (letras / visibles);
}

function interpolar(t, t0, t1, c0, c1) {
  if (c1 <= c0 || t1 <= t0) return c0;
  const parte = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  return Math.round(c0 + parte * (c1 - c0));
}

// Columna automática donde debe imprimirse un cambio de acorde.
export function columnaDeTiempo(linea, tiempo) {
  const txt = linea.texto || '';
  const tope = Math.max(0, txt.length - 1);
  const pos = posicionesDeLinea(linea);
  if (!pos.length) {
    const ini = Number(linea.inicio) || 0;
    return interpolar(tiempo, ini, limiteLinea(linea, pos), 0, tope);
  }

  const primero = pos[0];
  if (tiempo < primero.t) {
    const ini = Number(linea.inicio);
    return Math.min(tope, interpolar(tiempo,
      Number.isFinite(ini) ? ini : primero.t, primero.t,
      0, Math.max(0, primero.col - 1)));
  }

  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const sig = pos[i + 1];
    const tf = finPalabra(linea, pos, i);
    if (tiempo <= tf || !sig) {
      return Math.min(tope, interpolar(tiempo, p.t, tf,
        p.col, Math.max(p.col, p.finCol - 1)));
    }
    if (tiempo < sig.t) {
      // Aqui esta la pausa real: se escribe sobre el espacio, no encima de
      // ninguna de las dos palabras.
      return Math.min(tope, interpolar(tiempo, tf, sig.t,
        p.finCol, Math.max(p.finCol, sig.col - 1)));
    }
  }
  return tope;
}

// Inversa usada al corregir con el dedo. Devuelve un segundo continuo para
// cualquier caracter, incluidos los espacios entre palabras.
export function tiempoDeColumna(linea, columna) {
  const txt = linea.texto || '';
  const tope = Math.max(0, txt.length - 1);
  const col = Math.max(0, Math.min(tope, Math.round(columna)));
  const pos = posicionesDeLinea(linea);
  const ini = Number(linea.inicio) || 0;
  const fin = limiteLinea(linea, pos);
  if (!pos.length) {
    return tope ? ini + (fin - ini) * col / tope : ini;
  }

  const primero = pos[0];
  if (col < primero.col) {
    const c1 = Math.max(1, primero.col);
    return ini + (primero.t - ini) * col / c1;
  }

  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const sig = pos[i + 1];
    const tf = finPalabra(linea, pos, i);
    if (col < p.finCol || !sig) {
      const c1 = Math.max(p.col + 1, p.finCol - 1);
      const parte = Math.max(0, Math.min(1, (col - p.col) / (c1 - p.col)));
      return p.t + (tf - p.t) * parte;
    }
    if (col < sig.col) {
      const huecos = Math.max(1, sig.col - p.finCol);
      const parte = Math.max(0, Math.min(1, (col - p.finCol + 0.5) / huecos));
      return tf + (sig.t - tf) * parte;
    }
  }
  return fin;
}

export class Cifrado {
  constructor(contenedor, {alSaltar, alMantener, marcado, alMover} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.alSaltar = alSaltar;
    // Mantener pulsado un acorde lo apunta en "los que no me se"
    this.alMantener = alMantener;
    this.marcado = marcado || (() => false);
    // Modo corregir: tocas un acorde y luego la silaba donde va
    this.alMover = alMover;
    this.editando = false;
    this.elegido = null;
    this.anchoLetra = 8;
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
      const dato = a.ancla_cifrado;
      const ancla = dato && Number.isFinite(Number(dato.linea)) &&
        Number.isFinite(Number(dato.columna))
        ? {linea: Number(dato.linea), columna: Math.round(Number(dato.columna))}
        : null;
      const ult = out[out.length - 1];
      // Si el usuario coloco expresamente este segundo acorde, no se puede
      // fundir con el anterior: desapareceria justo la correccion que hizo.
      if (ult && ult.k === k && !ancla &&
          Math.abs(ult.fin - a.inicio) < 0.06) {
        ult.fin = a.fin;
        continue;
      }
      out.push({k, nombre: n, anglo: angloAcorde(a, this.simple),
                inicio: a.inicio, fin: a.fin, ancla});
    }
    return out;
  }

  // ------------------------------------------------ colocar en la letra

  // En que caracter del texto empieza cada palabra cronometrada
  posiciones(linea) {
    return posicionesDeLinea(linea);
  }

  // La columna sale del instante exacto, incluidos los espacios. "antes"
  // son los del hueco previo: van a la izquierda, delante de la primera
  // silaba, con un margen visible reservado para ellos.
  colocar(bloques, linea, antes = [], prefijo = 0,
          inicioOriginal = linea.inicio) {
    const largo = (linea.texto || '').length;
    const tope = Math.max(0, largo - 1);
    const marcas = bloques.map((b) => {
      const fijada = b.ancla &&
        Math.abs(b.ancla.linea - Number(inicioOriginal)) < 0.02;
      // El ancla manda solo en la hoja. El segundo musical se conserva por
      // separado y sigue gobernando audio, seguimiento y color activo.
      const cruda = fijada
        ? prefijo + b.ancla.columna
        : columnaDeTiempo(linea, b.inicio);
      const col = Math.max(0, Math.min(tope, Math.round(cruda)));
      return {nombre: b.nombre, anglo: b.anglo, col,
              inicio: b.inicio, fin: b.fin};
    });
    marcas.sort((x, y) => x.col - y.col || x.inicio - y.inicio);

    const todas = [];
    let libre = 0;
    for (const b of antes) {
      todas.push({nombre: b.nombre, anglo: b.anglo, col: libre,
                  inicio: b.inicio, fin: b.fin, antes: true});
      libre += b.nombre.length + 1;
    }
    // Dos acordes sobre la misma silaba se pisarian: se corre el segundo
    for (const m of marcas) {
      if (m.col < libre) m.col = libre;
      todas.push(m);
      libre = m.col + m.nombre.length + 1;
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
    this.anchoLetra = ancho || 8;
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
      trozos.push({texto: texto.slice(desde, hasta), marcas: suyas,
                   desde, hasta});
      ini = fin;
      // Los espacios normales del corte no se repiten al comienzo del
      // siguiente renglon. Pero si un acorde esta fijado JUSTO en uno de
      // ellos, ese espacio tiene contenido musical: se conserva como la
      // primera columna del nuevo renglon para que la marca no desaparezca.
      while (texto[ini] === ' ' && !marcas.some((m) => m.col === ini)) ini++;
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
    this.elegido = null;
    this.filaActiva = -1;
    this.acActivo = -1;

    const lineas = (this.cancion.letra || []).filter((l) => (l.texto || '').trim());
    const bl = this.bloques();

    if (!bl.length) {
      this.cont.innerHTML =
        '<p class="cif-vacio">Esta canción todavía no tiene acordes.</p>';
      return;
    }

    // Cada acorde busca dueno. Regla: NUNCA queda al extremo de una frase
    // anterior. O cae en el caracter que corresponde por tiempo, o ocupa el
    // margen previo del verso siguiente, o —si no hay ninguno cerca— forma
    // un bloque instrumental que lleva su propio rotulo debajo.
    const duenos = lineas.map((ln) => ({ln, antes: [], dentro: []}));
    const sueltos = new Map();
    const apartar = (b, j) => {
      if (!sueltos.has(j)) sueltos.set(j, []);
      sueltos.get(j).push(b);
    };

    let i = 0;
    for (const b of bl) {
      // Una correccion visual elegida por la persona gana a la asignacion
      // automatica por tiempo. Si la letra fue retranscrita y ya no existe
      // esa linea (su inicio cambio), simplemente se vuelve al automatico.
      const fijada = b.ancla
        ? lineas.findIndex((ln) => Math.abs(ln.inicio - b.ancla.linea) < 0.02)
        : -1;
      if (fijada >= 0) {
        duenos[fijada].dentro.push(b);
        continue;
      }

      while (i < lineas.length && b.inicio >= lineas[i].fin) i++;
      if (i < lineas.length && b.inicio >= lineas[i].inicio) {
        const primera = this.posiciones(lineas[i])[0];
        // Puede haber aire entre el inicio del segmento de Whisper y la
        // primera palabra. Ese acorde va en un margen real, no sobre ella.
        (primera && b.inicio < primera.t ? duenos[i].antes : duenos[i].dentro)
          .push(b);
        continue;
      }
      const sig = i < lineas.length ? duenos[i] : null;
      const dSig = sig ? sig.ln.inicio - b.inicio : Infinity;
      // En una pausa corta se lee hacia delante: el acorde queda en el
      // espacio ANTES del verso que viene. Nunca se manda despues de toda
      // la frase anterior, que era el salto lejano de la captura.
      if (sig && (dSig <= HUECO || b.fin >= sig.ln.inicio)) sig.antes.push(b);
      else apartar(b, i);
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
      const anchoAntes = d.antes.reduce((n, b) => n + b.nombre.length + 1, 0);
      const anchoAnclas = d.dentro.reduce((n, b) => {
        if (!b.ancla || Math.abs(b.ancla.linea - d.ln.inicio) >= 0.02) return n;
        return Math.max(n, -b.ancla.columna);
      }, 0);
      const prefijo = Math.max(anchoAntes, anchoAnclas);
      const inicioVista = Math.min(d.ln.inicio,
        ...d.antes.map((b) => b.inicio),
        ...d.dentro.filter((b) => b.ancla && b.ancla.columna < 0)
          .map((b) => b.inicio));
      const lineaVista = {...d.ln, inicio: inicioVista,
        texto: ' '.repeat(prefijo) + (d.ln.texto || '')};
      const marcas = this.colocar(d.dentro, lineaVista, d.antes,
                                  prefijo, d.ln.inicio);
      const trozos = this.partir(lineaVista.texto, marcas, cols);
      const pos = this.posiciones(lineaVista);
      trozos.forEach((tr, n) => {
        const primeraTrozo = pos.find((o) =>
          o.col >= tr.desde && o.col < tr.hasta);
        const t0 = n === 0 ? inicioVista
          : (tr.marcas[0] ? tr.marcas[0].inicio
            : (primeraTrozo ? primeraTrozo.t : d.ln.inicio));
        // Se conserva el mapa completo, aunque la frase se haya partido en
        // pantalla. Asi un espacio al borde de un trozo sigue convirtiendose
        // al segundo correcto de la linea original.
        tr.mapaLinea = lineaVista;
        tr.lineaInicio = d.ln.inicio;
        tr.prefijo = prefijo;
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
    s.className = 'cif-ac' + (m.antes ? ' antes' : '') +
      (m.anglo && this.marcado(m.anglo) ? ' marcado' : '');
    s.textContent = m.nombre;
    s.dataset.anglo = m.anglo || '';
    s.onclick = () => {
      if (this.editando) {
        const marca = this.marcas.find((x) => x.el === s);
        this.elegir(this.elegido && this.elegido.el === s ? null : marca);
        return;
      }
      if (this.alSaltar) this.alSaltar(m.inicio);
    };
    if (this.alMantener) this.alMantener(s, m.anglo);
    this.marcas.push({inicio: m.inicio, fin: m.fin, el: s});
    return s;
  }

  // Repinta la senal de "no me lo se" sin reconstruir la hoja entera
  refrescarMarcas() {
    for (const {el} of this.marcas) {
      const a = el.dataset.anglo;
      el.classList.toggle('marcado', !!a && this.marcado(a));
    }
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
    fl.onclick = (e) => {
      if (!this.editando) {
        if (this.alSaltar) this.alSaltar(inicio);
        return;
      }
      const destino = this.momentoDeltoque(e, fl, trozo, inicio);
      if (destino && this.elegido && this.alMover) {
        this.alMover(this.elegido.inicio, destino.t, destino.ancla);
      }
    };

    fila.append(fa, fl);
    this.cont.appendChild(fila);
    this.filas.push({inicio, fin, el: fila});
  }

  // Donde tocaste, en segundos Y en columna. La primera mueve el momento
  // musical; la segunda se guarda como ancla visual. Sin el ancla, al
  // reconstruir la hoja un toque en un espacio volveria a saltar a una
  // palabra y la correccion pareceria perdida.
  momentoDeltoque(e, el, trozo, inicioLinea) {
    const caja = el.getBoundingClientRect();
    const x = (e.clientX !== undefined ? e.clientX : 0) - caja.left;
    const tope = Math.max(0, (trozo.texto || '').length - 1);
    const local = Math.max(0, Math.min(tope,
      Math.floor(x / this.anchoLetra)));
    const global = (trozo.desde || 0) + local;
    const mapa = trozo.mapaLinea || {
      inicio: inicioLinea, fin: inicioLinea, texto: trozo.texto || '',
      palabras: [],
    };
    return {
      t: tiempoDeColumna(mapa, global),
      ancla: {
        linea: Number.isFinite(Number(trozo.lineaInicio))
          ? Number(trozo.lineaInicio) : Number(inicioLinea),
        columna: global - (trozo.prefijo || 0),
      },
    };
  }

  // Agarrar un acorde para moverlo
  elegir(marca) {
    for (const m of this.marcas) m.el.classList.remove('elegido');
    this.elegido = marca;
    if (marca) marca.el.classList.add('elegido');
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
