"""Devuelve una cancion a como estaba antes del ultimo analisis.

    python volver.py <slug>

`procesar.py` guarda una copia (cancion.anterior.json) cada vez que
reescribe una cancion. Esto la restaura. Solo hay UN paso atras: no es un
historial, es un deshacer.
"""
import os
import shutil
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))

if len(sys.argv) < 2:
    raise SystemExit("uso: python volver.py <slug>")

carpeta = os.path.join(RAIZ, "canciones", sys.argv[1])
actual = os.path.join(carpeta, "cancion.json")
copia = os.path.join(carpeta, "cancion.anterior.json")

if not os.path.isfile(copia):
    raise SystemExit("no hay copia anterior en " + carpeta)

# La que se va tambien se guarda: asi volver.py dos veces te devuelve aqui
if os.path.isfile(actual):
    shutil.copy2(actual, actual + ".tmp")
shutil.copy2(copia, actual)
if os.path.isfile(actual + ".tmp"):
    os.replace(actual + ".tmp", copia)

print("restaurada la version anterior de " + sys.argv[1])
print("para deshacer este deshacer, vuelve a correr lo mismo")
