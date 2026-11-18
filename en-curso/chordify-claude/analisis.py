"""
Motor de analisis musical: pulso, compases, tonalidad y acordes.

Trabaja sobre el stem instrumental (sin voz) para que la melodia cantada
no contamine el cromagrama.
"""
import numpy as np
import librosa

CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
LATIN = {'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 'F': 'Fa',
         'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si'}

# Cada plantilla: (intervalos, peso de cada grado, penalizacion por complejidad).
# La tercera pesa mas porque decide mayor/menor. La quinta pesa poco porque
# casi siempre esta presente y no distingue nada.
PLANTILLAS = {
    'maj':  ([0, 4, 7],     [1.0, 1.1, 0.7],      0.00),
    'min':  ([0, 3, 7],     [1.0, 1.1, 0.7],      0.00),
    'dim':  ([0, 3, 6],     [1.0, 1.0, 1.0],      0.06),
    'aug':  ([0, 4, 8],     [1.0, 1.0, 1.0],      0.10),
    'sus4': ([0, 5, 7],     [1.0, 1.0, 0.8],      0.04),
    'sus2': ([0, 2, 7],     [1.0, 1.0, 0.8],      0.06),
    '7':    ([0, 4, 7, 10], [1.0, 1.0, 0.6, 0.9], 0.05),
    'maj7': ([0, 4, 7, 11], [1.0, 1.0, 0.6, 0.9], 0.06),
    'm7':   ([0, 3, 7, 10], [1.0, 1.0, 0.6, 0.9], 0.05),
    '6':    ([0, 4, 7, 9],  [1.0, 1.0, 0.6, 0.8], 0.08),
    'm6':   ([0, 3, 7, 9],  [1.0, 1.0, 0.6, 0.8], 0.10),
}

# Perfiles Krumhansl-Schmuckler para detectar la tonalidad
KS_MAYOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MENOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def construir_vocabulario():
    """Devuelve (etiquetas, matriz de plantillas normalizadas, penalizaciones)."""
    etiquetas, filas, penas = ['N'], [np.zeros(12)], [0.0]
    for tipo, (intervalos, pesos, pena) in PLANTILLAS.items():
        for raiz in range(12):
            v = np.zeros(12)
            for iv, peso in zip(intervalos, pesos):
                v[(raiz + iv) % 12] = peso
            etiquetas.append(CLASES[raiz] + ':' + tipo)
            filas.append(v / np.linalg.norm(v))
            penas.append(pena)
    return etiquetas, np.array(filas), np.array(penas)


ETIQUETAS, PLANTILLA_M, PENAS = construir_vocabulario()
MASCARA = (PLANTILLA_M > 0).astype(float)


GRADOS_MAYOR = [0, 2, 4, 5, 7, 9, 11]


def detectar_tonalidad(cromagrama):
    """Primero QUE ESCALA, y solo despues cual de sus dos tonicas.

    Krumhansl-Schmuckler solo no vale para elegir la escala: puntua por
    parecido con un perfil tipico y se lo lleva la nota que mas suena. En
    "Destruyeme" el Do era la nota mas fuerte —el acorde mas repetido— y
    daba Do mayor, cuando la cancion tiene Fa# y es de Mi menor. La unica
    nota que separaba las dos tonalidades era esa, y pesaba demasiado poco.

    El error no se queda en el rotulo: `prior_diatonico` empuja despues los
    acordes hacia la tonalidad, y con Do mayor convertia catorce Re mayor
    en Re menor.

    Asi que la escala se elige por cuanta energia cae dentro de sus siete
    notas frente a las cinco de fuera, que es justo donde el Fa# pesa. Ya
    con la escala fijada, Krumhansl decide entre la mayor y su relativa
    menor: ahi si acierta, porque las dos comparten las mismas notas y solo
    cambia el centro.
    """
    perfil = cromagrama.mean(axis=1)
    perfil = perfil / (perfil.sum() + 1e-9)

    mejor_esc, mejor_v = 0, -9.0
    for t in range(12):
        dentro = set((t + g) % 12 for g in GRADOS_MAYOR)
        v = (sum(perfil[i] for i in dentro)
             - sum(perfil[i] for i in range(12) if i not in dentro))
        if v > mejor_v:
            mejor_v, mejor_esc = v, t

    relativa = (mejor_esc + 9) % 12
    mejor, mejor_r = (mejor_esc, 'mayor'), -2.0
    for raiz, modo, ks in ((mejor_esc, 'mayor', KS_MAYOR),
                           (relativa, 'menor', KS_MENOR)):
        r = float(np.corrcoef(perfil, np.roll(ks, raiz))[0, 1])
        if r > mejor_r:
            mejor_r, mejor = r, (raiz, modo)
    return mejor[0], mejor[1], mejor_r


