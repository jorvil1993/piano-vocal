// Motor de lecciones: UNA lección a la vez, en orden, sabiendo dónde te
// quedaste. Nada suelto, nada flotando.
//
// La versión anterior era una página con piezas sueltas —un círculo aquí,
// unos botones allá— sin explicar por qué ni en qué orden. Eso desmotiva
// más que ayudar. Ahora cada concepto vive dentro de la lección que lo
// necesita, y la lección tiene una forma fija:
//
//   por qué importa → se ve y se oye → pasos numerados → qué practicar
//
// Todo ejemplo suena. Los ejercicios de oído conocen la respuesta correcta,
// así que corrigen de verdad en vez de decir "mira si acertaste".
import { LECCIONES, leccionDe, CANCIONES, TOTAL_ESCRITAS } from './lecciones-datos.js';
import { Teclado, nombreDe } from './visuales.js';
import { tocarNota, tocarAcorde, reproducir, despertar } from './sonido.js';

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VIAS = {A: 'Manos', B: 'Oído', C: 'Canto', D: 'Rellenar'};
const COLOR_VIA = {A: '#ffb64a', B: '#4aa3ff', C: '#a371f7', D: '#5ad1c4'};
const $ = (id) => document.getElementById(id);

class Lecciones {
  constructor() {
    this.n = this.leerNumero();
    this.pararActual = null;
    this.arrancar();
  }

  leerNumero() {
    const p = new URLSearchParams(location.search);
    const pedida = parseInt(p.get('n'), 10);
    if (pedida >= 1 && pedida <= TOTAL_ESCRITAS) return pedida;
    const guardada = parseInt(localStorage.getItem('leccion-actual'), 10);
    return (guardada >= 1 && guardada <= TOTAL_ESCRITAS) ? guardada : 1;
  }

  async arrancar() {
    try {
      const d = await (await fetch('/api/practica')).json();
      this.hechas = new Set((d.lecciones || []).map(Number));
    } catch (e) {
      this.hechas = new Set();
    }
    this.pintar();
  }

