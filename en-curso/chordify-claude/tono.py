"""Sube o baja el tono de una cancion sin cambiarle la velocidad.

    python tono.py <slug> +2          # dos semitonos arriba
    python tono.py <slug> -1          # uno abajo
    python tono.py --borrar <slug>    # tira los tonos ya generados
    python tono.py --borrar           # los de todas
    python tono.py --peso             # cuanto ocupa el cache

Cantar en la tonalidad del disco no siempre se puede. Pero transportar solo
los NOMBRES de los acordes no sirve de nada: tocarias Fa mientras suena Mi.
Por eso aqui se mueve tambien el audio, las seis pistas, y asi lo que ves y
lo que oyes son el mismo acorde.

Lo hace ffmpeg con librubberband, que cambia el tono dejando la duracion
INTACTA. Eso es lo que evita tener que resincronizar nada: medido sobre
"Destruyeme" a -1, las seis pistas dan 236.040 s antes y 236.040 s despues,
deriva 0.000 s. Los tiempos de los acordes, de la letra y de los pulsos
siguen valiendo tal cual, y por eso el cancion.json NI SE TOCA. El tono es
como te sientas a tocar hoy, no un dato de la cancion.

El resultado NO va junto a la cancion: va a %LOCALAPPDATA%, fuera de
OneDrive. Son 17 MB por cada tono de cada cancion -doce tonos por veintinueve
canciones serian 6 GB- y todo se vuelve a hacer en trece segundos. Subir a la
nube algo asi de pesado y asi de facil de rehacer no tiene sentido.
"""
import concurrent.futures as cf
import os
import shutil
import subprocess
import sys
import threading

RAIZ = os.path.dirname(os.path.abspath(__file__))
CANCIONES = os.path.join(RAIZ, "canciones")

# Fuera de OneDrive, a proposito (ver arriba)
CACHE = os.path.join(os.environ.get("LOCALAPPDATA") or
                     os.path.join(os.path.expanduser("~"), ".cache"),
                     "chordify-claude", "tonos")

# Mas de seis semitonos no tiene sentido pedirlos: a +7 estas mas cerca
# bajando 5, y a esa distancia rubberband ya suena a lata.
LIMITE = 6

# Las seis que suenan en el atril. `original.mp3` no se transporta porque
# la consola no lo reproduce (PISTAS en app.js son estas mismas seis) y es
# el archivo mas pesado con diferencia: renderizarlo casi doblaria la espera
# a cambio de un audio que nadie llega a oir.
PISTAS = ["voz", "bateria", "bajo", "guitarra", "piano", "resto"]

# Cuantas pistas a la vez. Son seis y cada una tarda ~6 s: con cuatro hilos
# la espera baja de 36 s a unos 13.
HILOS = 4


def escala(semis):
    """Semitonos -> el factor que entiende rubberband."""
    return 2.0 ** (int(semis) / 12.0)


def nombre_carpeta(semis):
    """Como se llama la carpeta de ese tono. Cadena vacia para el original.

    Se escribe con palabras y no con "+2" porque asi se entiende abriendo el
    explorador de archivos, y porque un "+" dentro de una URL es territorio
    resbaladizo. El navegador NO construye esta ruta: se la devuelve el
    servidor en /api/tono, para que la regla viva en un solo sitio y no
    pueda desincronizarse.
    """
    semis = int(semis)
    if semis == 0:
        return ""
    return "tono-%s-%d" % ("sube" if semis > 0 else "baja", abs(semis))


def carpeta_origen(slug):
    return os.path.join(CANCIONES, slug)


def carpeta_de(slug, semis):
    """Donde viven (o viviran) las pistas de esa cancion a ese tono."""
    if int(semis) == 0:
        return carpeta_origen(slug)
    return os.path.join(CACHE, slug, nombre_carpeta(semis))


def _fuentes(slug):
    """Las pistas que existen de verdad en esa cancion."""
    origen = carpeta_origen(slug)
    return [p for p in PISTAS
            if os.path.isfile(os.path.join(origen, p + ".mp3"))]


def bitrate(ruta, por_defecto=96000):
    """El bitrate del origen, para no engordar ni degradar al recodificar."""
    try:
        salida = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a:0",
             "-show_entries", "stream=bit_rate", "-of", "csv=p=0", ruta],
            capture_output=True, text=True, timeout=30)
        return min(max(int((salida.stdout or "").strip()), 64000), 192000)
    except (ValueError, OSError, subprocess.SubprocessError):
        return por_defecto