def prior_diatonico(raiz_tono, modo):
    """Sube la probabilidad de los acordes que pertenecen a la tonalidad.

    Es el ajuste que mas precision agrega: evita que un Re mayor con ruido
    se confunda con un Re# o un Solm que en esta cancion no existen.
    """
    if modo == 'mayor':
        grados = {0: 'maj', 2: 'min', 4: 'min', 5: 'maj', 7: 'maj', 9: 'min', 11: 'dim'}
    else:
        grados = {0: 'min', 2: 'dim', 3: 'maj', 5: 'min', 7: 'min', 8: 'maj', 10: 'maj'}

    escala = set((raiz_tono + g) % 12 for g in grados)
    bonus = np.zeros(len(ETIQUETAS))
    for i, et in enumerate(ETIQUETAS):
        if et == 'N':
            continue
        nombre, tipo = et.split(':')
        raiz = CLASES.index(nombre)
        grado = (raiz - raiz_tono) % 12
        if grado in grados:
            esperado = grados[grado]
            if tipo == esperado:
                bonus[i] += 0.055           # acorde propio de la tonalidad
            elif tipo in ('7', 'sus4', 'sus2', 'maj7', 'm7', '6', 'm6'):
                bonus[i] += 0.025           # variante razonable del mismo grado
        elif raiz in escala:
            bonus[i] += 0.005
        else:
            bonus[i] -= 0.030               # raiz ajena a la tonalidad
    return bonus


SUFIJOS = {'maj': '', 'min': 'm', 'dim': 'dim', 'aug': 'aug', 'sus4': 'sus4',
           'sus2': 'sus2', '7': '7', 'maj7': 'maj7', 'm7': 'm7', '6': '6', 'm6': 'm6'}


def nombrar(etiqueta, bajo=None):
    """'B:min' -> nombres en cifrado anglosajon y latino, mas sus notas.

    `bajo` es la nota del bajo cuando NO es la fundamental: un Sol con Fa#
    abajo. Va en campo aparte y no pegado al nombre, porque el diagrama de
    guitarra y el teclado esperan el acorde a secas; quien lo quiera
    mostrar con la barra lo compone al pintarlo.

    Hoy SIEMPRE llega vacio: se llena a mano desde el editor. Se intento
    sacarlo solo del cromagrama de graves y no salio ni una barra, porque
    donde el musico oye "Sol con Fa# abajo" el audio a veces solo tiene el
    bajo andando —una nota sola, sin acorde detras— y eso no se puede
    deducir, se interpreta.
    """
    if etiqueta == 'N':
        return {'anglo': None, 'latino': None, 'notas': [], 'notas_latinas': [],
                'bajo': None, 'bajo_latino': None}
    nombre, tipo = etiqueta.split(':')
    raiz = CLASES.index(nombre)
    intervalos = PLANTILLAS[tipo][0]
    notas = [CLASES[(raiz + iv) % 12] for iv in intervalos]
    return {
        'anglo': nombre + SUFIJOS[tipo],
        'latino': LATIN[nombre] + SUFIJOS[tipo],
        'notas': notas,
        'notas_latinas': [LATIN[n] for n in notas],
        'bajo': bajo,
        'bajo_latino': LATIN[bajo] if bajo else None,
    }


def completar_intro(tiempos_beat, tempo):
    """Extiende la rejilla hacia atras para cubrir el intro libre.

    El detector de pulso no engancha en intros sin tempo fijo, y sin esto
    los primeros segundos se quedan sin linea de tiempo. Los pulsos
    agregados van marcados como estimados para que el editor los distinga.
    """
    if not len(tiempos_beat):
        return list(tiempos_beat), []
    paso = 60.0 / tempo
    extra = []
    t = tiempos_beat[0] - paso
    while t > 0.05:
        extra.append(t)
        t -= paso
    extra.reverse()
    return extra + list(tiempos_beat), [True] * len(extra) + [False] * len(tiempos_beat)


