// Módulo de práctica: guía el método de 66 días.
//
// DECISIÓN CENTRAL DEL DISEÑO: el día del método avanza cuando practicas,
// no cuando pasa el calendario. Si faltas una semana, al volver estás en el
// día siguiente al último que hiciste, no "siete días atrasado". No existe
// forma de quedarse atrás, porque no hay un calendario contra el que perder.
//
// Todo lo demás sale de ahí:
//   • No hay rachas que se rompan. Cada día hecho queda pintado para siempre.
//   • El único aviso aparece al SEGUNDO día sin tocar, nunca al primero:
//     fallar una vez es estadísticamente invisible (Lally, 2010); lo que
//     frena la curva son dos o tres seguidos.
//   • El piso son 5 minutos y se declara cumplido sin asterisco.
import { VIAS, EJERCICIOS, porId } from './curriculo.js';
import { FASES, DIAS, faseDe, diaDe, oracionDe, ejerciciosDelDia,
         PISO_MINUTOS } from './metodo.js';
import { TOTAL_ESCRITAS } from './lecciones-datos.js';

const $ = (id) => document.getElementById(id);
const hoy = () => new Date().toLocaleDateString('sv');

class Practica {
  constructor() {
    this.datos = {sesiones: [], dominio: {}};
    this.hechos = new Set();
    this.arrancar();
  }

  async arrancar() {
    try {
      const r = await fetch('/api/practica');
      if (!r.ok) throw new Error(r.status);
      this.datos = await r.json();
    } catch (e) {
      try {
        this.datos = JSON.parse(localStorage.getItem('practica-local') || 'null')
          || {sesiones: [], dominio: {}, lecciones: []};
      } catch (e2) {
        this.datos = {sesiones: [], dominio: {}, lecciones: []};
      }
    }
    const sesionHoy = this.datos.sesiones.find((s) => s.fecha === hoy());
    if (sesionHoy) for (const e of sesionHoy.ejercicios || []) this.hechos.add(e);

    // El día del método avanza con lo hecho, no con el calendario: faltar
    // no te deja atrasado, solo te deja donde estabas.
    const hechos = this.datos.sesiones.length;
    this.numeroDia = sesionHoy ? Math.max(1, hechos)
                               : Math.min(hechos + 1, DIAS.length);

    this.dia = diaDe(this.numeroDia) || DIAS[DIAS.length - 1];
    this.fase = faseDe(this.numeroDia);
    this.pintar();
  }

  // ---------------------------------------------------------- pintado

  pintar() {
    this.pintarCabecera();
    this.pintarOracion();
    this.pintarLeccion();
    this.pintarEjercicios();
    this.pintarCalendario();
    this.pintarAvance();
  }

  pintarCabecera() {
    $('dia-numero').textContent = 'Día ' + this.numeroDia;
    $('dia-total').textContent = 'de ' + DIAS.length;
    $('dia-titulo').textContent = this.dia.titulo;

    const barra = $('fases');
    barra.innerHTML = '';
    for (const x of FASES) {
      const el = document.createElement('div');
      el.className = 'fase' + (x.id === this.fase.id ? ' activa' : '') +
                     (this.numeroDia > x.hasta ? ' pasada' : '');
      el.style.setProperty('--fase', x.color);
      el.innerHTML = '<span class="fase-nombre">' + x.nombre + '</span>' +
                     '<span class="fase-rango">' + x.desde + '–' + x.hasta + '</span>';
      barra.appendChild(el);
    }
    $('fase-lema').textContent = this.fase.lema;
    $('fase-idea').textContent = this.fase.idea;
    document.documentElement.style.setProperty('--fase-color', this.fase.color);
  }

  pintarOracion() {
    const o = oracionDe(this.numeroDia);
    $('oracion-titulo').textContent = o.titulo;
    $('oracion-texto').textContent = o.texto;
  }

  pintarLeccion() {
    $('leccion').textContent = this.dia.leccion;

    const etiquetas = $('etiquetas');
    etiquetas.innerHTML = '';
    const marcas = [];
    if (this.dia.nuevo) marcas.push(['nuevo', 'Concepto nuevo']);
    if (this.dia.repaso) marcas.push(['repaso', 'Repaso, sin novedad']);
    if (this.dia.control) marcas.push(['control', 'Día de control']);
    if (this.dia.midi) marcas.push(['midi', 'Se mide por MIDI']);
    for (const [c, t] of marcas) {
      const s = document.createElement('span');
      s.className = 'etiqueta ' + c;
      s.textContent = t;
      etiquetas.appendChild(s);
    }

    // El método NO repite la lección: lleva a ella. Los días con versión
    // interactiva escrita abren la clase; el resto queda con el texto.
    const hayLeccion = this.numeroDia <= TOTAL_ESCRITAS;
    $('ir-leccion').classList.toggle('oculta', !hayLeccion);
    $('leccion-aviso').classList.toggle('oculta', hayLeccion);
    if (hayLeccion) $('ir-leccion').href = 'lecciones.html?n=' + this.numeroDia;

    $('reto').textContent = this.dia.reto || '';
    $('reto-caja').classList.toggle('oculta', !this.dia.reto);

    const caja = $('midi-caja');
    caja.classList.toggle('oculta', !this.dia.midi);
    if (this.dia.midi) this.prepararGrabacion();
  }

