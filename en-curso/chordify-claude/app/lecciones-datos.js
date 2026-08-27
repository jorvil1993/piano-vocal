// Contenido de las lecciones. Cada una es una unidad cerrada:
// por qué importa → demostraciones que se ven y se oyen → pasos numerados →
// qué practicar, en qué canción concreta → comprobación.
//
// Nada de "reproduce la canción" sin decir cuál. Todo ejemplo suena, y en
// los ejercicios de oído la respuesta correcta está guardada aquí, así que
// el sistema puede corregir de verdad.
//
// Referencia de alturas MIDI: Do central = 60. Las canciones son las que ya
// están procesadas en la biblioteca, con su tonalidad detectada del audio.

export const CANCIONES = {
  hastaElFinal: {
    slug: 'hasta-el-final-estacion-cero-video-oficial-musica-catolica',
    nombre: 'Hasta el Final', tonalidad: 'Re mayor', tonica: 'D', bpm: 69.8,
  },
  miEterno: {
    slug: 'mi-eterno-destino',
    nombre: 'Mi Eterno Destino', tonalidad: 'Do mayor', tonica: 'C', bpm: 80.8,
  },
  trisagion: {
    slug: 'trisagion-magnificat-video-oficial',
    nombre: 'TRISAGION - Magnificat', tonalidad: 'Re menor', tonica: 'D', bpm: 92.3,
  },
  aTiTeAlabo: {
    slug: 'a-ti-te-alabo-live-session',
    nombre: 'A Ti te alabo', tonalidad: 'Re# mayor', tonica: 'D#', bpm: 86.1,
  },
};

// Atajos de altura para no escribir números por todos lados
const DO = 60, RE = 62, MI = 64, FA = 65, SOL = 67, LA = 69, SI = 71;
const DO5 = 72, RE5 = 74, MI5 = 76, FA5 = 77, SOL5 = 79;
const DO3 = 48, RE3 = 50, MI3 = 52, FA3 = 53, SOL3 = 55, LA3 = 57, SI3 = 59;
const DO2 = 36, RE2 = 38, SOL2 = 43, LA2 = 45;

import { MINISTRAR } from './lecciones-ministrar.js';