def segmentar(secuencia, tiempos_beat, duracion, min_pulsos=2):
    """Agrupa pulsos en segmentos de acorde y absorbe los parpadeos cortos."""
    segs = []
    for i, c in enumerate(secuencia):
        if segs and segs[-1]['etiqueta'] == c:
            segs[-1]['fin_beat'] = i + 1
        else:
            segs.append({'etiqueta': c, 'inicio_beat': i, 'fin_beat': i + 1})

    # Un acorde de un solo pulso ENTRE DOS IGUALES es ruido del detector:
    # A B A queda en A. Pero si los vecinos son distintos, ese pulso corto
    # es un cambio de verdad y hay que respetarlo.
    #
    # Antes se lo absorbia el vecino mas largo fueran cuales fueran, y eso
    # provocaba un efecto domino: absorber creaba vecinos iguales, que se
    # fusionaban, lo que dejaba otro segmento corto al lado, que se volvia
    # a absorber... En "Destruyeme" una estrofa entera de 56 s acabo como
    # un unico Do. Medido: el Viterbi veia 14 cambios ahi y solo
    # sobrevivian 5; con esta regla sobreviven los 14.
    cambio = True
    while cambio and len(segs) > 2:
        cambio = False
        for i in range(1, len(segs) - 1):
            s = segs[i]
            if s['fin_beat'] - s['inicio_beat'] >= min_pulsos:
                continue
            if segs[i - 1]['etiqueta'] != segs[i + 1]['etiqueta']:
                continue
            segs[i - 1]['fin_beat'] = segs[i + 1]['fin_beat']
            del segs[i:i + 2]
            cambio = True
            break

    # Fusionar vecinos que quedaron iguales tras la absorcion
    fusion = []
    for s in segs:
        if fusion and fusion[-1]['etiqueta'] == s['etiqueta']:
            fusion[-1]['fin_beat'] = s['fin_beat']
        else:
            fusion.append(s)

    salida = []
    for s in fusion:
        ini = float(tiempos_beat[s['inicio_beat']])
        fin = (float(tiempos_beat[s['fin_beat']])
               if s['fin_beat'] < len(tiempos_beat) else duracion)
        salida.append({
            'inicio': round(ini, 3),
            'fin': round(fin, 3),
            'pulsos': s['fin_beat'] - s['inicio_beat'],
            'etiqueta': s['etiqueta'],
            'editado': False,
            **nombrar(s['etiqueta']),
        })
    return salida


# Rango donde vive el pulso que una persona marca con el pie. Fuera de aqui
# casi siempre se trata de otro nivel metrico (la corchea o el compas entero).
RANGO_PULSO = (60.0, 145.0)


def elegir_tempo(y, sr, rango=RANGO_PULSO):
    """Elige el nivel metrico correcto, no solo el pico mas fuerte.

    Una cancion en 6/8 tiene picos en relacion 1 : 1.5 : 3 (negra con
    puntillo, negra y corchea). El pico mas fuerte suele ser el mas lento y
    tomarlo tal cual da un tempo que no sirve para contar. Se prefiere el
    candidato que caiga dentro del rango en que se marca el pulso.
    """
    envolvente = librosa.onset.onset_strength(y=y, sr=sr)
    tg = librosa.feature.tempogram(onset_envelope=envolvente, sr=sr)
    frecuencias = librosa.tempo_frequencies(tg.shape[0], sr=sr)
    perfil = tg.mean(axis=1)

    valido = np.isfinite(frecuencias) & (frecuencias > 25) & (frecuencias < 320)
    frecuencias, perfil = frecuencias[valido], perfil[valido]
    if not len(frecuencias):
        return 120.0

    orden = np.argsort(perfil)[::-1][:10]
    candidatos = [(float(frecuencias[i]), float(perfil[i])) for i in orden]

    # Primero, el mejor candidato que YA este en el rango del pulso
    dentro = [(t, p) for t, p in candidatos if rango[0] <= t <= rango[1]]
    if dentro:
        return max(dentro, key=lambda c: c[1])[0]

    # Si ninguno cae dentro, se traen por multiplos o divisores
    mejor, mejor_p = None, -1.0
    for t, p in candidatos:
        for factor in (2.0, 3.0, 0.5, 1.0 / 3.0):
            movido = t * factor
            if rango[0] <= movido <= rango[1] and p > mejor_p:
                mejor_p, mejor = p, movido
    return mejor if mejor else candidatos[0][0]


