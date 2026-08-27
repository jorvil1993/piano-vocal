// Lecciones 12-14: tres progresiones para acompañar la oración.
//
// El material sale de estudiar el video «3 Progresiones Fáciles para
// Ministrar en el Piano», de José Realpe (Clases de Piano Fácil). Las
// progresiones y la técnica son suyas; el desglose en pasos, las
// demostraciones y la puesta en método son nuestras.
//
// REGLA DE COHERENCIA: dentro de una lección, TODAS las demostraciones
// tocan exactamente lo mismo. Si la rejilla de compases dice que la
// izquierda entra sola en el pulso 1, la comparación y la secuencia hacen
// eso mismo. Una lección que se contradice a sí misma no enseña: confunde.

export const MINISTRAR = [

// ══════════════════════════════════════════════════════ LECCIÓN 12
{
  n: 12, titulo: 'Ministrar en Do: el bajo que sube', via: 'D',
  aprendes: 'Tu primera progresión para acompañar oración: el bajo sube ' +
    'paso a paso mientras la mano derecha casi no se mueve',
  porque: 'Aquí se junta todo lo anterior en algo que ya puedes usar. ' +
    'Cuatro compases que se sostienen solos bajo una prédica o un momento ' +
    'de oración. El truco es que la derecha se queda casi quieta y el bajo ' +
    'camina por notas seguidas: Do, Re, Mi, Fa.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'La progresión entera, en bucle',
      texto: 'Cuatro compases, un acorde por compás. Las dos manos entran ' +
        'juntas en el pulso 1 y sostienen: aquí no se marca el pulso, se ' +
        'sostiene el ambiente. Ponlo en Muy lento y déjalo dar vueltas.',
      acorde: 'Do  ·  Fasus2/Re  ·  Do/Mi  ·  Fa',
      acordes: ['Do', 'Fasus2/Re', 'Do/Mi', 'Fa'],
      compases: 4, pulsosPorCompas: 4, bpm: 60, sostenido: true,
      lineas: [
        {mano: 'DER', rotulo: 'casi no se mueve', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[64, 67, 72], [65, 67, 72], [64, 67, 72], [65, 69, 72]]},
        {mano: 'IZQ', rotulo: 'Do → Re → Mi → Fa', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[36], [38], [40], [41]]},
      ],
    },
    {
      tipo: 'secuencia',
      titulo: 'Los mismos cuatro compases, con su nombre',
      texto: 'Idéntico a la rejilla de arriba, pero ahora con el acorde real ' +
        'de cada compás. Fíjate cuántas notas de la derecha se repiten: casi ' +
        'todas.',
      eventos: [
        {t: 0.0, notas: [36, 64, 67, 72], duracion: 2.2, etiqueta: 'Do · bajo Do'},
        {t: 2.2, notas: [38, 65, 67, 72], duracion: 2.2, etiqueta: 'Fasus2 · bajo Re'},
        {t: 4.4, notas: [40, 64, 67, 72], duracion: 2.2, etiqueta: 'Do · bajo Mi'},
        {t: 6.6, notas: [41, 65, 69, 72], duracion: 2.2, etiqueta: 'Fa · bajo Fa'},
        {t: 8.8, notas: [36, 64, 67, 72], duracion: 3, etiqueta: 'y vuelve a Do'},
      ],
    },
    {
      tipo: 'pasos-teclado',
      titulo: 'Las cuatro posiciones, una por una',
      texto: 'Recórrelas con las flechas. El Sol y el Do de arriba no se ' +
        'mueven en ningún compás: son el ancla de toda la progresión.',
      pasos: [
        {rotulo: '1 · Do con bajo Do', notas: [36, 64, 67, 72],
         nota: 'Do en primera inversión: Mi, Sol, Do. Abierto, no apretado.',
         marcas: [{midi: 36, clase: 'raiz', rotulo: 'Do'},
                  {midi: 64, clase: 'acorde', rotulo: 'Mi'},
                  {midi: 67, clase: 'acorde', rotulo: 'Sol'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '2 · Fasus2 con bajo Re', notas: [38, 65, 67, 72],
         nota: 'Solo se movió UN dedo: el Mi subió al Fa. El bajo bajó al Re.',
         marcas: [{midi: 38, clase: 'raiz', rotulo: 'Re'},
                  {midi: 65, clase: 'acorde', rotulo: 'Fa'},
                  {midi: 67, clase: 'acorde', rotulo: 'Sol'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '3 · Do con bajo Mi', notas: [40, 64, 67, 72],
         nota: 'La derecha vuelve a la posición 1. El bajo sigue subiendo.',
         marcas: [{midi: 40, clase: 'raiz', rotulo: 'Mi'},
                  {midi: 64, clase: 'acorde', rotulo: 'Mi'},
                  {midi: 67, clase: 'acorde', rotulo: 'Sol'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '4 · Fa', notas: [41, 65, 69, 72],
         nota: 'Fa completo. El bajo llegó tras cuatro pasos seguidos.',
         marcas: [{midi: 41, clase: 'raiz', rotulo: 'Fa'},
                  {midi: 65, clase: 'acorde', rotulo: 'Fa'},
                  {midi: 69, clase: 'acorde', rotulo: 'La'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Por qué el bajo caminando lo cambia todo',
      texto: 'Los mismos acordes, tocados igual de sostenidos. Lo único que ' +
        'cambia es la nota que pone la izquierda.',
      mal: {
        rotulo: 'Bajo saltando',
        nota: 'Do, Fa, Do, Fa. Correcto, pero da tumbos y no avanza.',
        eventos: [
          {t: 0.0, notas: [36, 64, 67, 72], duracion: 1.6},
          {t: 1.6, notas: [41, 65, 67, 72], duracion: 1.6},
          {t: 3.2, notas: [36, 64, 67, 72], duracion: 1.6},
          {t: 4.8, notas: [41, 65, 69, 72], duracion: 2},
        ],
      },
      bien: {
        rotulo: 'Bajo subiendo',
        nota: 'Do, Re, Mi, Fa. Cuatro notas seguidas: la progresión camina sola.',
        eventos: [
          {t: 0.0, notas: [36, 64, 67, 72], duracion: 1.6},
          {t: 1.6, notas: [38, 65, 67, 72], duracion: 1.6},
          {t: 3.2, notas: [40, 64, 67, 72], duracion: 1.6},
          {t: 4.8, notas: [41, 65, 69, 72], duracion: 2},
        ],
      },
    },
  ],

  pasos: [
    'Mano derecha: Mi, Sol, Do. Colócala y NO la muevas todavía.',
    'Izquierda en el Do grave. Toca las dos a la vez y sostén. Ese es el ' +
      'compás 1 entero: un solo golpe que dura cuatro pulsos.',
    'Compás 2: izquierda al Re y en la derecha solo el Mi sube al Fa. ' +
      'Un dedo, nada más.',
    'Compás 3: izquierda al Mi, la derecha vuelve a la posición del compás 1.',
    'Compás 4: izquierda al Fa, derecha hace Fa–La–Do.',
    'Vuelve al principio y déjalo dar vueltas, muy suave, sin prisa.',
  ],

  vigilar: 'La tentación es mover toda la mano derecha en cada compás. No ' +
    'hace falta: entre el compás 1 y el 2 solo se mueve un dedo. Si tu mano ' +
    'salta entera, estás trabajando de más y sonando peor.',

  practica: {
    cancion: 'miEterno', modo: 'teclado', tempo: 0.7,
    texto: 'Mi Eterno Destino está en Do mayor, el mismo tono. Pon la ' +
      'canción muy suave y toca esta progresión por debajo, sin seguir sus ' +
      'acordes: solo dando vueltas. Así se ministra.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 13
{
  n: 13, titulo: 'La misma idea en otro tono', via: 'D',
  aprendes: 'Que un patrón aprendido en un tono se toca en cualquier otro, ' +
    'y que dentro del acorde hay una melodía escondida',
  porque: 'Esto hace que aprender un patrón valga por doce. Si piensas en ' +
    'grados en vez de en nombres, la progresión de ayer sale igual en Sol, ' +
    'en Re o en Mi. Y de paso: la nota más aguda de cada acorde forma una ' +
    'melodía por sí sola.',

  demos: [
    {
      tipo: 'comparacion',
      titulo: 'La misma progresión en dos tonos',
      texto: 'Los dos son correctos: no hay uno malo. Es la MISMA progresión ' +
        'movida de sitio, para que oigas que el movimiento no cambia.',
      mal: {
        rotulo: 'En Do (la de ayer)',
        nota: 'Bajo Do, Re, Mi, Fa. La que ya sabes.',
        eventos: [
          {t: 0.0, notas: [36, 64, 67, 72], duracion: 1.5},
          {t: 1.5, notas: [38, 65, 67, 72], duracion: 1.5},
          {t: 3.0, notas: [40, 64, 67, 72], duracion: 1.5},
          {t: 4.5, notas: [41, 65, 69, 72], duracion: 2},
        ],
      },
      bien: {
        rotulo: 'En Sol (idéntica)',
        nota: 'Bajo Sol, La, Si, Do. Mismo movimiento, siete semitonos arriba.',
        eventos: [
          {t: 0.0, notas: [43, 62, 67, 71], duracion: 1.5},
          {t: 1.5, notas: [45, 62, 67, 72], duracion: 1.5},
          {t: 3.0, notas: [47, 62, 67, 71], duracion: 1.5},
          {t: 4.5, notas: [48, 64, 67, 72], duracion: 2},
        ],
      },
      sinVeredicto: true,
    },
    {
      tipo: 'compases',
      titulo: 'En Sol, con segunda inversión',
      texto: 'Aquí la derecha usa la segunda inversión: Re, Sol, Si. Queda ' +
        'más cerrada y más dulce. El bajo sube Sol, La, Si, Do.',
      acorde: 'Sol  ·  Dosus2/La  ·  Sol/Si  ·  Do',
      acordes: ['Sol', 'Dosus2/La', 'Sol/Si', 'Do'],
      compases: 4, pulsosPorCompas: 4, bpm: 60, sostenido: true,
      lineas: [
        {mano: 'DER', rotulo: 'Re Sol Si · 2ª inversión', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[62, 67, 71], [62, 67, 72], [62, 67, 71], [64, 67, 72]]},
        {mano: 'IZQ', rotulo: 'Sol → La → Si → Do', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[43], [45], [47], [48]]},
      ],
    },
    {
      tipo: 'secuencia',
      titulo: 'La melodía escondida dentro del acorde',
      texto: 'Primero suena sola la nota más aguda de cada acorde: eso es ' +
        'una melodía. Después la misma melodía dentro de la armonía. Si la ' +
        'tocas un poco más fuerte que el resto, el acorde canta.',
      eventos: [
        {t: 0.0, notas: [71], etiqueta: 'Si'},
        {t: 0.9, notas: [72], etiqueta: 'Do'},
        {t: 1.8, notas: [71], etiqueta: 'Si'},
        {t: 2.7, notas: [72], etiqueta: 'Do'},
        {t: 4.2, notas: [43, 62, 67, 71], duracion: 1.5, etiqueta: 'ahora dentro'},
        {t: 5.7, notas: [45, 62, 67, 72], duracion: 1.5, etiqueta: 'del acorde'},
        {t: 7.2, notas: [47, 62, 67, 71], duracion: 1.5, etiqueta: '...'},
        {t: 8.7, notas: [48, 64, 67, 72], duracion: 2, etiqueta: 'y resuelve'},
      ],
    },
  ],

  pasos: [
    'Toca la progresión de ayer en Do, dos vueltas, hasta que salga sola.',
    'Cuenta lo que hacía el bajo: grados 1, 2, 3 y 4 de la escala.',
    'En Sol eso es Sol, La, Si, Do. Búscalos antes de tocar nada.',
    'Coloca la derecha en Re–Sol–Si, que es Sol en segunda inversión.',
    'Repite el mismo movimiento: entre el compás 1 y el 2 se mueve un dedo.',
    'Cuando salga, toca la nota más aguda un poco más fuerte y escucha la ' +
      'melodía aparecer.',
  ],

  vigilar: 'Si al cambiar de tono tienes que aprenderlo todo de cero, es que ' +
    'memorizaste teclas en vez de movimientos. Piensa «grado 1, grado 2», ' +
    'no «Do, Re».',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'Hasta el Final está en Re mayor. Lleva esta progresión a Re: el ' +
      'bajo tendría que subir Re, Mi, Fa#, Sol. Si te sale, ya la sabes en ' +
      'tres tonos.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 14
{
  n: 14, titulo: 'El patrón de La menor', via: 'D',
  aprendes: 'La progresión más tocada de la música de alabanza, y cómo ' +
    'sostenerla suave para acompañar oración',
  porque: 'Lam – Fa – Do – Sol. Casi todo pianista de alabanza la toca por ' +
    'inercia, y con razón: sirve para decenas de canciones y para rellenar ' +
    'cuando no hay nada escrito. En grados es vi–IV–I–V, así que ya la ' +
    'conoces: es la progresión de siempre empezando por otro sitio.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'Los cuatro acordes, en bucle',
      texto: 'Un acorde por compás, sostenido. Esto es lo que se toca bajo ' +
        'una oración: no va a ninguna parte, sostiene.',
      acorde: 'Lam  ·  Fa  ·  Do  ·  Sol',
      acordes: ['Lam', 'Fa', 'Do', 'Sol'],
      compases: 4, pulsosPorCompas: 4, bpm: 56, sostenido: true,
      lineas: [
        {mano: 'DER', rotulo: 'acorde, muy suave', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[64, 69, 72], [65, 69, 72], [64, 67, 72], [62, 67, 71]]},
        {mano: 'IZQ', rotulo: 'La → Fa → Do → Sol', pulsos: [1, 0, 0, 0],
         notasPorCompas: [[45], [41], [48], [43]]},
      ],
    },
    {
      tipo: 'pasos-teclado',
      titulo: 'Las cuatro posiciones con la mano casi quieta',
      texto: 'Las inversiones están elegidas para que la mano se mueva lo ' +
        'mínimo. Fíjate cuántas notas se repiten de una posición a la siguiente.',
      pasos: [
        {rotulo: '1 · La menor', notas: [45, 64, 69, 72],
         nota: 'Mi, La, Do. El acorde menor que pone el color.',
         marcas: [{midi: 45, clase: 'raiz', rotulo: 'La'},
                  {midi: 64, clase: 'acorde', rotulo: 'Mi'},
                  {midi: 69, clase: 'acorde', rotulo: 'La'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '2 · Fa', notas: [41, 65, 69, 72],
         nota: 'La y Do se quedan quietos. Solo el Mi sube al Fa.',
         marcas: [{midi: 41, clase: 'raiz', rotulo: 'Fa'},
                  {midi: 65, clase: 'acorde', rotulo: 'Fa'},
                  {midi: 69, clase: 'acorde', rotulo: 'La'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '3 · Do', notas: [48, 64, 67, 72],
         nota: 'El Do de arriba se queda. Bajan el Fa al Mi y el La al Sol.',
         marcas: [{midi: 48, clase: 'raiz', rotulo: 'Do'},
                  {midi: 64, clase: 'acorde', rotulo: 'Mi'},
                  {midi: 67, clase: 'acorde', rotulo: 'Sol'},
                  {midi: 72, clase: 'acorde', rotulo: 'Do'}]},
        {rotulo: '4 · Sol', notas: [43, 62, 67, 71],
         nota: 'El Sol se queda. Es el acorde que pide volver al principio.',
         marcas: [{midi: 43, clase: 'raiz', rotulo: 'Sol'},
                  {midi: 62, clase: 'acorde', rotulo: 'Re'},
                  {midi: 67, clase: 'acorde', rotulo: 'Sol'},
                  {midi: 71, clase: 'acorde', rotulo: 'Si'}]},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Marcar el pulso contra sostener',
      texto: 'Los mismos cuatro acordes. Lo único que cambia es el volumen y ' +
        'cuánto se sostiene cada uno.',
      mal: {
        rotulo: 'Marcando el pulso',
        nota: 'Sirve para una canción, pero encima de una oración tapa a ' +
          'quien está rezando.',
        eventos: [
          {t: 0.0, notas: [45, 64, 69, 72], volumen: 0.8, duracion: 0.5},
          {t: 0.6, notas: [64, 69, 72], volumen: 0.75, duracion: 0.5},
          {t: 1.2, notas: [41, 65, 69, 72], volumen: 0.8, duracion: 0.5},
          {t: 1.8, notas: [65, 69, 72], volumen: 0.75, duracion: 0.5},
          {t: 2.4, notas: [48, 64, 67, 72], volumen: 0.8, duracion: 0.5},
          {t: 3.0, notas: [64, 67, 72], volumen: 0.75, duracion: 0.5},
        ],
      },
      bien: {
        rotulo: 'Sosteniendo',
        nota: 'Un acorde por compás, largo y suave. Deja sitio para que ' +
          'alguien hable o rece encima.',
        eventos: [
          {t: 0.0, notas: [45, 64, 69, 72], volumen: 0.35, duracion: 3},
          {t: 2.4, notas: [41, 65, 69, 72], volumen: 0.32, duracion: 3},
          {t: 4.8, notas: [48, 64, 67, 72], volumen: 0.3, duracion: 3},
          {t: 7.2, notas: [43, 62, 67, 71], volumen: 0.28, duracion: 3.5},
        ],
      },
    },
  ],

  pasos: [
    'Coloca la derecha en Mi–La–Do y la izquierda en el La grave.',
    'Toca las dos y sostén todo el compás. Suave.',
    'Compás 2: izquierda al Fa. En la derecha, solo el Mi sube al Fa.',
    'Compás 3: izquierda al Do. La derecha baja a Mi–Sol–Do.',
    'Compás 4: izquierda al Sol. Derecha en Re–Sol–Si.',
    'Vuelve al La menor y repite, sin prisa, un acorde por compás.',
  ],

  vigilar: 'Acompañar oración no es tocar una canción: es sostener un ' +
    'ambiente. Si te descubres marcando el pulso o subiendo el volumen, ' +
    'para y vuelve a lo suave.',

  practica: {
    cancion: 'trisagion', modo: 'teclado', tempo: 0.7,
    texto: 'Da vueltas a la progresión sin canción de fondo, tres minutos ' +
      'seguidos, muy suave. Reza mientras tocas: ese es el ejercicio de ' +
      'verdad, y es para lo que empezaste todo esto.',
  },
},

];
