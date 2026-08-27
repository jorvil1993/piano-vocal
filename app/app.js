import { CHORD_DEFINITIONS, SONG_METADATA } from './song-data.js';
import { PianoVisualizer } from './piano.js';

class PianoVocalApp {
  constructor() {
    this.currentVersionKey = 'official'; // Video oficial por defecto
    this.notation = 'latin'; // 'latin' (Do Re Mi) o 'anglo' (C D E)
    this.isPlaying = false;
    this.isSeeking = false;
    this.countInEnabled = true;
    this.loopSectionEnabled = false;
    this.playbackRate = 1.0;
    this.wakeLock = null;
    this.noSleepVideo = null;

    // 4 Stems de Audio (IA Demucs): Voz, Batería, Bajo, Resto
    this.stems = {
      vocals: new Audio(),
      drums: new Audio(),
      bass: new Audio(),
      other: new Audio()
    };
    Object.values(this.stems).forEach(a => {
      a.preload = 'auto';
      a.preservesPitch = true;
    });

    this.volumes = { vocals: 1.0, drums: 0.0, bass: 0.0, other: 0.0 };
    this.mutes = { vocals: false, drums: false, bass: false, other: false };
    this.solos = { vocals: false, drums: false, bass: false, other: false };

    this.audioCtx = null;

    // Elementos DOM
    this.playBtn = document.getElementById('play-main-btn');
    this.progressBarWrap = document.getElementById('progress-bar-wrap');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.currentTimeEl = document.getElementById('current-time');
    this.totalTimeEl = document.getElementById('total-time');
    this.mainChordName = document.getElementById('main-chord-name');
    this.chordNotesBadge = document.getElementById('chord-notes-badge');
    this.activeLyricLine = document.getElementById('active-lyric-line');
    this.activeSectionTag = document.getElementById('active-section-tag');
    this.measuresGrid = document.getElementById('measures-grid');
    this.countInOverlay = document.getElementById('count-in-overlay');
    this.countInNumber = document.getElementById('count-in-number');
    this.speedSelect = document.getElementById('speed-select');
    this.loopBtn = document.getElementById('loop-btn');
    this.countInBtn = document.getElementById('countin-btn');
    this.wakeLockBtn = document.getElementById('wakelock-btn');
    this.mixerDrawer = document.getElementById('mixer-drawer');
    this.toggleMixerBtn = document.getElementById('toggle-mixer-btn');

    // Inicializar visualizador de teclado de piano
    this.piano = new PianoVisualizer('piano-container', {
      notation: this.notation,
      startOctave: 3,
      octaves: 3
    });

    this.initWakeLockEngine();
    this.initAudioSync();
    this.setupEventListeners();
    this.loadVersion(this.currentVersionKey);
  }

