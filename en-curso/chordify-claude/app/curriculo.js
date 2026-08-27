// Currículo de práctica, diseñado sobre un diagnóstico concreto:
//
//   Mayores y menores ... fluidos en cualquier tonalidad  (resuelto)
//   sus2 y alteraciones . un poco más lentos              (afinar)
//   Séptimas ............ no las sabe, las calcula        (hueco)
//   Manos ............... se traban                       (cuello de botella)
//   Oído armónico ....... saca melodía, no armonía        (hueco principal)
//   Rellenar huecos ..... toca acordes, deja silencios    (lo que suena "pro")
//
// Por eso casi no hay ejercicios de acordes mayores y menores: esa parte ya
// está. El peso va a manos, oído, séptimas y a rellenar, que es lo que
// separa "sé los acordes" de "el piano canta".
//
// Cada ejercicio va sobre música real de la biblioteca, no sobre patrones
// abstractos: los ejercicios sueltos son justo lo que se abandonó otras veces.

export const VIAS = {
  A: {nombre: 'Manos', color: '#ffb64a',
      idea: 'Que cada mano haga lo suyo sin contaminarse'},
  B: {nombre: 'Oído', color: '#4aa3ff',
      idea: 'Reconocer funciones armónicas de oído, no memorizar canciones'},
  C: {nombre: 'Canto', color: '#a371f7',
      idea: 'Lo que hace que suene bonito en vez de plano'},
  D: {nombre: 'Rellenar', color: '#5ad1c4',
      idea: 'Que no queden huecos entre acorde y acorde'},
};