def rendir_una(origen, destino, semis):
    filtro = "rubberband=pitch=%.9f:pitchq=quality" % escala(semis)
    if os.path.basename(origen).startswith("voz"):
        # Sin esto una voz subida dos semitonos suena a ardilla: al mover la
        # nota se llevaba por delante los formantes, que son justo lo que
        # hace que una "a" suene a "a". `preserved` los deja quietos.
        filtro += ":formant=preserved"
    # Se escribe a un nombre provisional y se renombra al final. Si ffmpeg
    # muere a medias -o se corta el servidor-, lo que queda es un .parcial y
    # no un mp3 truncado que luego pasaria por bueno para siempre.
    medias = destino + ".parcial"
    # `-f mp3` va explicito: con la extension .parcial ffmpeg no sabe que
    # formato escribir y se planta con un -22 sin mas explicacion.
    hecho = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", origen, "-af", filtro,
         "-c:a", "libmp3lame", "-b:a", "%dk" % (bitrate(origen) // 1000),
         "-f", "mp3", medias],
        capture_output=True, text=True)
    if hecho.returncode != 0:
        # Sin esto el fallo llega como "exit status 4294967274" y no hay
        # forma de saber si falto ffmpeg, el filtro o el disco.
        motivo = (hecho.stderr or "").strip().splitlines()
        raise RuntimeError(
            "ffmpeg no pudo con %s: %s"
            % (os.path.basename(origen),
               motivo[-1] if motivo else "codigo %d" % hecho.returncode))
    os.replace(medias, destino)


def listo(slug, semis):
    """True si ese tono ya esta rendido entero."""
    semis = int(semis)
    if semis == 0:
        return True
    destino = carpeta_de(slug, semis)
    return all(os.path.isfile(os.path.join(destino, p + ".mp3"))
               for p in _fuentes(slug))


def rendir(slug, semis, avisar=None):
    """Deja listas las pistas al tono pedido. Devuelve la carpeta destino.

    `avisar(hechas, total)` se llama segun van cayendo, para poder pintar una
    barra: son trece segundos y sin barra parece que se colgo.
    """
    semis = int(semis)
    if not -LIMITE <= semis <= LIMITE:
        raise ValueError("el tono va de -%d a +%d semitonos" % (LIMITE, LIMITE))
    origen = carpeta_origen(slug)
    if not os.path.isdir(origen):
        raise ValueError("no existe la cancion %s" % slug)
    if semis == 0:
        return origen

    destino = carpeta_de(slug, semis)
    os.makedirs(destino, exist_ok=True)
    faltan = [p for p in _fuentes(slug)
              if not os.path.isfile(os.path.join(destino, p + ".mp3"))]
    total = len(faltan)
    if avisar:
        avisar(0, total)
    if not faltan:
        return destino

    hechas = [0]
    cerrojo = threading.Lock()

    def una(p):
        rendir_una(os.path.join(origen, p + ".mp3"),
                   os.path.join(destino, p + ".mp3"), semis)
        with cerrojo:
            hechas[0] += 1
            if avisar:
                avisar(hechas[0], total)

    with cf.ThreadPoolExecutor(max_workers=HILOS) as pool:
        for _ in pool.map(una, faltan):   # recorrerlo propaga los errores
            pass
    return destino


def peso(slug=None):
    """Cuantos MB ocupa el cache de tonos."""
    donde = os.path.join(CACHE, slug) if slug else CACHE
    total = 0
    for base, _, archivos in os.walk(donde):
        for a in archivos:
            try:
                total += os.path.getsize(os.path.join(base, a))
            except OSError:
                pass
    return total / 1e6


def borrar(slug=None):
    """Tira el cache de tonos. Devuelve los MB liberados."""
    libre = peso(slug)
    donde = os.path.join(CACHE, slug) if slug else CACHE
    shutil.rmtree(donde, ignore_errors=True)
    return libre


def _uso():
    print(__doc__.strip().split("\n\n")[1].strip())


if __name__ == "__main__":
    args = list(sys.argv[1:])

    if "--peso" in args:
        print("el cache de tonos ocupa %.0f MB en %s" % (peso(), CACHE))
        sys.exit(0)

    if "--borrar" in args:
        args.remove("--borrar")
        if args:
            libre = sum(borrar(s) for s in args)
            print("borrados los tonos de %d cancion(es), %.0f MB libres"
                  % (len(args), libre))
        else:
            print("borrado el cache entero, %.0f MB libres" % borrar())
        sys.exit(0)

    if len(args) != 2:
        _uso()
        sys.exit(1)
    slug, semis = args[0], int(args[1])
    if not os.path.isdir(carpeta_origen(slug)):
        print("no existe la cancion %s" % slug)
        sys.exit(1)

    def barra(hechas, total):
        print("  %d/%d pistas" % (hechas, total), flush=True)

    print("listo: %s" % rendir(slug, semis, avisar=barra))
