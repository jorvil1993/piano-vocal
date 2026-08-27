"""
Graba y analiza lo que se toca en el piano por MIDI.

    python midi_sesion.py --escuchar            graba hasta Ctrl+C
    python midi_sesion.py --analizar <archivo>  informe de esa sesion

Por que MIDI y no el microfono: el micro obliga a detectar alturas de un
audio polifonico, que es aproximado y falla con el pedal. El cable entrega
la tecla exacta, la fuerza exacta y el instante exacto. No hay nada que
adivinar.

Lo que se mide esta elegido a proposito, no es todo lo medible: son los
huecos concretos del pianista que va a usar esto.
"""
import argparse
import glob
import json
import os
import time
from datetime import datetime

import numpy as np

RAIZ = os.path.dirname(os.path.abspath(__file__))
SESIONES = os.path.join(RAIZ, "sesiones-midi")
DO_CENTRAL = 60          # frontera para separar mano izquierda de derecha
CLASES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
LATIN = {'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 'F': 'Fa',
         'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#',
         'B': 'Si'}


# ------------------------------------------------------------- grabacion

def puertos():
    import mido
    return mido.get_input_names()


def escuchar(nombre_puerto=None, cancion=None):
    """Graba todo lo tocado hasta Ctrl+C y lo deja en un JSON."""
    import mido

    disponibles = mido.get_input_names()
    if not disponibles:
        print("No hay ningun dispositivo MIDI conectado.")
        print("Conecta el piano con un cable USB-B a USB-A y vuelve a probar.")
        return None

    puerto = nombre_puerto or disponibles[0]
    print("Escuchando: %s" % puerto)
    print("Toca lo que quieras. Ctrl+C para terminar.\n")

    eventos = []
    t0 = time.time()
    try:
        with mido.open_input(puerto) as entrada:
            for msg in entrada:
                if msg.type not in ("note_on", "note_off"):
                    continue
                # Un note_on con fuerza 0 es un note_off disfrazado
                encendido = msg.type == "note_on" and msg.velocity > 0
                eventos.append({
                    "t": round(time.time() - t0, 4),
                    "nota": msg.note,
                    "vel": msg.velocity,
                    "on": encendido,
                })
    except KeyboardInterrupt:
        pass

    if not eventos:
        print("\nNo se registro ninguna nota.")
        return None

    os.makedirs(SESIONES, exist_ok=True)
    marca = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    destino = os.path.join(SESIONES, "sesion_%s.json" % marca)
    with open(destino, "w", encoding="utf-8") as f:
        json.dump({
            "fecha": datetime.now().isoformat(timespec="seconds"),
            "puerto": puerto,
            "cancion": cancion,
            "duracion": round(eventos[-1]["t"], 2),
            "eventos": eventos,
        }, f, ensure_ascii=False)

    print("\nGuardado: %s" % destino)
    print("%d eventos en %.0f segundos" % (len(eventos), eventos[-1]["t"]))
    return destino


# -------------------------------------------------------------- analisis

def notas_de(sesion):
    """Convierte los eventos sueltos en notas con inicio y final."""
    abiertas, notas = {}, []
    for e in sesion["eventos"]:
        if e["on"]:
            abiertas[e["nota"]] = e
        elif e["nota"] in abiertas:
            ini = abiertas.pop(e["nota"])
            notas.append({"inicio": ini["t"], "fin": e["t"],
                          "nota": e["nota"], "vel": ini["vel"]})
    # Lo que quedo sonando al cortar la grabacion
    for n, ini in abiertas.items():
        notas.append({"inicio": ini["t"], "fin": sesion["duracion"],
                      "nota": n, "vel": ini["vel"]})
    notas.sort(key=lambda x: x["inicio"])
    return notas


def independencia(notas, umbral=0.03):
    """Cuanto se despegan las manos entre si.

    Si cada vez que cae la derecha cae tambien la izquierda dentro de 30 ms,
    las manos van pegadas: hay acordes, no acompanamiento. Es el cuello de
    botella declarado, y aqui deja de ser sensacion para ser un numero.
    """
    izq = [n["inicio"] for n in notas if n["nota"] < DO_CENTRAL]
    der = [n["inicio"] for n in notas if n["nota"] >= DO_CENTRAL]
    if not izq or not der:
        return None

    izq_a = np.array(sorted(izq))
    juntas = 0
    separaciones = []
    for t in der:
        d = float(np.min(np.abs(izq_a - t)))
        separaciones.append(d)
        if d < umbral:
            juntas += 1

    return {
        "notas_izquierda": len(izq),
        "notas_derecha": len(der),
        "pegadas_pct": round(100.0 * juntas / len(der), 1),
        "separacion_mediana_ms": round(float(np.median(separaciones)) * 1000, 1),
    }


def huecos(notas, duracion, minimo=0.8):
    """Silencios donde el piano deja de sonar."""
    if not notas:
        return {"cuantos": 0, "total_s": 0.0, "peor_s": 0.0, "pct": 0.0}
    fin = 0.0
    encontrados = []
    for n in sorted(notas, key=lambda x: x["inicio"]):
        if n["inicio"] - fin > minimo:
            encontrados.append(round(n["inicio"] - fin, 2))
        fin = max(fin, n["fin"])
    total = float(sum(encontrados))
    return {
        "cuantos": len(encontrados),
        "total_s": round(total, 1),
        "peor_s": round(max(encontrados), 1) if encontrados else 0.0,
        "pct": round(100.0 * total / duracion, 1) if duracion else 0.0,
    }