export const EJERCICIOS = [
  // ---------------------------------------------------- VÍA A: manos
  {
    id: 'A1', via: 'A', nivel: 1, minutos: 2,
    titulo: 'Izquierda quieta, derecha en movimiento',
    consigna: 'Mano izquierda: solo la fundamental del acorde, sostenida, una por compás. ' +
      'Mano derecha: el acorde en negras, marcando el pulso. Nada más.',
    porque: 'Es el primer escalón de la independencia: una mano sostiene mientras la otra ' +
      'se mueve. Si las dos caen juntas, no hay acompañamiento posible.',
    tempo: 0.7, modo: 'teclado',
  },
  {
    id: 'A2', via: 'A', nivel: 1, minutos: 2,
    titulo: 'El bajo camina',
    consigna: 'Izquierda: fundamental y quinta alternando, en blancas. ' +
      'Derecha: el acorde sostenido, sin moverse.',
    porque: 'Se invierten los papeles: ahora la que se mueve es la izquierda. ' +
      'Aquí es donde aparece el traba, y es exactamente lo que hay que entrenar.',
    tempo: 0.7, modo: 'teclado',
  },
  {
    id: 'A3', via: 'A', nivel: 2, minutos: 3,
    titulo: 'Octavas abajo, inversiones arriba',
    consigna: 'Izquierda: la fundamental en octava. Derecha: el acorde en la inversión ' +
      'que muestra el atril, moviéndose lo mínimo entre acordes.',
    porque: 'Es el sonido de acompañamiento de verdad. El atril ya te calcula la inversión ' +
      'más cercana, así que solo tienes que copiar lo que ves.',
    tempo: 0.85, modo: 'teclado',
  },
  {
    id: 'A4', via: 'A', nivel: 3, minutos: 3,
    titulo: 'Izquierda arpegia, derecha canta',
    consigna: 'Izquierda: fundamental, quinta, octava, una nota por pulso. ' +
      'Derecha: solo la melodía, una nota a la vez.',
    porque: 'Dos ritmos distintos a la vez. Es la prueba real de independencia y ' +
      'la puerta a tocar sin que nadie cante.',
    tempo: 0.7, modo: 'teclado',
  },
  {
    id: 'A5', via: 'A', nivel: 4, minutos: 3,
    titulo: 'Ritmos cruzados',
    consigna: 'Izquierda en el 1 y el 3. Derecha en el 2 y el 4, a contratiempo. ' +
      'Empieza lentísimo.',
    porque: 'El examen final de independencia. Si esto sale, ya puedes acompañar ' +
      'cualquier cosa.',
    tempo: 0.5, modo: 'teclado',
  },

  // ----------------------------------------------------- VÍA B: oído
  {
    id: 'B1', via: 'B', nivel: 1, minutos: 2,
    titulo: 'Encontrar el uno',
    consigna: 'Reproduce la canción sin mirar el acorde. Busca en el piano la nota ' +
      'donde todo "descansa". Después mira si acertaste la tónica.',
    porque: 'Todo el oído armónico empieza aquí. Sin encontrar el 1, los demás ' +
      'acordes no tienen contra qué medirse.',
    tempo: 1.0, modo: 'teclado', tapar: true,
  },
  {
    id: 'B2', via: 'B', nivel: 1, minutos: 2,
    titulo: 'I o V',
    consigna: 'Con el acorde tapado: en cada cambio, decide si volvió al I (reposo) ' +
      'o se fue al V (tensión, pide resolver). Después destapa y comprueba.',
    porque: 'Son los dos polos de toda la música tonal. Distinguirlos de oído es ' +
      'el 60% del trabajo.',
    tempo: 1.0, modo: 'teclado', tapar: true,
  },
  {
    id: 'B3', via: 'B', nivel: 2, minutos: 3,
    titulo: 'Entra el IV',
    consigna: 'Igual que antes, pero ahora distinguiendo I, IV y V. ' +
      'El IV suena a "abrirse", ni reposo ni tensión.',
    porque: 'Con I, IV y V se acompaña la mayoría del repertorio de alabanza.',
    tempo: 1.0, modo: 'teclado', tapar: true,
  },
  {
    id: 'B4', via: 'B', nivel: 3, minutos: 3,
    titulo: 'El relativo menor',
    consigna: 'Agrega el vi. Escucha el color: es el que pone la canción melancólica ' +
      'sin cambiar de tonalidad.',
    porque: 'I–V–vi–IV es la progresión más usada del mundo. Reconocer el vi te ' +
      'desbloquea muchísimo repertorio.',
    tempo: 1.0, modo: 'teclado', tapar: true,
  },
  {
    id: 'B5', via: 'B', nivel: 4, minutos: 4,
    titulo: 'Sacar la progresión entera',
    consigna: 'Canción nueva, acordes tapados. Saca los cuatro acordes de la estrofa ' +
      'solo de oído. Después destapa y compara.',
    porque: 'Es el objetivo completo: llegar a una canción que no conoces y sacarla.',
    tempo: 1.0, modo: 'teclado', tapar: true,
  },

  // ---------------------------------------------------- VÍA C: canto
  {
    id: 'C1', via: 'C', nivel: 1, minutos: 1,
    titulo: 'La misma nota, distinto lugar',
    consigna: 'Toca el acorde en estado fundamental, luego primera inversión, ' +
      'luego segunda. Escucha cómo cambia sin cambiar de acorde.',
    porque: 'Tocar todo en estado fundamental es lo que hace que suene plano. ' +
      'Las inversiones son el primer paso para que respire.',
    tempo: 1.0, modo: 'teclado',
  },
  {
    id: 'C2', via: 'C', nivel: 2, minutos: 2,
    titulo: 'Que la mano no salte',
    consigna: 'Sigue las inversiones del atril durante toda una estrofa. ' +
      'Fíjate cuántos dedos se quedan quietos entre acorde y acorde.',
    porque: 'Conducción de voces. Es la diferencia técnica más grande entre sonar ' +
      'a principiante y sonar a pianista.',
    tempo: 0.85, modo: 'teclado',
  },
  {
    id: 'C3', via: 'C', nivel: 2, minutos: 2,
    titulo: 'Añade la novena',
    consigna: 'Sobre los acordes mayores, agrega con el meñique la nota que está ' +
      'un tono encima de la fundamental. Escucha el color.',
    porque: 'Es el ingrediente que suena "moderno" y de adoración. Una nota, ' +
      'cambio enorme.',
    tempo: 1.0, modo: 'teclado',
  },
  {
    id: 'C4', via: 'C', nivel: 3, minutos: 2,
    titulo: 'Suspender y resolver',
    consigna: 'Antes de cada acorde importante, toca el sus4 y déjalo un pulso ' +
      'antes de resolver al acorde.',
    porque: 'Crea expectativa y resolución. Es el recurso que hace que una entrada ' +
      'de estribillo se sienta.',
    tempo: 0.85, modo: 'teclado',
  },
  {
    id: 'C5', via: 'C', nivel: 3, minutos: 2,
    titulo: 'Fuerte y suave',
    consigna: 'Toca la misma progresión dos veces: una casi susurrada, otra con ' +
      'cuerpo. Sin cambiar nada más que la fuerza.',
    porque: 'Para acompañar oración, la dinámica importa más que las notas. ' +
      'Un piano que no varía de volumen no acompaña, tapa.',
    tempo: 1.0, modo: 'teclado',
  },

  // ------------------------------------------------ VÍA D: rellenar
  {
    id: 'D1', via: 'D', nivel: 1, minutos: 2,
    titulo: 'La escalera entre dos acordes',
    consigna: 'Toca un acorde, y antes del siguiente sube o baja con la mano ' +
      'derecha por las notas de la escala hasta llegar. Una nota por pulso.',
    porque: 'Son las notas de paso. El hueco entre acorde y acorde es donde ' +
      'se nota si alguien acompaña o solo aprieta acordes.',
    tempo: 0.7, modo: 'teclado',
  },
  {
    id: 'D2', via: 'D', nivel: 2, minutos: 2,
    titulo: 'Rellenar donde nadie canta',
    consigna: 'Silencia la voz en la consola. Donde el cantante calla, ' +
      'mete algo con la derecha: tres notas, no más.',
    porque: 'Los huecos que sientes son huecos reales, y están donde la voz ' +
      'descansa. Ahí es donde el piano tiene que contestar.',
    tempo: 0.85, modo: 'teclado',
  },
  {
    id: 'D3', via: 'D', nivel: 2, minutos: 2,
    titulo: 'La séptima, sin calcularla',
    consigna: 'Toca el acorde mayor y añade el dedo meñique un tono por debajo ' +
      'de la fundamental (una octava arriba). Esa es la séptima. Sin contar.',
    porque: 'Ya usas esa fórmula a medias en la cabeza. Aquí se convierte en ' +
      'forma de mano, que es como se toca de verdad: sin pensar.',
    tempo: 1.0, modo: 'teclado',
  },
  {
    id: 'D4', via: 'D', nivel: 3, minutos: 3,
    titulo: 'Bajar por el bajo',
    consigna: 'Entre dos acordes, baja la mano izquierda por notas seguidas ' +
      'aunque no sean del acorde. Deja que la derecha sostenga.',
    porque: 'Es el recurso que hace que una progresión suene inevitable. ' +
      'La línea del bajo tira de la canción.',
    tempo: 0.7, modo: 'teclado',
  },
  {
    id: 'D5', via: 'D', nivel: 4, minutos: 3,
    titulo: 'Contestar la frase',
    consigna: 'Escucha una frase de la melodía. Cuando termine, contéstala ' +
      'con la derecha usando notas del acorde en curso.',
    porque: 'Pregunta y respuesta. Es lo que hace que un acompañamiento ' +
      'suene conversado y no mecánico.',
    tempo: 0.85, modo: 'teclado',
  },
];

export const PISO_MINUTOS = 5;    // el mínimo sagrado: nunca se falla

export function porId(id) {
  return EJERCICIOS.find((e) => e.id === id) || null;
}