  // Motor Multi-Capa para mantener la pantalla 100% encendida sin apagarse
  initWakeLockEngine() {
    // 1. Fallback invisible video loop (funciona en cualquier celular iOS o Android)
    this.createNoSleepVideo();

    // 2. Activar en el primer toque del usuario
    const enableWake = () => {
      this.activateScreenKeepAlive();
      window.removeEventListener('touchstart', enableWake);
      window.removeEventListener('pointerdown', enableWake);
      window.removeEventListener('click', enableWake);
    };
    window.addEventListener('touchstart', enableWake, { passive: true });
    window.addEventListener('pointerdown', enableWake, { passive: true });
    window.addEventListener('click', enableWake, { passive: true });

    // 3. Reactivar cuando el usuario regrese a la pestaña o aplicación
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.activateScreenKeepAlive();
      }
    });
    window.addEventListener('focus', () => this.activateScreenKeepAlive());
  }

  createNoSleepVideo() {
    // Video mínimo transparente en bucle (el método más confiable en móviles para evitar suspensión)
    if (!this.noSleepVideo) {
      this.noSleepVideo = document.createElement('video');
      this.noSleepVideo.setAttribute('title', 'NoSleep');
      this.noSleepVideo.setAttribute('playsinline', '');
      this.noSleepVideo.setAttribute('webkit-playsinline', '');
      this.noSleepVideo.setAttribute('loop', '');
      this.noSleepVideo.muted = true;
      this.noSleepVideo.style.position = 'fixed';
      this.noSleepVideo.style.left = '-100px';
      this.noSleepVideo.style.top = '-100px';
      this.noSleepVideo.style.width = '1px';
      this.noSleepVideo.style.height = '1px';
      this.noSleepVideo.style.opacity = '0.01';
      this.noSleepVideo.style.pointerEvents = 'none';

      // Video webm codificado en base64 de 1 frame
      this.noSleepVideo.src = 'data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua8WIhoAUUU5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5UoE5U';
      document.body.appendChild(this.noSleepVideo);
    }
  }

  async activateScreenKeepAlive() {
    // Método A: Screen Wake Lock API nativo
    if ('wakeLock' in navigator) {
      try {
        if (!this.wakeLock || this.wakeLock.released) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
            if (!document.hidden) {
              setTimeout(() => this.activateScreenKeepAlive(), 1000);
            }
          });
        }
      } catch (err) {
        console.warn('WakeLock nativo:', err);
      }
    }

    // Método B: Video loop de apoyo
    if (this.noSleepVideo) {
      this.noSleepVideo.play().catch(() => {});
    }

    // Actualizar indicador visual
    if (this.wakeLockBtn) {
      this.wakeLockBtn.classList.add('active');
      const textSpan = this.wakeLockBtn.querySelector('.btn-text');
      if (textSpan) textSpan.textContent = "Pantalla Activa";
    }
  }

  loadVersion(versionKey) {
    this.pause();
    this.currentVersionKey = versionKey;
    this.versionData = SONG_METADATA.versions[versionKey];

    // Actualizar botones de versión en interfaz
    document.querySelectorAll('.version-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.version === versionKey);
    });

    // Configurar rutas de audio para los 4 stems
    const stems = this.versionData.stems;
    this.stems.vocals.src = stems.vocals;
    this.stems.drums.src = stems.drums;
    this.stems.bass.src = stems.bass;
    this.stems.other.src = stems.other;

    Object.values(this.stems).forEach(a => {
      a.playbackRate = this.playbackRate;
      a.preservesPitch = true;
    });

    this.applyMixerState();

    this.secondsPerBeat = 60 / this.versionData.bpm;
    this.secondsPerMeasure = this.secondsPerBeat * 4;

    this.renderMeasuresGrid();
    this.updateProgress(0);

    // Reset displays
    this.mainChordName.textContent = "—";
    this.chordNotesBadge.textContent = "Preparado";
    this.activeLyricLine.textContent = "Toca cualquier compás o presiona Play";
    this.activeLyricLine.classList.add('empty');
    this.activeSectionTag.textContent = this.versionData.name;
    this.totalTimeEl.textContent = this.formatTime(this.versionData.totalDuration);
  }

  renderMeasuresGrid() {
    this.measuresGrid.innerHTML = '';
    this.measureElements = [];

    this.versionData.measures.forEach((m, index) => {
      const card = document.createElement('div');
      card.className = 'measure-card';
      card.id = `measure-${m.id}`;
      card.dataset.index = index;

      // Cabecera del compás
      const header = document.createElement('div');
      header.className = 'measure-card-header';
      header.innerHTML = `
        <span class="measure-id">#${m.id}</span>
        ${m.section ? `<span class="section-pill">${m.section}</span>` : ''}
      `;
      card.appendChild(header);

      // Acordes del compás
      const chordsDiv = document.createElement('div');
      chordsDiv.className = 'measure-chords';
      
      const chordNames = m.chords.map(c => {
        if (!c.chord) return '—';
        const chordDef = CHORD_DEFINITIONS[c.chord];
        if (!chordDef) return c.chord;
        return this.notation === 'latin' ? chordDef.name : chordDef.nameEn;
      }).join(' - ');

      chordsDiv.innerHTML = `<span class="measure-chord-pill">${chordNames}</span>`;
      card.appendChild(chordsDiv);

      // Barra de 4 pulsos/beats
      const beatsBar = document.createElement('div');
      beatsBar.className = 'measure-beats-bar';
      for (let b = 0; b < 4; b++) {
        const seg = document.createElement('div');
        seg.className = 'measure-beat-segment';
        beatsBar.appendChild(seg);
      }
      card.appendChild(beatsBar);

      // Letra asociada
      if (m.lyric) {
        const lyricEl = document.createElement('div');
        lyricEl.className = 'measure-lyric';
        lyricEl.textContent = m.lyric;
        card.appendChild(lyricEl);
      }

      // Al hacer clic en un compás, saltar a ese punto exacto sin resetearse
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seekToMeasure(index);
      });

      this.measuresGrid.appendChild(card);
      this.measureElements.push(card);
    });
  }

  getMeasureStartTime(index) {
    return Math.max(0, this.versionData.offsetSeconds + index * this.secondsPerMeasure);
  }

  applyMixerState() {
    const anySolo = Object.values(this.solos).some(v => v);

    for (const key of ['vocals', 'drums', 'bass', 'other']) {
      let audibleVol = this.volumes[key];
      if (this.mutes[key]) {
        audibleVol = 0;
      } else if (anySolo && !this.solos[key]) {
        audibleVol = 0;
      }

      const audio = this.stems[key];
      if (audio) {
        audio.volume = audibleVol;
      }

      // Actualizar UI
      const strip = document.querySelector(`.channel-strip[data-stem="${key}"]`);
      if (strip) {
        strip.classList.toggle('muted', this.mutes[key]);
        strip.classList.toggle('soloed', this.solos[key]);
        const fader = document.getElementById(`fader-${key}`);
        if (fader && document.activeElement !== fader) fader.value = this.volumes[key];
        const valEl = document.getElementById(`val-${key}`);
        if (valEl) valEl.textContent = `${Math.round(this.volumes[key] * 100)}%`;
        const mBtn = document.getElementById(`mute-${key}`);
        if (mBtn) mBtn.classList.toggle('active', this.mutes[key]);
        const sBtn = document.getElementById(`solo-${key}`);
        if (sBtn) sBtn.classList.toggle('active', this.solos[key]);
      }
    }
  }

  setMixerPreset(preset) {
    if (preset === 'vocal-only') {
      this.volumes = { vocals: 1.0, drums: 0.0, bass: 0.0, other: 0.0 };
      this.mutes = { vocals: false, drums: false, bass: false, other: false };
      this.solos = { vocals: false, drums: false, bass: false, other: false };
    } else if (preset === 'vocal-rhythm') {
      this.volumes = { vocals: 1.0, drums: 0.75, bass: 0.75, other: 0.0 };
      this.mutes = { vocals: false, drums: false, bass: false, other: false };
      this.solos = { vocals: false, drums: false, bass: false, other: false };
    } else if (preset === 'full-band') {
      this.volumes = { vocals: 1.0, drums: 0.85, bass: 0.85, other: 0.75 };
      this.mutes = { vocals: false, drums: false, bass: false, other: false };
      this.solos = { vocals: false, drums: false, bass: false, other: false };
    }

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });

    this.applyMixerState();
  }

  seekToMeasure(index) {
    this.isSeeking = true;
    const targetTime = this.getMeasureStartTime(index);

    // Actualizar los 4 stems simultáneamente
    Object.values(this.stems).forEach(audio => {
      try {
        audio.currentTime = targetTime;
      } catch (e) {
        console.warn('Seek error:', e);
      }
    });

    this.updateProgress(targetTime);
    this.highlightMeasureDirectly(index, 1);

    setTimeout(() => {
      this.isSeeking = false;
    }, 200);
  }

  highlightMeasureDirectly(measureIndex, currentBeat = 1) {
    if (measureIndex < 0 || measureIndex >= this.versionData.measures.length) return;
    const measureData = this.versionData.measures[measureIndex];

    // Resaltar tarjeta visual
    this.measureElements.forEach((el, idx) => {
      if (idx === measureIndex) {
        el.classList.add('active');
        const segments = el.querySelectorAll('.measure-beat-segment');
        segments.forEach((seg, bIdx) => {
          seg.classList.toggle('beat-lit', bIdx < currentBeat);
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        el.classList.remove('active');
        el.querySelectorAll('.measure-beat-segment').forEach(s => s.classList.remove('beat-lit'));
      }
    });

    // Acorde en este pulso
    let currentChordKey = null;
    let accumulatedBeats = 0;
    for (const c of measureData.chords) {
      accumulatedBeats += c.beats;
      if (currentBeat <= accumulatedBeats) {
        currentChordKey = c.chord;
        break;
      }
    }

    if (currentChordKey && CHORD_DEFINITIONS[currentChordKey]) {
      const chordDef = CHORD_DEFINITIONS[currentChordKey];
      const chordDisplay = this.notation === 'latin' ? chordDef.name : chordDef.nameEn;
      this.mainChordName.textContent = chordDisplay;

      const notesText = this.notation === 'latin' 
        ? chordDef.latinNotes.join(' - ')
        : chordDef.notes.map(n => n.replace(/[0-9]/g, '')).join(' - ');
      this.chordNotesBadge.textContent = `${chordDef.type}: ${notesText}`;

      this.piano.highlightChord(chordDef);
    } else {
      this.mainChordName.textContent = '—';
      this.chordNotesBadge.textContent = 'Silencio / Transición';
      this.piano.clearHighlights();
    }

    if (measureData.lyric) {
      this.activeLyricLine.textContent = measureData.lyric;
      this.activeLyricLine.classList.remove('empty');
    }

    if (measureData.section) {
      this.activeSectionTag.textContent = measureData.section;
    }

    for (let b = 1; b <= 4; b++) {
      const dot = document.getElementById(`beat-dot-${b}`);
      if (dot) dot.classList.toggle('active', b === currentBeat);
    }
  }

  initAudioSync() {
    const leadAudio = this.stems.vocals;

    leadAudio.addEventListener('timeupdate', () => {
      if (this.isSeeking) return;
      const time = leadAudio.currentTime;
      this.updateProgress(time);
      this.highlightAtTime(time);

      // Verificación de alineación milimétrica entre los 4 stems
      for (const [name, audio] of Object.entries(this.stems)) {
        if (name !== 'vocals' && Math.abs(audio.currentTime - time) > 0.08) {
          audio.currentTime = time;
        }
      }
    });

    leadAudio.addEventListener('seeked', () => {
      this.isSeeking = false;
      const time = leadAudio.currentTime;
      for (const [name, audio] of Object.entries(this.stems)) {
        if (name !== 'vocals') audio.currentTime = time;
      }
    });

    leadAudio.addEventListener('loadedmetadata', () => {
      this.totalTimeEl.textContent = this.formatTime(leadAudio.duration || this.versionData.totalDuration);
    });

    leadAudio.addEventListener('ended', () => {
      this.pause();
      this.updateProgress(0);
    });
  }

  updateProgress(time) {
    const dur = this.stems.vocals.duration || this.versionData.totalDuration;
    const pct = Math.min(100, Math.max(0, (time / dur) * 100));
    this.progressBarFill.style.width = `${pct}%`;
    this.currentTimeEl.textContent = this.formatTime(time);
  }

  highlightAtTime(time) {
    const offset = this.versionData.offsetSeconds;
    if (time < offset) {
      this.clearMeasureHighlights();
      return;
    }

    const elapsed = time - offset;
    const totalBeats = Math.floor(elapsed / this.secondsPerBeat);
    const measureIndex = Math.floor(totalBeats / 4);
    const currentBeat = (totalBeats % 4) + 1; // 1, 2, 3, 4

    if (measureIndex >= this.versionData.measures.length) {
      return;
    }

    this.highlightMeasureDirectly(measureIndex, currentBeat);
  }

  clearMeasureHighlights() {
    this.measureElements.forEach(el => {
      el.classList.remove('active');
      el.querySelectorAll('.measure-beat-segment').forEach(s => s.classList.remove('beat-lit'));
    });
    this.piano.clearHighlights();
    for (let b = 1; b <= 4; b++) {
      const dot = document.getElementById(`beat-dot-${b}`);
      if (dot) dot.classList.remove('active');
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.countInEnabled && this.stems.vocals.currentTime < 1) {
        this.runCountIn(() => this.play());
      } else {
        this.play();
      }
    }
  }

  play() {
    this.isPlaying = true;
    this.playBtn.innerHTML = '⏸';
    
    // Reproducir los 4 stems sincronizados
    Object.values(this.stems).forEach(audio => {
      audio.playbackRate = this.playbackRate;
      audio.play().catch(e => console.warn('Play stem error:', e));
    });

    this.activateScreenKeepAlive();
  }

  pause() {
    this.isPlaying = false;
    this.playBtn.innerHTML = '▶';
    Object.values(this.stems).forEach(audio => audio.pause());
  }

  runCountIn(callback) {
    this.countInOverlay.classList.add('visible');
    let count = 1;
    this.countInNumber.textContent = count;
    this.playMetronomeClick(880);

    const interval = setInterval(() => {
      count++;
      if (count <= 4) {
        this.countInNumber.textContent = count;
        this.playMetronomeClick(count === 1 ? 880 : 440);
      } else {
        clearInterval(interval);
        this.countInOverlay.classList.remove('visible');
        callback();
      }
    }, (60 / this.versionData.bpm) * 1000);
  }

  playMetronomeClick(frequency) {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      // AudioContext policy
    }
  }

  setupEventListeners() {
    this.playBtn.addEventListener('click', () => this.togglePlay());

    // Barra de progreso interactiva (Seek en cualquier momento)
    this.progressBarWrap.addEventListener('click', (e) => {
      const rect = this.progressBarWrap.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const dur = this.stems.vocals.duration || this.versionData.totalDuration;
      const targetTime = pos * dur;
      this.isSeeking = true;
      Object.values(this.stems).forEach(audio => {
        audio.currentTime = targetTime;
      });
      this.updateProgress(targetTime);
      this.highlightAtTime(targetTime);
      setTimeout(() => { this.isSeeking = false; }, 200);
    });

    // Pestañas de versión (Oficial vs Live)
    document.querySelectorAll('.version-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = e.target.dataset.version;
        if (v !== this.currentVersionKey) {
          this.loadVersion(v);
        }
      });
    });

    // Selector de notación (Do-Re-Mi vs C-D-E)
    document.querySelectorAll('.notation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.notation-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.notation = e.target.dataset.notation;
        this.piano.setNotation(this.notation);
        this.renderMeasuresGrid();
        this.highlightAtTime(this.stems.vocals.currentTime);
      });
    });

    // Controles de Mezclador de 4 Canales (Faders)
    ['vocals', 'drums', 'bass', 'other'].forEach(stem => {
      const fader = document.getElementById(`fader-${stem}`);
      if (fader) {
        fader.addEventListener('input', (e) => {
          this.volumes[stem] = parseFloat(e.target.value);
          this.applyMixerState();
        });
      }

      const mBtn = document.getElementById(`mute-${stem}`);
      if (mBtn) {
        mBtn.addEventListener('click', () => {
          this.mutes[stem] = !this.mutes[stem];
          this.applyMixerState();
        });
      }

      const sBtn = document.getElementById(`solo-${stem}`);
      if (sBtn) {
        sBtn.addEventListener('click', () => {
          this.solos[stem] = !this.solos[stem];
          this.applyMixerState();
        });
      }
    });

    // Botones de Preajustes de Mezcla (Presets)
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setMixerPreset(e.target.dataset.preset);
      });
    });

    // Botón para alternar visibilidad del mezclador
    if (this.toggleMixerBtn && this.mixerDrawer) {
      this.toggleMixerBtn.addEventListener('click', () => {
        const isCollapsed = this.mixerDrawer.classList.toggle('collapsed');
        this.toggleMixerBtn.classList.toggle('active', !isCollapsed);
      });
    }

    // Selector de velocidad
    this.speedSelect.addEventListener('change', (e) => {
      this.playbackRate = parseFloat(e.target.value);
      Object.values(this.stems).forEach(audio => {
        audio.playbackRate = this.playbackRate;
      });
    });

    // Conteo previo toggle
    this.countInBtn.addEventListener('click', () => {
      this.countInEnabled = !this.countInEnabled;
      this.countInBtn.classList.toggle('active', this.countInEnabled);
    });

    // Pantalla completa
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Wake Lock botón
    if (this.wakeLockBtn) {
      this.wakeLockBtn.addEventListener('click', () => {
        if (this.wakeLock) {
          this.wakeLock.release();
          this.wakeLock = null;
          this.wakeLockBtn.classList.remove('active');
        } else {
          this.activateScreenKeepAlive();
        }
      });
    }

    // Atajos de teclado
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowLeft') {
        const target = Math.max(0, this.stems.vocals.currentTime - 5);
        Object.values(this.stems).forEach(a => a.currentTime = target);
      } else if (e.code === 'ArrowRight') {
        const target = Math.min(this.stems.vocals.duration, this.stems.vocals.currentTime + 5);
        Object.values(this.stems).forEach(a => a.currentTime = target);
      }
    });
  }

  formatTime(secs) {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new PianoVocalApp();
});
