// Piezas visuales e interactivas de las lecciones.
//
// Todo suena: un teclado que no suena es un dibujo, y de un dibujo no se
// aprende a oír. El sintetizador es deliberadamente simple —tres osciladores
// con envolvente— porque el objetivo es reconocer intervalos y funciones, no
// imitar un Steinway. El piano de verdad lo tiene él al lado.

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};
const NEGRA = [false, true, false, true, false, false, true, false, true,
  false, true, false];

export function nombreDe(clase, latino = true) {
  return latino ? LATIN[clase] : clase;
}

// El sonido lo pone sonido.js: un piano de verdad, no ondas triangulares.
export { tocarNota as sonar, tocarAcorde as sonarAcorde, arpegiar,
         reproducir, despertar } from './sonido.js';
import { tocarNota, tocarAcorde } from './sonido.js';

// ------------------------------------------------- teclado interactivo

export class Teclado {
  constructor(contenedor, {desde = 48, hasta = 84, alSonar = null} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.desde = desde;
    this.hasta = hasta;
    this.alSonar = alSonar;
    this.latino = true;
    this.marcadas = new Map();     // midi -> clase css
    this.dibujar();
  }

  dibujar() {
    this.cont.innerHTML = '';
    const caja = document.createElement('div');
    caja.className = 'tk';

    const blancas = [];
    for (let m = this.desde; m <= this.hasta; m++) {
      if (!NEGRA[m % 12]) blancas.push(m);
    }
    const ancho = 100 / blancas.length;
    this.teclas = new Map();

    blancas.forEach((m, i) => {
      const t = this.crear(m, i * ancho, ancho, false);
      caja.appendChild(t);
    });
    let idx = 0;
    for (let m = this.desde; m <= this.hasta; m++) {
      if (NEGRA[m % 12]) {
        const t = this.crear(m, idx * ancho - ancho * 0.3, ancho * 0.6, true);
        caja.appendChild(t);
      } else {
        idx++;
      }
    }
    this.cont.appendChild(caja);
  }

  crear(midi, izq, ancho, negra) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tk-tecla ' + (negra ? 'tk-negra' : 'tk-blanca');
    t.style.left = izq + '%';
    t.style.width = ancho + '%';
    t.dataset.midi = midi;
    const et = document.createElement('span');
    et.className = 'tk-nombre';
    t.appendChild(et);

    const tocar = (ev) => {
      ev.preventDefault();
      tocarNota(midi);
      t.classList.add('tk-pulsada');
      setTimeout(() => t.classList.remove('tk-pulsada'), 180);
      if (this.alSonar) this.alSonar(midi);
    };
    t.addEventListener('pointerdown', tocar);

    this.teclas.set(midi, {el: t, etiqueta: et, negra});
    return t;
  }

  // marcas: [{midi, clase, rotulo}]
  marcar(marcas) {
    for (const {el, etiqueta} of this.teclas.values()) {
      el.classList.remove('tk-raiz', 'tk-acorde', 'tk-bajo', 'tk-guia');
      etiqueta.textContent = '';
    }
    for (const m of (marcas || [])) {
      const t = this.teclas.get(m.midi);
      if (!t) continue;
      t.el.classList.add('tk-' + (m.clase || 'acorde'));
      t.etiqueta.textContent = m.rotulo !== undefined
        ? m.rotulo : nombreDe(CLASES[m.midi % 12], this.latino);
    }
  }

  limpiar() { this.marcar([]); }
}

// ------------------------------------------------ círculo de quintas

// El orden del círculo: cada paso a la derecha sube una quinta justa.
export const CIRCULO = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#',
                        'D#', 'A#', 'F'];

export class CirculoQuintas {
  constructor(contenedor, {alElegir = null, latino = true} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.alElegir = alElegir;
    this.latino = latino;
    this.tonica = 'C';
    this.dibujar();
  }

  // El IV es el vecino de la izquierda y el V el de la derecha: eso es lo
  // que el círculo enseña de un vistazo y ninguna tabla explica igual.
  familia(tonica = this.tonica) {
    const i = CIRCULO.indexOf(tonica);
    const iv = CIRCULO[(i + 11) % 12];
    const v = CIRCULO[(i + 1) % 12];
    const vi = CLASES[(CLASES.indexOf(tonica) + 9) % 12];
    const ii = CLASES[(CLASES.indexOf(tonica) + 2) % 12];
    const iii = CLASES[(CLASES.indexOf(tonica) + 4) % 12];
    return {i: tonica, ii, iii, iv, v, vi};
  }

  dibujar() {
    const R = 100, r = 66, cx = 118, cy = 118;
    const svg = ['<svg viewBox="0 0 236 236" class="cq">'];
    svg.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + 12) +
             '" class="cq-fondo" />');

    this.nodos = [];
    CIRCULO.forEach((nota, i) => {
      const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
      const menor = CLASES[(CLASES.indexOf(nota) + 9) % 12];
      const xm = cx + Math.cos(ang) * r, ym = cy + Math.sin(ang) * r;
      this.nodos.push({nota, x, y, menor, xm, ym});
    });

    for (const n of this.nodos) {
      svg.push('<g class="cq-nodo" data-nota="' + n.nota + '">');
      svg.push('<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) +
               '" r="19" class="cq-mayor" />');
      svg.push('<text x="' + n.x.toFixed(1) + '" y="' + (n.y + 4).toFixed(1) +
               '" class="cq-txt">' + nombreDe(n.nota, this.latino) + '</text>');
      svg.push('</g>');
      svg.push('<g class="cq-nodo-m" data-nota="' + n.nota + '">');
      svg.push('<circle cx="' + n.xm.toFixed(1) + '" cy="' + n.ym.toFixed(1) +
               '" r="13" class="cq-menor" />');
      svg.push('<text x="' + n.xm.toFixed(1) + '" y="' + (n.ym + 3.5).toFixed(1) +
               '" class="cq-txt-m">' + nombreDe(n.menor, this.latino) + 'm</text>');
      svg.push('</g>');
    }
    svg.push('</svg>');

    this.cont.innerHTML = svg.join('');
    this.cont.querySelectorAll('.cq-nodo').forEach((g) => {
      g.addEventListener('pointerdown', () => this.elegir(g.dataset.nota));
    });
    this.pintar();
  }

  elegir(nota) {
    this.tonica = nota;
    this.pintar();
    const f = this.familia();
    const base = 48 + CLASES.indexOf(nota);
    tocarAcorde([base, base + 4, base + 7]);
    if (this.alElegir) this.alElegir(f);
  }

  pintar() {
    const f = this.familia();
    this.cont.querySelectorAll('.cq-nodo').forEach((g) => {
      const n = g.dataset.nota;
      g.classList.toggle('es-i', n === f.i);
      g.classList.toggle('es-iv', n === f.iv);
      g.classList.toggle('es-v', n === f.v);
    });
    this.cont.querySelectorAll('.cq-nodo-m').forEach((g) => {
      const menor = CLASES[(CLASES.indexOf(g.dataset.nota) + 9) % 12];
      g.classList.toggle('es-vi', menor === f.vi);
    });
  }
}

// --------------------------------------------------------- utilidades

export function notasDeAcorde(raiz, tipo = '', octava = 4) {
  const iv = {'': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10],
    m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7],
    sus2: [0, 2, 7], dim: [0, 3, 6], aug: [0, 4, 8]}[tipo] || [0, 4, 7];
  const base = 12 * (octava + 1) + CLASES.indexOf(raiz);
  return iv.map((x) => base + x);
}