def detectar_agrupacion(secuencia):
    """Decide si el compas agrupa de 3 o de 4 pulsos, y donde cae el uno.

    Los cambios de acorde caen casi siempre en el primer tiempo. Se prueba
    cada agrupacion con cada fase y gana la que concentre mas cambios ahi.
    """
    cambios = [i for i in range(1, len(secuencia)) if secuencia[i] != secuencia[i - 1]]
    if not cambios:
        return 4, 0

    mejor = (4, 0, -1.0)
    for grupo in (4, 3):
        for fase in range(grupo):
            aciertos = sum(1 for c in cambios if (c - fase) % grupo == 0)
            proporcion = aciertos / len(cambios)
            # Con grupos de 3 hay mas primeros tiempos y por puro azar acierta
            # mas seguido; se descuenta para que la comparacion sea justa.
            puntaje = proporcion - (1.0 / grupo)
            if puntaje > mejor[2]:
                mejor = (grupo, fase, puntaje)
    return mejor[0], mejor[1]


def extraer_rasgos(ruta_armonica, ruta_pulso=None, sr=22050):
    """Etapa cara: cromagramas y pulso.

    Usa dos entradas distintas a proposito:
      - ruta_armonica: bajo + resto, sin bateria. Los golpes de percusion
        son ruido de banda ancha que ensucia el cromagrama.
      - ruta_pulso: la mezcla completa. Sin percusion el detector de pulso
        se engancha en la periodicidad equivocada y devuelve el doble de
        tempo (69 BPM leidos como 143).
    """
    y, sr = librosa.load(ruta_armonica, sr=sr, mono=True)
    duracion = float(len(y)) / sr

    # Separar armonicos de percusion: el cromagrama solo debe ver notas
    y_arm = librosa.effects.harmonic(y, margin=3.0)

    # --- Pulso ---
    if ruta_pulso:
        y_pulso, _ = librosa.load(ruta_pulso, sr=sr, mono=True)
    else:
        y_pulso = y
    tempo = elegir_tempo(y_pulso, sr)
    _, beats = librosa.beat.beat_track(y=y_pulso, sr=sr, trim=False,
                                       units='frames', start_bpm=tempo)
    tiempos_beat = librosa.frames_to_time(beats, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])

    # El detector no engancha en el intro libre ni suele llegar al final.
    # Se extiende la rejilla al tempo detectado para que toda la cancion
    # tenga linea de tiempo; esos pulsos quedan marcados como estimados.
    tiempos_beat, estimados = completar_intro(tiempos_beat, tempo)
    paso = 60.0 / tempo
    t = tiempos_beat[-1] + paso
    while t < duracion - 0.05:
        tiempos_beat.append(t)
        estimados.append(True)
        t += paso
    tiempos_beat = np.array(tiempos_beat)
    beats = librosa.time_to_frames(tiempos_beat, sr=sr)
    beats = np.clip(beats, 0, None)

    # --- Cromagramas: uno general y uno de graves para leer el bajo ---
    croma = librosa.feature.chroma_cqt(y=y_arm, sr=sr, bins_per_octave=36)
    croma_bajo = librosa.feature.chroma_cqt(
        y=y_arm, sr=sr, fmin=librosa.note_to_hz('C1'),
        n_octaves=3, bins_per_octave=36)

    # --- Promediar por pulso ---
    # pad=False es obligatorio. Con el valor por defecto (pad=True) sync
    # devuelve len(beats)+1 columnas: la columna 0 es el audio ANTERIOR al
    # primer pulso y la columna i cubre [beat i-1, beat i). Emparejarla con
    # tiempos_beat[i] atrasa cada acorde un pulso entero (0.86 s a 70 BPM).
    # Con pad=False la columna j cubre [beat j, beat j+1), que es lo correcto.
    croma_beat = librosa.util.sync(croma, beats, aggregate=np.median, pad=False)
    bajo_beat = librosa.util.sync(croma_bajo, beats, aggregate=np.median, pad=False)
    rms_beat = librosa.util.sync(librosa.feature.rms(y=y)[0], beats,
                                 aggregate=np.mean, pad=False)

    n = min(croma_beat.shape[1], bajo_beat.shape[1], len(rms_beat), len(tiempos_beat))
    croma_beat, bajo_beat = croma_beat[:, :n], bajo_beat[:, :n]
    rms_beat, tiempos_beat = rms_beat[:n], tiempos_beat[:n]
    estimados = estimados[:n]

    croma_n = croma_beat / (np.linalg.norm(croma_beat, axis=0, keepdims=True) + 1e-9)
    bajo_n = bajo_beat / (np.linalg.norm(bajo_beat, axis=0, keepdims=True) + 1e-9)

    return {
        'duracion': duracion,
        'tempo': tempo,
        'croma_n': croma_n,
        'bajo_n': bajo_n,
        'croma_beat': croma_beat,
        'rms_beat': rms_beat,
        'tiempos_beat': tiempos_beat,
        'estimados': estimados,
    }