  pintarEjercicios() {
    const cont = $('sesion');
    cont.innerHTML = '';
    // Los del día más lo que haga falta para llegar al piso, de otras vías
    const lista = ejerciciosDelDia(this.numeroDia);

    if (!lista.length) {
      cont.innerHTML = '<p class="ayuda">Hoy no hay ejercicio. Toca lo que quieras.</p>';
      $('resumen-hoy').textContent = 'Día libre';
      return;
    }

    const minutos = lista.reduce((s, e) => s + e.minutos, 0);
    $('resumen-hoy').textContent = lista.length +
      (lista.length === 1 ? ' ejercicio · ' : ' ejercicios · ') +
      'unos ' + minutos + ' minutos';

    for (const e of lista) {
      const via = VIAS[e.via];
      const hecho = this.hechos.has(e.id);
      const card = document.createElement('article');
      card.className = 'ejercicio' + (hecho ? ' hecho' : '');
      card.style.setProperty('--via', via.color);
      card.innerHTML =
        '<div class="ej-top">' +
          '<span class="ej-via">' + via.nombre + '</span>' +
          '<span class="ej-min">' + e.minutos + ' min</span>' +
        '</div>' +
        '<h3 class="ej-titulo">' + e.titulo + '</h3>' +
        '<p class="ej-consigna">' + e.consigna + '</p>' +
        '<p class="ej-porque"><strong>Por qué:</strong> ' + e.porque + '</p>' +
        '<div class="ej-botones">' +
          '<a class="btn" href="index.html?modo=' + e.modo +
            '&tempo=' + e.tempo + (e.tapar ? '&tapar=1' : '') +
            '">Abrir el atril</a>' +
          '<button class="btn marcar-hecho" data-ej="' + e.id + '">' +
            (hecho ? '✓ Hecho' : 'Marcar hecho') + '</button>' +
        '</div>';
      cont.appendChild(card);
    }
    cont.querySelectorAll('.marcar-hecho').forEach((b) => {
      b.onclick = () => this.marcarHecho(b.dataset.ej);
    });
  }

  pintarCalendario() {
    const cont = $('calendario');
    cont.innerHTML = '';
    const porFecha = {};
    for (const s of this.datos.sesiones) porFecha[s.fecha] = s.minutos || 0;

    const base = new Date();
    for (let i = 55; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const clave = d.toLocaleDateString('sv');
      const min = porFecha[clave] || 0;
      const celda = document.createElement('div');
      celda.className = 'dia-celda' + (min > 0 ? ' hecho' : '') +
                        (clave === hoy() ? ' hoy' : '');
      celda.title = min > 0 ? clave + ' · ' + min + ' min' : clave;
      if (min > 0) celda.style.opacity = Math.min(1, 0.5 + min / 30);
      cont.appendChild(celda);
    }
  }

  pintarAvance() {
    const s = this.datos.sesiones;
    const totalMin = s.reduce((a, x) => a + (x.minutos || 0), 0);
    const dominados = Object.values(this.datos.dominio)
      .filter((d) => d.veces >= 3).length;

    $('dato-dias').textContent = s.length;
    $('dato-minutos').textContent = totalMin;
    $('dato-dominados').textContent = dominados + '/' + EJERCICIOS.length;

    const pct = Math.round(100 * this.numeroDia / DIAS.length);
    $('avance-metodo').style.width = pct + '%';
    $('avance-rotulo').textContent = pct + '% del método';

    // Único aviso: al segundo día sin tocar, nunca al primero
    const fechas = new Set(s.map((x) => x.fecha));
    let sinTocar = 0;
    for (let i = 1; i <= 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (fechas.has(d.toLocaleDateString('sv'))) break;
      sinTocar++;
    }
    const aviso = $('aviso');
    if (sinTocar >= 2 && !fechas.has(hoy())) {
      aviso.innerHTML = '<strong>Llevas ' + sinTocar + ' días sin tocar.</strong> ' +
        'Un día no mueve la aguja; dos o tres seguidos sí frenan la curva. ' +
        'No perdiste el sitio: sigues en el día ' + this.numeroDia +
        ', porque el método avanza contigo y no con el calendario. ' +
        'Hoy bastan ' + PISO_MINUTOS + ' minutos.';
      aviso.classList.remove('oculta');
    } else {
      aviso.classList.add('oculta');
    }
  }

