// Diagramas de guitarra en afinacion estandar (Mi La Re Sol Si Mi).
//
// En vez de guardar 132 acordes a mano, se usan las dos formas moviles de
// siempre: la del Mi (fundamental en la 6a cuerda) y la del La (en la 5a).
// Se corren por el mastil segun la fundamental y se elige la que caiga en
// el traste mas bajo. En el traste 0 dan justamente los acordes abiertos.

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Cuerdas de la 6a (grave) a la 1a. null = cuerda al aire no, silenciada.
const FORMA_MI = {
  '':     [0, 2, 2, 1, 0, 0],
  'm':    [0, 2, 2, 0, 0, 0],
  '7':    [0, 2, 0, 1, 0, 0],
  'm7':   [0, 2, 0, 0, 0, 0],
  'maj7': [0, 2, 1, 1, 0, 0],
  'sus4': [0, 2, 2, 2, 0, 0],
  'sus2': [0, 2, 4, 4, null, null],
  '6':    [0, 2, 2, 1, 2, 0],
  'm6':   [0, 2, 2, 0, 2, 0],
  'dim':  [0, 1, 2, 0, null, null],
  'aug':  [0, 3, 2, 1, 1, 0],
};

const FORMA_LA = {
  '':     [null, 0, 2, 2, 2, 0],
  'm':    [null, 0, 2, 2, 1, 0],
  '7':    [null, 0, 2, 0, 2, 0],
  'm7':   [null, 0, 2, 0, 1, 0],
  'maj7': [null, 0, 2, 1, 2, 0],
  'sus4': [null, 0, 2, 2, 3, 0],
  'sus2': [null, 0, 2, 2, 0, 0],
  '6':    [null, 0, 2, 2, 2, 2],
  'm6':   [null, 0, 2, 2, 1, 2],
  'dim':  [null, 0, 1, 2, 1, null],
  'aug':  [null, 0, 3, 2, 2, 1],
};

// Pitch class de cada cuerda al aire, de la 6a a la 1a
const AIRE = [4, 9, 2, 7, 11, 4];

// Acordes abiertos de primera posicion. Van PRIMERO: son los que se tocan
// de verdad. Sin esta tabla, un Remaj7 salia como cejilla en el traste 5
// cuando todo el mundo lo hace al aire, y la mano saltaba por el mastil a
// mitad de cancion.
const ABIERTOS = {
  'C':     [null, 3, 2, 0, 1, 0],
  'C7':    [null, 3, 2, 3, 1, 0],
  'Cmaj7': [null, 3, 2, 0, 0, 0],
  'Csus2': [null, 3, 0, 0, 1, 3],

  'D':     [null, null, 0, 2, 3, 2],
  'Dm':    [null, null, 0, 2, 3, 1],
  'D7':    [null, null, 0, 2, 1, 2],
  'Dmaj7': [null, null, 0, 2, 2, 2],
  'Dm7':   [null, null, 0, 2, 1, 1],
  'Dsus4': [null, null, 0, 2, 3, 3],
  'Dsus2': [null, null, 0, 2, 3, 0],
  'D6':    [null, null, 0, 2, 0, 2],

  'E':     [0, 2, 2, 1, 0, 0],
  'Em':    [0, 2, 2, 0, 0, 0],
  'E7':    [0, 2, 0, 1, 0, 0],
  'Em7':   [0, 2, 0, 0, 0, 0],
  'Emaj7': [0, 2, 1, 1, 0, 0],
  'Esus4': [0, 2, 2, 2, 0, 0],

  'Fmaj7': [null, null, 3, 2, 1, 0],
  'F6':    [null, null, 3, 2, 3, 1],

  'G':     [3, 2, 0, 0, 0, 3],
  'G7':    [3, 2, 0, 0, 0, 1],
  'Gmaj7': [3, 2, 0, 0, 0, 2],
  'G6':    [3, 2, 0, 0, 0, 0],
  'Gsus4': [3, 3, 0, 0, 1, 3],

  'A':     [null, 0, 2, 2, 2, 0],
  'Am':    [null, 0, 2, 2, 1, 0],
  'A7':    [null, 0, 2, 0, 2, 0],
  'Am7':   [null, 0, 2, 0, 1, 0],
  'Amaj7': [null, 0, 2, 1, 2, 0],
  'Asus4': [null, 0, 2, 2, 3, 0],
  'Asus2': [null, 0, 2, 2, 0, 0],
  'Am6':   [null, 0, 2, 2, 1, 2],

  'B7':    [null, 2, 1, 2, 0, 2],
  'Bm7':   [null, 2, 0, 2, 0, 2],
};