def decodificar(rasgos, quedarse=0.92, temperatura=0.035, peso_bajo=0.16):
    """Etapa barata: convierte los rasgos en una secuencia de acordes."""
    croma_n = rasgos['croma_n']
    bajo_n = rasgos['bajo_n']
    croma_beat = rasgos['croma_beat']
    rms_beat = rasgos['rms_beat']
    tiempos_beat = rasgos['tiempos_beat']

    tono_raiz, tono_modo, tono_conf = detectar_tonalidad(croma_beat)
    bonus = prior_diatonico(tono_raiz, tono_modo)

    # --- Puntaje de cada acorde en cada pulso ---
    puntajes = PLANTILLA_M @ croma_n                  # afinidad con la plantilla
    sobrante = (1.0 - MASCARA) @ croma_n              # energia que no encaja
    puntajes = puntajes - 0.35 * (sobrante / 9.0) - PENAS[:, None]

    # El bajo confirma la raiz
    for i, et in enumerate(ETIQUETAS):
        if et == 'N':
            continue
        raiz = CLASES.index(et.split(':')[0])
        puntajes[i] += peso_bajo * bajo_n[raiz]

    puntajes += bonus[:, None]

    # Silencio -> acorde nulo
    umbral = float(np.percentile(rms_beat, 12)) * 1.25
    puntajes[0, :] = np.where(rms_beat < umbral,
                              puntajes[1:, :].max(axis=0) + 0.05, -1.0)

    # --- Viterbi: castiga cambiar de acorde en cada pulso ---
    # Softmax con temperatura: sin esto las probabilidades quedan casi
    # planas entre 133 acordes y el Viterbi se queda pegado en uno solo.
    emision = np.exp((puntajes - puntajes.max(axis=0, keepdims=True)) / temperatura)
    emision = emision / emision.sum(axis=0, keepdims=True)
    K = len(ETIQUETAS)
    trans = np.full((K, K), (1.0 - quedarse) / (K - 1))
    np.fill_diagonal(trans, quedarse)
    camino = librosa.sequence.viterbi(emision, trans)
    secuencia = [ETIQUETAS[i] for i in camino]

    # --- Compas: de a cuantos pulsos agrupa y donde cae el uno ---
    cambios = [i for i in range(1, len(secuencia)) if secuencia[i] != secuencia[i - 1]]
    grupo, fase = detectar_agrupacion(secuencia)

    return {
        'duracion': rasgos['duracion'],
        'tempo': rasgos['tempo'],
        'tonalidad': {'raiz': CLASES[tono_raiz], 'modo': tono_modo,
                      'confianza': tono_conf},
        'tiempos_beat': [float(t) for t in tiempos_beat],
        'estimados': list(rasgos['estimados']),
        'acordes_por_beat': secuencia,
        'fase_compas': fase,
        'grupo_compas': grupo,
        'energia_beat': [float(e) for e in rms_beat],
        'cambios_detectados': len(cambios),
    }
