// Entrenador de los acordes de UNA cancion.
//
// El problema que resuelve: hay canciones con acordes que no te sabes, y
// acabas tocando a trompicones —pausa, aprender, play, pausa otra vez—.
// Aqui se sacan antes: primero cuales no sabes, luego cada uno por separado,
// y al final el cambio de uno a otro, que es lo que de verdad cuesta.
//
// Los nombres y las notas NO se calculan aqui: se importan de cifrado.js,
// para que \"sencillo\" quiera decir exactamente lo mismo en la hoja y aqui.
import { claveAcorde, nombreAcorde, angloAcorde, notasAcorde, midisAcorde }
  from './cifrado.js';
import * as Sonido from './sonido.js';
import * as Guitarra from './guitarra.js';
import { Piano } from './piano.js';

// Lo que te sabes es tuyo, no de la cancion: vale para todas
const RECUERDO = 'acordes-que-se';
const VELOCIDADES = [5, 4, 3, 2, 1.5];

export class Entrenador {
  constructor(contenedor, {notacion = 'latino', simple = true} = {}) {
    this.cont = typeof contenedor === 'string'
      ? document.getElementById(contenedor) : contenedor;
    this.notacion = notacion;
    this.simple = simple;
    this.paso = 0;
    this.cancion = null;
    // 'cancion' = los acordes de la que tienes abierta.
    // 'todas'   = los de toda la biblioteca, para ir vaciando la lista de
    //             lo que no te sabes aunque hoy no toques esa cancion.
    this.ambito = 'cancion';
    this.biblioteca = null;
    this.verSabidos = false;
    this.sabidos = this.leer();
    this.hechos = new Set();
    this.velocidad = 1;              // indice en VELOCIDADES
  }

  // ------------------------------------------------------- memoria

  leer() {
    try { return new Set(JSON.parse(localStorage.getItem(RECUERDO) || '[]')); }
    catch (e) { return new Set(); }
  }

  guardar() {
    try { localStorage.setItem(RECUERDO, JSON.stringify([...this.sabidos])); }
    catch (e) {}
  }

  // ------------------------------------------------------- inventario

  // De donde salen los acordes segun el ambito elegido
  fuentes() {
    if (this.ambito === 'todas') return this.biblioteca || [];
    return this.cancion ? [{titulo: this.cancion.titulo,
                            acordes: this.cancion.acordes}] : [];
  }

  // Los acordes distintos, el mas usado primero: si solo vas a aprender
  // dos, que sean los que mas suenan.
  inventario() {
    const mapa = new Map();
    for (const src of this.fuentes()) {
      for (const a of (src.acordes || [])) {
        if (!a.anglo) continue;
        const k = claveAcorde(a, this.simple);
        if (!mapa.has(k)) {
          mapa.set(k, {
            k,
            nombre: nombreAcorde(a, {simple: this.simple, notacion: this.notacion}),
            anglo: angloAcorde(a, this.simple),
            notas: notasAcorde(a, this.simple, this.notacion),
            notasAnglo: notasAcorde(a, this.simple, 'anglo'),
            midis: midisAcorde(a, this.simple),
            veces: 0,
            donde: new Set(),
          });
        }
        const c = mapa.get(k);
        c.veces++;
        c.donde.add(src.titulo || '');
      }
    }
    return [...mapa.values()].sort((x, y) => y.veces - x.veces);
  }

  // Los cambios que de verdad ocurren en la cancion, no todas las parejas
  // posibles. Practicar Do->Fa#m solo sirve si la cancion lo pide.
  cambios() {
    const inv = new Map(this.inventario().map((c) => [c.k, c]));
    const cuenta = new Map();
    for (const src of this.fuentes()) {
      // El cambio no cruza de una cancion a otra: se reinicia en cada una
      let previo = null;
      for (const a of (src.acordes || [])) {
        if (!a.anglo) continue;
        const k = claveAcorde(a, this.simple);
        if (previo && previo !== k) {
          const par = previo + '>' + k;
          if (!cuenta.has(par)) {
            cuenta.set(par, {par, de: inv.get(previo), a: inv.get(k), veces: 0});
          }
          cuenta.get(par).veces++;
        }
        previo = k;
      }
    }
    // Primero los cambios que tocan un acorde que no te sabes; dentro de
    // esos, los que mas se repiten.
    return [...cuenta.values()]
      .filter((c) => c.de && c.a)
      .sort((x, y) => (this.pesa(y) - this.pesa(x)) || (y.veces - x.veces));
  }

