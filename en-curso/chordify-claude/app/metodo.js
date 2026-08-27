// ===========================================================================
// MÉTODO DE 66 DÍAS — piano al oído para acompañar la oración
// ===========================================================================
//
// Por qué 66 y no 21: Lally (2010) siguió a 96 personas durante 84 días. La
// mediana real para que un hábito se vuelva automático fue 66 días, no los
// 21 del mito. El rango va de 18 a 254. Por eso hay material para 66 días
// completos: menos que eso es abandonar justo antes de que el hábito agarre.
//
// Sobre qué se construye este método, y por qué está ordenado así:
//
//   • El diagnóstico real: acordes mayores y menores fluidos, séptimas no,
//     manos trabadas, oído que saca melodía pero no armonía, y huecos al
//     tocar. Por eso no hay días dedicados a aprender acordes: hay días
//     dedicados a separar las manos y a oír funciones.
//
//   • El sueño consolida. La mejora motora aparece DESPUÉS de dormir (10-13%
//     más eficiente, menos errores), no durante la sesión. Lo de hoy se
//     cobra mañana: por eso el método insiste en volver, no en durar.
//
//   • Práctica intercalada, no en bloque. Retiene mejor aunque se sienta
//     peor mientras se hace.
//
//   • Todo se toca sobre música real de la biblioteca. Los ejercicios
//     abstractos son justo lo que se abandonó otras veces.

import { EJERCICIOS, porId } from './curriculo.js';

export const PISO_MINUTOS = 5;

// ---------------------------------------------------------------- fases

export const FASES = [
  {
    id: 1, desde: 1, hasta: 14, color: '#ffb64a',
    nombre: 'Cimientos',
    lema: 'Que las manos dejen de ser una sola',
    idea: 'Mientras las dos manos caigan juntas no hay acompañamiento, hay ' +
      'acordes. Todo lo demás depende de resolver esto primero.',
  },
  {
    id: 2, desde: 15, hasta: 30, color: '#4aa3ff',
    nombre: 'El círculo',
    lema: 'Entender por qué los acordes van donde van',
    idea: 'El círculo de quintas no es teoría decorativa: los acordes de una ' +
      'tonalidad son vecinos en el círculo, y eso explica de un vistazo por ' +
      'qué unas progresiones suenan inevitables y otras raras.',
  },
  {
    id: 3, desde: 31, hasta: 48, color: '#a371f7',
    nombre: 'Color y relleno',
    lema: 'Que el piano cante en vez de sonar plano',
    idea: 'Aquí se llenan los huecos: inversiones, décimas, novenas, notas de ' +
      'paso. Es la diferencia entre apretar acordes y acompañar.',
  },
  {
    id: 4, desde: 49, hasta: 66, color: '#5ad1c4',
    nombre: 'Acompañar',
    lema: 'Tocar para que otros recen',
    idea: 'Todo junto, sobre canciones completas, con el oficio de sostener ' +
      'un momento de oración: entrar, sostener, callar y cerrar.',
  },
];

export function faseDe(dia) {
  return FASES.find((f) => dia >= f.desde && dia <= f.hasta) || FASES[0];
}

// ------------------------------------------------------------ oraciones
//
// Una antes de cada sesión. No es decoración: fijar una intención antes de
// empezar es lo que convierte un rato de tecla en algo que se sostiene
// cuando el ánimo no acompaña.
//
// Santa Cecilia es la patrona de los músicos desde que Gregorio XIII la
// proclamó en 1594. La tradición cuenta que mientras los músicos tocaban en
// su boda, ella cantaba a Dios en su corazón. Ese es exactamente el oficio:
// que suene por fuera lo que ya se está cantando por dentro.