const BASE = [

// ══════════════════════════════════════════════════════ LECCIÓN 1
{
  n: 1, titulo: 'Una mano sostiene, la otra se mueve', via: 'A',
  aprendes: 'Independencia de manos: que una sostenga mientras la otra se mueve',
  porque: 'Mientras las dos manos caigan a la vez no estás acompañando, ' +
    'estás apretando acordes. Todo el método depende de resolver esto ' +
    'primero, y se resuelve con el ejercicio más simple que existe.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'Dónde cae cada mano, compás a compás',
      texto: 'Esto es lo que la lección quiere que hagas. La izquierda toca ' +
        'UNA vez por compás y se queda sonando. La derecha toca los cuatro ' +
        'pulsos. Míralo en bucle hasta que se entienda, y fíjate en el pulso ' +
        '1 del segundo compás: ahí la izquierda vuelve a entrar.',
      acorde: 'Re mayor  ·  Re – La – Re',
      compases: 2, pulsosPorCompas: 4, bpm: 70,
      lineas: [
        {mano: 'DER', rotulo: 'acorde, los 4 pulsos',
         notas: [62, 69, 74], pulsos: [1, 1, 1, 1]},
        {mano: 'IZQ', rotulo: 'Re grave, solo el pulso 1',
         notas: [38], pulsos: [1, 0, 0, 0]},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Escucha la diferencia antes de tocar nada',
      texto: 'Son las mismas cuatro notas. Lo único que cambia es CUÁNDO ' +
        'entra cada mano. Dale a los dos botones seguidos.',
      mal: {
        rotulo: 'Las dos manos en cada pulso',
        nota: 'La izquierda vuelve a pulsar cada vez que lo hace la derecha. ' +
          'Cuatro golpes de bajo por compás: suena a bloque y las manos ' +
          'quedan pegadas.',
        eventos: [
          {t: 0.0, notas: [RE2, RE, LA, RE5], duracion: 0.8},
          {t: 0.85, notas: [RE2, RE, LA, RE5], duracion: 0.8},
          {t: 1.7, notas: [RE2, RE, LA, RE5], duracion: 0.8},
          {t: 2.55, notas: [RE2, RE, LA, RE5], duracion: 0.8},
        ],
      },
      bien: {
        rotulo: 'Izquierda una vez, derecha cuatro',
        nota: 'La izquierda toca UNA vez y sostiene todo el compás. La ' +
          'derecha marca los cuatro pulsos encima. Es exactamente la rejilla ' +
          'de arriba.',
        eventos: [
          {t: 0.0, notas: [RE2], duracion: 4},
          {t: 0.0, notas: [RE, LA, RE5], duracion: 0.8},
          {t: 0.85, notas: [RE, LA, RE5], duracion: 0.8},
          {t: 1.7, notas: [RE, LA, RE5], duracion: 0.8},
          {t: 2.55, notas: [RE, LA, RE5], duracion: 0.8},
        ],
      },
    },
    {
      tipo: 'teclado',
      titulo: 'Así se reparte',
      texto: 'Las mismas teclas de la rejilla de arriba. Dorado: mano ' +
        'izquierda, toca una vez y se queda sonando. Azul: mano derecha, ' +
        'marca los cuatro pulsos.',
      marcas: [
        {midi: RE2, clase: 'raiz', rotulo: 'IZQ'},
        {midi: RE, clase: 'acorde', rotulo: 'DER'},
        {midi: LA, clase: 'acorde', rotulo: 'DER'},
        {midi: RE5, clase: 'acorde', rotulo: 'DER'},
      ],
      reproducir: {tipo: 'secuencia', eventos: [
        {t: 0.0, notas: [RE2], duracion: 4},
        {t: 0.0, notas: [RE, LA, RE5], duracion: 0.8},
        {t: 0.85, notas: [RE, LA, RE5], duracion: 0.8},
        {t: 1.7, notas: [RE, LA, RE5], duracion: 0.8},
        {t: 2.55, notas: [RE, LA, RE5], duracion: 0.8},
      ]},
    },
  ],

  pasos: [
    'Pon la mano izquierda en el Re grave. Solo esa tecla, con el meñique.',
    'Tócala una vez y NO la sueltes. Se queda todo el compás.',
    'Con la derecha, toca Re–La–Re cuatro veces, una por pulso. La primera ' +
      'cae junto con la izquierda; las otras tres suenan solas, con el bajo ' +
      'todavía sonando abajo.',
    'Cuando cambie el acorde, mueve la izquierda a la nueva fundamental y ' +
      'vuelve a sostener.',
  ],

  vigilar: 'Si la izquierda vuelve a pulsar cada vez que lo hace la derecha, ' +
    'las manos están pegadas. Ese es exactamente el hábito que venimos a ' +
    'romper: la izquierda toca UNA vez por compás.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'Sobre Hasta el Final, en Re mayor, al 70% de velocidad. El ' +
      'atril te va marcando el acorde: la izquierda toma la fundamental ' +
      'que veas, la derecha hace el resto.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 2
{
  n: 2, titulo: 'El bajo camina', via: 'A',
  aprendes: 'Que la mano izquierda camine entre la fundamental y la quinta',
  porque: 'Ayer la izquierda estaba quieta. Hoy es la que se mueve y la ' +
    'derecha la que sostiene: se invierten los papeles. Aquí es donde suele ' +
    'aparecer el traba, y por eso es exactamente lo que hay que entrenar.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'Los papeles cambiados, compás a compás',
      texto: 'Ahora al revés: la derecha sostiene los cuatro pulsos y la ' +
        'izquierda se mueve, en el 1 y en el 3. Míralo en bucle.',
      acorde: 'Re mayor  ·  bajo Re – La',
      compases: 2, pulsosPorCompas: 4, bpm: 70,
      lineas: [
        {mano: 'DER', rotulo: 'acorde sostenido', notas: [62, 66, 69],
         pulsos: [1, 0, 0, 0]},
        {mano: 'IZQ', rotulo: 'Re grave (pulso 1)', notas: [38],
         pulsos: [1, 0, 0, 0]},
        {mano: 'IZQ', rotulo: 'La grave (pulso 3)', notas: [45],
         pulsos: [0, 0, 1, 0]},
      ],
    },
    {
      tipo: 'teclado',
      titulo: 'La quinta: el intervalo que sostiene',
      texto: 'Entre la fundamental y la quinta hay siete semitonos. No es ' +
        'alegre ni triste: es firme. Por eso todo bajo del mundo va y viene ' +
        'entre esas dos notas.',
      marcas: [{midi: RE2, clase: 'raiz', rotulo: 'IZQ 1'},
               {midi: LA2, clase: 'raiz', rotulo: 'IZQ 5'}],
      reproducir: {tipo: 'secuencia', eventos: [
        {t: 0, notas: [RE2]}, {t: 0.9, notas: [LA2]},
        {t: 1.8, notas: [RE2]}, {t: 2.7, notas: [LA2]},
      ]},
    },
    {
      tipo: 'teclado',
      titulo: 'Las dos manos, con los papeles cambiados',
      texto: 'La derecha se queda quieta sosteniendo el acorde. La izquierda ' +
        'camina: fundamental, quinta, fundamental, quinta.',
      marcas: [
        {midi: RE2, clase: 'raiz', rotulo: 'IZQ'},
        {midi: LA2, clase: 'raiz', rotulo: 'IZQ'},
        {midi: RE, clase: 'acorde', rotulo: 'DER'},
        {midi: 66, clase: 'acorde', rotulo: 'DER'},
        {midi: LA, clase: 'acorde', rotulo: 'DER'},
      ],
      reproducir: {tipo: 'secuencia', eventos: [
        {t: 0, notas: [RE, 66, LA], duracion: 4},
        {t: 0, notas: [RE2]}, {t: 1.0, notas: [LA2]},
        {t: 2.0, notas: [RE2]}, {t: 3.0, notas: [LA2]},
      ]},
    },
  ],

  pasos: [
    'Con la derecha toma el acorde completo y sosténlo. No lo sueltes.',
    'Con la izquierda toca la fundamental en el pulso 1.',
    'En el pulso 3, sin soltar la derecha, mueve la izquierda a la quinta.',
    'Vuelve a la fundamental. Repite hasta que la derecha ni se entere de ' +
      'lo que hace la izquierda.',
  ],

  vigilar: 'Si al mover la izquierda vuelves a pulsar la derecha sin querer, ' +
    've más lento. La velocidad no se practica: aparece sola cuando el ' +
    'patrón está.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'Sobre Hasta el Final. Cada acorde que veas: derecha sostiene, ' +
      'izquierda camina entre la fundamental y su quinta.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 3
{
  n: 3, titulo: 'Encontrar el uno', via: 'B',
  aprendes: 'Encontrar la tónica de una canción solo escuchando',
  porque: 'Todo el oído armónico empieza aquí. En cualquier canción hay una ' +
    'nota donde todo descansa: la tónica, el «1». Si la encuentras, los demás ' +
    'acordes tienen contra qué medirse. Si no, estás adivinando a ciegas.',

  demos: [
    {
      tipo: 'secuencia',
      titulo: 'Escucha cómo todo vuelve a casa',
      texto: 'Cuatro acordes en Do mayor. Fíjate en el último: esa sensación ' +
        'de «ya está, aquí se acaba» es la tónica. Los otros tres te dejan ' +
        'esperando algo.',
      eventos: [
        {t: 0.0, notas: [DO2, DO, MI, SOL], etiqueta: 'I · reposo'},
        {t: 1.4, notas: [FA3 - 12, FA, LA, DO5], etiqueta: 'IV · se abre'},
        {t: 2.8, notas: [SOL2, SOL, SI, RE5], etiqueta: 'V · tensión'},
        {t: 4.2, notas: [DO2, DO, MI, SOL], etiqueta: 'I · vuelve a casa'},
      ],
    },
    {
      tipo: 'teclado',
      titulo: 'Esa nota de descanso es esta',
      texto: 'En Do mayor la tónica es Do. Tócala y después vuelve a oír la ' +
        'secuencia de arriba: vas a notar que el último acorde se apoya justo ' +
        'en ella.',
      marcas: [{midi: DO, clase: 'raiz', rotulo: '1'}],
      reproducir: {tipo: 'nota', notas: [DO]},
    },
  ],

  prueba: {
    tipo: 'tonica',
    titulo: 'Ahora tú: ¿dónde descansa?',
    texto: 'Voy a tocar una progresión. Escúchala entera y después busca en ' +
      'el teclado la nota donde sentiste que todo se apoyaba. Tienes tres ' +
      'intentos y te digo si vas caliente o frío.',
    rondas: [
      {eventos: [
        {t: 0.0, notas: [SOL2, SOL, SI, RE5]},
        {t: 1.3, notas: [DO, MI, SOL]},
        {t: 2.6, notas: [RE3, RE, 66, LA]},
        {t: 3.9, notas: [SOL2, SOL, SI, RE5]},
      ], respuesta: 'G', pista: 'Termina donde empezó.'},
      {eventos: [
        {t: 0.0, notas: [RE2, RE, 66, LA]},
        {t: 1.3, notas: [SOL3, SOL, SI, RE5]},
        {t: 2.6, notas: [LA2, LA, 73, MI5]},
        {t: 3.9, notas: [RE2, RE, 66, LA]},
      ], respuesta: 'D', pista: 'Es la tonalidad de Hasta el Final.'},
      {eventos: [
        {t: 0.0, notas: [FA3 - 12, FA, LA, DO5]},
        {t: 1.3, notas: [DO, MI, SOL]},
        {t: 2.6, notas: [SOL2, SOL, SI, RE5]},
        {t: 3.9, notas: [DO2, DO, MI, SOL]},
      ], respuesta: 'C', pista: 'La tonalidad más simple del piano.'},
    ],
  },

  pasos: [
    'Escucha la progresión completa sin tocar nada.',
    'Canta por dentro la nota donde sientes que la música «se sienta».',
    'Búscala en el teclado probando teclas hasta que una encaje.',
    'Marca tu respuesta. Si fallas, escucha otra vez antes del segundo intento.',
  ],

  practica: {
    cancion: 'miEterno', modo: 'teclado', tempo: 1.0, tapar: true,
    texto: 'Mi Eterno Destino está en Do mayor. Ponla con los acordes ' +
      'tapados y busca el Do antes de destapar. Cuando lo tengas, el atril ' +
      'te confirma.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 4
{
  n: 4, titulo: 'Repaso: lo de estos tres días', via: 'A', repaso: true,
  porque: 'Sin material nuevo a propósito. La mejora en habilidad motora ' +
    'aparece DESPUÉS de dormir, entre un 10 y un 13% más eficiente y con ' +
    'menos errores. Lo de anteayer se está cobrando hoy aunque no lo notes.',
  aprendes: 'Asentar lo de estos tres días, sin material nuevo',

  demos: [
    {
      tipo: 'secuencia',
      titulo: 'Las tres cosas juntas',
      texto: 'Izquierda que sostiene, izquierda que camina, y todo apoyado ' +
        'en la tónica. Escúchalo como una sola idea.',
      eventos: [
        {t: 0.0, notas: [RE2], etiqueta: 'izquierda entra sola'},
        {t: 0.6, notas: [RE, 66, LA], etiqueta: 'derecha encima'},
        {t: 1.6, notas: [LA2], etiqueta: 'el bajo camina a la quinta'},
        {t: 2.6, notas: [RE2], etiqueta: 'y vuelve a la tónica'},
        {t: 3.4, notas: [RE, 66, LA], etiqueta: 'reposo'},
      ],
    },
  ],

  pasos: [
    'Cinco minutos alternando: dos de mano sostenida, dos de bajo que ' +
      'camina, uno buscando la tónica de oído.',
    'No busques que salga mejor que ayer. Busca volver.',
  ],

  vigilar: 'Va a dar menos sensación de avance que repetir una sola cosa. ' +
    'Eso está estudiado y es esperable: alternar retiene más aunque se ' +
    'sienta peor mientras se hace.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'La misma canción de los días anteriores. La familiaridad es ' +
      'parte del método, no falta de imaginación.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 5
{
  n: 5, titulo: 'La octava en la izquierda', via: 'A',
  aprendes: 'La octava en la izquierda: que el piano suene grande sin más esfuerzo',
  porque: 'El primer truco de sonido del método: mismo esfuerzo, mucho más ' +
    'cuerpo. Una sola tecla más y el piano deja de sonar delgado.',

  demos: [
    {
      tipo: 'comparacion',
      titulo: 'Una nota contra dos',
      texto: 'Escucha primero la fundamental sola, después la misma nota con ' +
        'su octava. No cambia la armonía: cambia el tamaño.',
      mal: {
        rotulo: 'Solo la fundamental',
        nota: 'Correcto, pero flaco.',
        eventos: [{t: 0, notas: [RE2]}, {t: 0.8, notas: [RE, 66, LA]}],
      },
      bien: {
        rotulo: 'Con octava',
        nota: 'Meñique y pulgar a la vez, una octava aparte. Suena a piano ' +
          'de verdad.',
        eventos: [{t: 0, notas: [RE2, RE3]}, {t: 0.8, notas: [RE, 66, LA]}],
      },
    },
    {
      tipo: 'teclado',
      titulo: 'La posición de la mano',
      texto: 'Meñique en la grave, pulgar en la misma nota una octava arriba. ' +
        'La mano queda abierta y estable: esa es la forma que vas a usar en ' +
        'todo el método.',
      marcas: [{midi: RE2, clase: 'bajo', rotulo: '5º dedo'},
               {midi: RE3, clase: 'bajo', rotulo: 'pulgar'}],
      reproducir: {tipo: 'acorde', notas: [RE2, RE3]},
    },
  ],

  pasos: [
    'Abre la izquierda: meñique en el Re grave, pulgar en el Re de arriba.',
    'Tócalas juntas. Debe sonar como una sola nota, más grande.',
    'Mantenlas mientras la derecha marca el acorde.',
    'Al cambiar de acorde, mueve el bloque entero sin cerrar la mano.',
  ],

  vigilar: 'Si te cuesta el estiramiento, toca primero la grave y añade la ' +
    'de arriba un instante después. Suena bien igual y no fuerza la mano.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'La misma canción, ahora con octavas en la izquierda. Vas a notar ' +
      'el cambio de tamaño desde el primer acorde.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 6
{
  n: 6, titulo: 'I o V, solo de oído', via: 'B',
  aprendes: 'Distinguir de oído el acorde que reposa del que pide resolver',
  porque: 'Son los dos polos de toda la música tonal. El I es reposo: puedes ' +
    'terminar ahí. El V es tensión: pide resolver. Distinguirlos de oído es ' +
    'más de la mitad del trabajo del oído armónico.',

  demos: [
    {
      tipo: 'comparacion',
      titulo: 'Reposo contra tensión',
      texto: 'El mismo tono, dos acordes. Fíjate en qué te hace sentir cada ' +
        'uno: uno cierra, el otro deja la frase abierta.',
      mal: {
        rotulo: 'El I · reposo',
        nota: 'Aquí se puede terminar. No pide nada.',
        eventos: [{t: 0, notas: [DO2, DO, MI, SOL], duracion: 2.5}],
      },
      bien: {
        rotulo: 'El V · tensión',
        nota: 'Te deja esperando. El oído quiere que vuelva al I.',
        eventos: [{t: 0, notas: [SOL2, SOL, SI, RE5], duracion: 2.5}],
      },
    },
    {
      tipo: 'secuencia',
      titulo: 'Y así resuelve',
      texto: 'La tensión soltándose. Ese alivio del final es lo que reconoces ' +
        'aunque no sepas nombrarlo.',
      eventos: [
        {t: 0, notas: [SOL2, SOL, SI, RE5], etiqueta: 'V · pide'},
        {t: 1.5, notas: [DO2, DO, MI, SOL], etiqueta: 'I · concede'},
      ],
    },
  ],

  prueba: {
    tipo: 'grado',
    titulo: 'Ahora tú: ¿I o V?',
    texto: 'Voy a tocar un acorde en Do mayor. Decide si es el que reposa o ' +
      'el que pide resolver. Seis rondas.',
    opciones: ['I', 'V'],
    rondas: [
      {eventos: [{t: 0, notas: [DO2, DO, MI, SOL], duracion: 2}], respuesta: 'I'},
      {eventos: [{t: 0, notas: [SOL2, SOL, SI, RE5], duracion: 2}], respuesta: 'V'},
      {eventos: [{t: 0, notas: [SOL2, SOL, SI, RE5], duracion: 2}], respuesta: 'V'},
      {eventos: [{t: 0, notas: [DO2, DO, MI, SOL], duracion: 2}], respuesta: 'I'},
      {eventos: [{t: 0, notas: [SOL2, SOL, SI, RE5], duracion: 2}], respuesta: 'V'},
      {eventos: [{t: 0, notas: [DO2, DO, MI, SOL], duracion: 2}], respuesta: 'I'},
    ],
  },

  pasos: [
    'Escucha el acorde entero antes de decidir.',
    'No lo analices: pregúntate solo si «cierra» o «deja esperando».',
    'Marca tu respuesta y sigue. El acierto viene con la repetición, no con ' +
      'pensarlo más.',
  ],

  practica: {
    cancion: 'miEterno', modo: 'teclado', tempo: 1.0, tapar: true,
    texto: 'Con los acordes tapados: en cada cambio, decide si volvió al I ' +
      'o se fue al V. Destapa y comprueba cada cuatro compases.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 7
{
  n: 7, titulo: 'Primera medición', via: 'A', medicion: true,
  porque: 'Hoy no se avanza: se mide. Este número es tu punto de partida, y ' +
    'dentro de dos meses lo vas a mirar con cariño. Sin él, «no avanzo ' +
    'nunca» es una sensación que no se puede discutir.',
  aprendes: 'Medir tu independencia de manos en milisegundos',

  demos: [
    {
      tipo: 'comparacion',
      titulo: 'Qué se está midiendo exactamente',
      texto: 'La máquina mide cuántas de tus notas caen con las dos manos a ' +
        'la vez. Estos son los dos extremos.',
      mal: {
        rotulo: 'Pegadas · 100%',
        nota: 'Cero milisegundos de separación. Son acordes, no acompañamiento.',
        eventos: [{t: 0, notas: [RE2, RE, 66, LA]},
                  {t: 1, notas: [RE2, RE, 66, LA]}],
      },
      bien: {
        rotulo: 'Separadas · 0%',
        nota: 'Casi medio segundo de separación. Eso es independencia.',
        eventos: [{t: 0, notas: [RE2]}, {t: 0.5, notas: [RE, 66, LA]},
                  {t: 1.0, notas: [LA2]}, {t: 1.5, notas: [RE, 66, LA]}],
      },
    },
  ],

  pasos: [
    'Conecta el piano al computador con el cable USB.',
    'Dale al botón Grabar de abajo.',
    'Toca cinco minutos lo que quieras: lo de estos días, o lo que te salga.',
    'Para la grabación. Queda guardada.',
    'Dime «revisa mi última sesión» y te doy el diagnóstico con tus números.',
  ],

  vigilar: 'No toques «mejor» porque te están midiendo. La medida sirve si ' +
    'es de cómo tocas normalmente, no de cómo tocas cuando te miran.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.7,
    texto: 'Si no sabes qué tocar, pon Hasta el Final y haz lo de la ' +
      'lección 1 y 2.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 8
{
  n: 8, titulo: 'El silencio también toca', via: 'C',
  aprendes: 'Usar el silencio como parte del acompañamiento',
  porque: 'Un piano que suena todo el tiempo cansa y tapa. Si alguien está ' +
    'rezando encima de tu música, el aire que dejes es lo que le permite ' +
    'hacerlo. Callar es una decisión musical, no una pausa.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'El hueco, dibujado',
      texto: 'La derecha toca 1, 2 y 3 y calla en el 4. Ese cuarto pulso ' +
        'vacío es el aire donde cabe una voz.',
      acorde: 'Do mayor',
      compases: 2, pulsosPorCompas: 4, bpm: 72,
      lineas: [
        {mano: 'DER', rotulo: 'calla en el 4', notas: [60, 64, 67],
         pulsos: [1, 1, 1, 0]},
        {mano: 'IZQ', rotulo: 'sostiene abajo', notas: [36],
         pulsos: [1, 0, 0, 0]},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Lleno contra con aire',
      texto: 'La misma progresión. En la segunda versión el último pulso de ' +
        'cada compás está en silencio.',
      mal: {
        rotulo: 'Sin aire',
        nota: 'Suena apretado, no deja sitio.',
        eventos: [
          {t: 0.0, notas: [DO, MI, SOL]}, {t: 0.5, notas: [DO, MI, SOL]},
          {t: 1.0, notas: [DO, MI, SOL]}, {t: 1.5, notas: [DO, MI, SOL]},
          {t: 2.0, notas: [FA, LA, DO5]}, {t: 2.5, notas: [FA, LA, DO5]},
          {t: 3.0, notas: [FA, LA, DO5]}, {t: 3.5, notas: [FA, LA, DO5]},
        ],
      },
      bien: {
        rotulo: 'Con aire',
        nota: 'El hueco del final de cada compás es donde cabe una voz.',
        eventos: [
          {t: 0.0, notas: [DO2]}, {t: 0.0, notas: [DO, MI, SOL]},
          {t: 0.5, notas: [DO, MI, SOL]}, {t: 1.0, notas: [DO, MI, SOL]},
          {t: 2.0, notas: [FA3 - 12]}, {t: 2.0, notas: [FA, LA, DO5]},
          {t: 2.5, notas: [FA, LA, DO5]}, {t: 3.0, notas: [FA, LA, DO5]},
        ],
      },
    },
  ],

  pasos: [
    'Toca la progresión marcando los cuatro pulsos, como siempre.',
    'Ahora quita el cuarto pulso: toca 1, 2, 3 y calla.',
    'Deja que la izquierda sostenga durante ese silencio.',
    'Repite hasta que el hueco deje de darte ansiedad y empiece a sonarte bien.',
  ],

  vigilar: 'Vas a sentir que falta algo y vas a querer rellenarlo. Aguanta: ' +
    'eso que falta es el sitio de la voz.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.85,
    texto: 'Con la voz al 100% en la consola. Escucha dónde respira el ' +
      'cantante y calla justo ahí.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 9
{
  n: 9, titulo: 'Inversiones: la misma nota en otro sitio', via: 'C',
  aprendes: 'Las tres inversiones del mismo acorde y para qué sirven de verdad',
  porque: 'Tocar todo en estado fundamental es la causa número uno de que ' +
    'un piano suene plano y de que la mano salte de un acorde a otro. Las ' +
    'inversiones son el mismo acorde con distinta nota abajo.',

  demos: [
    {
      tipo: 'pasos-teclado',
      titulo: 'Las tres posiciones del mismo acorde',
      texto: 'Do mayor tiene tres notas, así que se puede tocar de tres ' +
        'maneras según cuál pongas abajo. Míralas y escúchalas una por una.',
      pasos: [
        {rotulo: 'Estado fundamental', notas: [DO, MI, SOL],
         nota: 'Do abajo. La posición «de manual».',
         marcas: [{midi: DO, clase: 'raiz', rotulo: '1'},
                  {midi: MI, clase: 'acorde', rotulo: '3'},
                  {midi: SOL, clase: 'acorde', rotulo: '5'}]},
        {rotulo: 'Primera inversión', notas: [MI, SOL, DO5],
         nota: 'El Do se fue arriba. Ahora manda el Mi.',
         marcas: [{midi: MI, clase: 'raiz', rotulo: '3'},
                  {midi: SOL, clase: 'acorde', rotulo: '5'},
                  {midi: DO5, clase: 'acorde', rotulo: '1'}]},
        {rotulo: 'Segunda inversión', notas: [SOL, DO5, MI5],
         nota: 'Ahora el Sol abajo. Mismas tres notas, otro color.',
         marcas: [{midi: SOL, clase: 'raiz', rotulo: '5'},
                  {midi: DO5, clase: 'acorde', rotulo: '1'},
                  {midi: MI5, clase: 'acorde', rotulo: '3'}]},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Para qué sirven de verdad',
      texto: 'Do a Fa, dos veces. En la primera la mano salta. En la segunda ' +
        'usa la inversión más cercana y casi no se mueve.',
      mal: {
        rotulo: 'Saltando',
        nota: 'La mano viaja entera de un sitio a otro.',
        eventos: [{t: 0, notas: [DO, MI, SOL]}, {t: 1.2, notas: [FA, LA, DO5]}],
      },
      bien: {
        rotulo: 'Con inversión',
        nota: 'El Do se queda quieto. Solo se mueven dos dedos, y poco.',
        eventos: [{t: 0, notas: [DO, MI, SOL]}, {t: 1.2, notas: [DO, FA, LA]}],
      },
    },
  ],

  pasos: [
    'Toca Do mayor en estado fundamental: Do, Mi, Sol.',
    'Sube el Do una octava, dejando Mi y Sol donde están. Eso es primera ' +
      'inversión.',
    'Ahora sube también el Mi. Segunda inversión.',
    'Vuelve abajo y repítelo en otras dos tonalidades.',
  ],

  vigilar: 'No memorices las tres formas: entiende que es la misma nota que ' +
    'se muda de octava. Así funciona en cualquier acorde sin aprenderlo de ' +
    'nuevo.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.85,
    texto: 'El atril ya te calcula la inversión más cercana a cada acorde. ' +
      'Copia lo que ves y fíjate cuántos dedos se quedan quietos entre uno ' +
      'y otro.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 10
{
  n: 10, titulo: 'Ritmos distintos, lentísimo', via: 'A',
  aprendes: 'Cada mano en su propio pulso: el examen de la independencia',
  porque: 'El examen real de independencia: cada mano en su propio pulso. ' +
    'Si esto sale, ya puedes acompañar cualquier cosa. Y sale, pero solo a ' +
    'velocidad de tortuga.',

  demos: [
    {
      tipo: 'compases',
      titulo: 'Nunca caen juntas',
      texto: 'Izquierda en el 1 y el 3. Derecha en el 2 y el 4. Fíjate que ' +
        'no hay ni un pulso donde suenen las dos. Empieza en Muy lento.',
      acorde: 'Do mayor',
      compases: 2, pulsosPorCompas: 4, bpm: 60,
      lineas: [
        {mano: 'DER', rotulo: 'acorde, pulsos 2 y 4', notas: [60, 64, 67],
         pulsos: [0, 1, 0, 1]},
        {mano: 'IZQ', rotulo: 'bajo, pulsos 1 y 3', notas: [36],
         pulsos: [1, 0, 1, 0]},
      ],
    },
    {
      tipo: 'secuencia',
      titulo: 'La izquierda en 1 y 3, la derecha en 2 y 4',
      texto: 'Nunca caen juntas. Escúchalo despacio y cuenta en voz alta: ' +
        'uno, dos, tres, cuatro.',
      eventos: [
        {t: 0.0, notas: [DO2], etiqueta: '1 · izquierda'},
        {t: 0.8, notas: [DO, MI, SOL], etiqueta: '2 · derecha'},
        {t: 1.6, notas: [SOL2], etiqueta: '3 · izquierda'},
        {t: 2.4, notas: [DO, MI, SOL], etiqueta: '4 · derecha'},
        {t: 3.2, notas: [DO2], etiqueta: '1 · izquierda'},
        {t: 4.0, notas: [DO, MI, SOL], etiqueta: '2 · derecha'},
        {t: 4.8, notas: [SOL2], etiqueta: '3 · izquierda'},
        {t: 5.6, notas: [DO, MI, SOL], etiqueta: '4 · derecha'},
      ],
    },
    {
      tipo: 'comparacion',
      titulo: 'Lo que NO se busca',
      texto: 'Si las manos vuelven a caer juntas, el ejercicio perdió su ' +
        'sentido. Compara.',
      mal: {
        rotulo: 'Se juntaron',
        nota: 'Aunque suene más «lleno», aquí no hay independencia.',
        eventos: [{t: 0, notas: [DO2, DO, MI, SOL]},
                  {t: 0.8, notas: [SOL2, DO, MI, SOL]}],
      },
      bien: {
        rotulo: 'Alternando',
        nota: 'Cada mano en su sitio. Esto es lo que se busca.',
        eventos: [{t: 0, notas: [DO2]}, {t: 0.8, notas: [DO, MI, SOL]},
                  {t: 1.6, notas: [SOL2]}, {t: 2.4, notas: [DO, MI, SOL]}],
      },
    },
  ],

  pasos: [
    'Cuenta en voz alta: uno, dos, tres, cuatro. Sin tocar.',
    'Añade la izquierda solo en el 1 y el 3. Sigue contando en voz alta.',
    'Cuando eso salga solo, añade la derecha en el 2 y el 4.',
    'Si se te juntan, baja la velocidad a la mitad. Otra vez a la mitad si hace falta.',
  ],

  vigilar: 'No hay premio por hacerlo rápido. El cerebro aprende el patrón, ' +
    'no la velocidad, y la velocidad aparece sola cuando el patrón está.',

  practica: {
    cancion: 'hastaElFinal', modo: 'teclado', tempo: 0.5,
    texto: 'Al 50% de velocidad. Sí, es lentísimo. Ese es el punto.',
  },
},

// ══════════════════════════════════════════════════════ LECCIÓN 11
{
  n: 11, titulo: 'El bajo que no es la fundamental', via: 'C',
  aprendes: 'Acordes con el bajo cambiado, para que el bajo camine en vez de saltar',
  porque: 'En la música de alabanza aparecen constantemente acordes donde el ' +
    'bajo NO es la fundamental: Re con Fa# abajo, Do con Mi abajo. Se ' +
    'escriben Re/Fa#. Sirven para que el bajo camine por notas seguidas en ' +
    'vez de dar saltos, y es de las cosas que más cambian el resultado.',

  demos: [
    {
      tipo: 'comparacion',
      titulo: 'El bajo saltando contra el bajo caminando',
      texto: 'La misma progresión Do–Sol–Lam–Fa. En la primera el bajo salta ' +
        'de una fundamental a otra. En la segunda baja por notas seguidas ' +
        'usando bajos distintos.',
      mal: {
        rotulo: 'Bajos por salto',
        nota: 'Do, Sol, La, Fa. Correcto, pero el bajo va a los tumbos.',
        eventos: [
          {t: 0.0, notas: [36, 60, 64, 67]},
          {t: 1.1, notas: [31, 55, 59, 62]},
          {t: 2.2, notas: [33, 57, 60, 64]},
          {t: 3.3, notas: [29, 53, 57, 60]},
        ],
      },
      bien: {
        rotulo: 'El bajo baja andando',
        nota: 'Do, Si, La, Sol: cuatro notas seguidas bajando. Los acordes ' +
          'de arriba son casi los mismos, pero suena inevitable.',
        eventos: [
          {t: 0.0, notas: [36, 60, 64, 67]},
          {t: 1.1, notas: [35, 55, 59, 62]},
          {t: 2.2, notas: [33, 57, 60, 64]},
          {t: 3.3, notas: [31, 53, 57, 60]},
        ],
      },
    },
    {
      tipo: 'pasos-teclado',
      titulo: 'Cómo se arma uno',
      texto: 'Sol/Si quiere decir: acorde de Sol arriba, Si abajo. La mano ' +
        'derecha no cambia; solo se muda la izquierda.',
      pasos: [
        {rotulo: 'Sol normal', notas: [31, 55, 59, 62],
         nota: 'Sol abajo, acorde de Sol arriba. Lo de siempre.',
         marcas: [{midi: 31, clase: 'raiz', rotulo: 'Sol'},
                  {midi: 55, clase: 'acorde'}, {midi: 59, clase: 'acorde'},
                  {midi: 62, clase: 'acorde'}]},
        {rotulo: 'Sol/Si', notas: [35, 55, 59, 62],
         nota: 'Misma mano derecha. Abajo, el Si: la tercera del acorde.',
         marcas: [{midi: 35, clase: 'raiz', rotulo: 'Si'},
                  {midi: 55, clase: 'acorde'}, {midi: 59, clase: 'acorde'},
                  {midi: 62, clase: 'acorde'}]},
        {rotulo: 'Sol/Re', notas: [38, 55, 59, 62],
         nota: 'Ahora el Re abajo: la quinta. Otro color, mismo acorde.',
         marcas: [{midi: 38, clase: 'raiz', rotulo: 'Re'},
                  {midi: 55, clase: 'acorde'}, {midi: 59, clase: 'acorde'},
                  {midi: 62, clase: 'acorde'}]},
      ],
    },
  ],

  pasos: [
    'Toca Sol mayor con la derecha y sosténlo sin moverlo.',
    'Con la izquierda toca el Sol grave. Ese es el acorde normal.',
    'Sin tocar la derecha, mueve la izquierda al Si. Eso es Sol/Si.',
    'Prueba también con el Re abajo. La derecha nunca se movió.',
    'Ahora encadena Do, Sol/Si, Lam, Sol: escucha cómo el bajo baja andando.',
  ],

  vigilar: 'La mano derecha NO cambia. Si la mueves también, estás tocando ' +
    'una inversión, que es otra cosa. Aquí solo se muda el bajo.',

  practica: {
    cancion: 'miEterno', modo: 'teclado', tempo: 0.85,
    texto: 'Sobre Mi Eterno Destino, en Do mayor. Donde el atril marque ' +
      'Sol, prueba poner Si en el bajo y escucha si la progresión fluye ' +
      'mejor hacia el siguiente acorde.',
  },
},

];

// Las tres de ministrar se enganchan al final, en orden
export const LECCIONES = BASE.concat(MINISTRAR);

export function leccionDe(n) {
  return LECCIONES.find((l) => l.n === n) || null;
}
export const TOTAL_ESCRITAS = LECCIONES.length;