  // ------------------------------------------------------ grabar MIDI
  //
  // Un botón, no un comando. La herramienta sirve a una persona.

  async prepararGrabacion() {
    if (this.grabacionLista) return;
    this.grabacionLista = true;
    $('btn-grabar').onclick = () => this.alternarGrabacion();
    this.refrescarEstadoMidi();
  }

  async refrescarEstadoMidi() {
    try {
      const e = await (await fetch('/api/midi/estado')).json();
      const et = $('midi-estado');
      const btn = $('btn-grabar');
      if (e.activa) {
        btn.textContent = '⏹ Parar';
        btn.classList.add('grabando');
        et.textContent = e.segundos + ' s · ' + e.notas + ' notas';
        setTimeout(() => this.refrescarEstadoMidi(), 1000);
      } else {
        btn.textContent = '⏺ Grabar';
        btn.classList.remove('grabando');
        btn.disabled = !e.puertos.length;
        et.textContent = e.puertos.length
          ? 'Conectado: ' + e.puertos[0]
          : 'No se detecta el piano. Conecta el cable USB al computador.';
      }
    } catch (err) {
      $('midi-estado').textContent = 'No se pudo consultar el piano.';
    }
  }

  async alternarGrabacion() {
    if (!this.clave) {
      this.clave = (await (await fetch('/api/clave')).json()).clave;
    }
    const activa = $('btn-grabar').classList.contains('grabando');
    const cab = {'Content-Type': 'application/json', 'X-Clave': this.clave};
    if (activa) {
      const r = await (await fetch('/api/midi/parar',
        {method: 'POST', headers: cab})).json();
      $('midi-estado').textContent = r.notas
        ? 'Guardado: ' + r.notas + ' notas en ' + r.duracion + ' s. ' +
          'Dime «revisa mi última sesión».'
        : (r.aviso || r.error || 'Sin notas.');
      $('btn-grabar').classList.remove('grabando');
      $('btn-grabar').textContent = '⏺ Grabar';
    } else {
      const r = await (await fetch('/api/midi/grabar', {method: 'POST',
        headers: cab, body: JSON.stringify({cancion: null})})).json();
      if (r.error) { $('midi-estado').textContent = r.error; return; }
      this.refrescarEstadoMidi();
    }
  }

  // --------------------------------------------------------- registro

  async marcarHecho(id) {
    if (this.hechos.has(id)) return;
    this.hechos.add(id);
    const ej = porId(id);
    try {
      if (!this.clave) {
        const rk = await fetch('/api/clave');
        if (!rk.ok) throw new Error(rk.status);
        this.clave = (await rk.json()).clave;
      }
      await fetch('/api/practica', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Clave': this.clave},
        body: JSON.stringify({
          fecha: hoy(), minutos: ej ? ej.minutos : 0,
          ejercicios: [id], dia_metodo: this.numeroDia,
        }),
      });
      this.datos = await (await fetch('/api/practica')).json();
    } catch (e) {
      const f = hoy();
      const min = ej ? ej.minutos : 0;
      let prev = this.datos.sesiones.find((s) => s.fecha === f);
      if (prev) {
        prev.minutos = (prev.minutos || 0) + min;
        if (!prev.ejercicios.includes(id)) prev.ejercicios.push(id);
      } else {
        this.datos.sesiones.push({fecha: f, minutos: min, ejercicios: [id], dia_metodo: this.numeroDia});
      }
      const d = (this.datos.dominio[id] = this.datos.dominio[id] || {veces: 0, ultimo: null});
      d.veces += 1;
      d.ultimo = f;
      try { localStorage.setItem('practica-local', JSON.stringify(this.datos)); } catch (e2) {}
    }
    this.pintarEjercicios();
    this.pintarCalendario();
    this.pintarAvance();
    this.celebrar();
  }

  celebrar() {
    const s = this.datos.sesiones.find((x) => x.fecha === hoy());
    if (!s || s.minutos < PISO_MINUTOS) return;
    const c = $('cumplido');
    c.classList.remove('oculta');
    c.innerHTML = '<strong>Hoy está cumplido.</strong> ' + s.minutos +
      ' minutos. Lo que toques de más es regalo, no adelanto. ' +
      'Y lo de hoy se cobra mañana: la mejora motora aparece después de ' +
      'dormir, no durante la sesión.';
  }
}

new Practica();