export const ORACIONES = [
  {
    id: 'o1', titulo: 'Antes de tocar',
    texto: 'Señor, que estas manos torpes sirvan para alabarte. No busco ' +
      'lucirme: busco que alguien rece mejor porque yo toqué.',
  },
  {
    id: 'o2', titulo: 'Santa Cecilia',
    texto: 'Santa Cecilia, que cantabas a Dios en tu corazón mientras sonaba ' +
      'la música alrededor: enséñame a tocar desde dentro. Ruega por mí.',
  },
  {
    id: 'o3', titulo: 'Cuando cuesta',
    texto: 'Señor, hoy no tengo ganas y vengo igual. Cinco minutos son míos ' +
      'y te los doy. Tú haces el resto.',
  },
  {
    id: 'o4', titulo: 'Contra la impaciencia',
    texto: 'Dios mío, quítame la prisa de sonar bien ya. Dame la humildad de ' +
      'sonar mal hoy para servir bien mañana.',
  },
  {
    id: 'o5', titulo: 'Por los que van a rezar',
    texto: 'Señor, que mi torpeza no estorbe. Que cuando toque, nadie me mire ' +
      'a mí. Que te miren a Ti.',
  },
  {
    id: 'o6', titulo: 'Al volver tras faltar',
    texto: 'Señor, volví. No me pesa lo que dejé, me alegra lo que retomo. ' +
      'Empezar de nuevo también es fidelidad.',
  },
  {
    id: 'o7', titulo: 'Acción de gracias',
    texto: 'Gracias por el oído que me diste, por estas manos y por este ' +
      'piano. Nada de esto lo merecí y todo me lo diste.',
  },
];

// -------------------------------------------------------------- los días
//
// Cada día: una lección corta (algo nuevo que aprender, no solo repetir),
// los ejercicios que la trabajan, y a veces un reto medible por MIDI.
//
// Los días de REPASO no traen material nuevo a propósito: la novedad diaria
// es lo que da combustible tres semanas y deja tirado en la cuarta.

