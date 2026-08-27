"""
Transcripcion de piano: del stem separado a notas con altura y duracion.

Usa el modelo de ByteDance (Kong et al.), que da onset, offset y velocidad
por nota. Corre sobre el stem de piano ya separado, no sobre la mezcla:
transcribir un piano aislado es muchisimo mas facil que sacarlo de una banda
entera tocando encima.

Aviso: el stem de piano es el mas flojo de los seis que da Demucs. Si en la
cancion el piano casi no suena, el stem sale practicamente vacio y aqui no
hay nada que rescatar; por eso se mide su nivel antes de gastar la GPU.
"""
import contextlib
import io
import os

import numpy as np

# Por debajo de esto el stem esta vacio y transcribirlo solo produce basura.
# Medido sobre cuatro canciones: las que tenian piano real dieron -27 y -34 dB,
# las que no, -57 y -66 dB.
UMBRAL_DB = -45.0

NOMBRES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
LATIN = {'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 'F': 'Fa',
         'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#',
         'B': 'Si'}


def nivel_db(y):
    if not len(y):
        return -120.0
    rms = float(np.sqrt(np.mean(np.square(y))))
    return 20.0 * np.log10(rms + 1e-12)


def transcribir(ruta_piano, rutas_otros=None, umbral_db=UMBRAL_DB):
    """Devuelve (notas, nivel_db). Lista vacia si el stem no tiene piano.

    rutas_otros son los demas stems: con ellos se mide, segundo a segundo,
    cuanto pesa el piano en la mezcla, y se descartan las notas de los tramos
    donde el piano practicamente no suena.
    """
    import librosa
    import torch
    from piano_transcription_inference import PianoTranscription, sample_rate

    y, _ = librosa.load(ruta_piano, sr=sample_rate, mono=True)
    db = nivel_db(y)
    if db < umbral_db:
        return [], db

    dispositivo = 'cuda' if torch.cuda.is_available() else 'cpu'
    # El modelo imprime "Segment N / M" por cada trozo; se silencia
    with contextlib.redirect_stdout(io.StringIO()):
        transcriptor = PianoTranscription(device=dispositivo)
        salida = transcriptor.transcribe(y, None)

    notas = []
    for e in salida.get('est_note_events', []):
        midi = int(e['midi_note'])
        clase = NOMBRES[midi % 12]
        notas.append({
            'inicio': round(float(e['onset_time']), 3),
            'fin': round(float(e['offset_time']), 3),
            'midi': midi,
            'nombre': clase + str(midi // 12 - 1),
            'latino': LATIN[clase] + str(midi // 12 - 1),
            'velocidad': int(e['velocity']),
        })
    notas.sort(key=lambda n: (n['inicio'], n['midi']))
    dom = dominancia_piano(ruta_piano, rutas_otros) if rutas_otros else None
    return limpiar(notas, dominancia=dom), db


# Por encima de esto la cancion es practicamente piano solo
DOMINANCIA_PIANO_SOLO = 0.55


def es_piano_solo(ruta_piano, rutas_otros):
    """True si el piano lleva la cancion casi sin compania."""
    _, proporcion = dominancia_piano(ruta_piano, rutas_otros)
    return float(np.median(proporcion)) >= DOMINANCIA_PIANO_SOLO, \
        float(np.median(proporcion))


def transcribir_directo(ruta_audio):
    """Transcribe el audio tal cual, sin pasar por la separacion.

    En una pieza de piano solo, Demucs no tiene nada que separar y solo puede
    empeorar: reparte notas entre 'piano' y 'resto' y agrega artefactos. El
    original limpio le da mejor material al transcriptor.
    """
    import librosa
    import torch
    from piano_transcription_inference import PianoTranscription, sample_rate

    y, _ = librosa.load(ruta_audio, sr=sample_rate, mono=True)
    dispositivo = 'cuda' if torch.cuda.is_available() else 'cpu'
    with contextlib.redirect_stdout(io.StringIO()):
        transcriptor = PianoTranscription(device=dispositivo)
        salida = transcriptor.transcribe(y, None)

    notas = []
    for e in salida.get('est_note_events', []):
        midi = int(e['midi_note'])
        clase = NOMBRES[midi % 12]
        notas.append({
            'inicio': round(float(e['onset_time']), 3),
            'fin': round(float(e['offset_time']), 3),
            'midi': midi,
            'nombre': clase + str(midi // 12 - 1),
            'latino': LATIN[clase] + str(midi // 12 - 1),
            'velocidad': int(e['velocity']),
        })
    notas.sort(key=lambda n: (n['inicio'], n['midi']))
    # Sin filtro de dominancia: aqui TODO es piano
    return limpiar(notas), nivel_db(y)


DURACION_MINIMA = 0.06
DURACION_MAXIMA = 3.5          # un piano de acompanamiento no sostiene mas
VELOCIDAD_MINIMA = 26
POLIFONIA_MAXIMA = 10          # dedos que tiene una persona

# Cuanto tiene que pesar el piano dentro de la mezcla para creerle al
# transcriptor. Medido sobre una cancion: donde el piano dominaba el 83%
# salieron 72 notas limpias, y donde pesaba el 1.7% salieron 223. O sea que
# el transcriptor produce MAS notas justo donde hay MENOS piano: eso no es
# piano, es lo que se le filtra al stem de los otros instrumentos.
DOMINANCIA_FIABLE = 0.35
DOMINANCIA_MINIMA = 0.15


def dominancia_piano(ruta_piano, rutas_otros, sr=11025, ventana=1.0):
    """Devuelve (tiempos, proporcion) de cuanto pesa el piano en la mezcla."""
    import librosa
    y_piano, _ = librosa.load(ruta_piano, sr=sr, mono=True)
    otros = []
    for r in rutas_otros:
        y, _ = librosa.load(r, sr=sr, mono=True)
        otros.append(y)

    n = min([len(y_piano)] + [len(y) for y in otros])
    paso = int(sr * ventana)
    tiempos, proporcion = [], []
    for i in range(0, max(1, n - paso), paso):
        ep = float(np.sqrt(np.mean(y_piano[i:i + paso] ** 2))) + 1e-9
        eo = sum(float(np.sqrt(np.mean(y[i:i + paso] ** 2))) + 1e-9 for y in otros)
        tiempos.append(i / sr)
        proporcion.append(ep / (ep + eo))
    return np.array(tiempos), np.array(proporcion)


def limpiar(notas, poli_max=POLIFONIA_MAXIMA, dominancia=None):
    """Quita lo que un pianista no podria haber tocado.

    El stem de piano trae artefactos de la separacion, y el transcriptor los
    lee como notas: fragmentos de milisegundos, notas casi mudas y racimos de
    semitonos vecinos sonando a la vez. Medido antes de limpiar, una cancion
    llegaba a 18 notas simultaneas, que con diez dedos no se toca.
    """
    # En la zona dudosa solo se conservan las notas mas fuertes que la media
    umbral_medio = (float(np.median([n['velocidad'] for n in notas]))
                    if notas else 0.0)

    vivas = []
    for n in notas:
        if (n['fin'] - n['inicio']) < DURACION_MINIMA:
            continue
        if n['velocidad'] < VELOCIDAD_MINIMA:
            continue

        # Donde el piano casi no suena, lo que el transcriptor ve es la
        # filtracion de los otros instrumentos dentro del stem.
        if dominancia is not None:
            tiempos, proporcion = dominancia
            peso = float(proporcion[min(int(n['inicio'] / (tiempos[1] - tiempos[0]))
                                        if len(tiempos) > 1 else 0,
                                        len(proporcion) - 1)])
            if peso < DOMINANCIA_MINIMA:
                continue
            if peso < DOMINANCIA_FIABLE and n['velocidad'] < umbral_medio:
                continue
            n = dict(n, confianza=round(min(1.0, peso / DOMINANCIA_FIABLE), 2))

        # Una nota de 6 s en un acompanamiento es filtracion, no pedal
        if (n['fin'] - n['inicio']) > DURACION_MAXIMA:
            n = dict(n, fin=round(n['inicio'] + DURACION_MAXIMA, 3))

        vivas.append(n)

    # Recorte de polifonia: en cada arranque se cuenta cuantas siguen
    # sonando y, si se pasa, cae la mas floja.
    vivas.sort(key=lambda n: n['inicio'])
    descartadas = set()
    for i, n in enumerate(vivas):
        if i in descartadas:
            continue
        sonando = [j for j, m in enumerate(vivas)
                   if j not in descartadas
                   and m['inicio'] <= n['inicio'] < m['fin']]
        if len(sonando) <= poli_max:
            continue
        # Se conservan las mas fuertes
        sonando.sort(key=lambda j: vivas[j]['velocidad'], reverse=True)
        for j in sonando[poli_max:]:
            descartadas.add(j)

    return [n for i, n in enumerate(vivas) if i not in descartadas]


def resumen(notas):
    if not notas:
        return {}
    alturas = [n['midi'] for n in notas]
    duraciones = [n['fin'] - n['inicio'] for n in notas]
    return {
        'notas': len(notas),
        'grave': min(alturas),
        'agudo': max(alturas),
        'duracion_mediana': round(float(np.median(duraciones)), 3),
    }
