"""Rehace solo la transcripcion de una cancion ya procesada.

    python reletra.py <slug> [--modelo large-v3]

Util para ajustar Whisper sin repetir la descarga, demucs y los acordes.
"""
import argparse
import json
import os

import procesar

p = argparse.ArgumentParser()
p.add_argument("slug")
p.add_argument("--modelo", default="large-v3")
a = p.parse_args()

carpeta = os.path.join(procesar.CANCIONES, a.slug)
ruta = os.path.join(carpeta, "cancion.json")
if not os.path.exists(ruta):
    raise SystemExit("no existe " + ruta)

with open(ruta, encoding="utf-8") as f:
    cancion = json.load(f)

# No pisar correcciones hechas a mano en el panel
manuales = {l["inicio"]: l for l in cancion.get("letra", []) if l.get("editado")}

cancion["letra"] = procesar.sacar_letra(
    os.path.join(carpeta, cancion["audio"]["voz"]), modelo=a.modelo)

for l in cancion["letra"]:
    if l["inicio"] in manuales:
        l.update(manuales[l["inicio"]])

with open(ruta, "w", encoding="utf-8") as f:
    json.dump(cancion, f, ensure_ascii=False, indent=1)

L = cancion["letra"]
palabras = sum(len(l["palabras"]) for l in L)
print("\n%d lineas, %d palabras con tiempo" % (len(L), palabras))
if L:
    largos = [len(l["texto"]) for l in L]
    print("caracteres por linea: min %d, medio %d, max %d"
          % (min(largos), sum(largos) // len(largos), max(largos)))
    print("cubre de %.1f s a %.1f s (audio %.1f s)"
          % (L[0]["inicio"], L[-1]["fin"], cancion["duracion"]))
