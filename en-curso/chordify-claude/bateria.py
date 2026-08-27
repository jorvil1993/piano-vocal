"""
Transcripcion de bateria: bombo, caja y platillo del stem separado.

Dos ideas sostienen esto:

1. Cada pieza se detecta en SU banda de frecuencia, no clasificando una
   lista unica de ataques. Cuando el bombo y el hi-hat caen en el mismo
   golpe, un detector global ve un solo ataque y pierde uno de los dos.

2. Detectar por banda no alcanza: el ataque de un parche es de banda ancha
   y se cuela en la banda del platillo. Por eso, despues de detectar, cada
   golpe pasa por un veto que mira su espectro completo y descarta el que no
   tenga la forma de la pieza que dice ser.

Se probaron dos separaciones mas y ninguna se sostuvo: el tom (comparte
graves con el bombo y medios con la caja) y hi-hat contra crash (la caida
del mismo plato varia casi al doble entre grabaciones). Quedan las tres que
se pueden defender con evidencia.
"""
import numpy as np
import librosa

HOP = 256
N_FFT = 2048

# Por debajo de esto el stem no tiene bateria y lo que se detecte son
# fantasmas: la envolvente se normaliza por su propio pico, asi que en un
# stem casi mudo el ruido de fondo se amplifica hasta parecer golpes.
# Medido: las canciones con bateria real dan de -18 a -25 dB; una pieza de
# piano solo dio -85.6 dB.
UMBRAL_DB = -50.0

# Nota sobre los platillos: se intento separar hi-hat de crash/ride por
# tiempo de caida y NO funciona. La caida del mismo instrumento cambia
# demasiado entre grabaciones: sobre golpes con hueco limpio dio 0.308 s en
# una cancion y 0.168 s en otra, casi el doble. Con un umbral fijo, una
# quedaba llena de crashes y la otra sin ninguno. Queda un solo carril de
# platillo, que es lo que se puede sostener con evidencia.

# (nombre, banda de deteccion, sensibilidad)
BANDAS = [
    ("bombo",    20,   120,   0.30),
    ("caja",     400,  1200,  0.26),
    ("platillo", 5000, 11000, 0.16),
]

# Bandas de referencia para describir la forma del espectro de un golpe
PERFIL = {
    "grave":  (20, 120),
    "tom":    (120, 400),
    "cuerpo": (400, 1200),
    "agudo":  (4000, 11000),
}


def _veto(tipo, r, ref):
    """Devuelve True si hay que descartar el golpe.

    r trae la proporcion de energia en cada banda de PERFIL. ref son las
    medianas de esta cancion: los umbrales van relativos a su propia mezcla,
    no fijos. Una grabacion en vivo tiene mucho mas grave filtrandose que un
    estudio, y con umbrales absolutos se le vetaban casi todos los platillos.
    """
    agudo_alto = ref["agudo"] * 1.15
    agudo_bajo = ref["agudo"] * 0.72
    tom_alto = ref["tom"] * 1.30

    if tipo == "bombo":
        # Un tom grave tambien pega abajo; el bombo casi no tiene agudos
        return r["grave"] < ref["grave"] * 0.55 or r["agudo"] > agudo_alto * 1.4

    if tipo == "caja":
        # La bordona hace ruido de banda ancha: sin agudos no es caja
        return r["agudo"] < agudo_bajo * 0.75 or r["cuerpo"] < ref["cuerpo"] * 0.45

    if tipo == "platillo":
        # Aqui estaba el problema que se veia en pantalla: el ataque de un
        # tom entra en la banda aguda y se dibujaba como platillo.
        return r["agudo"] < agudo_bajo or (r["tom"] > tom_alto
                                           and r["agudo"] < ref["agudo"])

    return False


def nivel_db(y):
    if not len(y):
        return -120.0
    return 20.0 * np.log10(float(np.sqrt(np.mean(np.square(y)))) + 1e-12)


def analizar(ruta_bateria, sr=22050, umbral_db=UMBRAL_DB):
    y, sr = librosa.load(ruta_bateria, sr=sr, mono=True)
    duracion = float(len(y)) / sr

    db = nivel_db(y)
    if db < umbral_db:
        return {"duracion": duracion, "golpes": [], "conteo": {}, "nivel_db": db}

    S = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP))
    frecuencias = librosa.fft_frequencies(sr=sr, n_fft=N_FFT)
    mascaras = {k: (frecuencias >= a) & (frecuencias < b)
                for k, (a, b) in PERFIL.items()}

    def perfil_en(cuadro):
        ventana = S[:, cuadro:cuadro + 3]
        total = ventana.sum() + 1e-9
        return {k: float(ventana[m].sum() / total) for k, m in mascaras.items()}

    # --- Primera pasada: detectar candidatos en cada banda ---
    candidatos = []
    for nombre, bajo, alto, sensibilidad in BANDAS:
        mascara = (frecuencias >= bajo) & (frecuencias < alto)
        envolvente = S[mascara].sum(axis=0)

        # Derivada positiva: solo interesa cuando la energia SUBE
        envolvente = np.maximum(0.0, np.diff(envolvente, prepend=envolvente[0]))
        pico = envolvente.max()
        if pico <= 0:
            continue
        envolvente = envolvente / pico

        cuadros = librosa.onset.onset_detect(
            onset_envelope=envolvente, sr=sr, hop_length=HOP,
            units="frames", backtrack=False,
            delta=sensibilidad, wait=int(0.045 * sr / HOP))

        for c in cuadros:
            candidatos.append((nombre, int(c), float(envolvente[c]),
                               perfil_en(c)))

    if not candidatos:
        return {"duracion": duracion, "golpes": [],
                "conteo": {n: 0 for n, _, _, _ in BANDAS}}

    # --- Referencia: como suena la bateria de ESTA cancion ---
    ref = {k: float(np.median([c[3][k] for c in candidatos])) + 1e-6
           for k in PERFIL}

    # --- Segunda pasada: descartar lo que no tenga la forma esperada ---
    golpes = []
    for nombre, cuadro, fuerza, perfil in candidatos:
        if _veto(nombre, perfil, ref):
            continue

        golpes.append({
            "t": round(float(librosa.frames_to_time(
                cuadro, sr=sr, hop_length=HOP)), 3),
            "tipo": nombre,
            "fuerza": round(min(1.0, fuerza), 3),
        })

    golpes.sort(key=lambda g: (g["t"], g["tipo"]))

    # Dos golpes de la misma pieza a menos de 40 ms son el mismo ataque
    limpios = []
    ultimo = {}
    for g in golpes:
        previo = ultimo.get(g["tipo"])
        if previo is not None and g["t"] - previo < 0.04:
            continue
        ultimo[g["tipo"]] = g["t"]
        limpios.append(g)

    finales = limpios

    conteo = {}
    for g in finales:
        conteo[g["tipo"]] = conteo.get(g["tipo"], 0) + 1
    return {"duracion": duracion, "golpes": finales, "conteo": conteo,
            "nivel_db": db}
