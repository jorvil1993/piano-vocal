// Componente del visualizador de Teclado de Piano Interactivo con sintetizador Web Audio
export class PianoVisualizer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.notation = options.notation || 'latin'; // 'latin' (Do Re Mi) o 'anglo' (C D E)
    this.startOctave = options.startOctave || 3;
    this.octaves = options.octaves || 3; // C3 a B5 + C6 (37 teclas)
    this.activeNotes = new Set();
    this.highlightedChord = null;
    this.audioCtx = null;

    this.noteNamesLatin = {
      'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi',
      'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La',
      'A#': 'La#', 'B': 'Si'
    };

    this.initAudio();
    this.render();
  }

  initAudio() {
    // Inicialización perezosa de Web Audio para responder al toque del usuario
    const init = () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      window.removeEventListener('pointerdown', init);
    };
    window.addEventListener('pointerdown', init);
  }

  playNoteSound(freq) {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    
    // Sintetizador estilo piano suave: fundamental + armónicos
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  }

  getNoteFrequency(noteName, octave) {
    const semitones = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };
    const midi = (octave + 1) * 12 + semitones[noteName];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setNotation(mode) {
    this.notation = mode;
    this.updateKeyLabels();
  }

  render() {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'piano-wrapper';

    const keysTrack = document.createElement('div');
    keysTrack.className = 'piano-keys';

    const notesPattern = [
      { name: 'C', isBlack: false },
      { name: 'C#', isBlack: true },
      { name: 'D', isBlack: false },
      { name: 'D#', isBlack: true },
      { name: 'E', isBlack: false },
      { name: 'F', isBlack: false },
      { name: 'F#', isBlack: true },
      { name: 'G', isBlack: false },
      { name: 'G#', isBlack: true },
      { name: 'A', isBlack: false },
      { name: 'A#', isBlack: true },
      { name: 'B', isBlack: false }
    ];

    this.keyElements = new Map();

    for (let o = 0; o < this.octaves; o++) {
      const currentOctave = this.startOctave + o;
      notesPattern.forEach(item => {
        const fullNote = `${item.name}${currentOctave}`;
        const keyEl = document.createElement('button');
        keyEl.type = 'button';
        keyEl.className = `piano-key ${item.isBlack ? 'black-key' : 'white-key'}`;
        keyEl.dataset.note = fullNote;
        keyEl.dataset.pitch = item.name;
        keyEl.dataset.octave = currentOctave;

        const label = document.createElement('span');
        label.className = 'key-label';
        keyEl.appendChild(label);

        const freq = this.getNoteFrequency(item.name, currentOctave);
        keyEl.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.playNoteSound(freq);
          keyEl.classList.add('key-pressed');
        });

        const release = () => keyEl.classList.remove('key-pressed');
        keyEl.addEventListener('pointerup', release);
        keyEl.addEventListener('pointerleave', release);

        keysTrack.appendChild(keyEl);
        this.keyElements.set(fullNote, keyEl);
      });
    }

    // Última tecla Do superior para cerrar (C6)
    const finalOctave = this.startOctave + this.octaves;
    const finalNote = `C${finalOctave}`;
    const finalKey = document.createElement('button');
    finalKey.type = 'button';
    finalKey.className = 'piano-key white-key';
    finalKey.dataset.note = finalNote;
    finalKey.dataset.pitch = 'C';
    finalKey.dataset.octave = finalOctave;
    const finalLabel = document.createElement('span');
    finalLabel.className = 'key-label';
    finalKey.appendChild(finalLabel);

    const finalFreq = this.getNoteFrequency('C', finalOctave);
    finalKey.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.playNoteSound(finalFreq);
      finalKey.classList.add('key-pressed');
    });
    const finalRelease = () => finalKey.classList.remove('key-pressed');
    finalKey.addEventListener('pointerup', finalRelease);
    finalKey.addEventListener('pointerleave', finalRelease);

    keysTrack.appendChild(finalKey);
    this.keyElements.set(finalNote, finalKey);

    wrapper.appendChild(keysTrack);
    this.container.appendChild(wrapper);

    this.updateKeyLabels();
  }

  updateKeyLabels() {
    this.keyElements.forEach((keyEl, fullNote) => {
      const pitch = keyEl.dataset.pitch;
      const labelSpan = keyEl.querySelector('.key-label');
      if (labelSpan) {
        if (this.notation === 'latin') {
          labelSpan.textContent = this.noteNamesLatin[pitch] || pitch;
        } else {
          labelSpan.textContent = pitch;
        }
      }
    });
  }

  // Resalta las teclas del acorde activo
  highlightChord(chordDef) {
    // Limpiar notas previas
    this.keyElements.forEach(keyEl => {
      keyEl.classList.remove('chord-active', 'chord-bass', 'chord-root');
      const badge = keyEl.querySelector('.key-badge');
      if (badge) badge.remove();
    });

    if (!chordDef || !chordDef.notes) return;

    this.highlightedChord = chordDef;

    // Normalizar notas (e.g. D4, F#4, A4)
    chordDef.notes.forEach((noteStr, idx) => {
      // Buscar coincidencia exacta o coincidencia por tono en el rango
      let keyEl = this.keyElements.get(noteStr);
      
      // Si la nota está fuera de rango o con bemol, normalizar
      if (!keyEl) {
        const pitch = noteStr.replace(/[0-9]/g, '');
        // Buscar primera ocurrencia en octava 3 o 4
        for (let o = this.startOctave; o < this.startOctave + this.octaves; o++) {
          const alt = this.keyElements.get(`${pitch}${o}`);
          if (alt) {
            keyEl = alt;
            break;
          }
        }
      }

      if (keyEl) {
        keyEl.classList.add('chord-active');
        if (idx === 0) {
          keyEl.classList.add('chord-root');
        }

        // Añadir indicador visual de nota
        const badge = document.createElement('span');
        badge.className = 'key-badge';
        const pitch = keyEl.dataset.pitch;
        badge.textContent = this.notation === 'latin' ? (this.noteNamesLatin[pitch] || pitch) : pitch;
        keyEl.appendChild(badge);
      }
    });

    // Auto-scroll del piano en móviles para centrar las teclas activas si no caben todas
    const firstActive = this.container.querySelector('.chord-active');
    if (firstActive && window.innerWidth < 768) {
      firstActive.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  clearHighlights() {
    this.keyElements.forEach(keyEl => {
      keyEl.classList.remove('chord-active', 'chord-bass', 'chord-root');
      const badge = keyEl.querySelector('.key-badge');
      if (badge) badge.remove();
    });
    this.highlightedChord = null;
  }
}