export const DIAS = [
  // ================================ FASE 1 — CIMIENTOS (1-14)
  {dia: 1, titulo: 'Una mano sostiene, la otra se mueve',
   leccion: 'El acompañamiento nace de que las dos manos hagan cosas ' +
     'distintas. Hoy la izquierda solo sostiene la fundamental, quieta, una ' +
     'por compás. La derecha marca el pulso con el acorde. Nada más. Si ' +
     'sientes que es demasiado fácil, mira si de verdad la izquierda se ' +
     'queda quieta o se mueve con la derecha sin que te des cuenta.',
   ejercicios: ['A1'], reto: 'Que la izquierda no se mueva ni una vez de más.'},

  {dia: 2, titulo: 'El bajo camina',
   leccion: 'Se invierten los papeles: ahora la izquierda es la que se mueve, ' +
     'alternando fundamental y quinta, mientras la derecha sostiene. Aquí es ' +
     'donde aparece el traba, y es exactamente lo que hay que entrenar. ' +
     'La quinta es el intervalo que sostiene toda la armonía occidental: ' +
     'suena a solidez porque casi no tiene tensión.',
   ejercicios: ['A2']},

  {dia: 3, titulo: 'Encontrar el uno',
   leccion: 'Todo el oído armónico empieza aquí. En cualquier canción hay ' +
     'una nota donde todo descansa: la tónica, el "1". Si la encuentras, ' +
     'todos los demás acordes tienen contra qué medirse. Si no, estás ' +
     'adivinando a ciegas. Ponte a buscarla antes de mirar el acorde.',
   ejercicios: ['B1']},

  {dia: 4, titulo: 'Repaso: manos y oído',
   leccion: 'Sin material nuevo. Repite lo de los tres días anteriores. ' +
     'Esto se siente a poco y es donde se construye: la mejora motora ' +
     'aparece después de dormir, no durante la sesión. Lo de anteayer se ' +
     'está cobrando hoy aunque no lo notes.',
   ejercicios: ['A1', 'B1'], repaso: true},

  {dia: 5, titulo: 'La octava en la izquierda',
   leccion: 'Toca la fundamental con el meñique y el pulgar a la vez, una ' +
     'octava aparte. Suena inmediatamente más grande y más profesional, y no ' +
     'cuesta nada. Es el primer truco de sonido del método: mismo esfuerzo, ' +
     'más cuerpo.',
   ejercicios: ['A3']},

  {dia: 6, titulo: 'I o V, solo de oído',
   leccion: 'Los dos polos de toda la música tonal. El I es reposo: puedes ' +
     'terminar ahí. El V es tensión: pide resolver, te deja esperando. ' +
     'Distinguir esos dos de oído es más de la mitad del trabajo del oído ' +
     'armónico. Tapa el acorde en el atril y decide antes de mirar.',
   ejercicios: ['B2']},

  {dia: 7, titulo: 'Primera medición',
   leccion: 'Hoy se mide, no se avanza. Conecta el piano por MIDI y graba ' +
     'cinco minutos tocando lo que quieras. El número que importa es qué ' +
     'porcentaje de tus notas caen con las dos manos a la vez. Ese número ' +
     'es tu punto de partida, y dentro de dos meses lo vas a mirar con ' +
     'cariño.',
   ejercicios: ['A1', 'A2'], midi: 'independencia', control: true},

  {dia: 8, titulo: 'El silencio también toca',
   leccion: 'Un piano que suena todo el tiempo cansa y tapa. Hoy toca la ' +
     'progresión dejando el último tiempo de cada compás en silencio. Vas a ' +
     'sentir que falta algo: eso que falta es aire, y el aire es lo que ' +
     'permite que alguien rece encima de tu música.',
   ejercicios: ['C5']},

  {dia: 9, titulo: 'Inversiones: la misma nota en otro sitio',
   leccion: 'Un acorde de tres notas se puede tocar de tres maneras según ' +
     'cuál pongas abajo. Suena distinto sin cambiar de acorde. Tocar todo en ' +
     'estado fundamental es la causa número uno de que un piano suene plano.',
   ejercicios: ['C1']},

  {dia: 10, titulo: 'Ritmos distintos, lentísimo',
   leccion: 'Izquierda en el 1 y el 3, derecha en el 2 y el 4. A velocidad ' +
     'de tortuga. Si se te juntan, más lento todavía. No hay premio por ' +
     'hacerlo rápido: el cerebro aprende el patrón, no la velocidad, y la ' +
     'velocidad viene sola después.',
   ejercicios: ['A5']},

  {dia: 11, titulo: 'Repaso intercalado',
   leccion: 'Tres cosas distintas en cinco minutos, alternando. Va a dar ' +
     'menos sensación de fluidez que repetir una sola: eso es esperable y ' +
     'está estudiado. Retiene mejor justo porque cuesta más.',
   ejercicios: ['A2', 'B2', 'C1'], repaso: true},

  {dia: 12, titulo: 'La izquierda también canta',
   leccion: 'Hasta ahora la izquierda solo sostenía. Hoy hazla subir y bajar ' +
     'por notas seguidas entre acorde y acorde, aunque no sean del acorde. ' +
     'Esa línea que camina es lo que hace que una progresión suene ' +
     'inevitable en vez de a bloques sueltos.',
   ejercicios: ['D4']},

  {dia: 13, titulo: 'Entra el IV',
   leccion: 'Con I y V ya te defiendes. El IV es el tercero: no es reposo ni ' +
     'tensión, es apertura. Suena a que la canción respira hacia afuera. ' +
     'Con I, IV y V se acompaña la mayor parte del repertorio de alabanza.',
   ejercicios: ['B3']},

  {dia: 14, titulo: 'Cierre de la primera fase',
   leccion: 'Dos semanas. Hoy toca una canción entera, lenta, con la ' +
     'izquierda sosteniendo y la derecha marcando. No busques que salga ' +
     'bonito: busca que las manos no se peguen. Eso es todo lo que se ' +
     'pedía esta fase, y si sale, lo demás se construye encima.',
   ejercicios: ['A1', 'A3'], control: true},

  // ================================== FASE 2 — EL CÍRCULO (15-30)
  {dia: 15, titulo: 'Qué es el círculo de quintas',
   leccion: 'Doce notas puestas en rueda, cada una una quinta arriba de la ' +
     'anterior: Do, Sol, Re, La, Mi... Al dar la vuelta pasas por las doce y ' +
     'vuelves al principio. No es un adorno teórico: lo que revela es que ' +
     'los acordes de una misma tonalidad son VECINOS en esa rueda.',
   ejercicios: ['B3'], nuevo: true},

  {dia: 16, titulo: 'Los vecinos del círculo',
   leccion: 'Toma tu tonalidad y mira el círculo: el acorde de la izquierda ' +
     'es el IV, el de la derecha es el V. Los tres pilares están pegados. ' +
     'Por eso I, IV y V suenan a familia: literalmente lo son.',
   ejercicios: ['B3', 'C1']},

  {dia: 17, titulo: 'Por qué el V tira hacia el I',
   leccion: 'El V contiene la nota que está a medio tono de la tónica. Ese ' +
     'medio tono es un imán: el oído quiere que resuelva. Toda la música ' +
     'occidental vive de crear esa tensión y soltarla. Cuando la reconozcas, ' +
     'vas a oírla en todas partes.',
   ejercicios: ['B2']},

  {dia: 18, titulo: 'El relativo menor',
   leccion: 'El vi es el acorde melancólico de la tonalidad. No cambia de ' +
     'tono, cambia de color. Es la nota triste dentro de una canción alegre, ' +
     'y en alabanza aparece constantemente porque permite decir cosas hondas ' +
     'sin salir de la tonalidad.',
   ejercicios: ['B4']},

  {dia: 19, titulo: 'I–V–vi–IV',
   leccion: 'La progresión más usada del planeta. Cientos de canciones son ' +
     'esos cuatro acordes en ese orden. Hoy tócala en tu tonalidad y ' +
     'reconócela de oído: cuando la tengas, tienes medio repertorio.',
   ejercicios: ['B4', 'C2']},

  {dia: 20, titulo: 'Repaso del círculo',
   leccion: 'Sin material nuevo. Toca I, IV, V y vi de tu tonalidad hasta ' +
     'que la mano vaya sola. La meta no es saberlos: es no tener que ' +
     'pensarlos.',
   ejercicios: ['B3', 'B4'], repaso: true},

  {dia: 21, titulo: 'Segunda medición',
   leccion: 'Graba otros cinco minutos por MIDI. Compara con el día 7: la ' +
     'separación de manos debería haber subido. Si no subió, no pasa nada ' +
     'y tampoco significa nada malo: dos semanas es poco. El número está ' +
     'para verlo moverse en meses, no en días.',
   ejercicios: ['A2', 'A5'], midi: 'independencia', control: true},

  {dia: 22, titulo: 'Cómo se cierra una frase',
   leccion: 'Una cadencia es el punto final de la música. V–I cierra con ' +
     'firmeza: se acabó. IV–I cierra suave, como un amén. Saber cerrar es ' +
     'lo que distingue a alguien que acompaña de alguien que se queda ' +
     'colgado esperando que otro termine.',
   ejercicios: ['C4']},

  {dia: 23, titulo: 'El V7 y su tirón',
   leccion: 'Añade al V la nota que está un tono debajo de su fundamental, ' +
     'una octava arriba. Eso es la séptima, y multiplica el tirón hacia el ' +
     'I. Es una sola tecla más y cambia por completo la sensación de que ' +
     'algo va a resolver.',
   ejercicios: ['D3'], nuevo: true},

  {dia: 24, titulo: 'La séptima como forma, no como cuenta',
   leccion: 'Hoy dejas de calcularla. La séptima menor es siempre el mismo ' +
     'gesto de mano: meñique un tono por debajo de la fundamental, arriba. ' +
     'Repítelo en cuatro tonalidades distintas hasta que la mano lo haga ' +
     'sin que la cabeza intervenga. Eso es tocar de verdad.',
   ejercicios: ['D3']},

  {dia: 25, titulo: 'La misma canción en otro tono',
   leccion: 'Toca la progresión de siempre subiendo todo un tono. Si sabes ' +
     'los números (I, IV, V) en vez de los nombres, transportar es ' +
     'automático. Esto es lo que te va a permitir bajarle el tono a una ' +
     'canción cuando la asamblea no llegue a las notas altas.',
   ejercicios: ['C2', 'B3']},

  {dia: 26, titulo: 'Bajar por quintas',
   leccion: 'Las progresiones que se mueven hacia atrás en el círculo suenan ' +
     'a que caen solas, sin esfuerzo. vi–ii–V–I es eso: cuatro pasos ' +
     'seguidos en la rueda. Tócala y siente cómo cada acorde empuja al ' +
     'siguiente.',
   ejercicios: ['B4', 'C2'], nuevo: true},

  {dia: 27, titulo: 'Repaso intercalado',
   leccion: 'Círculo, séptimas y manos, alternando. Recuerda: menos ' +
     'sensación de progreso, más retención real.',
   ejercicios: ['B4', 'D3', 'A3'], repaso: true},

  {dia: 28, titulo: 'ii–V–I',
   leccion: 'La progresión que sostiene el jazz y buena parte de la música ' +
     'moderna de adoración. El ii prepara al V y el V resuelve al I: tres ' +
     'pasos consecutivos bajando por el círculo. Es la cadencia más elegante ' +
     'que existe.',
   ejercicios: ['B4', 'C2']},

  {dia: 29, titulo: 'Sacar los acordes de una canción nueva',
   leccion: 'Con el atril tapado, saca la estrofa de una canción que no ' +
     'conozcas. Busca el 1 primero, después decide si cada cambio va al IV, ' +
     'al V o al vi. Vas a fallar y está bien: fallar y comprobar es ' +
     'exactamente el mecanismo que entrena el oído.',
   ejercicios: ['B5']},

  {dia: 30, titulo: 'Cierre de la segunda fase',
   leccion: 'Un mes. Si hoy puedes encontrar la tónica de una canción y ' +
     'reconocer cuándo va al V, ya tienes algo que la mayoría de quienes ' +
     '"tocan piano" no tiene. Y en un mes.',
   ejercicios: ['B5', 'C2'], control: true},

  // ============================ FASE 3 — COLOR Y RELLENO (31-48)
  {dia: 31, titulo: 'Conducción de voces',
   leccion: 'Entre dos acordes, casi siempre hay notas comunes. Si las dejas ' +
     'quietas y mueves solo lo necesario, la mano deja de saltar y la música ' +
     'suena ligada. Es la diferencia técnica más grande entre sonar a ' +
     'principiante y sonar a pianista. El atril ya te calcula la inversión ' +
     'más cercana: solo tienes que copiar lo que ves.',
   ejercicios: ['C2'], nuevo: true},

  {dia: 32, titulo: 'Voicings abiertos',
   leccion: 'En vez de apretar las tres notas juntas, sepáralas entre las ' +
     'dos manos y a lo largo del teclado. El mismo acorde con las notas ' +
     'espaciadas suena más rico y más grande. Los acordes apretados en el ' +
     'registro grave suenan a barro.',
   ejercicios: ['C1', 'C2'], nuevo: true},

  {dia: 33, titulo: 'La décima en la izquierda',
   leccion: 'La izquierda toca la fundamental grave y las otras dos notas ' +
     'en el registro medio, una décima arriba. Ese espaciado suena precioso ' +
     'y libera la derecha para la melodía. Si la mano no alcanza, se toca ' +
     'partida: primero la grave, después las otras.',
   ejercicios: ['A4'], nuevo: true},

  {dia: 34, titulo: 'La novena',
   leccion: 'Sobre un acorde mayor, añade con el meñique la nota que está un ' +
     'tono encima de la fundamental. Es el ingrediente que suena moderno y ' +
     'de adoración. Una tecla, cambio enorme.',
   ejercicios: ['C3'], nuevo: true},

  {dia: 35, titulo: 'Suspender y resolver',
   leccion: 'El sus4 quita la tercera y pone la cuarta: el acorde queda ' +
     'colgado, sin decidir si es alegre o triste. Déjalo sonar un pulso y ' +
     'resuélvelo. Es el recurso que hace que la entrada de un estribillo se ' +
     'sienta como una puerta que se abre.',
   ejercicios: ['C4']},

  {dia: 36, titulo: 'Notas de paso',
   leccion: 'El hueco entre dos acordes es donde se nota si alguien ' +
     'acompaña o solo aprieta acordes. Sube o baja por la escala con la ' +
     'derecha hasta llegar al siguiente. Una nota por pulso, sin adornos.',
   ejercicios: ['D1'], nuevo: true},

  {dia: 37, titulo: 'Tercera medición',
   leccion: 'Graba por MIDI. Hoy el número que importa no es solo la ' +
     'separación de manos: son los huecos. Cuántos silencios de más de ' +
     'ocho décimas dejas, y qué porcentaje del tiempo el piano calla sin ' +
     'querer.',
   ejercicios: ['D1', 'A4'], midi: 'huecos', control: true},

  {dia: 38, titulo: 'Rellenar donde calla la voz',
   leccion: 'Silencia la voz en la consola y escucha dónde descansa el ' +
     'cantante. Ahí, y solo ahí, mete tres notas con la derecha. Los huecos ' +
     'que sientes al tocar están exactamente donde la voz respira: es el ' +
     'sitio donde el piano tiene que contestar.',
   ejercicios: ['D2']},

  {dia: 39, titulo: 'Pregunta y respuesta',
   leccion: 'La melodía pregunta, tú contestas. Escucha una frase completa y ' +
     'cuando termine responde con notas del acorde en curso. Eso es lo que ' +
     'hace que un acompañamiento suene conversado en vez de mecánico.',
   ejercicios: ['D5'], nuevo: true},

  {dia: 40, titulo: 'El bajo que baja cromático',
   leccion: 'Entre dos acordes, baja la izquierda por semitonos aunque las ' +
     'notas no pertenezcan a la armonía. Suena a cine, a que algo se está ' +
     'derrumbando hacia su sitio. Úsalo poco y en el momento justo.',
   ejercicios: ['D4']},

  {dia: 41, titulo: 'Arpegios que respiran',
   leccion: 'En vez de tocar el acorde de golpe, desgránalo: fundamental, ' +
     'quinta, octava, tercera. Deja el pedal. El acorde sigue ahí pero ahora ' +
     'tiene movimiento. Es la textura de la mayoría de las baladas de ' +
     'adoración.',
   ejercicios: ['A4']},

  {dia: 42, titulo: 'Repaso intercalado',
   leccion: 'Color, relleno y manos. Sin novedad. La novedad es recompensa, ' +
     'no dieta: un método que promete algo nuevo cada día se abandona en la ' +
     'cuarta semana.',
   ejercicios: ['C3', 'D1', 'A4'], repaso: true},

  {dia: 43, titulo: 'Acordes largos para orar',
   leccion: 'Para sostener un momento de oración no hace falta movimiento: ' +
     'hace falta que no se acabe. Acordes de redonda o más, con las notas ' +
     'espaciadas en cuartas y quintas abiertas. Los acordes apretados se ' +
     'emborronan cuando duran; los abiertos se sostienen limpios.',
   ejercicios: ['C5'], nuevo: true},

  {dia: 44, titulo: 'Cuartas y quintas abiertas',
   leccion: 'Quita la tercera del acorde. Sin tercera no es ni mayor ni ' +
     'menor: queda abierto, sin decidir. En un momento de oración eso ' +
     'sostiene sin imponer un ánimo. Es el sonido que no estorba.',
   ejercicios: ['C1', 'C5']},

  {dia: 45, titulo: 'El volumen como oración',
   leccion: 'Toca la misma progresión susurrada y después con cuerpo. Para ' +
     'acompañar oración la dinámica importa más que las notas: un piano que ' +
     'no varía de volumen no acompaña, tapa. Si alguien está rezando en voz ' +
     'baja y tú tocas fuerte, lo callaste.',
   ejercicios: ['C5']},

  {dia: 46, titulo: 'Repaso',
   leccion: 'Sin novedad. Recuerda lo que dice la evidencia: la mejora llega ' +
     'después de dormir. Un día de repaso no es un día perdido, es el día en ' +
     'que se fija lo anterior.',
   ejercicios: ['D2', 'C3', 'A5'], repaso: true},

  {dia: 47, titulo: 'Improvisar con las notas del acorde',
   leccion: 'Sobre cada acorde, la derecha se mueve libre pero solo con las ' +
     'notas de ese acorde. No puedes equivocarte: cualquier orden suena ' +
     'bien. Es la primera improvisación de verdad y es más fácil de lo que ' +
     'parece.',
   ejercicios: ['D5'], nuevo: true},

  {dia: 48, titulo: 'Cierre de la tercera fase',
   leccion: 'Toca una canción entera usando todo: décimas abajo, ' +
     'inversiones arriba, una novena donde quepa, notas de paso entre ' +
     'acordes. Escúchate. Esto ya no suena a acordes apretados.',
   ejercicios: ['C2', 'D1', 'A4'], control: true},

  // ================================= FASE 4 — ACOMPAÑAR (49-66)
  {dia: 49, titulo: 'Una canción completa, lenta',
   leccion: 'De principio a fin, sin parar, al 70% de velocidad. Si te ' +
     'equivocas sigues: parar a corregir en mitad de una canción es un ' +
     'hábito de estudio que arruina el de tocar. En vivo no hay repetición.',
   ejercicios: ['C2', 'A3']},

  {dia: 50, titulo: 'Cómo se empieza una canción',
   leccion: 'Una intro no es adorno: le dice a la gente en qué tono va a ' +
     'cantar y cuándo entrar. Lo más simple que funciona: los últimos cuatro ' +
     'acordes del estribillo, en arpegio, y entrar en el I.',
   ejercicios: ['A4'], nuevo: true},

  {dia: 51, titulo: 'Cómo se cierra',
   leccion: 'Terminar es más difícil que empezar. Lo que casi siempre ' +
     'funciona: repetir el último acorde bajando de intensidad y dejarlo ' +
     'sonar con pedal hasta que se apague solo. No cortes seco: en oración ' +
     'el silencio necesita entrada, no portazo.',
   ejercicios: ['C5']},

  {dia: 52, titulo: 'Acompañar a alguien que canta',
   leccion: 'Deja la voz al 100% en la consola y tócale debajo. Tu trabajo ' +
     'no es que te oigan: es que el cantante no se pierda. Si dudas, toca ' +
     'menos. El acompañante que se nota demasiado está estorbando.',
   ejercicios: ['C5', 'D2']},

  {dia: 53, titulo: 'Tocar sin cantante',
   leccion: 'Ahora silencia la voz. Todo lo que hacía el cantante lo tienes ' +
     'que sugerir tú con la derecha: la melodía, aunque sea a medias. Aquí ' +
     'es donde se paga el trabajo de independencia de las primeras semanas.',
   ejercicios: ['A4', 'D5']},

  {dia: 54, titulo: 'Cuarta medición',
   leccion: 'Graba por MIDI tocando una canción entera. Compara los tres ' +
     'números con el día 7: manos, huecos y dinámica. Aquí es donde el ' +
     '"no avanzo nunca" se topa con los datos.',
   ejercicios: ['C2', 'D2'], midi: 'completo', control: true},

  {dia: 55, titulo: 'Cambiar de tono en mitad de una canción',
   leccion: 'Subir un tono en el último estribillo levanta un momento de ' +
     'oración como pocas cosas. El truco más simple: toca el V del tono ' +
     'nuevo justo antes de entrar. El oído lo acepta sin resistirse.',
   ejercicios: ['B4', 'C4'], nuevo: true},

  {dia: 56, titulo: 'Bajarle el tono a la asamblea',
   leccion: 'La gente no canta en el tono del disco. Si ves que nadie llega ' +
     'a las notas altas, baja dos o tres semitonos. Pensando en números ' +
     'esto es inmediato; pensando en nombres de acordes es un infierno. Por ' +
     'eso importó tanto la fase 2.',
   ejercicios: ['B3', 'C2']},

  {dia: 57, titulo: 'Sostener el silencio',
   leccion: 'En un momento de oración el piano a veces solo tiene que ' +
     'sostener un acorde abierto mientras alguien habla. Practícalo: un ' +
     'acorde, sin tercera, pedal, quieto, durante un minuto entero sin ' +
     'ponerte nervioso y llenarlo de notas.',
   ejercicios: ['C5', 'C1']},

  {dia: 58, titulo: 'Repaso',
   leccion: 'Sin novedad. Estás a ocho días de los 66. Este es el tramo ' +
     'donde históricamente lo dejas: cuando ya no hay nada nuevo y solo ' +
     'queda volver. Volver es todo lo que se pide hoy.',
   ejercicios: ['A4', 'C2', 'D2'], repaso: true},

  {dia: 59, titulo: 'Sacar una canción entera de oído',
   leccion: 'Una canción que no conozcas, el atril tapado del todo. Saca la ' +
     'estrofa y el estribillo. Si llegas, esto era el objetivo que dijiste ' +
     'al empezar: llegar a una canción nueva y poder tocarla sin que nadie ' +
     'te dé los acordes.',
   ejercicios: ['B5'], control: true},

  {dia: 60, titulo: 'Tocar de memoria',
   leccion: 'Una canción que ya domines, sin mirar el atril. Vas a ' +
     'equivocarte más, y es exactamente el punto: el error te dice qué ' +
     'partes sabías de verdad y cuáles estabas leyendo.',
   ejercicios: ['C2', 'A4']},

  {dia: 61, titulo: 'Con los ojos cerrados',
   leccion: 'Suena a ejercicio de circo y no lo es: obliga a que la mano ' +
     'conozca las distancias sin la vista. Es lo que te va a permitir mirar ' +
     'a la asamblea en vez de al teclado, que es la diferencia entre tocar ' +
     'y dirigir un momento de oración.',
   ejercicios: ['A3', 'C1']},

  {dia: 62, titulo: 'Un momento de oración completo',
   leccion: 'Arma cinco minutos seguidos: entrada suave, una canción, un ' +
     'sostenido abierto para que alguien pueda hablar encima, y cierre que ' +
     'se apaga. Eso es el oficio entero. No es virtuosismo: es servicio.',
   ejercicios: ['C5', 'D2', 'A4']},

  {dia: 63, titulo: 'Repaso general',
   leccion: 'Lo que peor te salga de todo el método. Sin excusas y sin ' +
     'castigo: solo el que peor esté.',
   ejercicios: ['A5', 'B5', 'D1'], repaso: true},

  {dia: 64, titulo: 'Medición final',
   leccion: 'Graba por MIDI los mismos cinco minutos del día 7. Mismo ' +
     'formato, mismas manos, dos meses después. Este es el día del método ' +
     'que más va a valer, y no por lo que toques: por lo que vas a poder ' +
     'comparar.',
   ejercicios: ['A1', 'A2'], midi: 'independencia', control: true},

  {dia: 65, titulo: 'Lo que ya sabes hacer',
   leccion: 'Hoy no se aprende nada. Toca las cosas que el día 1 no te ' +
     'salían. Si alguien te pregunta si sabes tocar piano, ya tienes datos ' +
     'para contestar sin encogerte: no una opinión sobre ti, números.',
   ejercicios: ['A5', 'C3', 'D5'], repaso: true},

  {dia: 66, titulo: 'Tocar para Dios',
   leccion: 'Sesenta y seis días. El hábito ya no depende de las ganas. ' +
     'Hoy no hay ejercicio ni medición: toca lo que quieras, para Quien ' +
     'empezaste a hacer todo esto. Como Cecilia, que cantaba por dentro ' +
     'mientras sonaba la música alrededor.',
   ejercicios: [], oracion: 'o7', libre: true},
];

