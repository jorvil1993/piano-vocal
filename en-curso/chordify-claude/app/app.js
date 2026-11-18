// Atril de ensayo. Una sola pantalla por instrumento: nadie toca piano,
// guitarra y bateria a la vez. Todo se sincroniza contra los tiempos medidos
// del audio, sin ninguna rejilla de tempo de por medio.
import { RolloPiano } from './rollo.js';
import * as Guitarra from './guitarra.js';
import { Piano } from './piano.js';
import { Cifrado } from './cifrado.js';
import { Entrenador, leerMarcados, alternarMarcado } from './practicar.js';
import { angloAcorde } from './cifrado.js';
import { transportarCancion, nombreTono, LIMITE as TONO_MAX }
  from './transportar.js';

const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Los tiempos se guardan con tres decimales, como los escribe el analisis
const round3 = (t) => Math.round(t * 1000) / 1000;
const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};
const TIPOS = [
  ['', 'mayor'], ['m', 'menor'], ['7', 'séptima'], ['m7', 'menor 7'],
  ['maj7', 'mayor 7'], ['sus4', 'sus4'], ['sus2', 'sus2'], ['dim', 'dim'],
  ['aug', 'aug'], ['6', 'sexta'], ['m6', 'menor 6'],
];
const INTERVALOS = {'': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11], sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6],
  aug: [0, 4, 8], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9]};

const PISTAS = ['voz', 'bateria', 'bajo', 'guitarra', 'piano', 'resto'];
const ETIQUETAS_PISTA = {
  voz: {icono: '🎤', nombre: 'Voz'}, bateria: {icono: '🥁', nombre: 'Batería'},
  bajo: {icono: '🎸', nombre: 'Bajo'}, guitarra: {icono: '🎸', nombre: 'Guitarra'},
  piano: {icono: '🎹', nombre: 'Piano'}, resto: {icono: '🎻', nombre: 'Resto'},
};
// Tres presets, los que se usan de verdad. Se irán agregando según haga
// falta, no por adelantado.
const PRESETS = {
  'banda':    {voz: 1,    bateria: 0.85, bajo: 0.85, guitarra: 0.85,
               piano: 0.85, resto: 0.75},
  'solo-voz': {voz: 1,    bateria: 0,    bajo: 0,    guitarra: 0,
               piano: 0,    resto: 0},
  // Voz de guía, bajita; la base rítmica al máximo para tocar encima
  'voz-ritmo': {voz: 0.35, bateria: 1,   bajo: 1,    guitarra: 0,
                piano: 0,   resto: 0},
};

// Carriles de bateria, de arriba abajo como en una partitura
const CARRILES = [
  {tipo: 'platillo', nombre: 'Platillo', color: '#4aa3ff', forma: 'aspa'},
  {tipo: 'caja',     nombre: 'Caja',     color: '#f2596f', forma: 'punto'},
  {tipo: 'bombo',    nombre: 'Bombo',    color: '#ffb64a', forma: 'punto'},
];
const ATRAS = 1.2;
const ADELANTE = 3.4;
const PASOS_VISIBLES = 6;      // cuantos acordes se ven venir

const $ = (id) => document.getElementById(id);

class Atril {
  constructor() {
    this.cancion = null;
    this.modo = 'guitarra';
    this.notacion = 'latino';
    this.editando = false;
    this.sinGuardar = false;
    this.indiceActual = -1;
    this.lineaActual = -1;
    this.marcas = [];
    this.pasos = [];
    this.tapado = false;      // ejercicios de oido: acorde oculto
    this.velocidadBase = 1;   // tempo elegido; la sincronía ajusta sobre él
    this.transporte = 0;      // semitonos arriba/abajo respecto al disco
    this.cambiandoTono = false;
    this.candado = null;        // Wake Lock de pantalla
    this.mantenerPantalla = true;

    this.pistas = {};
    for (const k of PISTAS) {
      const a = new Audio();
      a.preload = 'auto';
      this.pistas[k] = a;
    }
    this.volumenes = Object.assign({}, PRESETS.banda);
    this.silencios = {};
    this.solos = {};
    for (const k of PISTAS) { this.silencios[k] = false; this.solos[k] = false; }

    this.rollo = new RolloPiano('lienzo-piano');
    // Respaldo: si la canción no tiene piano transcrito, al menos
    // se ven las teclas del acorde en curso.
    // Tres octavas en el ancho de un celular dan teclas finísimas que no
    // parecen un piano. En pantalla angosta se muestran dos.
    const angosta = window.innerWidth < 700;
    this.teclado = new Piano('teclado-acorde',
      {octavaInicial: angosta ? 3 : 3, octavas: angosta ? 2 : 3});

    this.hoja = new Cifrado('cif-hoja', {
      alSaltar: (t) => { if (!this.veniaDeLargo()) this.saltarA(t); },
      alMantener: (el, anglo) => this.mantener(el, () => anglo),
      marcado: (anglo) => this.marcados.has(anglo),
      alMover: (viejo, nuevo, ancla) => this.moverAcorde(viejo, nuevo, ancla),
    });
    this.marcados = leerMarcados();
    this.cargaToken = 0;
    this.entreno = new Entrenador('ent-cuerpo', {notacion: this.notacion});
    this.verCifrado = false;
    try { this.verCifrado = localStorage.getItem('ver-cifrado') === '1'; } catch (e) {}

    this.leerParametros();
    this.conectar();
    this.cargarLista();
    requestAnimationFrame(() => this.latir());
  }

  // Los ejercicios de práctica abren el atril ya configurado
  leerParametros() {
    const p = new URLSearchParams(location.search);
    const m = p.get('modo');
    if (m && ['guitarra', 'teclado', 'piano', 'bateria'].includes(m)) this.modo = m;
    this.tempoPedido = parseFloat(p.get('tempo')) || null;
    this.tapado = p.get('tapar') === '1';
  }

  // ============================================================ carga

  async cargarLista() {
    let r = await fetch('/api/canciones').catch(() => null);
    if (!r || !r.ok) r = await fetch('../canciones/lista.json');
    const lista = await r.json();
    const sel = $('selector-cancion');
    sel.innerHTML = '';
    if (!lista.length) {
      sel.innerHTML = '<option>Sin canciones</option>';
      return;
    }
    for (const c of lista) {
      const o = document.createElement('option');
      o.value = c.id;
      // Siempre igual: cancion primero, artista despues
      o.textContent = c.artista ? c.titulo + ' — ' + c.artista : c.titulo;
      sel.appendChild(o);
    }
    sel.onchange = () => this.cargar(sel.value);
    this.cargar(lista[0].id);
  }

