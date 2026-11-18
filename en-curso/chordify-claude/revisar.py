"""Revisa una cancion ya procesada y avisa de lo que suele salir mal.

    python revisar.py                 # todas
    python revisar.py <slug>          # una

Existe porque `procesar.py` termina sin quejarse aunque la transcripcion se
haya dejado media cancion o el tempo salga al doble. Esos dos fallos han
pasado de verdad y no se ven en el log: hay que medirlos. Aqui estan las
mismas medidas que se hacian a mano, para que cualquiera saque el mismo
veredicto sin tener que inventarlas.

Ninguna comprobacion adivina: todas comparan el JSON contra el audio.
"""
import glob
import json
import os
import sys

import numpy as np

import analisis
from analisis import RANGO_PULSO

# Un acorde que dura tantas veces mas que la mediana de la cancion, y ademas
# tantos segundos, no es musica: es el detector aplanando un tramo entero.
# En "Destruyeme" una estrofa quedo como un unico Do de 56 s mientras el
# Viterbi veia catorce cambios ahi dentro.
LARGO_VECES = 8
LARGO_SEG = 12.0

# Pistas de las que sale la armonia, las mismas que usa el pipeline
ARMONICAS = ["bajo", "guitarra", "piano", "resto"]

# Un tramo de 2 s con este nivel respecto a la media de la pista de voz
# cuenta como "aqui se canta". Mismo criterio que el filtro de alucinaciones
# de procesar.py, pero mas exigente: alli se trata de tirar basura, aqui de
# no dar por buena una letra a medias.
VOZ = 0.25
TRAMO = 2

# Cuantos segundos de canto sin transcribir se toleran antes de avisar
AVISO_LETRA = 10

# Donde se cuenta comodo un pulso. El tempo solo es DUDOSO si el elegido cae
# fuera de esta franja y su mitad o su doble cae dentro: entonces hay dos
# lecturas y ninguna la decide el dato. Avisar siempre que la mitad quepa en
# el rango llenaba esto de ruido (una cancion a 70 avisaba por 140, que nadie
# contaria asi).
COMODO = (70.0, 125.0)

# Si la voz aislada apenas suena comparada con la mezcla, la cancion es
# instrumental y no tiene sentido quejarse de que le falte letra.
INSTRUMENTAL = 0.05


def carga(carpeta):
    with open(os.path.join(carpeta, "cancion.json"), encoding="utf-8") as f:
        return json.load(f)


def es_instrumental(carpeta):
    """La voz aislada casi no suena frente a la mezcla."""
    import librosa
    voz = os.path.join(carpeta, "voz.mp3")
    orig = os.path.join(carpeta, "original.mp3")
    if not (os.path.isfile(voz) and os.path.isfile(orig)):
        return False
    v, sr = librosa.load(voz, sr=8000, mono=True)
    o, _ = librosa.load(orig, sr=8000, mono=True)
    rv = float(np.sqrt(np.mean(v ** 2)))
    ro = float(np.sqrt(np.mean(o ** 2))) or 1e-9
    return rv / ro < INSTRUMENTAL


def cobertura_letra(carpeta, cancion):
    """Segundos en los que se canta pero no hay letra transcrita."""
    import librosa
    voz = os.path.join(carpeta, "voz.mp3")
    if not os.path.isfile(voz):
        return None, None, []
    y, sr = librosa.load(voz, sr=16000, mono=True)
    dur = len(y) / sr
    nivel = float(np.sqrt(np.mean(y ** 2))) or 1e-9

    canta = []
    for i in range(0, int(dur), TRAMO):
        tr = y[i * sr:(i + TRAMO) * sr]
        if len(tr) and float(np.sqrt(np.mean(tr ** 2))) / nivel > VOZ:
            canta.append(i)

    cubierto = set()
    for l in cancion.get("letra") or []:
        desde = int(l["inicio"]) // TRAMO * TRAMO
        for i in range(desde, int(l["fin"]) + 1, TRAMO):
            cubierto.add(i)

    falta = [i for i in canta if i not in cubierto]
    huecos, ini, prev = [], None, None
    for i in falta:
        if ini is None:
            ini = i
        elif i - prev > TRAMO:
            huecos.append((ini, prev + TRAMO))
            ini = i
        prev = i
    if ini is not None:
        huecos.append((ini, prev + TRAMO))
    return len(canta) * TRAMO, len(falta) * TRAMO, huecos


