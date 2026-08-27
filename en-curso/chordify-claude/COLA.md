# Cola del proyecto

Todo lo pedido, en orden. Nada se empieza sin terminar lo anterior.

---

## Hecho

- **Hoja de cifrado**: la letra con cada acorde encima de su sílaba, en dos
  versiones (sencilla y completa). Nunca un acorde sin texto debajo
- **Entrenador de acordes**: inventario → aprender → cambios, por canción o
  por toda la biblioteca. Lo que sabes se guarda global

- **Atril**: acordes, letra y batería sincronizados con tiempos medidos del audio
- **Cuatro modos**: Guitarra, Teclado, Notas (rollo), Batería
- **Consola de 6 pistas** colapsable, con presets
- **Mástil de guitarra** en SVG, con cejilla como barra y número de traste grande
- **Piano siempre en estado fundamental** (sin inversiones: el teclado está
  para enseñar el acorde que no te sabes, y a uno invertido no se le ve la
  tónica de un vistazo)
- **Batería**: bombo, caja y platillo (tom y hi-hat/crash descartados, ver abajo)
- **Rollo de piano** estilo Synthesia, para canciones con piano real
- **Calibración por oído** (botón Marcar) y ajuste fino por canción
- **Móvil**: vertical y horizontal, sin scroll interno, pantalla que no se apaga
- **Módulo de práctica**: 20 ejercicios, sesión diaria de 5 min, sin rachas

---

## En cola

### 1. MIDI del piano — corregir lo que toca de verdad
El P-515 tiene **USB TO HOST**. Con un cable USB-B a USB-A y la Web MIDI API,
la app sabe exactamente qué tecla, con qué fuerza y en qué milisegundo. Habilita:

- Corrección real: «tocaste Fa# donde iba Fa, compás 12»
- **Independencia de manos medida en milisegundos** — el cuello de botella
  deja de ser una sensación y pasa a ser un número que sube o baja
- Ejercicios de oído autocorregidos: toca lo que crees, la app compara
- Detección de huecos: dónde deja de sonar el piano

Funciona en Chrome, Edge, Firefox y Android. **No en iPhone/iPad** (Apple no
implementa Web MIDI). El micrófono sería una aproximación borrosa de algo que
el cable entrega exacto: no vale la pena salvo como respaldo para iOS.

### 2. Examen periódico
Cada 2 o 3 semanas, medir de nuevo lo mismo que se midió al principio y
guardar el resultado. Es la munición contra el «no avanzo nunca»: cuando
aparezca esa sensación, poder mostrar la curva.

### 3. Repertorio de oración
Marcar canciones como «las que quiero poder tocar» y que el método las use
como meta concreta, no solo como material de ejercicio.

### 4. Método de guitarra (v2)
Mismo esquema que el de piano. **Antes hay que resolver el instrumento**: el
mástil actual es muy ancho y las cejillas salen duras. Con una guitarra de
mástil delgado el método arranca sin pelear contra la mano.

### 5. Método de batería (v2)
Sobre la Yamaha DD-75. Verificar si trae MIDI: si lo tiene, se corrige igual
que el piano.

---

## Descartado, y por qué

No volver a intentarlos sin evidencia nueva.

| Idea | Por qué no |
|---|---|
| Separar **tom** de bombo y caja | Comparte graves con el bombo y medios con la caja. Zona gris irresoluble por frecuencia |
| Separar **hi-hat de crash/ride** | La caída del mismo plato varía casi al doble entre grabaciones (0.308 s vs 0.168 s). Con umbral fijo, una canción sale llena de crashes y otra sin ninguno |
| Separar **guitarra acústica de eléctrica** | Ningún modelo público lo hace: la diferencia es de timbre, no de contenido separable |
| Transcribir piano desde la **mezcla completa** | Da 2443 notas contra 1344 del stem. Peor, no mejor |
| Filtrar notas de piano **por el acorde detectado** | Las notas fuera del acorde tienen velocidad 45 y las de dentro 46. Indistinguibles: borrarlas se lleva melodía real |
| Subir las canciones a **GitHub Pages o Netlify** | Son grabaciones comerciales completas. Publicarlas es redistribuir música ajena. El código sí puede subirse |

---

## Notas de diseño que no hay que perder

**El piso son 5 minutos y no se falla.** No es la meta, es el mínimo. Lo que
se toque de más es regalo, no adelanto.

**No hay rachas.** Un contador que se resetea a cero activa el patrón
«fallo → abandono». Cada día hecho queda pintado para siempre.

**Un día perdido no importa.** Lally (2010), 96 personas seguidas 84 días:
fallar una vez es estadísticamente invisible. Lo que frena la curva son dos o
tres seguidos. Por eso el único aviso del sistema aparece al segundo día, no
al primero.

**La práctica intercalada se siente peor de lo que funciona.** Retiene más
que repetir en bloque, pero da menos sensación de fluidez. Hay que avisarlo o
se interpreta como falta de avance.

**La novedad es recompensa, no dieta.** Un método basado en «algo nuevo cada
día» da combustible tres semanas y luego deja tirado. El currículo repite un
set pequeño a propósito.
