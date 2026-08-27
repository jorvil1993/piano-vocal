// Rollo de piano estilo Synthesia: las notas caen y llegan al teclado justo
// cuando suenan. Solo dibuja: no maneja audio ni carga datos, para poder
// usarlo dentro de cualquier pantalla.
const CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LATIN = {C: 'Do', 'C#': 'Do#', D: 'Re', 'D#': 'Re#', E: 'Mi', F: 'Fa',
  'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'};
const NEGRA = [false, true, false, true, false, false, true, false, true,
  false, true, false];

const MEDIO = 60;               // Do central: separa mano izquierda de derecha
const COLOR_IZQ = '#4aa3ff';
const COLOR_DER = '#ffb64a';

export class RolloPiano {
  constructor(lienzo) {
    this.lienzo = typeof lienzo === 'string'
      ? document.getElementById(lienzo) : lienzo;
    this.ctx = this.lienzo.getContext('2d');
    this.notacion = 'latino';
    this.caida = 3.0;
    this.notas = [];
  }

  cargar(notas) {
    this.notas = notas || [];
    if (!this.notas.length) return;
    const alturas = this.notas.map((n) => n.midi);
    // Se estira a octavas completas para que el teclado empiece en un Do
    this.desde = Math.floor(Math.min(...alturas) / 12) * 12;
    this.hasta = Math.ceil((Math.max(...alturas) + 1) / 12) * 12 - 1;
    this.armarTeclas();
  }

  armarTeclas() {
    const blancas = [];
    for (let m = this.desde; m <= this.hasta; m++) {
      if (!NEGRA[m % 12]) blancas.push(m);
    }
    this.blancas = blancas;
    this.teclas = {};
    const ancho = 1 / blancas.length;

    blancas.forEach((m, i) => {
      this.teclas[m] = {x: i * ancho, w: ancho, negra: false};
    });
    for (let m = this.desde; m <= this.hasta; m++) {
      if (!NEGRA[m % 12]) continue;
      const siguiente = blancas.findIndex((b) => b > m);
      const i = siguiente < 0 ? blancas.length : siguiente;
      this.teclas[m] = {x: i * ancho - ancho * 0.3, w: ancho * 0.6, negra: true};
    }
  }

  dibujar(t, beats) {
    if (!this.notas.length) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const W = this.lienzo.clientWidth;
    const H = this.lienzo.clientHeight;
    if (!W || !H) return;
    if (this.lienzo.width !== W * dpr || this.lienzo.height !== H * dpr) {
      this.lienzo.width = W * dpr;
      this.lienzo.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // El teclado se encoge en pantallas chicas
    const altoTeclado = Math.max(52, Math.min(104, H * 0.22));
    const linea = H - altoTeclado;
    const pps = linea / this.caida;

    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    for (let m = this.desde; m <= this.hasta; m++) {
      if (m % 12 !== 0) continue;
      const k = this.teclas[m];
      if (!k) continue;
      ctx.beginPath();
      ctx.moveTo(k.x * W, 0);
      ctx.lineTo(k.x * W, linea);
      ctx.stroke();
    }

    for (const b of (beats || [])) {
      if (b.pulso !== 1 || b.t < t || b.t > t + this.caida) continue;
      const y = linea - (b.t - t) * pps;
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const sonando = new Set();
    for (const n of this.notas) {
      if (n.fin < t - 0.15 || n.inicio > t + this.caida) continue;
      const k = this.teclas[n.midi];
      if (!k) continue;

      const yAbajo = linea - (n.inicio - t) * pps;
      const yArriba = linea - (n.fin - t) * pps;
      const alto = Math.max(4, yAbajo - yArriba);
      const activa = n.inicio <= t && n.fin >= t;
      if (activa) sonando.add(n.midi);

      ctx.globalAlpha = k.negra ? 0.92 : 1;
      ctx.fillStyle = activa ? '#fff' : (n.midi < MEDIO ? COLOR_IZQ : COLOR_DER);
      this.caja(ctx, k.x * W + 1, Math.min(yArriba, linea - alto),
                Math.max(3, k.w * W - 2), Math.min(alto, linea - yArriba), 3);
      ctx.fill();
      if (activa) {
        ctx.strokeStyle = n.midi < MEDIO ? COLOR_IZQ : COLOR_DER;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    this.dibujarTeclado(ctx, W, linea, altoTeclado, sonando);
  }

  caja(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  dibujarTeclado(ctx, W, y0, alto, sonando) {
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(W, y0);
    ctx.stroke();

    for (const m of this.blancas) {
      const k = this.teclas[m];
      const on = sonando.has(m);
      ctx.fillStyle = on ? (m < MEDIO ? COLOR_IZQ : COLOR_DER) : '#f2f4f7';
      ctx.fillRect(k.x * W, y0, k.w * W - 1, alto);
      if (m % 12 === 0 && k.w * W > 14) {
        ctx.fillStyle = '#0d1117';
        ctx.font = '600 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.nombre(m), k.x * W + k.w * W / 2, y0 + alto - 6);
      }
    }
    for (let m = this.desde; m <= this.hasta; m++) {
      if (!NEGRA[m % 12]) continue;
      const k = this.teclas[m];
      const on = sonando.has(m);
      ctx.fillStyle = on ? (m < MEDIO ? '#2f7fd1' : '#d98a1f') : '#10151d';
      ctx.fillRect(k.x * W, y0, k.w * W, alto * 0.62);
    }
  }

  nombre(midi) {
    const c = CLASES[midi % 12];
    return (this.notacion === 'latino' ? LATIN[c] : c) + (Math.floor(midi / 12) - 1);
  }
}