  pesa(c) {
    const nuevos = (this.sabidos.has(c.de.anglo) ? 0 : 1) +
                   (this.sabidos.has(c.a.anglo) ? 0 : 1);
    return nuevos * 1000 + c.veces;
  }

  // ---------------------------------------------------------- abrir

  abrir(cancion, {notacion, simple} = {}) {
    this.cancion = cancion;
    if (notacion) this.notacion = notacion;
    if (simple !== undefined) this.simple = simple;
    this.sabidos = this.leer();
    this.paso = 0;
    this.cola = [];
    this.hechos = new Set();
    this.pintar();
  }

  cerrar() { this.parar(); }

  // Cambiar de ambito empieza de cero: la cola y los cambios son otros
  irAmbito(a) {
    this.ambito = a;
    this.paso = 0;
    this.cola = [];
    this.hechos = new Set();
    this.verSabidos = false;
    document.querySelectorAll('.ent-amb').forEach((b) => {
      b.classList.toggle('activo', b.dataset.ambito === a);
    });
    this.pintar();
  }

  parar() {
    if (this.lazo) { cancelAnimationFrame(this.lazo); this.lazo = null; }
    this.corriendo = false;
  }

  // --------------------------------------------------------- pintar

  pintar() {
    this.parar();
    if (!this.cont) return;
    if (this.ambito === 'cancion' && !this.cancion) return;
    this.cont.innerHTML = '';
    if (this.paso === 0) this.pintarInventario();
    else if (this.paso === 1) this.pintarAprender();
    else this.pintarCambios();
    this.marcarPasos();
  }

  marcarPasos() {
    document.querySelectorAll('.ent-paso').forEach((b) => {
      b.classList.toggle('activo', +b.dataset.paso === this.paso);
    });
  }

  ir(paso) { this.paso = paso; this.pintar(); }

  // ------------------------------------------------ paso 1: inventario

  pintarInventario() {
    const todas = this.ambito === 'todas';
    const inv = this.inventario();
    const faltan = inv.filter((c) => !this.sabidos.has(c.anglo));
    const sabidos = inv.filter((c) => this.sabidos.has(c.anglo));

    if (todas && !inv.length) {
      this.cont.innerHTML = '<div class="ent-intro"><h2>Sin canciones</h2>' +
        '<p>Todavía no hay acordes en la biblioteca.</p></div>';
      return;
    }

    const cab = document.createElement('div');
    cab.className = 'ent-intro';
    cab.innerHTML = todas
      ? '<h2>Lo que te falta, en todo lo que tienes</h2>' +
        '<p>Los acordes de <strong>todas</strong> tus canciones que aún no ' +
        'marcaste. Según los vas aprendiendo desaparecen de aquí.</p>'
      : '<h2>¿Cuáles ya te sabes?</h2>' +
        '<p>Toca los que puedes poner sin pensar. Los demás los practicamos ' +
        'ahora, antes de tocar la canción entera.</p>';
    this.cont.appendChild(cab);

    // En la biblioteca entera se ven solo los que faltan: la lista se vacia
    // sola segun aprendes, que es justo para lo que sirve.
    this.cont.appendChild(this.rejilla(todas ? faltan : inv));

    if (todas && sabidos.length) {
      const abre = document.createElement('button');
      abre.className = 'btn ancho';
      abre.textContent = (this.verSabidos ? 'Ocultar' : 'Ver') + ' los ' +
        sabidos.length + ' que ya te sabes';
      abre.onclick = () => { this.verSabidos = !this.verSabidos; this.pintar(); };
      this.cont.appendChild(abre);
      if (this.verSabidos) this.cont.appendChild(this.rejilla(sabidos));
    }

    const pie = document.createElement('div');
    pie.className = 'ent-pie';
    const n = faltan.length;
    pie.innerHTML = '<p class="ent-cuenta">Te sabes <strong>' +
      (inv.length - n) + '</strong> de <strong>' + inv.length +
      '</strong> acordes ' +
      (todas ? 'de tus ' + this.fuentes().length + ' canciones.'
             : 'de esta canción.') + '</p>';
    const ir = document.createElement('button');
    ir.className = 'btn destacado ancho grande';
    if (n) {
      ir.textContent = 'Aprender los ' + n + ' que faltan →';
      ir.onclick = () => { this.cola = faltan.slice(); this.ir(1); };
    } else {
      ir.textContent = 'Practicar los cambios →';
      ir.onclick = () => this.ir(2);
    }
    pie.appendChild(ir);
    this.cont.appendChild(pie);
  }