  async cargar(slug) {
    // Si cambias de cancion mientras otra sigue cargando, las dos cargas
    // corren a la vez y la que acaba ULTIMA deja la pantalla puesta. Como
    // la vieja tarda mas, se quedaba la anterior. Cada carga lleva un
    // numero: si al volver de un await ya no es la ultima, se abandona.
    const token = ++this.cargaToken;
    const base = '../canciones/' + encodeURIComponent(slug) + '/';
    const datos = await (await fetch(base + 'cancion.json')).json();
    if (token !== this.cargaToken) return;
    this.cancion = datos;
    this.slug = slug;
    this.sinGuardar = false;
    this.indiceActual = -1;
    this.lineaActual = -1;
    this.marcas = [];

    // Si venía sonando, la nueva arranca sola: cambiar de canción no
    // debería obligarte a volver a darle play.
    const veniaSonando = !this.pistas.voz.paused;
    this.pausar();

    // El tono con el que dejaste esta canción la última vez. Se pide ANTES
    // de bajar el audio: si hay que renderizarlo se baja ya lo transportado,
    // en vez de bajarse el original y volver a bajarlo todo encima medio
    // minuto después.
    this.transporte = 0;
    const donde = await this.prepararTono(slug, this.tonoGuardado(slug));
    if (token !== this.cargaToken) return;
    if (donde.semis) {
      transportarCancion(this.cancion, donde.semis);
      this.transporte = donde.semis;
    }

    await this.cargarPistas(donde.base, this.cancion.audio);
    if (token !== this.cargaToken) return;
    this.aplicarConsola();

    $('titulo').textContent = this.cancion.titulo;
    this.pintarMeta();
    $('dur-total').textContent = this.formato(this.cancion.duracion);

    const ms = this.cancion.ajuste_ms || 0;
    this.cancion.ajuste_ms = ms;
    $('ajuste').value = ms;
    $('etq-ajuste').textContent = (ms > 0 ? '+' : '') + ms + ' ms';
    $('etq-marcas').textContent = '';

    // Puntos del pulso segun el compás detectado
    const porCompas = parseInt((this.cancion.compas || '4/4').split('/')[0], 10) || 4;
    // Guitarra y teclado muestran los mismos pulsos: se construyen en ambas
    this.grupos = [];
    for (const id of ['pulsos', 'pulsos-teclado']) {
      const caja = $(id);
      if (!caja) continue;
      caja.innerHTML = '';
      const grupo = [];
      for (let k = 0; k < porCompas; k++) {
        const p = document.createElement('span');
        p.className = 'pulso' + (k === 0 ? ' fuerte' : '');
        p.textContent = k + 1;
        caja.appendChild(p);
        grupo.push(p);
      }
      this.grupos.push(grupo);
    }

    // Duración media de un compás: sirve para decir si un acorde dura uno
    // entero o medio, que es como se cuenta al tocar.
    const bs = this.cancion.beats || [];
    this.duracionCompas = bs.length > 1
      ? ((bs[bs.length - 1].t - bs[0].t) / (bs.length - 1)) * porCompas : 0;

    if (this.tempoPedido) {
      $('velocidad').value = String(this.tempoPedido);
      for (const k of PISTAS) {
        this.pistas[k].playbackRate = this.tempoPedido;
        this.pistas[k].preservesPitch = true;
      }
    }
    if (this.tapado) {
      $('btn-tapar').classList.add('activo');
      $('btn-tapar').textContent = '🙈';
    }

    this.rollo.cargar(this.cancion.piano_notas || []);
    this.dibujarCinta();
    this.rehacerHoja();
    this.marcarEstado();
    this.ajustarModo();
    this.pintarTono();
    if (veniaSonando) this.reproducir();
  }

  // Seis pistas son ~45 MB: sin aviso parece que la app se colgó.
  // Se espera a que todas puedan reproducirse, mostrando cuántas van.
  cargarPistas(base, audio) {
    const capa = $('cargando');
    const barra = $('cargando-avance');
    const texto = $('cargando-texto');
    capa.classList.remove('oculta');
    barra.style.width = '0%';
    texto.textContent = 'Cargando pistas…';

    let listas = 0, rotas = 0;
    const esperas = PISTAS.map((k) => new Promise((resolver) => {
      const a = this.pistas[k];
      let resuelto = false;
      const acabar = (ok) => {
        if (resuelto) return;
        resuelto = true;
        if (ok) listas++; else rotas++;
        a.removeEventListener('canplay', bien);
        a.removeEventListener('error', mal);
        resolver(ok);
      };
      const bien = () => acabar(true);
      const mal = () => acabar(false);
      a.addEventListener('canplay', bien);
      a.addEventListener('error', mal);
      a.preload = 'auto';
      a.src = base + (audio[k] || '');
      a.load();
    }));

    // Una barra que se MUEVE con lo que lleva bajado de verdad. Antes solo
    // saltaba al terminar cada pista, se quedaba quieta minutos enteros y
    // no habia forma de saber si seguia viva o se habia colgado.
    const lider = this.pistas[PISTAS[0]];
    const desde = performance.now();
    const refrescar = () => {
      let parte = listas / PISTAS.length;
      try {
        if (lider.buffered.length && lider.duration) {
          parte = Math.max(parte,
            lider.buffered.end(lider.buffered.length - 1) / lider.duration);
        }
      } catch (e) {}
      barra.style.width = Math.min(100, parte * 100).toFixed(0) + '%';
      const seg = Math.round((performance.now() - desde) / 1000);
      texto.textContent = 'Cargando pistas… ' + listas + ' de ' +
        PISTAS.length + (seg > 6 ? ' · ' + seg + ' s' : '');
    };
    const tic = setInterval(refrescar, 250);

    // Con que pueda sonar la voz basta para empezar: las demas acaban de
    // bajar mientras ya se toca. Lo que ya NO se hace es esconder el aviso
    // a los 6 s pasara lo que pasara, que era lo que dejaba la pantalla
    // como si estuviera lista cuando no habia cargado nada.
    const rendirse = new Promise((r) => setTimeout(() => r('tarde'), 45000));
    return Promise.race([esperas[0], rendirse]).then((res) => {
      clearInterval(tic);
      capa.classList.add('oculta');
      if (res === 'tarde') {
        texto.textContent = 'La red va muy lenta.';
      } else if (res === false && rotas === PISTAS.length) {
        texto.textContent = 'No se pudo cargar el audio.';
      }
    });
  }

  // ============================================================== tono
  //
  // Subir o bajar la canción entera. Se mueven a la vez el NOMBRE de los
  // acordes y el AUDIO: mover solo los nombres te haría tocar Fa mientras
  // suena Mi, que es peor que no tener la herramienta.
  //
  // El cancion.json no se toca. El tono es cómo te sientas a tocar hoy, no
  // un dato de la canción: se recuerda en el navegador, canción por canción.

  tonoGuardado(slug) {
    try {
      const n = parseInt(localStorage.getItem('tono:' + slug), 10);
      return Number.isFinite(n) ? Math.max(-TONO_MAX, Math.min(TONO_MAX, n)) : 0;
    } catch (e) { return 0; }
  }