export function figura(anglo) {
  if (!anglo) return null;
  const m = anglo.match(/^([A-G]#?)(.*)$/);
  if (!m) return null;
  const raiz = CLASES.indexOf(m[1]);
  const tipo = m[2];
  if (raiz < 0) return null;

  // Primero, el acorde abierto de toda la vida si existe
  const abierto = ABIERTOS[anglo];
  if (abierto) {
    const tocadas = abierto.filter((f) => f !== null && f > 0);
    return {
      trastes: abierto.slice(),
      base: tocadas.length ? Math.min(...tocadas) : 0,
      cejilla: false,
      cuerdaRaiz: 6 - abierto.findIndex((f) => f !== null),
      nombre: anglo,
    };
  }

  const opciones = [];
  const mi = FORMA_MI[tipo];
  const la = FORMA_LA[tipo];
  if (mi) opciones.push({base: ((raiz - AIRE[0]) % 12 + 12) % 12, forma: mi, cuerdaRaiz: 6});
  if (la) opciones.push({base: ((raiz - AIRE[1]) % 12 + 12) % 12, forma: la, cuerdaRaiz: 5});
  if (!opciones.length) return null;

  // La que quede mas abajo en el mastil es la mas comoda
  opciones.sort((a, b) => a.base - b.base);
  const elegida = opciones[0];

  const trastes = elegida.forma.map(
    (f) => (f === null ? null : f + elegida.base));
  return {
    trastes,
    base: elegida.base,
    cejilla: elegida.base > 0,
    cuerdaRaiz: elegida.cuerdaRaiz,
    nombre: anglo,
  };
}

export function dibujar(contenedor, anglo, notacionLatina, trastes = 5) {
  const cont = typeof contenedor === 'string'
    ? document.getElementById(contenedor) : contenedor;
  cont.innerHTML = '';

  const fig = figura(anglo);
  if (!fig) {
    cont.innerHTML = '<div class="guitarra-vacia">—</div>';
    return;
  }

  // Ventana del mastil. Un acorde abierto se dibuja desde la cejuela;
  // uno con cejilla, desde el traste donde va el dedo.
  const pisados = fig.trastes.filter((f) => f !== null && f > 0);
  const desde = fig.cejilla && pisados.length ? Math.min(...pisados) : 1;

  // Geometria en unidades del SVG (se escala sola con el contenedor)
  const izq = 30, arriba = 22, anchoCuerda = 20, altoTraste = 26;
  const ancho = izq * 2 + anchoCuerda * 5;
  const alto = arriba + altoTraste * trastes + 10;

  const svg = ['<svg class="mastil" viewBox="0 0 ' + ancho + ' ' + alto +
               '" preserveAspectRatio="xMidYMid meet">'];
  const xDe = (cuerda) => izq + cuerda * anchoCuerda;     // 0 = 6a (grave)
  const yDe = (traste) => arriba + (traste - desde + 1) * altoTraste;

  // Cuerdas
  for (let c = 0; c < 6; c++) {
    svg.push('<line x1="' + xDe(c) + '" y1="' + arriba + '" x2="' + xDe(c) +
             '" y2="' + (arriba + altoTraste * trastes) +
             '" class="m-cuerda" />');
  }
  // Trastes
  for (let t = 0; t <= trastes; t++) {
    const y = arriba + t * altoTraste;
    svg.push('<line x1="' + izq + '" y1="' + y + '" x2="' + xDe(5) +
             '" y2="' + y + '" class="m-traste" />');
  }
  // Cejuela gruesa solo en primera posicion
  if (desde === 1) {
    svg.push('<rect x="' + (izq - 1) + '" y="' + (arriba - 3) + '" width="' +
             (anchoCuerda * 5 + 2) + '" height="4" class="m-cejuela" />');
  }
  // El numero va SIEMPRE, tambien el 1: es la referencia para saber en que
  // parte del mastil poner la mano, y sin el hay que deducirlo.
  svg.push('<text x="' + (izq - 9) + '" y="' + (arriba + altoTraste * 0.82) +
           '" class="m-numero">' + desde + '</text>');

  // Cabeceras: ✕ cuerda muda, ○ cuerda al aire
  for (let c = 0; c < 6; c++) {
    const f = fig.trastes[c];
    if (f === null) {
      svg.push('<text x="' + xDe(c) + '" y="' + (arriba - 8) +
               '" class="m-marca muda">✕</text>');
    } else if (f === 0) {
      svg.push('<text x="' + xDe(c) + '" y="' + (arriba - 8) +
               '" class="m-marca aire">○</text>');
    }
  }

  // La cejilla, como barra: es un dedo cruzando, no puntos sueltos
  if (fig.cejilla) {
    const enBase = [];
    fig.trastes.forEach((f, c) => { if (f === fig.base) enBase.push(c); });
    if (enBase.length > 1) {
      const a = Math.min(...enBase), b = Math.max(...enBase);
      const y = yDe(fig.base) - altoTraste / 2;
      svg.push('<rect x="' + (xDe(a) - 7) + '" y="' + (y - 7) + '" width="' +
               (xDe(b) - xDe(a) + 14) + '" height="14" rx="7" class="m-cejilla" />');
    }
  }

  // Dedos
  fig.trastes.forEach((f, c) => {
    if (f === null || f === 0) return;
    if (fig.cejilla && f === fig.base) return;      // ya lo cubre la barra
    if (f < desde || f > desde + trastes - 1) return;
    const esRaiz = c === 6 - fig.cuerdaRaiz;
    svg.push('<circle cx="' + xDe(c) + '" cy="' + (yDe(f) - altoTraste / 2) +
             '" r="7" class="m-dedo' + (esRaiz ? ' raiz' : '') + '" />');
  });

  svg.push('</svg>');

  // El nombre del acorde va GRANDE y encima del mástil: es lo primero que
  // se mira y antes estaba en gris diminuto debajo del rótulo.
  const caja = document.createElement('div');
  caja.className = 'mastil-caja';
  caja.innerHTML =
    '<div class="mastil-nombre">' +
      (notacionLatina ? traducir(anglo) : anglo) +
    '</div>' +
    '<div class="mastil-pos">' +
      (fig.cejilla ? 'cejilla en el traste ' + fig.base : 'abierto') +
    '</div>' + svg.join('');
  cont.appendChild(caja);
}

const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};

function traducir(anglo) {
  const m = anglo.match(/^([A-G]#?)(.*)$/);
  return m ? LATIN[m[1]] + m[2] : anglo;
}