export function diaDe(n) {
  return DIAS.find((d) => d.dia === n) || null;
}

// Los ejercicios que trae el día enseñan su tema, pero muchos días no
// llegan solos a los 5 minutos prometidos. Se completan con ejercicios de
// OTRAS vías, que además es lo que dice la evidencia: alternar retiene
// mejor que repetir. Nunca se rellena con más de lo mismo.
export function ejerciciosDelDia(n) {
  const d = diaDe(n);
  if (!d || d.libre) return [];

  const base = (d.ejercicios || []).map(porId).filter(Boolean);
  let minutos = base.reduce((a, e) => a + e.minutos, 0);
  if (minutos >= PISO_MINUTOS) return base;

  const usadas = new Set(base.map((e) => e.via));
  const puestos = new Set(base.map((e) => e.id));
  const fase = faseDe(n);
  // Cuanto más avanzada la fase, más alto el nivel que puede entrar
  const techo = Math.min(4, fase.id);

  const candidatos = EJERCICIOS
    .filter((e) => !puestos.has(e.id) && e.nivel <= techo)
    .sort((a, b) => {
      // Primero una vía que no esté hoy; después, lo más corto que quepa
      const na = usadas.has(a.via) ? 1 : 0;
      const nb = usadas.has(b.via) ? 1 : 0;
      if (na !== nb) return na - nb;
      return a.minutos - b.minutos;
    });

  const salida = base.slice();
  for (const e of candidatos) {
    if (minutos >= PISO_MINUTOS) break;
    salida.push(e);
    puestos.add(e.id);
    usadas.add(e.via);
    minutos += e.minutos;
  }
  return salida;
}

export function oracionDe(n) {
  const d = diaDe(n);
  if (d && d.oracion) return ORACIONES.find((o) => o.id === d.oracion);
  return ORACIONES[(n - 1) % ORACIONES.length];
}