def tonalidad_medida(carpeta):
    """Vuelve a leer la tonalidad del audio, sin mirar el JSON.

    Se mezclan las mismas pistas que usa el pipeline para los acordes y se
    llama a la funcion del motor. Si aqui se copiara el calculo, el dia que
    cambie el criterio en analisis.py esta comprobacion mentiria.
    """
    import librosa
    mezcla = None
    for p in ARMONICAS:
        ruta = os.path.join(carpeta, p + ".mp3")
        if not os.path.isfile(ruta):
            continue
        y, sr = librosa.load(ruta, sr=22050, mono=True)
        if mezcla is None:
            mezcla = y
        else:
            n = min(len(mezcla), len(y))
            mezcla = mezcla[:n] + y[:n]
    if mezcla is None or not len(mezcla):
        return None
    cro = librosa.feature.chroma_cqt(y=mezcla, sr=22050)
    raiz, modo, _ = analisis.detectar_tonalidad(cro)
    return analisis.LATIN[analisis.CLASES[raiz]] + " " + modo


def revisar(carpeta):
    nombre = os.path.basename(carpeta.rstrip("/" + os.sep))
    try:
        c = carga(carpeta)
    except (OSError, ValueError) as e:
        print("%-30s no se puede leer: %s" % (nombre[:30], e))
        return 1

    avisos = []
    acordes = [a for a in c.get("acordes") or [] if a.get("anglo")]
    letra = c.get("letra") or []
    palabras = sum(len(l.get("palabras") or []) for l in letra)

    # --- 1. el tempo puede estar al doble o a la mitad -----------------
    t = c.get("tempo") or 0
    otros = []
    if not (COMODO[0] <= t <= COMODO[1]):
        for alt in (t / 2, t * 2):
            dentro = RANGO_PULSO[0] <= alt <= RANGO_PULSO[1]
            if dentro and COMODO[0] <= alt <= COMODO[1]:
                otros.append(alt)
    if otros:
        avisos.append("tempo ambiguo: %.1f, pero %s tambien cabe en el rango. "
                      "Los acordes encajan igual con las dos rejillas, asi "
                      "que esto NO se decide con los datos: hay que oirla y "
                      "mirar si los puntos 1-2-3-4 van al ritmo que contarias"
                      % (t, " o ".join("%.0f" % o for o in otros)))

    # --- 2. la rejilla de pulsos deberia ser pareja --------------------
    pulsos = np.array([b["t"] for b in c.get("beats") or []])
    if len(pulsos) > 3:
        dt = np.diff(pulsos)
        if dt.std() > 0.03:
            avisos.append("la rejilla de pulsos va irregular (desviacion "
                          "%.3f s): los puntos del compas pueden bailar"
                          % dt.std())

    # --- 3. la letra sin transcribir --------------------------------
    if es_instrumental(carpeta):
        canta, falta, huecos = None, 0, []
        print("%-30s %5.1f BPM %-12s %3d acordes  (instrumental: no se revisa"
              " la letra)" % (nombre[:30], t,
                              (c.get("tonalidad") or {}).get("nombre", "?"),
                              len(acordes)))
        for a in avisos:
            print("    - " + a)
        return len(avisos)

    canta, falta, huecos = cobertura_letra(carpeta, c)
    if canta is None:
        avisos.append("no encuentro voz.mp3, no puedo revisar la letra")
    elif falta > AVISO_LETRA:
        donde = ", ".join("%d-%d s" % h for h in huecos[:5])
        avisos.append("faltan %d s de canto por transcribir (de %d s): %s%s. "
                      "OJO: repetir con reletra.py casi nunca los recupera "
                      "—usa los mismos ajustes y da el mismo resultado—. "
                      "Solo sirve si la cancion se proceso con una version "
                      "anterior del motor. Medido: quitar el filtro de "
                      "repeticion no cambia nada y quitar el salto por "
                      "silencio empeora (62%% -> 47%%). Lo que queda se "
                      "corrige a mano en el panel."
                      % (falta, canta, donde,
                         " ..." if len(huecos) > 5 else ""))

    # --- 4. la hoja de cifrado necesita tiempos por palabra ------------
    if letra and palabras < 10:
        avisos.append("casi no hay palabras con tiempo propio (%d): la hoja "
                      "de cifrado no podra poner cada acorde sobre su silaba"
                      % palabras)

    # --- 5. sin acordes no hay nada que tocar --------------------------
    if not acordes:
        avisos.append("no se detecto ningun acorde")

    # --- 6. un acorde que se come medio tema ---------------------------
    #
    # OJO: hay que juntar antes los iguales seguidos. El JSON parte un
    # mismo acorde en varios trozos, y midiendo los trozos sueltos el Do de
    # 56 s de "Destruyeme" pasaba por ocho segundos y no saltaba ninguna
    # alarma. Se mide lo que se VE en pantalla, no como esta guardado.
    juntos = []
    for a in acordes:
        if juntos and juntos[-1]["nombre"] == a.get("latino"):
            juntos[-1]["fin"] = a["fin"]
        else:
            juntos.append({"nombre": a.get("latino"), "inicio": a["inicio"],
                           "fin": a["fin"]})
    if len(juntos) > 4:
        duras = np.array([x["fin"] - x["inicio"] for x in juntos])
        med = float(np.median(duras))
        peor = int(duras.argmax())
        if duras[peor] >= LARGO_SEG and med > 0 and duras[peor] >= LARGO_VECES * med:
            x = juntos[peor]
            avisos.append(
                "el acorde %s dura %.0f s seguidos (del %.0f al %.0f), %.0f "
                "veces mas que los demas de esta cancion. Casi siempre "
                "significa que ahi el detector aplano un tramo entero: "
                "compruebalo en el atril"
                % (x["nombre"], duras[peor], x["inicio"], x["fin"],
                   duras[peor] / med))

    # --- 7. la tonalidad, contrastada con lo que suena -----------------
    #
    # Esta comprobacion existe porque el fallo que la motivo era invisible:
    # la tonalidad salia mal, el prior diatonico empujaba los acordes hacia
    # ella y todo quedaba coherente y equivocado a la vez. Solo se vio
    # comparando con un cifrado hecho a mano. Se vuelve a medir la escala
    # desde el audio con la MISMA funcion del motor, no con una copia.
    guardada = (c.get("tonalidad") or {}).get("nombre", "")
    medida = tonalidad_medida(carpeta)
    if medida and guardada and medida.lower() != guardada.lower():
        avisos.append("la tonalidad guardada es %s pero el audio suena a %s. "
                      "Si no coinciden, los acordes salen empujados hacia la "
                      "escala equivocada (un Re mayor se vuelve Re menor)"
                      % (guardada, medida))

    print("%-30s %5.1f BPM %-12s %3d acordes %3d lineas %4d palabras  %s"
          % (nombre[:30], t, (c.get("tonalidad") or {}).get("nombre", "?"),
             len(acordes), len(letra), palabras,
             "OK" if not avisos else "%d aviso(s)" % len(avisos)))
    for a in avisos:
        print("    - " + a)
    return len(avisos)


if __name__ == "__main__":
    aqui = os.path.dirname(os.path.abspath(__file__))
    raiz = os.path.join(aqui, "canciones")
    if len(sys.argv) > 1:
        carpetas = [os.path.join(raiz, s) for s in sys.argv[1:]]
    else:
        carpetas = sorted(d for d in glob.glob(os.path.join(raiz, "*"))
                          if os.path.isfile(os.path.join(d, "cancion.json")))
    total = sum(revisar(d) for d in carpetas)
    print()
    print("%d cancion(es), %d aviso(s)" % (len(carpetas), total))