  ir(n) {
    if (n < 1 || n > TOTAL_ESCRITAS) return;
    this.detener();
    this.n = n;
    localStorage.setItem('leccion-actual', String(n));
    history.replaceState(null, '', '?n=' + n);
    this.pintar();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  detener() {
    if (this.pararActual) { this.pararActual(); this.pararActual = null; }
  }

  // ========================================================== pintado

  pintar() {
    const l = leccionDe(this.n);
    if (!l) return;
    this.l = l;

    document.documentElement.style.setProperty('--via-color', COLOR_VIA[l.via]);
    $('lec-num').textContent = 'Lección ' + l.n;
    $('lec-total').textContent = 'de ' + TOTAL_ESCRITAS + ' escritas';
    $('lec-titulo').textContent = l.titulo;
    $('lec-via').textContent = VIAS[l.via] || '';
    $('lec-aprendes').textContent = l.aprendes || '';
    $('lec-aprendes').parentElement.classList.toggle('oculta', !l.aprendes);
    $('lec-porque').textContent = l.porque;

    this.pintarIndice();
    this.pintarDemos();
    this.pintarPrueba();
    this.pintarPasos();
    this.pintarPractica();
    this.pintarNavegacion();
  }

  pintarIndice() {
    const cont = $('indice');
    cont.innerHTML = '';
    for (const l of LECCIONES) {
      const b = document.createElement('button');
      b.className = 'idx' + (l.n === this.n ? ' actual' : '') +
                    (this.hechas.has(l.n) ? ' hecha' : '');
      b.style.setProperty('--via', COLOR_VIA[l.via]);
      b.textContent = l.n;
      b.title = l.titulo;
      b.onclick = () => this.ir(l.n);
      cont.appendChild(b);
    }
  }

  pintarDemos() {
    const cont = $('demos');
    cont.innerHTML = '';
    for (const d of (this.l.demos || [])) {
      const caja = document.createElement('section');
      caja.className = 'demo';
      caja.innerHTML = '<h3 class="demo-titulo">' + d.titulo + '</h3>' +
                       '<p class="demo-texto">' + d.texto + '</p>';
      const cuerpo = document.createElement('div');
      cuerpo.className = 'demo-cuerpo';
      caja.appendChild(cuerpo);
      cont.appendChild(caja);

      if (d.tipo === 'comparacion') this.demoComparacion(cuerpo, d);
      else if (d.tipo === 'teclado') this.demoTeclado(cuerpo, d);
      else if (d.tipo === 'secuencia') this.demoSecuencia(cuerpo, d);
      else if (d.tipo === 'pasos-teclado') this.demoPasos(cuerpo, d);
      else if (d.tipo === 'compases') this.demoCompases(cuerpo, d);
    }
  }

  // --- dos versiones enfrentadas: así no / así sí ---
  demoComparacion(cont, d) {
    const fila = document.createElement('div');
    fila.className = 'versus';
    // Sin un veredicto explícito, una comparación ensena las dos cosas por
    // igual y el alumno no sabe cuál copiar. Cada lado dice qué es.
    for (const [lado, v] of [['mal', d.mal], ['bien', d.bien]]) {
      const caja = document.createElement('div');
      caja.className = 'versus-lado ' + lado;
      const sello = document.createElement('div');
      if (d.sinVeredicto) {
        // A veces se comparan dos cosas correctas (el mismo patrón en dos
        // tonos). Poner "así no" ahí sería mentir.
        sello.className = 'sello neutro';
        sello.textContent = lado === 'mal' ? 'A' : 'B';
      } else {
        sello.className = 'sello ' + lado;
        sello.textContent = lado === 'mal' ? '✗  Así NO' : '✓  Así SÍ';
      }
      caja.appendChild(sello);
      const b = document.createElement('button');
      b.className = 'btn ' + (lado === 'bien' ? 'destacado' : '');
      b.textContent = '▶ ' + v.rotulo;
      b.onclick = () => {
        this.detener();
        despertar();
        this.pararActual = reproducir(v.eventos);
      };
      caja.appendChild(b);
      const p = document.createElement('p');
      p.className = 'versus-nota';
      p.textContent = v.nota;
      caja.appendChild(p);
      fila.appendChild(caja);
    }
    cont.appendChild(fila);
  }

  // --- un teclado con teclas marcadas y botón para oírlo ---
  demoTeclado(cont, d) {
    const caja = document.createElement('div');
    cont.appendChild(caja);
    const tk = new Teclado(caja, {desde: 36, hasta: 84});
    tk.marcar(d.marcas || []);

    if (d.reproducir) {
      const b = document.createElement('button');
      b.className = 'btn destacado ancho';
      b.textContent = '▶ Escuchar cómo debería sonar';
      b.onclick = () => {
        this.detener();
        despertar();
        const r = d.reproducir;
        if (r.tipo === 'secuencia') {
          this.pararActual = reproducir(r.eventos);
        } else if (r.tipo === 'arpegio') {
          this.pararActual = reproducir(
            r.notas.map((nn, i) => ({t: i * 0.18, notas: [nn]})));
        } else if (r.tipo === 'nota') {
          r.notas.forEach((nn) => tocarNota(nn));
        } else {
          tocarAcorde(r.notas);
        }
      };
      cont.appendChild(b);
    }
  }

  // --- una línea de tiempo que se ilumina mientras suena ---
  demoSecuencia(cont, d) {
    const linea = document.createElement('div');
    linea.className = 'linea-eventos';
    const marcas = d.eventos.map((e, i) => {
      const m = document.createElement('div');
      m.className = 'evento';
      m.innerHTML = '<span class="ev-t">' + e.t.toFixed(1) + 's</span>' +
        '<span class="ev-rot">' + (e.etiqueta || '') + '</span>';
      linea.appendChild(m);
      return m;
    });
    cont.appendChild(linea);

    const caja = document.createElement('div');
    cont.appendChild(caja);
    const tk = new Teclado(caja, {desde: 36, hasta: 84});

    const b = document.createElement('button');
    b.className = 'btn destacado ancho';
    b.textContent = '▶ Escuchar';
    b.onclick = () => {
      this.detener();
      despertar();
      marcas.forEach((m) => m.classList.remove('sonando'));
      let i = 0;
      this.pararActual = reproducir(d.eventos, (e) => {
        marcas.forEach((m) => m.classList.remove('sonando'));
        if (marcas[i]) marcas[i].classList.add('sonando');
        tk.marcar(e.notas.map((nn, k) => ({
          midi: nn, clase: nn < 55 ? 'bajo' : (k === 0 ? 'raiz' : 'acorde'),
        })));
        i++;
      });
    };
    cont.appendChild(b);
  }

  // --- posiciones que se recorren una a una ---
  demoPasos(cont, d) {
    let idx = 0;
    const rotulo = document.createElement('div');
    rotulo.className = 'paso-rotulo';
    cont.appendChild(rotulo);

    const caja = document.createElement('div');
    cont.appendChild(caja);
    const tk = new Teclado(caja, {desde: 48, hasta: 84});

    const nota = document.createElement('p');
    nota.className = 'paso-nota';
    cont.appendChild(nota);

    const mandos = document.createElement('div');
    mandos.className = 'paso-mandos';
    cont.appendChild(mandos);

    const pintar = () => {
      const p = d.pasos[idx];
      rotulo.innerHTML = '<span class="paso-n">' + (idx + 1) + ' / ' +
        d.pasos.length + '</span> ' + p.rotulo;
      tk.marcar(p.marcas);
      nota.textContent = p.nota;
    };

    const anterior = document.createElement('button');
    anterior.className = 'btn';
    anterior.textContent = '‹';
    anterior.onclick = () => { idx = (idx - 1 + d.pasos.length) % d.pasos.length;
                               pintar(); };

    const oir = document.createElement('button');
    oir.className = 'btn destacado';
    oir.textContent = '▶ Escuchar esta posición';
    oir.onclick = () => { despertar(); tocarAcorde(d.pasos[idx].notas); };

    const siguiente = document.createElement('button');
    siguiente.className = 'btn';
    siguiente.textContent = '›';
    siguiente.onclick = () => { idx = (idx + 1) % d.pasos.length; pintar(); };

    const todas = document.createElement('button');
    todas.className = 'btn';
    todas.textContent = '▶ Las tres seguidas';
    todas.onclick = () => {
      despertar();
      d.pasos.forEach((p, i) => setTimeout(() => {
        idx = i; pintar(); tocarAcorde(p.notas);
      }, i * 1400));
    };

    mandos.append(anterior, oir, siguiente, todas);
    pintar();
  }

  // --- rejilla de compases: qué mano toca en qué pulso, en bucle ---
  //
  // Es lo que faltaba para entender un ejercicio: ver el compás. Sin esto,
  // "la izquierda una vez y la derecha cuatro" no dice dónde cae cada cosa
  // ni qué pasa cuando empieza el compás siguiente.
  demoCompases(cont, d) {
    const pulsos = d.pulsosPorCompas || 4;
    const compases = d.compases || 2;
    const total = pulsos * compases;
    const seg = 60 / (d.bpm || 70);

    if (d.acorde) {
      const et = document.createElement('div');
      et.className = 'acorde-de-hoy';
      et.innerHTML = '<span>Acorde</span><strong>' + d.acorde + '</strong>';
      cont.appendChild(et);
    }

    // Notas de una línea en un compás dado. Si la línea trae
    // notasPorCompas, cada compás tiene las suyas; si trae notas, se
    // repiten. Sin esto la rejilla no puede mostrar una progresión.
    const notasDe = (linea, compas) => (
      linea.notasPorCompas ? linea.notasPorCompas[compas % linea.notasPorCompas.length]
                           : linea.notas);

    const tabla = document.createElement('div');
    tabla.className = 'rejilla-compas';
    tabla.style.setProperty('--cols', total);

    // Fila con el nombre del acorde de cada compás
    if (d.acordes && d.acordes.length) {
      const fa = document.createElement('div');
      fa.className = 'rc-fila rc-acordes';
      fa.appendChild(Object.assign(document.createElement('div'),
        {className: 'rc-rotulo'}));
      for (let i = 0; i < total; i++) {
        const c = document.createElement('div');
        const compas = Math.floor(i / pulsos);
        c.className = 'rc-celda rc-nombre' + ((i % pulsos) === 0 ? ' inicio' : '');
        c.textContent = (i % pulsos) === 0
          ? (d.acordes[compas % d.acordes.length] || '') : '';
        fa.appendChild(c);
      }
      tabla.appendChild(fa);
    }

    // Cabecera: números de pulso, con separación entre compases
    const cabecera = document.createElement('div');
    cabecera.className = 'rc-fila rc-cabecera';
    cabecera.appendChild(Object.assign(document.createElement('div'),
      {className: 'rc-rotulo', textContent: ''}));
    for (let i = 0; i < total; i++) {
      const c = document.createElement('div');
      const pulso = (i % pulsos) + 1;
      c.className = 'rc-celda rc-num' + (pulso === 1 ? ' inicio' : '');
      c.textContent = pulso;
      cabecera.appendChild(c);
    }
    tabla.appendChild(cabecera);

    // Una fila por mano
    const celdas = [];
    for (const linea of d.lineas) {
      const fila = document.createElement('div');
      fila.className = 'rc-fila';
      const rot = document.createElement('div');
      rot.className = 'rc-rotulo rc-' + linea.mano.toLowerCase();
      rot.innerHTML = '<strong>' + linea.mano + '</strong>' +
        '<span>' + (linea.rotulo || '') + '</span>';
      fila.appendChild(rot);

      const fc = [];
      for (let i = 0; i < total; i++) {
        const c = document.createElement('div');
        const suena = linea.pulsos[i % linea.pulsos.length];
        c.className = 'rc-celda' + (suena ? ' suena' : '') +
                      ((i % pulsos) === 0 ? ' inicio' : '');
        c.innerHTML = suena ? '<i></i>' : '';
        fila.appendChild(c);
        fc.push(c);
      }
      celdas.push(fc);
      tabla.appendChild(fila);
    }
    cont.appendChild(tabla);

    // El piano de verdad debajo: qué teclas producen ese sonido
    const cajaTk = document.createElement('div');
    cont.appendChild(cajaTk);
    const tk = new Teclado(cajaTk, {desde: 36, hasta: 84});
    // Al cargar, se muestran todas las teclas que intervienen
    // Convención única en toda la app: DORADO = mano izquierda,
    // AZUL = mano derecha. Antes cada demo pintaba distinto y las dos
    // imágenes de una misma lección no coincidían.
    const todas = [];
    for (const linea of d.lineas) {
      const juegos = linea.notasPorCompas || [linea.notas];
      for (const juego of juegos) {
        for (const nn of juego) {
          todas.push({midi: nn, clase: linea.mano === 'IZQ' ? 'raiz' : 'acorde',
                      rotulo: linea.mano});
        }
      }
    }
    tk.marcar(todas);

    // Mandos: reproducir en bucle hasta que se pause
    const mandos = document.createElement('div');
    mandos.className = 'rc-mandos';
    const btn = document.createElement('button');
    btn.className = 'btn destacado';
    btn.textContent = '▶ Escuchar en bucle';
    const vel = document.createElement('select');
    vel.className = 'selector chico';
    for (const [v, r] of [[0.6, 'Muy lento'], [0.8, 'Lento'], [1, 'Normal']]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = r;
      if (v === 0.8) o.selected = true;
      vel.appendChild(o);
    }
    mandos.append(btn, vel);
    cont.appendChild(mandos);

    let timer = null, paso = 0;
    const limpiar = () => {
      for (const fc of celdas) fc.forEach((c) => c.classList.remove('ahora'));
      cabecera.querySelectorAll('.rc-num').forEach(
        (c) => c.classList.remove('ahora'));
    };

    const parar = () => {
      if (timer) { clearInterval(timer); timer = null; }
      btn.textContent = '▶ Escuchar en bucle';
      btn.classList.remove('sonando');
      limpiar();
      tk.marcar(todas);
    };

    const tic = () => {
      limpiar();
      const nums = cabecera.querySelectorAll('.rc-num');
      if (nums[paso]) nums[paso].classList.add('ahora');
      const compas = Math.floor(paso / pulsos);
      const sonando = [];
      d.lineas.forEach((linea, li) => {
        const suena = linea.pulsos[paso % linea.pulsos.length];
        celdas[li][paso].classList.add('ahora');
        if (suena) {
          const notas = notasDe(linea, compas);
          tocarAcorde(notas, {volumen: linea.mano === 'IZQ' ? 0.65 : 0.5,
                              duracion: d.sostenido ? seg * pulsos * 1.05 : null});
          for (const nn of notas) {
            sonando.push({midi: nn,
              clase: linea.mano === 'IZQ' ? 'raiz' : 'acorde',
              rotulo: linea.mano});
          }
        }
      });
      // El teclado marca lo que suena AHORA; lo demás queda apagado
      tk.marcar(sonando.length ? sonando : []);
      paso = (paso + 1) % total;
    };

    btn.onclick = () => {
      if (timer) { parar(); return; }
      this.detener();
      despertar();
      paso = 0;
      btn.textContent = '⏸ Pausar';
      btn.classList.add('sonando');
      tic();
      timer = setInterval(tic, seg * 1000 / parseFloat(vel.value));
      this.pararActual = parar;
    };
    vel.onchange = () => { if (timer) { parar(); btn.click(); } };
  }

  // ===================================================== prueba de oído

  pintarPrueba() {
    const cont = $('prueba');
    cont.innerHTML = '';
    const p = this.l.prueba;
    cont.classList.toggle('oculta', !p);
    if (!p) return;

    cont.innerHTML = '<h3 class="demo-titulo">' + p.titulo + '</h3>' +
                     '<p class="demo-texto">' + p.texto + '</p>';

    const estado = {ronda: 0, intentos: 0, aciertos: 0};
    const marcador = document.createElement('p');
    marcador.className = 'marcador';
    cont.appendChild(marcador);

    const zona = document.createElement('div');
    cont.appendChild(zona);

    const veredicto = document.createElement('p');
    veredicto.className = 'veredicto';
    cont.appendChild(veredicto);

    const oir = document.createElement('button');
    oir.className = 'btn destacado ancho';
    cont.appendChild(oir);

    const siguiente = document.createElement('button');
    siguiente.className = 'btn ancho oculta';
    siguiente.textContent = 'Siguiente ronda →';
    cont.appendChild(siguiente);

    const rondaActual = () => p.rondas[estado.ronda];

    const actualizar = () => {
      marcador.textContent = 'Ronda ' + (estado.ronda + 1) + ' de ' +
        p.rondas.length + ' · aciertos: ' + estado.aciertos;
      oir.textContent = '▶ Escuchar';
      oir.onclick = () => {
        this.detener();
        despertar();
        this.pararActual = reproducir(rondaActual().eventos);
      };
    };

    const acertar = (correcto, dicho) => {
      estado.intentos++;
      if (correcto) {
        estado.aciertos++;
        veredicto.className = 'veredicto bien';
        veredicto.textContent = '✓ Correcto: era ' + dicho + '.';
        siguiente.classList.remove('oculta');
      } else {
        veredicto.className = 'veredicto mal';
        veredicto.textContent = estado.intentos >= 3
          ? '✗ Era ' + rondaActual().respuesta + '. ' +
            (rondaActual().pista || '')
          : '✗ No es esa. Escucha otra vez. ' +
            (estado.intentos === 2 ? (rondaActual().pista || '') : '');
        if (estado.intentos >= 3) siguiente.classList.remove('oculta');
      }
    };

    // --- tipo tónica: elige la tecla ---
    if (p.tipo === 'tonica') {
      const caja = document.createElement('div');
      zona.appendChild(caja);
      const tk = new Teclado(caja, {desde: 48, hasta: 72, alSonar: (m) => {
        const clase = CLASES[m % 12];
        acertar(clase === rondaActual().respuesta, nombreDe(clase, true));
      }});
      this.tkPrueba = tk;
    }

    // --- tipo grado: botones ---
    if (p.tipo === 'grado') {
      const fila = document.createElement('div');
      fila.className = 'botonera';
      for (const op of p.opciones) {
        const b = document.createElement('button');
        b.className = 'btn grande';
        b.textContent = op;
        b.onclick = () => acertar(op === rondaActual().respuesta, op);
        fila.appendChild(b);
      }
      zona.appendChild(fila);
    }

    siguiente.onclick = () => {
      estado.ronda++;
      estado.intentos = 0;
      veredicto.textContent = '';
      siguiente.classList.add('oculta');
      if (estado.ronda >= p.rondas.length) {
        marcador.textContent = 'Terminado: ' + estado.aciertos + ' de ' +
          p.rondas.length + ' correctas.';
        oir.classList.add('oculta');
        zona.classList.add('oculta');
        return;
      }
      actualizar();
    };

    actualizar();
  }

  // ============================================================ pasos

  pintarPasos() {
    const ol = $('pasos');
    ol.innerHTML = '';
    for (const p of (this.l.pasos || [])) {
      const li = document.createElement('li');
      li.textContent = p;
      ol.appendChild(li);
    }
    const v = $('vigilar');
    v.classList.toggle('oculta', !this.l.vigilar);
    if (this.l.vigilar) $('vigilar-texto').textContent = this.l.vigilar;
  }

  pintarPractica() {
    const p = this.l.practica;
    const caja = $('practica');
    caja.classList.toggle('oculta', !p);
    if (!p) return;
    const c = CANCIONES[p.cancion];
    $('practica-texto').textContent = p.texto;
    $('practica-cancion').textContent = c
      ? c.nombre + ' · ' + c.tonalidad + ' · ' + Math.round(p.tempo * 100) + '%'
      : '';
    $('practica-ir').href = 'index.html?modo=' + (p.modo || 'teclado') +
      '&tempo=' + p.tempo + (p.tapar ? '&tapar=1' : '');
  }

  pintarNavegacion() {
    $('btn-antes').disabled = this.n <= 1;
    $('btn-despues').disabled = this.n >= TOTAL_ESCRITAS;
    $('btn-antes').onclick = () => this.ir(this.n - 1);
    $('btn-despues').onclick = () => this.ir(this.n + 1);

    const hecha = this.hechas.has(this.n);
    const b = $('btn-hecha');
    b.textContent = hecha ? '✓ Hecha' : 'Marcar hecha';
    b.classList.toggle('destacado', hecha);
    b.onclick = () => this.marcarHecha();
  }

  async marcarHecha() {
    if (this.hechas.has(this.n)) return;
    this.hechas.add(this.n);
    try {
      if (!this.clave) {
        this.clave = (await (await fetch('/api/clave')).json()).clave;
      }
      await fetch('/api/practica', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Clave': this.clave},
        body: JSON.stringify({
          fecha: new Date().toLocaleDateString('sv'),
          minutos: 5, ejercicios: [], leccion: this.n,
        }),
      });
    } catch (e) { console.warn('no se pudo registrar', e); }
    this.pintarIndice();
    this.pintarNavegacion();
    if (this.n < TOTAL_ESCRITAS) {
      setTimeout(() => this.ir(this.n + 1), 700);
    }
  }
}

new Lecciones();