  rejilla(lista) {
    const rej = document.createElement('div');
    rej.className = 'ent-rejilla';
    const todas = this.ambito === 'todas';
    for (const c of lista) {
      const b = document.createElement('button');
      b.className = 'ent-ficha' + (this.sabidos.has(c.anglo) ? ' sabido' : '');
      const cuantas = c.donde ? c.donde.size : 1;
      b.innerHTML = '<span class="ent-nom">' + c.nombre + '</span>' +
        '<span class="ent-veces">' +
        (todas ? cuantas + (cuantas === 1 ? ' canción' : ' canciones')
               : c.veces + (c.veces === 1 ? ' vez' : ' veces')) +
        '</span><span class="ent-tic">✓</span>';
      b.onclick = () => {
        if (this.sabidos.has(c.anglo)) this.sabidos.delete(c.anglo);
        else this.sabidos.add(c.anglo);
        this.guardar();
        this.pintar();
      };
      rej.appendChild(b);
    }
    return rej;
  }

  // ------------------------------------------------- paso 2: aprender

  pintarAprender() {
    if (!this.cola || !this.cola.length) {
      this.cola = this.inventario().filter((c) => !this.sabidos.has(c.anglo));
    }
    if (!this.cola.length) {
      this.cont.innerHTML = '<div class="ent-intro"><h2>No queda ninguno</h2>' +
        '<p>Ya marcaste todos los acordes de esta canción.</p></div>';
      const b = document.createElement('button');
      b.className = 'btn destacado ancho grande';
      b.textContent = 'Practicar los cambios →';
      b.onclick = () => this.ir(2);
      this.cont.appendChild(b);
      return;
    }

    const c = this.cola[0];
    const total = this.inventario().filter((x) => !this.sabidos.has(x.anglo)).length;

    const caja = document.createElement('div');
    caja.className = 'ent-foco';
    caja.innerHTML =
      '<div class="ent-marca">Quedan ' + total + '</div>' +
      '<div class="ent-grande">' + c.nombre + '</div>' +
      '<div class="ent-notas">' + c.notas.join(' · ') + '</div>';
    this.cont.appendChild(caja);

    this.cont.appendChild(this.verAcorde(c));

    const mandos = document.createElement('div');
    mandos.className = 'ent-mandos';
    mandos.append(
      this.boton('🔊 Escucharlo', () => this.sonar(c), 'ancho'),
      this.boton('Todavía no', () => {
        this.cola.push(this.cola.shift());
        this.pintar();
      }),
      this.boton('Ya lo tengo ✓', () => {
        this.sabidos.add(c.anglo); this.guardar();
        this.cola.shift();
        this.pintar();
      }, 'destacado'));
    this.cont.appendChild(mandos);
  }

  // ------------------------------------------------- paso 3: cambios

