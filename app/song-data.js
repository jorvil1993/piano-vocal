// Mapeo completo de acordes para piano y datos de la canción
export const CHORD_DEFINITIONS = {
  'Re': {
    name: 'Re',
    nameEn: 'D',
    root: 'D',
    type: 'Mayor',
    notes: ['D4', 'F#4', 'A4'],
    bass: 'D3',
    latinNotes: ['Re', 'Fa#', 'La']
  },
  'La#dim': {
    name: 'La#dim',
    nameEn: 'A#dim',
    root: 'A#',
    type: 'Disminuido',
    notes: ['A#3', 'C#4', 'E4'],
    bass: 'A#2',
    latinNotes: ['La#', 'Do#', 'Mi']
  },
  'Do#dim': {
    name: 'Do#dim',
    nameEn: 'C#dim',
    root: 'C#',
    type: 'Disminuido',
    notes: ['C#4', 'E4', 'G4'],
    bass: 'C#3',
    latinNotes: ['Do#', 'Mi', 'Sol']
  },
  'Fa#dim': {
    name: 'Fa#dim',
    nameEn: 'F#dim',
    root: 'F#',
    type: 'Disminuido',
    notes: ['F#3', 'A3', 'C4'],
    bass: 'F#2',
    latinNotes: ['Fa#', 'La', 'Do']
  },
  'Sol#dim': {
    name: 'Sol#dim',
    nameEn: 'G#dim',
    root: 'G#',
    type: 'Disminuido',
    notes: ['G#3', 'B3', 'D4'],
    bass: 'G#2',
    latinNotes: ['Sol#', 'Si', 'Re']
  },
  'Sol': {
    name: 'Sol',
    nameEn: 'G',
    root: 'G',
    type: 'Mayor',
    notes: ['G3', 'B3', 'D4'],
    bass: 'G2',
    latinNotes: ['Sol', 'Si', 'Re']
  },
  'Solm': {
    name: 'Solm',
    nameEn: 'Gm',
    root: 'G',
    type: 'Menor',
    notes: ['G3', 'A#3', 'D4'],
    bass: 'G2',
    latinNotes: ['Sol', 'La#', 'Re']
  },
  'La': {
    name: 'La',
    nameEn: 'A',
    root: 'A',
    type: 'Mayor',
    notes: ['A3', 'C#4', 'E4'],
    bass: 'A2',
    latinNotes: ['La', 'Do#', 'Mi']
  },
  'Lam': {
    name: 'Lam',
    nameEn: 'Am',
    root: 'A',
    type: 'Menor',
    notes: ['A3', 'C4', 'E4'],
    bass: 'A2',
    latinNotes: ['La', 'Do', 'Mi']
  },
  'Lasus4': {
    name: 'La sus4',
    nameEn: 'Asus4',
    root: 'A',
    type: 'Sus4',
    notes: ['A3', 'D4', 'E4'],
    bass: 'A2',
    latinNotes: ['La', 'Re', 'Mi']
  },
  'La7': {
    name: 'La 7',
    nameEn: 'A7',
    root: 'A',
    type: 'Séptima dominante',
    notes: ['A3', 'C#4', 'E4', 'G4'],
    bass: 'A2',
    latinNotes: ['La', 'Do#', 'Mi', 'Sol']
  },
  'Sim': {
    name: 'Sim',
    nameEn: 'Bm',
    root: 'B',
    type: 'Menor',
    notes: ['B3', 'D4', 'F#4'],
    bass: 'B2',
    latinNotes: ['Si', 'Re', 'Fa#']
  },
  'Si': {
    name: 'Si',
    nameEn: 'B',
    root: 'B',
    type: 'Mayor',
    notes: ['B3', 'D#4', 'F#4'],
    bass: 'B2',
    latinNotes: ['Si', 'Re#', 'Fa#']
  },
  'Si7': {
    name: 'Si 7',
    nameEn: 'B7',
    root: 'B',
    type: 'Séptima dominante',
    notes: ['B3', 'D#4', 'F#4', 'A4'],
    bass: 'B2',
    latinNotes: ['Si', 'Re#', 'Fa#', 'La']
  },
  'Fa#m': {
    name: 'Fa#m',
    nameEn: 'F#m',
    root: 'F#',
    type: 'Menor',
    notes: ['F#3', 'A3', 'C#4'],
    bass: 'F#2',
    latinNotes: ['Fa#', 'La', 'Do#']
  },
  'Fa#': {
    name: 'Fa#',
    nameEn: 'F#',
    root: 'F#',
    type: 'Mayor',
    notes: ['F#3', 'A#3', 'C#4'],
    bass: 'F#2',
    latinNotes: ['Fa#', 'La#', 'Do#']
  },
  'Mim': {
    name: 'Mim',
    nameEn: 'Em',
    root: 'E',
    type: 'Menor',
    notes: ['E3', 'G3', 'B3'],
    bass: 'E2',
    latinNotes: ['Mi', 'Sol', 'Si']
  },
  'Mim7': {
    name: 'Mim 7',
    nameEn: 'Em7',
    root: 'E',
    type: 'Menor 7',
    notes: ['E3', 'G3', 'B3', 'D4'],
    bass: 'E2',
    latinNotes: ['Mi', 'Sol', 'Si', 'Re']
  },
  'Do': {
    name: 'Do',
    nameEn: 'C',
    root: 'C',
    type: 'Mayor',
    notes: ['C4', 'E4', 'G4'],
    bass: 'C3',
    latinNotes: ['Do', 'Mi', 'Sol']
  }
};