  recordarTono() {
    try {
      if (this.transporte) {
        localStorage.setItem('tono:' + this.slug, String(this.transporte));
      } else {
        localStorage.removeItem('tono:' + this.slug);
      }
    } catch (e) {}
  }

  // Pide al servidor el audio a ese tono y espera a que esté. Devuelve el
  // tono que se consiguió DE VERDAD y de dónde bajar las pistas.
  //
  // Si el audio no se puede transportar devuelve 0, y quien llama deja los
  // acordes como estaban. Enseñar los nombres transportados sobre el audio
  // original sería lo peor que puede hacer esto: tocarías en un tono
  // distinto del que suena y mirando la pantalla no habría cómo notarlo.
  async prepararTono(slug, semis) {
    const original = {semis: 0,
      base: '../canciones/' + encodeURIComponent(slug) + '/'};
    semis = Math.max(-TONO_MAX, Math.min(TONO_MAX, semis | 0));
    if (!semis) return original;

    const preguntar = async () => {
      const r = await fetch('/api/tono?cancion='
        + encodeURIComponent(slug) + '&semis=' + semis);
      if (!r.ok) throw new Error('requiere el servidor en tu PC');
      return r.json();
    };
    const capa = $('cargando');
    const barra = $('cargando-avance');
    const texto = $('cargando-texto');
    try {
      let res = await preguntar();
      if (res.estado === 'haciendo') {
        // Son trece segundos de ffmpeg. Sin barra parece que se colgó.
        capa.classList.remove('oculta');
        while (res.estado === 'haciendo') {
          const parte = res.total ? res.hechas / res.total : 0;
          barra.style.width = (parte * 100).toFixed(0) + '%';
          texto.textContent = 'Cambiando el tono a ' + nombreTono(semis)
            + '… ' + (res.hechas || 0) + ' de ' + (res.total || 6) + ' pistas';
          await new Promise((r) => setTimeout(r, 600));
          res = await preguntar();
        }
        capa.classList.add('oculta');
      }
      if (res.estado !== 'listo') throw new Error(res.error || 'no se pudo');
      return {semis, base: res.base};
    } catch (e) {
      capa.classList.add('oculta');
      this.avisar('No se pudo cambiar el tono: ' + e.message);
      return original;
    }
  }

  async cambiarTono(n) {
    if (!this.cancion || this.cambiandoTono) return;
    n = Math.max(-TONO_MAX, Math.min(TONO_MAX, n | 0));
    if (n === this.transporte) return;
    this.cambiandoTono = true;
    try {
      const donde = await this.prepararTono(this.slug, n);
      if (donde.semis !== n) return;      // no se pudo: todo se queda igual

      // Dónde ibas y si sonaba: cambiar de tono no debe sacarte del sitio
      const t = this.pistas.voz.currentTime;
      const sonaba = !this.pistas.voz.paused;
      this.pausar();

      transportarCancion(this.cancion, n - this.transporte);
      this.transporte = n;
      this.recordarTono();

      await this.cargarPistas(donde.base, this.cancion.audio);
      this.aplicarConsola();
      this.saltarA(t);

      this.rollo.cargar(this.cancion.piano_notas || []);
      this.pintarMeta();
      this.pintarTono();
      this.indiceActual = -1;
      this.lineaActual = -1;
      this.dibujarCinta();
      this.rehacerHoja();
      if (sonaba) this.reproducir();
    } finally {
      this.cambiandoTono = false;
    }
  }

  pintarTono() {
    const etq = $('etq-tono');
    if (etq) etq.textContent = nombreTono(this.transporte);
    const caja = $('tono');
    if (caja) caja.classList.toggle('activo', !!this.transporte);
    const baja = $('btn-tono-baja'), sube = $('btn-tono-sube');
    if (baja) baja.disabled = this.transporte <= -TONO_MAX;
    if (sube) sube.disabled = this.transporte >= TONO_MAX;
  }

  pintarMeta() {
    const c = this.cancion;
    const partes = [c.artista, c.tonalidad.nombre,
      c.tempo.toFixed(1) + ' BPM', c.compas];
    // Que se vea de un golpe que no estás en el tono del disco
    if (this.transporte) {
      partes.splice(2, 0, 'tono ' + nombreTono(this.transporte));
    }
    $('meta').textContent = partes.join(' · ');
  }

  // ============================================================ modos

  ajustarModo() {
    document.body.dataset.modo = this.modo;
    for (const m of ['guitarra', 'teclado', 'piano', 'bateria']) {
      $('vista-' + m).classList.toggle('oculta', m !== this.modo);
    }
    document.querySelectorAll('.modo').forEach((b) => {
      b.classList.toggle('activo', b.dataset.modo === this.modo);
    });
    // Tocando batería la letra estorba y ese alto le sirve a los carriles
    const conLetra = this.modo === 'guitarra' || this.modo === 'teclado'
                     || this.modo === 'piano';
    $('cinta-letra').classList.toggle('oculta', !conLetra);
    $('cinta-acordes').classList.toggle('oculta',
        this.modo === 'bateria' || this.verCifrado);
    if (!this.cancion) return;

    const hayPiano = (this.cancion.piano_notas || []).length > 0;
    $('piano-respaldo').classList.toggle('oculta', hayPiano);
    $('lienzo-piano').classList.toggle('oculta', !hayPiano);
    $('piano-ctrl-caja').classList.toggle('oculta', !hayPiano);
    if (!hayPiano) {
      $('piano-aviso').textContent =
        'Esta canción no tiene piano suficiente para transcribir.';
    }

    const hayBateria = (this.cancion.bateria || []).length > 0;
    $('bateria-aviso').classList.toggle('oculta', hayBateria);
    $('lienzo-bateria').classList.toggle('oculta', !hayBateria);
    if (!hayBateria) {
      $('bateria-aviso').textContent = 'Esta canción no tiene batería detectada.';
    } else {
      const cuenta = {};
      for (const g of this.cancion.bateria) cuenta[g.tipo] = (cuenta[g.tipo] || 0) + 1;
      $('bateria-info').textContent = CARRILES
        .map((c) => (cuenta[c.tipo] || 0) + ' ' + c.nombre.toLowerCase().split(' ')[0])
        .join(' · ');
    }
    this.indiceActual = -1;   // fuerza repintar lo del modo nuevo
  }

  // ====================================================== cinta acordes

  nombre(a) {
    if (!a || !a.anglo) return '—';
    if (this.tapado) return '?';   // se saca de oido, no de la pantalla
    return this.notacion === 'latino' ? a.latino : a.anglo;
  }