  pintarCambios() {
    const todos = this.cambios().filter((c) => !this.hechos.has(c.par));
    if (!todos.length) {
      this.cont.innerHTML = '<div class="ent-intro"><h2>Listo</h2>' +
        '<p>Ya pasaste por todos los cambios de la canción. ' +
        'Ahora sí: al atril.</p></div>';
      return;
    }
    const c = todos[0];
    this.cambioActual = c;
    this.lado = 0;

    const cab = document.createElement('div');
    cab.className = 'ent-intro';
    cab.innerHTML = '<h2>El cambio</h2><p>Quedan ' + todos.length +
      ' cambios. Este aparece <strong>' + c.veces +
      '</strong> ' + (c.veces === 1 ? 'vez' : 'veces') + ' en la canción.</p>';
    this.cont.appendChild(cab);

    const par = document.createElement('div');
    par.className = 'ent-par';
    par.innerHTML = '<span class="ent-lado" data-lado="0">' + c.de.nombre +
      '</span><span class="ent-flecha">→</span>' +
      '<span class="ent-lado" data-lado="1">' + c.a.nombre + '</span>';
    this.cont.appendChild(par);
    this.lados = par.querySelectorAll('.ent-lado');

    const riel = document.createElement('div');
    riel.className = 'ent-riel';
    riel.innerHTML = '<div class="ent-avance"></div>';
    this.cont.appendChild(riel);
    this.avance = riel.firstChild;

    this.caja = document.createElement('div');
    this.caja.className = 'ent-vista';
    this.cont.appendChild(this.caja);
    this.mostrarLado();

    const vel = document.createElement('div');
    vel.className = 'ent-velocidad';
    const etq = document.createElement('span');
    etq.className = 'etq';
    const verEtq = () => {
      etq.textContent = VELOCIDADES[this.velocidad].toFixed(1) + ' s por acorde';
    };
    verEtq();
    vel.append(
      this.boton('− lento', () => {
        this.velocidad = Math.max(0, this.velocidad - 1); verEtq();
      }),
      etq,
      this.boton('rápido +', () => {
        this.velocidad = Math.min(VELOCIDADES.length - 1, this.velocidad + 1);
        verEtq();
      }));
    this.cont.appendChild(vel);

    const mandos = document.createElement('div');
    mandos.className = 'ent-mandos';
    this.btnCorrer = this.boton('▶ Empezar', () => this.alternar(), 'destacado ancho');
    mandos.append(
      this.btnCorrer,
      this.boton('Otro cambio', () => {
        this.hechos.add(c.par);
        this.pintar();
      }),
      this.boton('Ya lo tengo ✓', () => {
        this.hechos.add(c.par);
        this.sabidos.add(c.de.anglo); this.sabidos.add(c.a.anglo);
        this.guardar();
        this.pintar();
      }, 'destacado'));
    this.cont.appendChild(mandos);
  }

  mostrarLado() {
    const c = this.cambioActual;
    const cual = this.lado ? c.a : c.de;
    this.caja.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'ent-grande';
    t.textContent = cual.nombre;
    const n = document.createElement('div');
    n.className = 'ent-notas';
    n.textContent = cual.notas.join(' · ');
    this.caja.append(t, n, this.verAcorde(cual));
    if (this.lados) {
      this.lados.forEach((el, i) => el.classList.toggle('ahora', i === this.lado));
    }
  }

  alternar() {
    if (this.corriendo) {
      this.parar();
      this.btnCorrer.textContent = '▶ Empezar';
      this.btnCorrer.classList.remove('sonando');
      return;
    }
    Sonido.despertar();
    this.corriendo = true;
    this.btnCorrer.textContent = '⏸ Parar';
    this.btnCorrer.classList.add('sonando');
    this.desde = performance.now();
    this.sonar(this.lado ? this.cambioActual.a : this.cambioActual.de);

    const paso = () => {
      if (!this.corriendo) return;
      const dur = VELOCIDADES[this.velocidad] * 1000;
      const va = performance.now() - this.desde;
      if (this.avance) {
        this.avance.style.width = Math.min(100, va / dur * 100) + '%';
      }
      if (va >= dur) {
        this.desde = performance.now();
        this.lado = this.lado ? 0 : 1;
        this.mostrarLado();
        this.sonar(this.lado ? this.cambioActual.a : this.cambioActual.de);
      }
      this.lazo = requestAnimationFrame(paso);
    };
    this.lazo = requestAnimationFrame(paso);
  }

  // ------------------------------------------------------- piezas

  // El acorde visto en los dos sitios donde lo va a tocar
  verAcorde(c) {
    const caja = document.createElement('div');
    caja.className = 'ent-instrumentos';

    const izq = document.createElement('div');
    izq.className = 'ent-inst';
    izq.innerHTML = '<span class="ent-rot">Piano</span>';
    const tec = document.createElement('div');
    izq.appendChild(tec);
    const p = new Piano(tec, {octavaInicial: 3, octavas: 2});
    p.notacion = this.notacion;
    p.iluminar(c.notasAnglo);

    const der = document.createElement('div');
    der.className = 'ent-inst';
    der.innerHTML = '<span class="ent-rot">Guitarra</span>';
    const g = document.createElement('div');
    der.appendChild(g);
    Guitarra.dibujar(g, c.anglo, this.notacion === 'latino');

    caja.append(izq, der);
    return caja;
  }

  sonar(c) {
    Sonido.despertar();
    Sonido.arpegiar(c.midis, 0.09, {volumen: 0.5});
  }

  boton(texto, alTocar, clases = '') {
    const b = document.createElement('button');
    b.className = 'btn ' + clases;
    b.textContent = texto;
    b.onclick = alTocar;
    return b;
  }
}