def dinamica(notas):
    """Rango de fuerza. Un piano que no varia de volumen tapa, no acompana."""
    if not notas:
        return None
    v = np.array([n["vel"] for n in notas])
    return {
        "minima": int(v.min()), "maxima": int(v.max()),
        "mediana": int(np.median(v)),
        "rango": int(v.max() - v.min()),
        "desviacion": round(float(v.std()), 1),
    }


def contra_acordes(notas, cancion, tolerancia=0.25):
    """Compara lo tocado con la partitura de acordes de la cancion."""
    acordes = [a for a in cancion.get("acordes", []) if a.get("notas")]
    if not acordes or not notas:
        return None

    inicios = [a["inicio"] for a in acordes]
    dentro = fuera = 0
    tarde = []
    fallos = {}

    for n in notas:
        i = np.searchsorted(inicios, n["inicio"], side="right") - 1
        if i < 0:
            continue
        a = acordes[i]
        clase = CLASES[n["nota"] % 12]
        if clase in a["notas"]:
            dentro += 1
        else:
            fuera += 1
            fallos[clase] = fallos.get(clase, 0) + 1
        # Cuanto tarda la mano en llegar tras el cambio de acorde
        retraso = n["inicio"] - a["inicio"]
        if 0 <= retraso <= tolerancia * 4:
            tarde.append(retraso)

    total = dentro + fuera
    return {
        "notas_evaluadas": total,
        "acierto_pct": round(100.0 * dentro / total, 1) if total else 0.0,
        "retraso_mediano_ms": round(float(np.median(tarde)) * 1000, 1) if tarde else None,
        "clases_fallidas": sorted(fallos.items(), key=lambda x: -x[1])[:5],
    }


def analizar(ruta, cancion=None):
    with open(ruta, encoding="utf-8") as f:
        sesion = json.load(f)
    notas = notas_de(sesion)
    informe = {
        "archivo": os.path.basename(ruta),
        "fecha": sesion.get("fecha"),
        "duracion": sesion.get("duracion"),
        "notas_tocadas": len(notas),
        "notas_por_segundo": round(len(notas) / sesion["duracion"], 2)
        if sesion.get("duracion") else 0,
        "independencia": independencia(notas),
        "huecos": huecos(notas, sesion.get("duracion", 0)),
        "dinamica": dinamica(notas),
    }
    if cancion:
        informe["contra_acordes"] = contra_acordes(notas, cancion)
    return informe


def imprimir(informe):
    print("=" * 58)
    print(" SESION %s" % informe.get("fecha", ""))
    print("=" * 58)
    print("  %d notas en %.0f s  (%.2f por segundo)"
          % (informe["notas_tocadas"], informe["duracion"] or 0,
             informe["notas_por_segundo"]))

    ind = informe.get("independencia")
    if ind:
        print("\n  MANOS")
        print("    izquierda %d notas | derecha %d notas"
              % (ind["notas_izquierda"], ind["notas_derecha"]))
        print("    caen juntas (menos de 30 ms): %.1f%%" % ind["pegadas_pct"])
        print("    separacion mediana: %.0f ms" % ind["separacion_mediana_ms"])

    h = informe.get("huecos")
    if h:
        print("\n  HUECOS  (silencios de mas de 0.8 s)")
        print("    %d huecos, %.1f s en total (%.1f%% del tiempo)"
              % (h["cuantos"], h["total_s"], h["pct"]))
        print("    el peor: %.1f s" % h["peor_s"])

    d = informe.get("dinamica")
    if d:
        print("\n  DINAMICA")
        print("    fuerza de %d a %d (rango %d, desviacion %.1f)"
              % (d["minima"], d["maxima"], d["rango"], d["desviacion"]))

    c = informe.get("contra_acordes")
    if c:
        print("\n  CONTRA LA PARTITURA")
        print("    %d notas evaluadas, %.1f%% dentro del acorde"
              % (c["notas_evaluadas"], c["acierto_pct"]))
        if c["retraso_mediano_ms"] is not None:
            print("    llegas al acorde %.0f ms despues del cambio"
                  % c["retraso_mediano_ms"])
        if c["clases_fallidas"]:
            fuera = ", ".join("%s (%d)" % (LATIN.get(k, k), v)
                              for k, v in c["clases_fallidas"])
            print("    notas fuera del acorde: %s" % fuera)
    print()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--escuchar", action="store_true", help="grabar una sesion")
    p.add_argument("--puertos", action="store_true", help="listar dispositivos")
    p.add_argument("--analizar", nargs="?", const="ultima",
                   help="analizar un archivo (o la ultima sesion)")
    p.add_argument("--cancion", default=None,
                   help="slug de la cancion para comparar contra sus acordes")
    a = p.parse_args()

    if a.puertos:
        ps = puertos()
        print("dispositivos MIDI: %d" % len(ps))
        for n in ps:
            print("   -", n)
        if not ps:
            print("   (conecta el piano con un cable USB-B a USB-A)")
        raise SystemExit

    cancion = None
    if a.cancion:
        ruta = os.path.join(RAIZ, "canciones", a.cancion, "cancion.json")
        if os.path.exists(ruta):
            with open(ruta, encoding="utf-8") as f:
                cancion = json.load(f)

    if a.escuchar:
        destino = escuchar(cancion=a.cancion)
        if destino:
            imprimir(analizar(destino, cancion))
        raise SystemExit

    if a.analizar:
        ruta = a.analizar
        if ruta == "ultima":
            todas = sorted(glob.glob(os.path.join(SESIONES, "sesion_*.json")))
            if not todas:
                raise SystemExit("todavia no hay sesiones grabadas")
            ruta = todas[-1]
        imprimir(analizar(ruta, cancion))
        raise SystemExit

    p.print_help()
