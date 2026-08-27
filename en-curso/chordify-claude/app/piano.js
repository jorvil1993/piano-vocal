// Teclado guia: ilumina las notas del acorde activo.
const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};
const NEGRAS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

export class Piano {
  constructor(contenedor, {octavaInicial = 3, octavas = 3} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.octavaInicial = octavaInicial;
    this.octavas = octavas;
    // Rango REAL que se dibuja. El voicing lo tenía escrito a mano (36-71)
    // y al reducir a 2 octavas en el móvil colocaba el acorde fuera de la
    // pantalla: solo se veía el bajo.
    this.grave = 12 * octavaInicial;
    this.agudo = 12 * (octavaInicial + octavas) - 1;
    this.notacion = 'latino';
    this.teclas = [];
    this.dibujar();
  }

  dibujar() {
    this.cont.innerHTML = '';
    this.teclas = [];
    const teclado = document.createElement('div');
    teclado.className = 'teclado';

    // Las blancas definen el ancho; las negras se posicionan encima
    const blancas = [];
    for (let o = 0; o < this.octavas; o++) {
      for (const c of CLASES) {
        if (!NEGRAS.has(c)) blancas.push({clase: c, octava: this.octavaInicial + o});
      }
    }
    const anchoBlanca = 100 / blancas.length;

    blancas.forEach((b, i) => {
      const t = document.createElement('div');
      t.className = 'tecla blanca';
      t.style.left = (i * anchoBlanca) + '%';
      t.style.width = anchoBlanca + '%';
      t.dataset.clase = b.clase;
      const et = document.createElement('span');
      et.className = 'tecla-nombre';
      t.appendChild(et);
      teclado.appendChild(t);
      this.teclas.push({el: t, clase: b.clase, octava: b.octava, etiqueta: et});
    });

    // Negra entre dos blancas: se corre media tecla a la izquierda
    let indice = 0;
    for (let o = 0; o < this.octavas; o++) {
      for (const c of CLASES) {
        if (NEGRAS.has(c)) {
          const t = document.createElement('div');
          t.className = 'tecla negra';
          t.style.left = (indice * anchoBlanca - anchoBlanca * 0.3) + '%';
          t.style.width = (anchoBlanca * 0.6) + '%';
          t.dataset.clase = c;
          const et = document.createElement('span');
          et.className = 'tecla-nombre negra';
          t.appendChild(et);
          teclado.appendChild(t);
          // Sin la octava, la altura de la tecla da NaN y la negra
          // jamas coincide con el acorde: no se encendia ninguna.
          this.teclas.push({el: t, clase: c,
                            octava: this.octavaInicial + o, etiqueta: et});
        } else {
          indice++;
        }
      }
    }

    this.cont.appendChild(teclado);
  }

  // SIEMPRE en estado fundamental: la tonica abajo y el acorde apilado
  // encima, sin inversiones. Antes buscaba la inversion mas cercana al
  // acorde previo (mueve menos los dedos y suena mejor), pero este teclado
  // no esta para sonar: esta para ENSEÑAR el acorde que no te sabes, y a
  // un acorde invertido no se le encuentra la tonica de un vistazo. Las
  // inversiones se aprenden aparte, en la leccion que toca.
  voicing(notas) {
    if (!notas || !notas.length) return {mano: new Set(), bajo: null};
    const clases = notas.map((n) => CLASES.indexOf(n));

    // Apila desde la tonica hacia arriba, cada nota por encima de la previa
    const apilar = (octava) => {
      const alturas = [];
      let previo = -1;
      for (const pc of clases) {
        let a = pc + 12 * octava;
        while (a <= previo) a += 12;
        alturas.push(a);
        previo = a;
      }
      return alturas;
    };

    // La segunda octava dibujada es la de la mano derecha; la primera queda
    // para el bajo. Un acorde alto (un si con septima) no cabe ahi entero,
    // asi que se busca la octava que si lo admita completo.
    const referencia = this.grave + 12;
    const ultima = this.octavaInicial + this.octavas - 1;
    const caben = [];
    for (let o = this.octavaInicial; o <= ultima; o++) {
      const a = apilar(o);
      if (a[0] >= this.grave && a[a.length - 1] <= this.agudo) caben.push(a);
    }
    // La mas grave que arranque ya sobre la octava del bajo: asi el acorde
    // cae siempre en la misma zona del teclado (se reconoce de memoria) y
    // no se confunde con la nota de la mano izquierda.
    let mejor = caben.find((a) => a[0] >= referencia);
    // Si ninguna llega tan arriba (teclado de dos octavas en el movil),
    // la que quede mas cerca de esa zona.
    if (!mejor && caben.length) {
      mejor = caben.reduce((x, y) =>
        Math.abs(y[0] - referencia) < Math.abs(x[0] - referencia) ? y : x);
    }
    // Si ni asi cabe (acorde muy abierto en un teclado corto), se muestra
    // desde la octava de la mano derecha aunque algo se salga de la vista:
    // vale mas la tonica en su sitio que un acorde recolocado.
    if (!mejor) mejor = apilar(this.octavaInicial + 1);

    return {mano: new Set(mejor), bajo: clases[0] + 12 * this.octavaInicial};
  }

  iluminar(notas) {
    const {mano, bajo} = this.voicing(notas);
    const raiz = notas && notas.length ? notas[0] : null;

    for (const t of this.teclas) {
      const altura = CLASES.indexOf(t.clase) + 12 * t.octava;
      const enMano = mano.has(altura);
      const enBajo = altura === bajo;
      const on = enMano || enBajo;

      t.el.classList.toggle('activa', enMano && t.clase !== raiz);
      t.el.classList.toggle('raiz', on && t.clase === raiz);
      t.el.classList.toggle('bajo', enBajo && !enMano);

      if (t.etiqueta) {
        t.etiqueta.textContent = on
          ? (this.notacion === 'latino' ? LATIN[t.clase] : t.clase) : '';
      }
    }
  }

  apagar() { this.iluminar([]); }
}