export const SONG_METADATA = {
  title: "Hasta el Final",
  artist: "Estación Cero",
  timeSignature: "4/4",
  key: "Re Mayor (D)",
  versions: {
    official: {
      name: "Video Oficial",
      bpm: 68.6,
      offsetSeconds: 3.65, // Calibrado al milisegundo: Compás #27 (Re) a los 94.65s ("cuesta"), Compás #28 (La#dim) a los 98.20s ("amor")
      stems: {
        vocals: "audio/official_vocals.mp3",
        drums: "audio/official_drums.mp3",
        bass: "audio/official_bass.mp3",
        other: "audio/official_other.mp3"
      },
      totalDuration: 310.6,
      measures: [
        // Fila 1 (Intro acústica / silencio video)
        { id: 1, chords: [{ chord: null, beats: 4 }], section: "Intro", lyric: "(Inicio instrumental)" },
        { id: 2, chords: [{ chord: null, beats: 4 }] },
        { id: 3, chords: [{ chord: null, beats: 4 }] },
        { id: 4, chords: [{ chord: null, beats: 4 }] },
        // Fila 2
        { id: 5, chords: [{ chord: null, beats: 4 }] },
        { id: 6, chords: [{ chord: null, beats: 4 }] },
        { id: 7, chords: [{ chord: 'Sim', beats: 4 }] },
        { id: 8, chords: [{ chord: 'La', beats: 2 }, { chord: 'Lam', beats: 2 }] },
        // Fila 3
        { id: 9, chords: [{ chord: 'Sol', beats: 4 }] },
        { id: 10, chords: [{ chord: 'La', beats: 4 }] },
        { id: 11, chords: [{ chord: 'Sim', beats: 4 }] },
        { id: 12, chords: [{ chord: 'La', beats: 4 }] },
        // Fila 4
        { id: 13, chords: [{ chord: 'Sol', beats: 4 }] },
        { id: 14, chords: [{ chord: 'La', beats: 4 }] },
        { id: 15, chords: [{ chord: 'Re', beats: 4 }] },
        { id: 16, chords: [{ chord: 'La#dim', beats: 4 }] },
        // Fila 5
        { id: 17, chords: [{ chord: 'Sol', beats: 4 }] },
        { id: 18, chords: [{ chord: 'La', beats: 4 }] },
        { id: 19, chords: [{ chord: 'Re', beats: 4 }] },
        { id: 20, chords: [{ chord: 'La#dim', beats: 4 }] },
        // Fila 6
        { id: 21, chords: [{ chord: 'Sol', beats: 4 }] },
        { id: 22, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }] },
        { id: 23, chords: [{ chord: null, beats: 4 }] },
        { id: 24, chords: [{ chord: null, beats: 3 }, { chord: 'Re', beats: 1 }] },
        // Fila 7
        { id: 25, chords: [{ chord: null, beats: 2 }, { chord: 'La#dim', beats: 2 }] },
        { id: 26, chords: [{ chord: null, beats: 2 }, { chord: 'Do#dim', beats: 2 }], lyric: "(Cómo me...)" },
        { id: 27, chords: [{ chord: 'Re', beats: 4 }], section: "Estrofa 1", lyric: "Cuesta entender que tanto..." },
        { id: 28, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Amor," },
        // Fila 8
        { id: 29, chords: [{ chord: 'Sol', beats: 4 }], lyric: "En esa cruz," },
        { id: 30, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Fuera por mí." },
        { id: 31, chords: [{ chord: 'Re', beats: 4 }], lyric: "Tú, siendo rey, no te negaste al dolor," },
        { id: 32, chords: [{ chord: 'La#dim', beats: 4 }] },
        // Fila 9
        { id: 33, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo estaba ahí," },
        { id: 34, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Mi lanza atravesaba tu costado." },
        { id: 35, chords: [{ chord: 'Fa#m', beats: 4 }], lyric: "Todo un héroe y en silencio," },
        { id: 36, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Eras tú, mi salvador," },
        // Fila 10
        { id: 37, chords: [{ chord: 'Mim7', beats: 4 }], lyric: "Te entregaste por amor." },
        { id: 38, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }] },
        { id: 39, chords: [{ chord: 'Re', beats: 4 }], section: "Estribillo 1", lyric: "Hasta el final," },
        { id: 40, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir," },
        // Fila 11
        { id: 41, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo," },
        { id: 42, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Tú te entregaste por mí." },
        { id: 43, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor," },
        { id: 44, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere," },
        // Fila 12
        { id: 45, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad, oh-oh" },
        { id: 46, chords: [{ chord: 'La', beats: 4 }] },
        { id: 47, chords: [{ chord: 'Re', beats: 4 }], section: "Interludio" },
        { id: 48, chords: [{ chord: 'La#dim', beats: 4 }] },
        // Fila 13
        { id: 49, chords: [{ chord: 'Sol', beats: 4 }], section: "Estrofa 2" },
        { id: 50, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }] },
        { id: 51, chords: [{ chord: 'Fa#m', beats: 4 }], lyric: "Todo un héroe y en silencio eras tú," },
        { id: 52, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Mi salvador, te entregaste por amor." },
        // Fila 14
        { id: 53, chords: [{ chord: 'Mim7', beats: 4 }] },
        { id: 54, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }] },
        { id: 55, chords: [{ chord: 'Re', beats: 4 }], section: "Estribillo 2", lyric: "Hasta el final," },
        { id: 56, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir," },
        // Fila 15
        { id: 57, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo," },
        { id: 58, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Tú te entregaste por mí." },
        { id: 59, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor," },
        { id: 60, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere," },
        // Fila 16
        { id: 61, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad." },
        { id: 62, chords: [{ chord: 'La', beats: 4 }] },
        { id: 63, chords: [{ chord: 'Fa#m', beats: 4 }], section: "Puente", lyric: "Hasta el último suspiro, sin renunciar a este castigo," },
        { id: 64, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Condenado por amar," },
        // Fila 17
        { id: 65, chords: [{ chord: 'Sol#dim', beats: 4 }] },
        { id: 66, chords: [{ chord: 'Solm', beats: 4 }], lyric: "Hasta morir, hasta el final, por darle a mi alma libertad." },
        { id: 67, chords: [{ chord: null, beats: 4 }] },
        { id: 68, chords: [{ chord: 'Re', beats: 4 }], section: "Estribillo Final", lyric: "Hasta el final," },
        // Fila 18 (Screenshot 3)
        { id: 69, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir," },
        { id: 70, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo oh," },
        { id: 71, chords: [{ chord: 'La', beats: 4 }], lyric: "Tú te entregaste por mí." },
        { id: 72, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor," },
        // Fila 19
        { id: 73, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere," },
        { id: 74, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad." },
        { id: 75, chords: [{ chord: 'La', beats: 4 }] },
        { id: 76, chords: [{ chord: 'Re', beats: 4 }], lyric: "Hasta el final," },
        // Fila 20
        { id: 77, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir," },
        { id: 78, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo," },
        { id: 79, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Tú te entregaste por mí." },
        { id: 80, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor," },
        // Fila 21
        { id: 81, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere," },
        { id: 82, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad, oh-oh" },
        { id: 83, chords: [{ chord: 'La', beats: 4 }] },
        { id: 84, chords: [{ chord: 'Re', beats: 4 }], section: "Cierre" },
        // Fila 22
        { id: 85, chords: [{ chord: 'La#dim', beats: 4 }] },
        { id: 86, chords: [{ chord: 'Re', beats: 4 }] },
        { id: 87, chords: [{ chord: 'La#dim', beats: 4 }] },
        { id: 88, chords: [{ chord: null, beats: 4 }] },
        // Fila 23
        { id: 89, chords: [{ chord: 'Solm', beats: 1 }, { chord: null, beats: 3 }] }
      ]
    },
    live: {
      name: "Live Session From LA",
      bpm: 62.8,
      offsetSeconds: -2.0,
      stems: {
        vocals: "audio/live_vocals.mp3",
        drums: "audio/live_drums.mp3",
        bass: "audio/live_bass.mp3",
        other: "audio/live_other.mp3"
      },
      totalDuration: 241.0,
      measures: [
        // Intro 1
        { id: 1, chords: [{ chord: null, beats: 1 }, { chord: 'Re', beats: 3 }], section: "Intro 1" },
        { id: 2, chords: [{ chord: null, beats: 2 }, { chord: 'La#dim', beats: 2 }] },
        { id: 3, chords: [{ chord: null, beats: 4 }] },
        // Estrofa 1
        { id: 4, chords: [{ chord: 'Re', beats: 4 }], section: "Estrofa 1", lyric: "Cómo me cuesta entender que tanto amor" },
        { id: 5, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "En esa cruz fuera por mí" },
        { id: 6, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Tú, siendo rey, no te negaste al dolor" },
        { id: 7, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }], lyric: "Y yo estaba allí" },
        { id: 8, chords: [{ chord: 'Re', beats: 4 }] },
        { id: 9, chords: [{ chord: 'La#dim', beats: 4 }] },
        { id: 10, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Mi lanza atravesaba tu costado" },
        { id: 11, chords: [{ chord: 'Lasus4', beats: 2 }, { chord: 'La', beats: 2 }] },
        { id: 12, chords: [{ chord: 'Fa#m', beats: 4 }], lyric: "Todo un héroe y en silencio, eras tú" },
        { id: 13, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Mi salvador" },
        { id: 14, chords: [{ chord: 'Mim7', beats: 4 }], lyric: "Te entregaste por amor" },
        { id: 15, chords: [{ chord: 'La', beats: 4 }] },
        // Estribillo 1
        { id: 16, chords: [{ chord: 'Re', beats: 4 }], section: "Estribillo 1", lyric: "Hasta el final" },
        { id: 17, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir" },
        { id: 18, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo" },
        { id: 19, chords: [{ chord: 'La', beats: 4 }], lyric: "Tú te entregaste por mí" },
        { id: 20, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor" },
        { id: 21, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere" },
        { id: 22, chords: [{ chord: 'Mim7', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad, oh-oh" },
        { id: 23, chords: [{ chord: 'La', beats: 4 }] },
        // Intro 2
        { id: 24, chords: [{ chord: 'Re', beats: 4 }], section: "Intro 2" },
        { id: 25, chords: [{ chord: 'La#dim', beats: 4 }] },
        { id: 26, chords: [{ chord: 'Sol', beats: 4 }] },
        { id: 27, chords: [{ chord: 'La', beats: 4 }] },
        // Estrofa 2
        { id: 28, chords: [{ chord: 'Fa#m', beats: 4 }], section: "Estrofa 2", lyric: "Todo un héroe y en silencio, eras tú" },
        { id: 29, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Mi salvador" },
        { id: 30, chords: [{ chord: 'Mim7', beats: 4 }], lyric: "Te entregaste por amor" },
        { id: 31, chords: [{ chord: 'La', beats: 2 }, { chord: 'La7', beats: 2 }] },
        // Estribillo 2
        { id: 32, chords: [{ chord: 'Re', beats: 4 }], section: "Estribillo 2", lyric: "Hasta el final" },
        { id: 33, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir" },
        { id: 34, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo" },
        { id: 35, chords: [{ chord: 'La', beats: 4 }], lyric: "Tú te entregaste por mí" },
        { id: 36, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor" },
        { id: 37, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere" },
        { id: 38, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad, oh-oh" },
        { id: 39, chords: [{ chord: 'La', beats: 4 }] },
        // Puente
        { id: 40, chords: [{ chord: 'Fa#', beats: 4 }], section: "Puente", lyric: "Hasta el último suspiro" },
        { id: 41, chords: [{ chord: 'Sim', beats: 4 }], lyric: "Sin renunciar a este castigo" },
        { id: 42, chords: [{ chord: 'Sol#dim', beats: 4 }], lyric: "Condenado por amar" },
        { id: 43, chords: [{ chord: 'Solm', beats: 4 }], lyric: "Hasta morir, hasta el final" },
        // Clímax
        { id: 44, chords: [{ chord: 'Re', beats: 4 }], lyric: "Por darle a mi alma libertad" },
        { id: 45, chords: [{ chord: 'Fa#dim', beats: 2 }, { chord: 'La#dim', beats: 2 }], lyric: "Hasta el final" },
        { id: 46, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Hasta morir" },
        { id: 47, chords: [{ chord: 'La', beats: 4 }], lyric: "Y yo sin merecerlo" },
        { id: 48, chords: [{ chord: 'Re', beats: 4 }], lyric: "Tú te entregaste por mí" },
        { id: 49, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "(Fue por amor)" },
        { id: 50, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que nunca muere" },
        { id: 51, chords: [{ chord: 'La', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad" },
        { id: 52, chords: [{ chord: 'Re', beats: 4 }], lyric: "Hasta el final" },
        { id: 53, chords: [{ chord: 'La#dim', beats: 4 }], lyric: "Hasta morir" },
        { id: 54, chords: [{ chord: 'Sol', beats: 4 }], lyric: "Y yo sin merecerlo" },
        { id: 55, chords: [{ chord: 'La', beats: 4 }], lyric: "Tú te entregaste por mí" },
        { id: 56, chords: [{ chord: 'Re', beats: 4 }], lyric: "Fue por amor" },
        { id: 57, chords: [{ chord: 'Do', beats: 2 }, { chord: 'Si', beats: 2 }], lyric: "Amor que nunca muere" },
        { id: 58, chords: [{ chord: 'Mim', beats: 4 }], lyric: "Amor que entrega todo hasta la eternidad, oh-oh" },
        { id: 59, chords: [{ chord: 'La', beats: 4 }] },
        { id: 60, chords: [{ chord: 'Mim', beats: 4 }] },
        { id: 61, chords: [{ chord: 'La', beats: 4 }] },
        // Cierre
        { id: 62, chords: [{ chord: 'Re', beats: 4 }], section: "Cierre" },
        { id: 63, chords: [{ chord: 'La#dim', beats: 4 }] },
        { id: 64, chords: [{ chord: 'Re', beats: 4 }] },
        { id: 65, chords: [{ chord: 'La#dim', beats: 4 }] }
      ]
    }
  }
};
