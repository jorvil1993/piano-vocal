"""
Pipeline completo: link de YouTube -> cancion.json listo para el panel.

    python procesar.py "https://www.youtube.com/watch?v=..."

Etapas:
  1. Descarga el audio                 (yt-dlp)
  2. Separa en 4 pistas                (Demucs, GPU)
  3. Detecta pulso, tonalidad, acordes (analisis.py)
  4. Transcribe la letra con tiempos   (Whisper, sobre la voz)
  5. Escribe canciones/<slug>/cancion.json

Las 4 pistas no son solo para la consola de mezcla: cada analisis usa la
entrada que le conviene. Los acordes se leen de bajo + resto (sin la
percusion, que ensucia el cromagrama) y el pulso de bateria + bajo (sin
armonia ni voz, que hacen dudar al detector entre el tempo y su doble).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata

import analisis
import bateria as mod_bateria
import piano_notas as mod_piano

RAIZ = os.path.dirname(os.path.abspath(__file__))
CANCIONES = os.path.join(RAIZ, "canciones")

# La consola de Windows llega en cp1252 y rompe con acentos y emojis
for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def log(etapa, mensaje):
    print("[%s] %s" % (etapa, mensaje), flush=True)


def correr(cmd, descripcion):
    log("cmd", descripcion)
    # Sin esto yt-dlp devuelve los titulos con acentos destrozados
    entorno = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", env=entorno)
    if r.returncode != 0:
        print(r.stdout[-2000:] if r.stdout else "")
        print(r.stderr[-2000:] if r.stderr else "")
        raise RuntimeError("fallo: " + descripcion)
    return r


def hacer_slug(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    t = re.sub(r"[^\w\s-]", "", t).strip().lower()
    t = re.sub(r"[\s_-]+", "-", t)
    return t[:60] or "cancion"


# ---------------------------------------------------------------- 1. descarga

def leer_datos(url):
    """Metadatos primero: con el titulo se calcula la carpeta destino."""
    meta = correr(["yt-dlp", "--no-playlist", "--print",
                   "%(id)s|||%(title)s|||%(uploader)s|||%(duration)s", url],
                  "leyendo datos del video")
    linea = [l for l in meta.stdout.strip().splitlines() if "|||" in l][-1]
    vid, titulo, autor, dur = linea.split("|||")
    return {"youtube_id": vid, "titulo": titulo.strip(),
            "artista": autor.strip(), "duracion_youtube": int(dur)}


def descargar(url, carpeta, hasta=None):
    """Baja a la carpeta DEFINITIVA de la cancion.

    Antes bajaba a una temporal y comprobaba ahi si ya existia; como la
    temporal nace vacia en cada corrida, se re-descargaba el video entero
    siempre. Con videos largos eso ademas deshacia el recorte.
    """
    destino = os.path.join(carpeta, "original.mp3")

    if not os.path.exists(destino):
        correr(["yt-dlp", "--no-playlist", "-f", "bestaudio", "-x",
                "--audio-format", "mp3", "--audio-quality", "0",
                "-o", os.path.join(carpeta, "original.%(ext)s"), url],
               "descargando audio")
    else:
        log("descarga", "original.mp3 ya existe, se reutiliza")

    if hasta:
        actual = float(correr(["ffprobe", "-v", "error", "-show_entries",
                               "format=duration", "-of", "csv=p=0", destino],
                              "midiendo el audio").stdout.strip())
        if actual > hasta + 1:
            recorte = destino + ".corte.mp3"
            correr(["ffmpeg", "-y", "-i", destino, "-t", str(hasta),
                    "-c", "copy", recorte], "recortando a %d s" % hasta)
            os.replace(recorte, destino)
            log("descarga", "recortado a %d s (venia de %.0f s)" % (hasta, actual))

    return duracion_de(destino)


def duracion_de(ruta):
    return float(correr(["ffprobe", "-v", "error", "-show_entries",
                         "format=duration", "-of", "csv=p=0", ruta],
                        "midiendo " + os.path.basename(ruta)).stdout.strip())


# ------------------------------------------------------------- 2. separacion

# htdemucs_6s agrega guitarra y piano a las 4 pistas del modelo normal.
# No separa guitarra acustica de electrica: ningun modelo publico lo hace,
# las dos caen juntas en "guitar".
MODELO_DEMUCS = "htdemucs_6s"

# Nombre de Demucs -> nombre del archivo en la carpeta de la cancion
STEMS = {"vocals": "voz.mp3", "drums": "bateria.mp3", "bass": "bajo.mp3",
         "guitar": "guitarra.mp3", "piano": "piano.mp3", "other": "resto.mp3"}

# Lo que aporta armonia (todo menos percusion y voz) alimenta los acordes
ARMONICOS = ["bass", "guitar", "piano", "other"]
RITMICOS = ["drums", "bass"]


def separar(carpeta):
    """Separa en 4 pistas y arma la mezcla armonica para analizar acordes."""
    salidas = {k: os.path.join(carpeta, v) for k, v in STEMS.items()}
    armonico = os.path.join(carpeta, "_armonico.wav")
    ritmo = os.path.join(carpeta, "_ritmo.wav")

    def mezclar(entradas, destino, que):
        cmd = ["ffmpeg", "-y"]
        for e in entradas:
            cmd += ["-i", e]
        cmd += ["-filter_complex",
                "amix=inputs=%d:normalize=0" % len(entradas), destino]
        correr(cmd, que)

    # Los stems solo valen si corresponden a ESTE audio. Si el original
    # cambio de duracion (por un recorte, o por volver a bajarlo entero),
    # los viejos mienten y hay que rehacerlos.
    original = os.path.join(carpeta, "original.mp3")
    if all(os.path.exists(p) for p in salidas.values()):
        dur_orig = duracion_de(original)
        dur_stem = duracion_de(salidas["vocals"])
        if abs(dur_orig - dur_stem) > 1.0:
            log("demucs", "los stems duran %.0f s y el audio %.0f s: se rehacen"
                % (dur_stem, dur_orig))
            for p in list(salidas.values()) + [armonico, ritmo]:
                try:
                    os.remove(p)
                except OSError:
                    pass

    if all(os.path.exists(p) for p in salidas.values()):
        log("demucs", "stems ya existen, se reutilizan")
        # Se rehacen desde los mp3 en vez de repetir demucs entero
        if not os.path.exists(armonico):
            mezclar([salidas[k] for k in ARMONICOS], armonico,
                    "rehaciendo la mezcla armonica")
        if not os.path.exists(ritmo):
            mezclar([salidas[k] for k in RITMICOS], ritmo,
                    "rehaciendo la mezcla ritmica")
        return salidas, armonico, ritmo

    tmp = os.path.join(carpeta, "_demucs")
    import torch
    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    log("demucs", "separando en 6 pistas (voz/bateria/bajo/guitarra/piano/resto) "
                  "en " + dispositivo)
    correr([sys.executable, "-m", "demucs", "-n", MODELO_DEMUCS,
            "-d", dispositivo, "-o", tmp,
            os.path.join(carpeta, "original.mp3")], "demucs")

    base = os.path.join(tmp, MODELO_DEMUCS, "original")
    for nombre, destino in salidas.items():
        correr(["ffmpeg", "-y", "-i", os.path.join(base, nombre + ".wav"),
                "-codec:a", "libmp3lame", "-b:a", "96k", destino],
               "convirtiendo " + os.path.basename(destino))

    # Para los acordes, todo lo armonico SIN bateria: los golpes de
    # percusion son ruido de banda ancha que ensucia el cromagrama.
    mezclar([os.path.join(base, k + ".wav") for k in ARMONICOS],
            armonico, "mezclando bajo + guitarra + piano + resto para los acordes")

    # Y para el pulso, bateria + bajo. Medido sobre esta cancion: la mezcla
    # completa da 143 BPM (el doble del real) salvo que se le adivine el
    # start_bpm; sobre la percusion da 69.84 sin necesidad de pistas.
    mezclar([os.path.join(base, k + ".wav") for k in RITMICOS],
            ritmo, "mezclando bateria + bajo para el pulso")

    # Los WAV de Demucs pesan ~50 MB cada uno y no se vuelven a usar.
    # Windows a veces conserva el bloqueo un instante tras cerrar ffmpeg.
    for intento in range(4):
        shutil.rmtree(tmp, ignore_errors=True)
        if not os.path.exists(tmp):
            break
        time.sleep(0.5)
    else:
        log("demucs", "aviso: no se pudo borrar " + tmp)
    return salidas, armonico, ritmo


# ---------------------------------------------------------------- 3. acordes

def sacar_acordes(armonico, ritmo):
    log("acordes", "extrayendo rasgos (cromagrama sin bateria, pulso sobre la percusion)")
    t0 = time.time()
    rasgos = analisis.extraer_rasgos(armonico, ruta_pulso=ritmo)
    log("acordes", "rasgos en %.1f s, %d pulsos" % (time.time() - t0,
                                                    len(rasgos["tiempos_beat"])))
    r = analisis.decodificar(rasgos)
    segmentos = analisis.segmentar(r["acordes_por_beat"], r["tiempos_beat"],
                                   r["duracion"])
    log("acordes", "%d segmentos, tonalidad %s %s"
        % (len(segmentos), r["tonalidad"]["raiz"], r["tonalidad"]["modo"]))
    return r, segmentos


def armar_compases(r):
    """Numera cada pulso segun la agrupacion y la fase detectadas."""
    fase = r["fase_compas"]
    grupo = r.get("grupo_compas", 4)
    beats = []
    for i, t in enumerate(r["tiempos_beat"]):
        rel = i - fase
        beats.append({
            "t": round(float(t), 3),
            "compas": rel // grupo + 1,
            "pulso": rel % grupo + 1,
            "estimado": bool(r["estimados"][i]) if i < len(r["estimados"]) else True,
        })
    return beats


# ------------------------------------------------------------------ 4. letra

def preparar_voz(voz):
    """Normaliza el stem antes de transcribir.

    La voz separada llega con mucho rango dinamico y reverb; asi Whisper
    la descarta como 'no es habla' y entra en bucle de alucinacion.
    """
    plano = os.path.join(os.path.dirname(voz), "_voz_normalizada.wav")
    # dynaudnorm nivela tramo a tramo, no la cancion entera. Hace falta
    # porque loudnorm sube el conjunto y una estrofa que entra floja se
    # queda igual de floja en relacion al resto: en "Hasta el final" habia
    # canto desde el segundo 90 y Whisper no lo cogia hasta el 120.
    correr(["ffmpeg", "-y", "-i", voz,
            "-af", "highpass=f=80,"
                   "dynaudnorm=f=200:g=15:p=0.92:m=20:s=8,"
                   "loudnorm=I=-16:TP=-1.5:LRA=11,"
                   "acompressor=threshold=-20dB:ratio=3:attack=20:release=250",
            "-ar", "16000", "-ac", "1", plano], "normalizando la voz")
    return plano


# Por debajo de esta parte del nivel medio de la voz, ahi no canta nadie.
# Medido sobre la biblioteca entera: las alucinaciones se quedan todas en
# 0.006 o menos y la linea cantada mas floja esta en 0.194.
SILENCIO = 0.05


def quitar_fantasmas(lineas, voz):
    """Tira las lineas que caen donde la pista de voz esta callada.

    Whisper rellena los silencios con muletillas —"Gracias.", "Amen.",
    "Canto en espanol."— que se colaban en la letra y en la hoja de
    cifrado. Como tenemos la voz aislada, se comprueba: si ahi no suena
    nada, no se canto nada.
    """
    import librosa
    import numpy as np
    y, sr = librosa.load(voz, sr=16000, mono=True)
    nivel = float(np.sqrt(np.mean(y ** 2))) or 1e-9
    limpias, fuera = [], []
    for l in lineas:
        a = int(l["inicio"] * sr)
        b = int(min(l["fin"], len(y) / sr) * sr)
        tramo = y[a:b]
        r = float(np.sqrt(np.mean(tramo ** 2))) if len(tramo) else 0.0
        if r / nivel >= SILENCIO:
            limpias.append(l)
        else:
            fuera.append(l["texto"])
    if fuera:
        log("letra", "fuera %d sobre silencio: %s"
            % (len(fuera), " | ".join(t[:24] for t in fuera[:5])))
    return limpias


def sacar_letra(voz, idioma="es", modelo="large-v3"):
    import torch
    import whisper
    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    plano = preparar_voz(voz)
    log("letra", "cargando Whisper %s en %s" % (modelo, dispositivo))
    m = whisper.load_model(modelo, device=dispositivo)
    log("letra", "transcribiendo la voz aislada")
    t0 = time.time()
    res = m.transcribe(
        plano, language=idioma, word_timestamps=True,
        fp16=(dispositivo == "cuda"),
        # Corta el bucle: sin esto repite la ultima frase indefinidamente
        condition_on_previous_text=False,
        # Mas permisivo: el canto puntua peor que el habla y se descartaba todo
        no_speech_threshold=0.85,
        logprob_threshold=-1.5,
        compression_ratio_threshold=2.6,
        temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0),
        hallucination_silence_threshold=2.0,
        initial_prompt="Transcripcion de una cancion en espanol, verso por verso.")
    log("letra", "transcrita en %.1f s" % (time.time() - t0))
    try:
        os.remove(plano)
    except OSError:
        pass

    lineas = []
    for s in res.get("segments", []):
        texto = s.get("text", "").strip()
        if not texto:
            continue
        lineas.append({
            "inicio": round(float(s["start"]), 3),
            "fin": round(float(s["end"]), 3),
            "texto": texto,
            "editado": False,
            "palabras": [{"t": round(float(w["start"]), 3),
                          "w": w["word"].strip()}
                         for w in s.get("words", []) or []],
        })
    lineas = quitar_fantasmas(lineas, voz)
    return lineas


# ------------------------------------------------------------------- armado

def procesar(url, saltar_letra=False, modelo="large-v3", hasta=None):
    os.makedirs(CANCIONES, exist_ok=True)
    info = leer_datos(url)
    slug = hacer_slug(info["titulo"])
    carpeta = os.path.join(CANCIONES, slug)
    os.makedirs(carpeta, exist_ok=True)
    descargar(url, carpeta, hasta=hasta)

    salidas, armonico, ritmo = separar(carpeta)
    r, segmentos = sacar_acordes(armonico, ritmo)
    beats = armar_compases(r)

    otros_stems = [salidas[k] for k in STEMS if k != "piano"]
    solo, peso = mod_piano.es_piano_solo(salidas["piano"], otros_stems)
    if solo:
        log("piano", "piano solo (%.0f%% de la mezcla): se transcribe el "
                     "audio original, sin pasar por la separacion" % (peso * 100))
        notas_piano, nivel_piano = mod_piano.transcribir_directo(
            os.path.join(carpeta, "original.mp3"))
    else:
        log("piano", "transcribiendo el stem separado (piano al %.0f%%)"
            % (peso * 100))
        notas_piano, nivel_piano = mod_piano.transcribir(
            salidas["piano"], rutas_otros=otros_stems)
    if notas_piano:
        r_piano = mod_piano.resumen(notas_piano)
        log("piano", "%d notas (%.1f dB, mediana %.2f s)"
            % (r_piano["notas"], nivel_piano, r_piano["duracion_mediana"]))
    else:
        log("piano", "stem vacio (%.1f dB): esta cancion no lleva piano" % nivel_piano)

    log("bateria", "transcribiendo bombo, caja y platillo por banda")
    golpes = mod_bateria.analizar(salidas["drums"])
    log("bateria", "%d golpes: %s" % (len(golpes["golpes"]), golpes["conteo"]))

    letra = [] if saltar_letra else sacar_letra(salidas["vocals"], modelo=modelo)

    # Las mezclas auxiliares ya cumplieron su funcion
    for intermedio in (armonico, ritmo):
        try:
            os.remove(intermedio)
        except OSError:
            pass

    raiz = r["tonalidad"]["raiz"]
    cancion = {
        "id": slug,
        "titulo": info["titulo"],
        "artista": info["artista"],
        "youtube_id": info["youtube_id"],
        "duracion": round(r["duracion"], 3),
        "tempo": round(r["tempo"], 2),
        "compas": "%d/4" % r.get("grupo_compas", 4),
        "tonalidad": {
            "raiz": raiz,
            "modo": r["tonalidad"]["modo"],
            "nombre": "%s %s" % (analisis.LATIN[raiz], r["tonalidad"]["modo"]),
            "confianza": round(r["tonalidad"]["confianza"], 3),
        },
        "audio": dict({"completo": "original.mp3"},
                      **{v.split(".")[0]: v for v in STEMS.values()}),
        # Corrimiento fino en milisegundos, ajustable desde el panel.
        # Positivo = mostrar los acordes antes de que suenen.
        "ajuste_ms": 0,
        "beats": beats,
        "acordes": segmentos,
        "bateria": golpes["golpes"],
        "piano_notas": notas_piano,
        "letra": letra,
        "generado_por": "claude",
        "version_datos": 1,
    }

    salida = os.path.join(carpeta, "cancion.json")
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(cancion, f, ensure_ascii=False, indent=1)
    log("listo", salida)
    return salida, cancion


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("url")
    p.add_argument("--sin-letra", action="store_true",
                   help="salta la transcripcion (mas rapido para probar acordes)")
    p.add_argument("--hasta", type=int, default=None,
                   help="recorta el audio a los primeros N segundos")
    p.add_argument("--modelo", default="large-v3",
                   help="modelo de Whisper (tiny/base/small/medium/large-v3)")
    a = p.parse_args()
    ruta, c = procesar(a.url, saltar_letra=a.sin_letra, modelo=a.modelo,
                       hasta=a.hasta)
    print("\n%s - %s" % (c["titulo"], c["artista"]))
    print("tonalidad %s | %.1f BPM | %d acordes | %d lineas de letra"
          % (c["tonalidad"]["nombre"], c["tempo"], len(c["acordes"]), len(c["letra"])))