  // Mover un acorde a otra silaba o a un espacio. El segundo sigue siendo
  // el momento musical; el ancla recuerda por separado el caracter exacto
  // donde la persona quiso verlo en la hoja.
  moverAcorde(viejo, nuevo, ancla) {
    const lista = this.cancion.acordes;
    const i = lista.findIndex((a) => Math.abs(a.inicio - viejo) < 0.02);
    if (i < 0) return;
    const a = lista[i];

    // No puede adelantarse al anterior ni pasarse del siguiente
    const min = i > 0 ? lista[i - 1].inicio + 0.15 : 0;
    const max = i + 1 < lista.length ? lista[i + 1].inicio - 0.15 : a.fin;
    const propuesto = Number(nuevo);
    if (!Number.isFinite(propuesto)) return;
    const limitado = propuesto < min || propuesto > max;
    const t = Math.max(min, Math.min(max, propuesto));

    if (i > 0) {
      lista[i - 1].fin = round3(t);
      // Esta frontera pertenece a los dos acordes. Si solo se conserva el
      // segundo al reprocesar, el anterior puede desaparecer o dejar hueco.
      lista[i - 1].editado = true;
    }
    a.inicio = round3(t);
    if (!limitado && ancla && Number.isFinite(Number(ancla.linea)) &&
        Number.isFinite(Number(ancla.columna))) {
      a.ancla_cifrado = {
        linea: round3(Number(ancla.linea)),
        columna: Math.round(Number(ancla.columna)),
      };
    } else {
      // Si los acordes vecinos obligaron a dejarlo en otro segundo, guardar
      // la linea tocada haria que audio y hoja contaran cosas distintas.
      delete a.ancla_cifrado;
    }
    a.editado = true;
    this.sinGuardar = true;
    this.indiceActual = -1;
    this.marcarEstado();
    this.dibujarCinta();
    this.rehacerHoja();
    this.hoja.editando = true;
    this.avisar(a.latino + ' movido a ' + this.formato(t));
  }

  // Todo lo que cambia como se LLAMA un acorde obliga a rehacer la hoja
  rehacerHoja() {
    if (!this.hoja || !this.cancion) return;
    this.hoja.cancion = this.cancion;
    this.hoja.notacion = this.notacion;
    this.hoja.tapado = this.tapado;
    const seguiaEditando = this.hoja.editando;
    this.hoja.construir();
    this.hoja.editando = seguiaEditando;
  }

  // La hoja ocupa el sitio de la cinta y de la letra: no caben las dos
  mostrarCifrado(v) {
    this.verCifrado = v;
    $('btn-cifrado').classList.toggle('activo', v);
    $('btn-cifrado').title = v
      ? 'Volver a la cinta de acordes'
      : 'Letra con los acordes encima';
    $('cifrado').classList.toggle('oculta', !v);
    $('cinta-letra').classList.toggle('oculta', v);
    try { localStorage.setItem('ver-cifrado', v ? '1' : '0'); } catch (e) {}
    this.ajustarModo();
    if (v) this.rehacerHoja();
  }

  // Mantener pulsado un acorde lo apunta en "los que no me se". Se usa
  // pointer para que valga igual con el dedo y con el raton, y se bloquea
  // el menu del navegador, que en el movil sale solo al mantener.
  mantener(el, dameAnglo) {
    let reloj = null;
    const soltar = () => { clearTimeout(reloj); reloj = null; };
    el.addEventListener('pointerdown', () => {
      soltar();
      reloj = setTimeout(() => {
        const anglo = dameAnglo();
        if (!anglo) return;
        this.marcaLarga = performance.now();
        const puesto = alternarMarcado(anglo);
        this.marcados = leerMarcados();
        this.avisar(puesto
          ? anglo + ' · apuntado para practicar'
          : anglo + ' · quitado de la lista');
        if (navigator.vibrate) navigator.vibrate(35);
        this.repintarMarcados();
      }, 500);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
      el.addEventListener(ev, soltar);
    }
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Tras una pulsacion larga no debe dispararse ademas el clic normal
  veniaDeLargo() {
    return this.marcaLarga && performance.now() - this.marcaLarga < 500;
  }

  repintarMarcados() {
    for (const el of (this.pasos || [])) {
      const a = el.dataset.anglo;
      el.classList.toggle('marcado', !!a && this.marcados.has(a));
    }
    if (this.hoja) this.hoja.refrescarMarcas();
  }

  avisar(texto) {
    const el = $('aviso-flotante');
    if (!el) return;
    el.textContent = texto;
    el.classList.remove('oculta');
    clearTimeout(this.relojAviso);
    this.relojAviso = setTimeout(() => el.classList.add('oculta'), 1900);
  }

  dibujarCinta() {
    const cont = $('cinta-acordes');
    cont.innerHTML = '';
    this.pasos = [];
    (this.cancion.acordes || []).forEach((a, i) => {
      const el = document.createElement('div');
      el.className = 'paso' + (a.anglo ? '' : ' vacio') + (a.editado ? ' editado' : '');
      el.innerHTML = '<div class="paso-nombre">' + this.nombre(a) + '</div>' +
                     '<div class="paso-pie">' + this.formato(a.inicio) + '</div>';
      const anglo = angloAcorde(a, this.hoja ? this.hoja.simple : true);
      el.dataset.anglo = anglo || '';
      if (anglo && this.marcados.has(anglo)) el.classList.add('marcado');
      el.onclick = () => {
        if (this.veniaDeLargo()) return;
        if (this.editando) this.abrirEditor(i);
        else this.saltarA(a.inicio);
      };
      this.mantener(el, () => anglo);
      cont.appendChild(el);
      this.pasos.push(el);
    });
  }

  // Deja la fila del acorde activo arriba del todo: la de abajo es el futuro
  centrarCinta(i) {
    const el = this.pasos[i];
    if (!el || this.usuarioMueve) return;
    const cont = $('cinta-acordes');
    cont.scrollTo({top: Math.max(0, el.offsetTop - cont.clientTop - 7),
                   behavior: 'smooth'});
  }

  // ============================================================ reloj

  buscar(lista, t, campo = 'inicio') {
    let lo = 0, hi = lista.length - 1, r = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (lista[m][campo] <= t) { r = m; lo = m + 1; } else { hi = m - 1; }
    }
    return r;
  }

  latir() {
    requestAnimationFrame(() => this.latir());
    if (!this.cancion) return;

    const lider = this.pistas.voz;
    const reloj = lider.currentTime;
    const t = reloj + (this.cancion.ajuste_ms || 0) / 1000;

    // Sincronía entre las seis pistas.
    //
    // Antes se corregía saltando (currentTime = reloj) con 60 ms de
    // tolerancia, y eso hacía DOS cosas mal: 60 ms de desfase entre copias
    // del mismo audio ya suena a interferencia, y saltar en una pista que
    // está sonando provoca un rebuffer audible: el corte de milisegundos.
    //
    // Ahora se corrige por VELOCIDAD: se acelera o frena la pista atrasada
    // una fracción de por ciento hasta que alcanza al reloj. Es inaudible y
    // no interrumpe el sonido. El salto queda solo para desfases grandes,
    // donde alcanzar por velocidad tardaría demasiado.
    if (!lider.paused) {
      const base = this.velocidadBase || 1;
      for (const k of PISTAS) {
        if (k === 'voz') continue;
        const p = this.pistas[k];
        const desfase = p.currentTime - reloj;
        const abs = Math.abs(desfase);

        if (abs > 0.05) {
          // Más de 50 ms: alcanzar por velocidad tardaría segundos y la
          // interferencia se oiría todo ese rato. Un salto único es peor
          // por un instante y mejor en el balance.
          p.currentTime = reloj;
          p.playbackRate = base;
        } else if (abs > 0.008) {
          // Hasta un 1% de cambio: cierra 50 ms en unos dos segundos y
          // queda muy por debajo de lo que el oído nota como afinación.
          const ajuste = Math.max(-0.01, Math.min(0.01, -desfase * 0.6));
          p.playbackRate = base * (1 + ajuste);
        } else if (p.playbackRate !== base) {
          p.playbackRate = base;    // ya alcanzó: se devuelve al tempo
        }
      }
    }

    $('tiempo').textContent = this.formato(reloj);
    $('barra-avance').style.width = (100 * reloj / (this.cancion.duracion || 1)) + '%';

    if (this.modo === 'piano') this.rollo.dibujar(t, this.cancion.beats);
    if (this.modo === 'bateria') this.dibujarBateria(t);

    const i = this.buscar(this.cancion.acordes || [], t);
    if (i !== this.indiceActual) {
      this.indiceActual = i;
      this.pasos.forEach((el, k) => el.classList.toggle('activo', k === i));
      this.centrarCinta(i);
      if (this.verCifrado) this.hoja.seguir(t);
      this.pintarAcorde(i >= 0 ? this.cancion.acordes[i] : null,
                        this.cancion.acordes[i + 1] || null);
      this.acordeActual = i >= 0 ? this.cancion.acordes[i] : null;
      const a = this.acordeActual;
      for (const id of ['resta-num', 'guitarra-compases']) {
        const num = $(id);
        if (num) {
          num.innerHTML = a ? this.etiquetaCompases(a.fin - a.inicio) : '';
        }
      }
    }

    // Cuánto le queda al acorde en curso, para saber si da tiempo a algo más
    const barra = $('resta-barra');
    if (barra) {
      const a = this.acordeActual;
      if (a && a.fin > a.inicio) {
        const queda = Math.max(0, Math.min(1, (a.fin - t) / (a.fin - a.inicio)));
        barra.style.width = (queda * 100) + '%';
      } else {
        barra.style.width = '0%';
      }
    }

    const b = this.buscar(this.cancion.beats || [], t, 't');
    if (b >= 0 && this.grupos) {
      const beat = this.cancion.beats[b];
      const rotulo = 'Compás ' + beat.compas;
      $('compas-actual').textContent = rotulo;
      $('tec-compas').textContent = rotulo;
      for (const grupo of (this.grupos || [])) {
        grupo.forEach((p, k) => p.classList.toggle('on', k + 1 === beat.pulso));
      }
    }

    const letra = this.cancion.letra || [];
    if (letra.length) {
      const li = this.buscar(letra, t);
      if (li !== this.lineaActual) {
        this.lineaActual = li;
        $('letra-ahora').textContent = li >= 0 ? letra[li].texto : '—';
        $('letra-luego').textContent = letra[li + 1] ? letra[li + 1].texto : '';
      }
    }
  }

  pintarAcorde(a, siguiente) {
    this.angloActual = a
      ? angloAcorde(a, this.hoja ? this.hoja.simple : true) : null;
    const nom = this.nombre(a);
    const notas = (a && !this.tapado)
      ? (this.notacion === 'latino' ? a.notas_latinas : a.notas) : [];
    $('acorde-grande').textContent = nom;
    $('notas-acorde').textContent = notas.length ? notas.join(' · ') : '—';
    $('piano-acorde').textContent = nom;
    $('piano-notas').textContent = notas.join(' · ');
    $('tec-acorde').textContent = nom;
    $('tec-notas').textContent = notas.length ? notas.join(' · ') : '—';
    this.teclado.iluminar((a && !this.tapado) ? a.notas : []);
    Guitarra.dibujar($('guitarra-ahora'), (a && !this.tapado) ? a.anglo : null,
                     this.notacion === 'latino');
    Guitarra.dibujar($('guitarra-luego'),
                     (siguiente && !this.tapado) ? siguiente.anglo : null,
                     this.notacion === 'latino');
  }

  // ========================================================== batería

  dibujarBateria(t) {
    const lienzo = $('lienzo-bateria');
    const ctx = lienzo.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = lienzo.clientWidth, H = lienzo.clientHeight;
    if (!W || !H) return;
    if (lienzo.width !== W * dpr || lienzo.height !== H * dpr) {
      lienzo.width = W * dpr; lienzo.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const total = ATRAS + ADELANTE;
    const aX = (x) => ((x - t + ATRAS) / total) * W;
    const alto = H / CARRILES.length;

    for (const b of (this.cancion.beats || [])) {
      if (b.t < t - ATRAS || b.t > t + ADELANTE) continue;
      const x = aX(b.t);
      ctx.strokeStyle = b.pulso === 1 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.07)';
      ctx.lineWidth = b.pulso === 1 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    CARRILES.forEach((c, i) => {
      const y = i * alto + alto / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.font = '600 9px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(c.nombre, 5, i * alto + 8);
    });

    for (const g of (this.cancion.bateria || [])) {
      if (g.t < t - ATRAS || g.t > t + ADELANTE) continue;
      const i = CARRILES.findIndex((c) => c.tipo === g.tipo);
      if (i < 0) continue;
      const x = aX(g.t), y = i * alto + alto / 2;
      const r = Math.min(alto * 0.34, 4 + g.fuerza * 7);
      const sonando = Math.abs(g.t - t) < 0.07;

      ctx.globalAlpha = g.t < t ? 0.28 : 1;
      ctx.fillStyle = CARRILES[i].color;
      ctx.strokeStyle = sonando ? '#fff' : CARRILES[i].color;
      ctx.lineWidth = sonando ? 2.5 : 2;

      const forma = CARRILES[i].forma;

      if (forma === 'aspa') {
        const d = r * 0.85;
        ctx.beginPath();
        ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
        ctx.stroke();
      } else if (forma === 'circulo') {
        ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (sonando) { ctx.strokeStyle = '#fff'; ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;

    const xc = (ATRAS / total) * W;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xc, 0); ctx.lineTo(xc, H); ctx.stroke();
  }

  // ===================================================== reproducción

  async reproducir() {
    try {
      const t = this.pistas.voz.currentTime;
      for (const k of PISTAS) {
        this.pistas[k].currentTime = t;
        this.pistas[k].playbackRate = this.velocidadBase;
      }
      await Promise.all(PISTAS.map((k) => this.pistas[k].play()));
      $('btn-play').textContent = '⏸';
      this.pedirCandado();
    } catch (e) { console.warn('no se pudo reproducir', e); }
  }

  pausar() {
    for (const k of PISTAS) this.pistas[k].pause();
    $('btn-play').textContent = '▶';
    this.soltarCandado();
  }

  // ---------------------------------------------------- pantalla

  // Sin esto el celular se apaga a los 15 s y te deja sin atril justo
  // cuando tienes las dos manos ocupadas.
  // La API de Wake Lock SOLO existe en conexiones seguras. Entrando por
  // http:// desde el celular no está disponible, así que hace falta el
  // recurso clásico: un video mínimo en bucle. Mientras hay video
  // reproduciéndose, el sistema no apaga la pantalla.
  async pedirCandado() {
    if (!this.mantenerPantalla) return;

    if ('wakeLock' in navigator) {
      try {
        if (this.candado) return;
        this.candado = await navigator.wakeLock.request('screen');
        this.candado.addEventListener('release', () => { this.candado = null; });
        return;
      } catch (e) {
        // Sigue al respaldo
      }
    }

    const v = $('desvelo');
    if (v && v.paused) {
      try { await v.play(); } catch (e) {
        console.warn('no se pudo mantener la pantalla encendida', e);
      }
    }
  }

  async soltarCandado() {
    try {
      if (this.candado) await this.candado.release();
    } catch (e) { /* ya estaba suelto */ }
    this.candado = null;
    const v = $('desvelo');
    if (v && !v.paused) v.pause();
  }

  alternar() { this.pistas.voz.paused ? this.reproducir() : this.pausar(); }

  saltarA(t) {
    t = Math.max(0, Math.min(t, this.cancion.duracion - 0.05));
    for (const k of PISTAS) {
      this.pistas[k].currentTime = t;
      this.pistas[k].playbackRate = this.velocidadBase;
    }
    this.indiceActual = -1;
    this.lineaActual = -1;
    this.usuarioMueve = false;
  }

  // ============================================================ consola

  aplicarConsola() {
    const haySolo = PISTAS.some((k) => this.solos[k]);
    for (const k of PISTAS) {
      let vol = this.volumenes[k];
      if (this.silencios[k] || (haySolo && !this.solos[k])) vol = 0;
      // Nunca exactamente 0: el navegador deja de decodificar lo inaudible
      // y la pista se retrasa. Con 0.0008 es inaudible pero sigue viva.
      this.pistas[k].volume = vol === 0 ? 0.0008 : vol;

      const canal = document.querySelector('.canal[data-pista="' + k + '"]');
      if (!canal) continue;
      canal.classList.toggle('silenciado', this.silencios[k]);
      canal.classList.toggle('en-solo', this.solos[k]);
      const fader = $('fader-' + k);
      if (fader && document.activeElement !== fader) fader.value = this.volumenes[k];
      $('val-' + k).textContent = Math.round(this.volumenes[k] * 100) + '%';
      $('m-' + k).classList.toggle('activo', this.silencios[k]);
      $('s-' + k).classList.toggle('activo', this.solos[k]);
    }
  }

  aplicarPreset(nombre) {
    const p = PRESETS[nombre];
    if (!p) return;
    for (const k of PISTAS) {
      this.volumenes[k] = p[k]; this.silencios[k] = false; this.solos[k] = false;
    }
    document.querySelectorAll('.preset').forEach((b) => {
      b.classList.toggle('activo', b.dataset.preset === nombre);
    });
    this.aplicarConsola();
  }

  dibujarConsola() {
    const cont = $('canales');
    cont.innerHTML = '';
    PISTAS.forEach((k, i) => {
      const {icono, nombre} = ETIQUETAS_PISTA[k];
      const c = document.createElement('div');
      c.className = 'canal';
      c.dataset.pista = k;
      c.innerHTML =
        '<div class="canal-top"><span>' + icono + '</span>' +
        '<span class="canal-nombre">' + nombre + '</span>' +
        '<span class="canal-val" id="val-' + k + '"></span></div>' +
        '<input type="range" class="fader" id="fader-' + k + '" min="0" max="1" step="0.02">' +
        '<div class="canal-btns">' +
        '<button type="button" class="canal-btn m" id="m-' + k + '">M</button>' +
        '<button type="button" class="canal-btn s" id="s-' + k + '" ' +
        'title="Solo (tecla ' + (i + 1) + ')">S</button></div>';
      cont.appendChild(c);
    });
    for (const k of PISTAS) {
      $('fader-' + k).oninput = (e) => {
        this.volumenes[k] = parseFloat(e.target.value);
        this.soltarPreset(); this.aplicarConsola();
      };
      $('m-' + k).onclick = () => {
        this.silencios[k] = !this.silencios[k];
        this.soltarPreset(); this.aplicarConsola();
      };
      $('s-' + k).onclick = () => {
        this.solos[k] = !this.solos[k];
        this.soltarPreset(); this.aplicarConsola();
      };
    }
    document.querySelectorAll('.preset').forEach((b) => {
      b.onclick = () => this.aplicarPreset(b.dataset.preset);
    });
    this.aplicarConsola();
  }

  soltarPreset() {
    document.querySelectorAll('.preset').forEach((b) => b.classList.remove('activo'));
  }

  // ============================================================ ajuste

  marcar() {
    if (!this.cancion) return;
    if (this.pistas.voz.paused) {
      $('etq-marcas').textContent = 'dale Play'; return;
    }
    const t = this.pistas.voz.currentTime;
    let borde = null, dist = Infinity;
    for (const a of this.cancion.acordes) {
      const d = Math.abs(a.inicio - t);
      if (d < dist) { dist = d; borde = a.inicio; }
    }
    if (borde === null || dist > 2.0) {
      $('etq-marcas').textContent = 'lejos de un cambio'; return;
    }
    this.marcas.push((borde - t) * 1000);
    const orden = [...this.marcas].sort((a, b) => a - b);
    const m = orden.length % 2 ? orden[(orden.length - 1) / 2]
      : (orden[orden.length / 2 - 1] + orden[orden.length / 2]) / 2;
    const ms = Math.round(m / 10) * 10;
    $('ajuste').value = Math.max(-600, Math.min(600, ms));
    this.fijarAjuste(ms);
    $('etq-marcas').textContent = this.marcas.length +
      (this.marcas.length === 1 ? ' marca' : ' marcas');
  }

  fijarAjuste(ms) {
    this.cancion.ajuste_ms = ms;
    $('etq-ajuste').textContent = (ms > 0 ? '+' : '') + ms + ' ms';
    this.indiceActual = -1; this.lineaActual = -1;
    this.sinGuardar = true; this.marcarEstado();
  }

  // =========================================================== edición

  abrirEditor(i) {
    const a = this.cancion.acordes[i];
    $('editor').classList.add('abierto');
    $('editor-titulo').textContent =
      'Compás en ' + this.formato(a.inicio) + ' · ' + a.pulsos + ' pulsos';
    const paleta = $('paleta');
    paleta.innerHTML = '';

    const nulo = document.createElement('button');
    nulo.className = 'chip nulo';
    nulo.textContent = 'Sin acorde';
    nulo.onclick = () => this.aplicarAcorde(i, null, null);
    paleta.appendChild(nulo);

    for (const raiz of CLASES) {
      const fila = document.createElement('div');
      fila.className = 'fila-raiz';
      const et = document.createElement('span');
      et.className = 'raiz-nombre';
      et.textContent = this.notacion === 'latino' ? LATIN[raiz] : raiz;
      fila.appendChild(et);
      for (const [suf, desc] of TIPOS) {
        const b = document.createElement('button');
        b.className = 'chip' + (a.anglo === raiz + suf ? ' actual' : '');
        b.title = desc;
        b.textContent = (this.notacion === 'latino' ? LATIN[raiz] : raiz) + suf;
        b.onclick = () => this.aplicarAcorde(i, raiz, suf);
        fila.appendChild(b);
      }
      paleta.appendChild(fila);
    }
  }

  aplicarAcorde(i, raiz, suf) {
    const a = this.cancion.acordes[i];
    if (raiz === null) {
      Object.assign(a, {etiqueta: 'N', anglo: null, latino: null,
        notas: [], notas_latinas: []});
    } else {
      const base = CLASES.indexOf(raiz);
      const notas = INTERVALOS[suf].map((iv) => CLASES[(base + iv) % 12]);
      Object.assign(a, {
        etiqueta: raiz + ':' + (suf === '' ? 'maj' : suf === 'm' ? 'min' : suf),
        anglo: raiz + suf, latino: LATIN[raiz] + suf,
        notas, notas_latinas: notas.map((n) => LATIN[n]),
      });
    }
    a.editado = true;
    this.sinGuardar = true;
    this.indiceActual = -1;
    this.dibujarCinta();
    this.marcarEstado();
    $('editor').classList.remove('abierto');
  }

  marcarEstado() {
    const n = (this.cancion.acordes || []).filter((a) => a.editado).length;
    $('btn-guardar').classList.toggle('pendiente', this.sinGuardar);
    $('btn-guardar').textContent = this.sinGuardar ? 'Guardar •' : 'Guardar';
    $('btn-guardar').title = n + ' corrección(es)';
  }

  async guardar() {
    if (!this.cancion) return;
    $('btn-guardar').disabled = true;
    try {
      if (!this.clave) {
        const rk = await fetch('/api/clave').catch(() => null);
        if (!rk || !rk.ok) throw new Error('solo disponible con el servidor en tu PC');
        this.clave = (await rk.json()).clave;
      }
      const r = await fetch('/api/guardar/' + encodeURIComponent(this.slug), {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Clave': this.clave},
        // Se guarda SIEMPRE en el tono del disco: lo que ves transportado
        // es cómo tocas hoy, pero el archivo tiene que seguir siendo la
        // canción. Va una copia devuelta a su sitio, sin tocar lo que hay
        // en pantalla. Es exacto: transportar son las doce clases de nota,
        // así que restar lo mismo que se sumó devuelve lo que había.
        body: JSON.stringify(this.transporte
          ? transportarCancion(JSON.parse(JSON.stringify(this.cancion)),
                               -this.transporte)
          : this.cancion),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error || 'error al guardar');
      this.sinGuardar = false;
      this.marcarEstado();
    } catch (e) {
      alert('No se pudo guardar: ' + e.message);
    } finally {
      $('btn-guardar').disabled = false;
    }
  }

  // ========================================================= controles

  // Los cajones son modales a pantalla completa: no se usan mientras se
  // toca, así que pueden ocupar todo y verse cómodos. El botón atrás del
  // celular los cierra en vez de salir de la aplicación.
  cajon(id) {
    const c = $(id);
    const abierto = !c.classList.contains('oculta');
    this.cerrarCajones();
    if (!abierto) {
      c.classList.remove('oculta');
      history.pushState({cajon: id}, '');
    }
  }

  cerrarCajones() {
    let habia = false;
    for (const otro of ['cajon-consola', 'cajon-ajustes', 'cajon-entreno']) {
      if (!$(otro).classList.contains('oculta')) habia = true;
      $(otro).classList.add('oculta');
    }
    // El entrenador deja un lazo de animacion corriendo con los cambios
    if (this.entreno) this.entreno.cerrar();
    return habia;
  }

  conectar() {
    this.dibujarConsola();

    document.querySelectorAll('.modo').forEach((b) => {
      b.onclick = () => { this.modo = b.dataset.modo; this.ajustarModo(); };
    });

    $('btn-play').onclick = () => this.alternar();
    $('btn-atras').onclick = () => this.saltarA(this.pistas.voz.currentTime - 5);
    $('btn-adelante').onclick = () => this.saltarA(this.pistas.voz.currentTime + 5);
    $('btn-guardar').onclick = () => this.guardar();
    const plegar = (v) => {
      document.body.classList.toggle('menu-plegado', v);
      $('pliegue-flecha').textContent = v ? '▼' : '▲';
      $('btn-menu').title = (v ? 'Mostrar' : 'Ocultar') + ' el menú (tecla H)';
      try { localStorage.setItem('menu-plegado', v ? '1' : '0'); } catch (e) {}
      // Los lienzos (rollo de piano, batería) miden su caja al redibujar
      window.dispatchEvent(new Event('resize'));
    };
    let pleg = false;
    try { pleg = localStorage.getItem('menu-plegado') === '1'; } catch (e) {}
    plegar(pleg);
    $('btn-menu').onclick = () => plegar(!document.body.classList.contains('menu-plegado'));
    this.plegar = plegar;

    $('btn-pantalla').classList.add('activo');
    $('btn-pantalla').onclick = () => {
      this.mantenerPantalla = !this.mantenerPantalla;
      $('btn-pantalla').classList.toggle('activo', this.mantenerPantalla);
      $('btn-pantalla').title = this.mantenerPantalla
        ? 'La pantalla se mantiene encendida mientras tocas'
        : 'La pantalla puede apagarse sola';
      if (this.mantenerPantalla) {
        if (!this.pistas.voz.paused) this.pedirCandado();
      } else {
        this.soltarCandado();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.pistas.voz.paused) {
        this.pedirCandado();
      }
    });

    // El video de respaldo se detiene solo en algunos navegadores: se
    // vuelve a poner en marcha mientras la música siga sonando.
    const v = $('desvelo');
    if (v) {
      v.addEventListener('pause', () => {
        if (this.mantenerPantalla && !this.pistas.voz.paused) {
          v.play().catch(() => {});
        }
      });
    }

    $('btn-tapar').onclick = () => {
      this.tapado = !this.tapado;
      $('btn-tapar').classList.toggle('activo', this.tapado);
      $('btn-tapar').textContent = this.tapado ? '🙈' : '👁';
      this.indiceActual = -1;
      this.dibujarCinta();
      this.rehacerHoja();
    };

    // El acorde grande es lo que tienes delante mientras tocas: si te
    // frena, lo mantienes pulsado ahi mismo sin buscar nada.
    for (const id of ['acorde-grande', 'tec-acorde', 'piano-acorde']) {
      const el = $(id);
      if (el) this.mantener(el, () => this.angloActual);
    }

    $('btn-cifrado').onclick = () => this.mostrarCifrado(!this.verCifrado);
    const verSimple = (v) => {
      this.hoja.simple = v;
      $('cif-sencillo').classList.toggle('activo', v);
      $('cif-completo').classList.toggle('activo', !v);
      this.rehacerHoja();
    };
    $('cif-cerrar').onclick = () => this.mostrarCifrado(false);
    $('cif-corregir').onclick = () => {
      this.hoja.editando = !this.hoja.editando;
      this.hoja.elegir(null);
      $('cif-corregir').classList.toggle('activo', this.hoja.editando);
      $('cif-ayuda').classList.toggle('oculta', !this.hoja.editando);
    };
    $('cif-sencillo').onclick = () => verSimple(true);
    $('cif-completo').onclick = () => verSimple(false);
    this.mostrarCifrado(this.verCifrado);

    $('btn-consola').onclick = () => this.cajon('cajon-consola');
    $('btn-ajustes').onclick = () => this.cajon('cajon-ajustes');
    $('btn-entreno').onclick = () => {
      if (!this.cancion) return;
      this.cajon('cajon-entreno');
      if (!$('cajon-entreno').classList.contains('oculta')) {
        this.entreno.abrir(this.cancion,
          {notacion: this.notacion, simple: this.hoja.simple});
      }
    };
    document.querySelectorAll('.ent-paso').forEach((b) => {
      b.onclick = () => this.entreno.ir(parseInt(b.dataset.paso, 10));
    });
    document.querySelectorAll('.ent-amb').forEach((b) => {
      b.onclick = async () => {
        const a = b.dataset.ambito;
        // La biblioteca se pide una sola vez: son los acordes de todas las
        // canciones, sin letra ni notas de piano (27 KB en vez de 870).
        if ((a === 'todas' || a === 'marcados') && !this.entreno.biblioteca) {
          b.textContent = 'Cargando…';
          try {
            let r = await fetch('/api/acordes').catch(() => null);
            if (!r || !r.ok) r = await fetch('../canciones/acordes.json');
            this.entreno.biblioteca = await r.json();
          } catch (e) {
            this.entreno.biblioteca = [];
          }
          b.textContent = a === 'todas' ? 'Todas' : '★ Los que marqué';
        }
        this.entreno.irAmbito(a);
      };
    });
    document.querySelectorAll('.cerrar').forEach((b) => {
      b.onclick = () => { if (this.cerrarCajones()) history.back(); };
    });

    // El botón atrás cierra el modal en lugar de abandonar la app
    window.addEventListener('popstate', () => this.cerrarCajones());

    $('velocidad').onchange = (e) => {
      this.velocidadBase = parseFloat(e.target.value);
      for (const k of PISTAS) {
        this.pistas[k].playbackRate = this.velocidadBase;
        this.pistas[k].preservesPitch = true;
      }
    };

    $('caida').oninput = (e) => {
      this.rollo.caida = parseFloat(e.target.value);
      $('etq-caida').textContent = this.rollo.caida.toFixed(1) + ' s';
    };

    $('ajuste').oninput = (e) => {
      this.marcas = []; $('etq-marcas').textContent = '';
      this.fijarAjuste(parseInt(e.target.value, 10));
    };
    $('btn-marcar').onclick = () => this.marcar();
    $('btn-ajuste-cero').onclick = () => {
      $('ajuste').value = 0; this.marcas = [];
      $('etq-marcas').textContent = ''; this.fijarAjuste(0);
    };

    $('btn-notacion').onclick = () => {
      this.notacion = this.notacion === 'latino' ? 'anglo' : 'latino';
      this.rollo.notacion = this.notacion;
      this.teclado.notacion = this.notacion;
      $('btn-notacion').textContent = this.notacion === 'latino' ? 'Do Re Mi' : 'C D E';
      this.indiceActual = -1;
      this.dibujarCinta();
    };

    $('btn-tono-baja').onclick = () => this.cambiarTono(this.transporte - 1);
    $('btn-tono-sube').onclick = () => this.cambiarTono(this.transporte + 1);
    $('etq-tono').onclick = () => this.cambiarTono(0);   // volver al del disco

    $('btn-editar').onclick = () => {
      this.editando = !this.editando;
      document.body.classList.toggle('modo-edicion', this.editando);
      $('btn-editar').classList.toggle('activo', this.editando);
      $('btn-editar').textContent = this.editando ? '✓' : '✎';
      if (!this.editando) $('editor').classList.remove('abierto');
    };
    $('cerrar-editor').onclick = () => $('editor').classList.remove('abierto');

    $('barra').onclick = (e) => {
      const c = e.currentTarget.getBoundingClientRect();
      this.saltarA((e.clientX - c.left) / c.width * this.cancion.duracion);
    };

    // Gestos reales, no el evento scroll: ese lo dispara el propio auto-scroll
    let temporizador;
    const marcarMano = () => {
      this.usuarioMueve = true;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => { this.usuarioMueve = false; }, 4000);
    };
    for (const ev of ['wheel', 'touchstart', 'pointerdown']) {
      $('cinta-acordes').addEventListener(ev, marcarMano, {passive: true});
    }

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); this.alternar(); }
      if (e.code === 'ArrowLeft') this.saltarA(this.pistas.voz.currentTime - 5);
      if (e.code === 'ArrowRight') this.saltarA(this.pistas.voz.currentTime + 5);
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.guardar(); }
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this.marcar(); }
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.plegar(!document.body.classList.contains('menu-plegado'));
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault(); this.cambiarTono(this.transporte + 1);
      }
      if (e.key === '-') {
        e.preventDefault(); this.cambiarTono(this.transporte - 1);
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= PISTAS.length) {
        const k = PISTAS[n - 1];
        this.solos[k] = !this.solos[k];
        this.soltarPreset(); this.aplicarConsola();
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.sinGuardar) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  // "medio compás" se entiende de un vistazo; "0.5" hay que traducirlo
  etiquetaCompases(seg) {
    if (!this.duracionCompas || !(seg > 0)) return '';
    const r = seg / this.duracionCompas;
    if (r > 4.5) return Math.round(r) + ' <em>compases</em>';
    const tabla = [[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'],
                   [0.75, '¾'], [1, '1'], [1.5, '1½'], [2, '2'],
                   [3, '3'], [4, '4']];
    let mejor = tabla[0];
    for (const f of tabla) {
      if (Math.abs(f[0] - r) < Math.abs(mejor[0] - r)) mejor = f;
    }
    return mejor[1] + ' <em>' + (mejor[0] > 1 ? 'compases' : 'compás') + '</em>';
  }

  formato(s) {
    if (!isFinite(s) || s < 0) s = 0;
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }
}

new Atril();
