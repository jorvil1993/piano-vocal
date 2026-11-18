"""Aplica un cifrado hecho a mano encima de lo que detecto el motor.

    python corregir.py <slug>              # lee correcciones/<slug>.txt
    python corregir.py <slug> --ver        # solo enseña, no guarda

Existe porque el detector no siempre llega, y cuando hay un cifrado de
verdad ese manda. El problema era la sincronia: una hoja de papel no trae
segundos. Pero la letra transcrita si guarda el tiempo de CADA palabra, asi
que basta con decir en que palabra entra cada acorde.

Formato del archivo, una linea por acorde:

    Mim  | te he conocido      <- entra en esa palabra
    Re   | te he amado
    Sol  | contigo
    Do   | @1:23               <- o en un minuto exacto, si no hay letra
    -    | @2:40               <- un guion corta: de aqui vuelve lo detectado

El ancla se busca AVANZANDO por la letra, asi que si una frase se repite se
resuelve sola: la segunda vez engancha la segunda aparicion.
"""
import argparse
import json
import os
import re
import shutil
import sys
import unicodedata

import analisis

RAIZ = os.path.dirname(os.path.abspath(__file__))

for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

LATIN_A_ANGLO = {"do": "C", "do#": "C#", "reb": "C#", "re": "D", "re#": "D#",
                 "mib": "D#", "mi": "E", "fa": "F", "fa#": "F#", "solb": "F#",
                 "sol": "G", "sol#": "G#", "lab": "G#", "la": "A", "la#": "A#",
                 "sib": "A#", "si": "B"}
SUF_A_TIPO = {"": "maj", "m": "min", "min": "min", "dim": "dim", "aug": "aug",
              "sus4": "sus4", "sus2": "sus2", "7": "7", "maj7": "maj7",
              "m7": "m7", "6": "6", "m6": "m6"}


def plano(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def leer_acorde(txt):
    """'Sol/Fa#' -> ('G:maj', 'F#').  'Lam7' -> ('A:m7', None)."""
    txt = txt.strip()
    if txt in ("-", "--"):
        return None, None
    bajo = None
    if "/" in txt:
        txt, b = txt.split("/", 1)
        bajo = LATIN_A_ANGLO.get(plano(b).replace("sostenido", "#"),
                                 b.strip().upper())
        if b.strip().endswith("#") and not bajo.endswith("#"):
            bajo = LATIN_A_ANGLO.get(plano(b) + "#", bajo)
    # Las raices se prueban de la MAS LARGA a la mas corta. Con una regex
    # golosa, "Mim" se leia entero como raiz en vez de "Mi" + "m", y
    # "Sol#" habria perdido el sostenido.
    txt = txt.strip().replace("♯", "#")
    anglo = suf = None
    for cand in sorted(LATIN_A_ANGLO, key=len, reverse=True):
        if txt.lower().startswith(cand):
            anglo, suf = LATIN_A_ANGLO[cand], txt[len(cand):].strip()
            break
    if anglo is None:
        m = re.match(r"^([A-Ga-g](?:#|b)?)(.*)$", txt)
        if not m:
            raise ValueError("no entiendo el acorde: " + txt)
        anglo, suf = m.group(1).upper(), m.group(2).strip()
        anglo = {"DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#",
                 "BB": "A#"}.get(anglo.upper(), anglo)
        if anglo not in analisis.CLASES:
            raise ValueError("no reconozco la raiz: " + txt)
    tipo = SUF_A_TIPO.get(suf.lower())
    if tipo is None:
        raise ValueError("no reconozco el tipo: " + suf + " (en " + txt + ")")
    return anglo + ":" + tipo, bajo


def leer_archivo(ruta):
    filas = []
    with open(ruta, encoding="utf-8") as f:
        for n, linea in enumerate(f, 1):
            # El comentario solo cuenta si la almohadilla ABRE la linea.
            # Cortando en cualquier '#' se partia "Sol/Fa#" por la mitad y
            # la linea se quedaba sin la barra.
            linea = linea.strip()
            if not linea or linea.startswith("#"):
                continue
            if "|" not in linea:
                raise SystemExit("linea %d: falta la barra |  -> %s" % (n, linea))
            ac, ancla = [x.strip() for x in linea.split("|", 1)]
            filas.append((n, ac, ancla))
    return filas


VOCALES = "aeiouáéíóúü"


def silabas(palabra):
    """Cuenta silabas contando grupos de vocales. Aproximado y suficiente:
    solo sirve para repartir el tiempo de la palabra en trozos iguales."""
    p = plano(palabra)
    grupos, dentro = 0, False
    for c in p:
        v = c in "aeiou"
        if v and not dentro:
            grupos += 1
        dentro = v
    return max(1, grupos)


def momento(ancla, palabras, desde):
    """Segundo en que entra el acorde. Devuelve (tiempo, indice avanzado).

    Formas del ancla:
      @1:23        un minuto exacto
      palabra      donde empieza esa palabra
      palabra:3    en su tercera silaba
      palabra +0.4 esa palabra, 0.4 s despues

    Las silabas hacen falta porque el acorde casi nunca entra justo al
    empezar la palabra: "te he conocido" lleva el Re en la sílaba "ci",
    no en "co".
    """
    ancla = ancla.strip()
    nudge = 0.0
    m = re.search(r"\s([+-]\s*\d+(?:\.\d+)?)\s*$", ancla)
    if m:
        nudge = float(m.group(1).replace(" ", ""))
        ancla = ancla[:m.start()].strip()

    silaba = None
    m = re.search(r":(\d+)\s*$", ancla)
    if m and not ancla.startswith("@"):
        silaba = int(m.group(1))
        ancla = ancla[:m.start()].strip()

    if ancla.startswith("@"):
        t = ancla[1:].strip()
        if ":" in t:
            mm, ss = t.split(":")
            return float(mm) * 60 + float(ss) + nudge, desde
        return float(t) + nudge, desde

    buscado = [plano(p) for p in ancla.split() if plano(p)]
    if not buscado:
        raise ValueError("ancla vacia")
    def sitio(i):
        """Tiempo de la palabra i, corrido a su silaba si se pidio."""
        t = float(palabras[i]["t"])
        if silaba and silaba > 1:
            # Cuanto dura la palabra: hasta que empieza la siguiente
            fin = (float(palabras[i + 1]["t"]) if i + 1 < len(palabras)
                   else t + 0.6)
            total = silabas(palabras[i]["w"])
            paso = max(0.0, fin - t) / total
            t += paso * min(silaba - 1, total - 1)
        return t + nudge, i + 1

    for i in range(desde, len(palabras) - len(buscado) + 1):
        if all(plano(palabras[i + k]["w"]) == buscado[k]
               for k in range(len(buscado))):
            return sitio(i)
    # Segundo intento: que la palabra EMPIECE igual (la transcripcion a
    # veces se come una silaba o pega un signo)
    for i in range(desde, len(palabras)):
        if plano(palabras[i]["w"]).startswith(buscado[0][:4]):
            return sitio(i)
    raise ValueError("no encuentro en la letra: " + ancla)


def repartir(texto, ini, fin):
    """Reparte las palabras de una frase entre dos momentos.

    Se hace por longitud, no en trozos iguales: una palabra larga se canta
    en mas tiempo que una corta. Es una aproximacion, pero solo decide
    donde cae cada palabra DENTRO de una linea cuyo principio y final ya
    son correctos; para leer la hoja de cifrado eso basta.
    """
    partes = [p for p in texto.split() if p]
    if not partes:
        return []
    pesos = [len(p) + 1 for p in partes]
    total = float(sum(pesos))
    dur = max(0.3, fin - ini)
    salida, acum = [], 0.0
    for p, w in zip(partes, pesos):
        salida.append({"t": round(ini + dur * acum / total, 3), "w": p})
        acum += w
    return salida


def aplicar_letra(slug, ver=False):
    """Pone la letra del cuaderno encima de la que transcribio Whisper."""
    carpeta = os.path.join(RAIZ, "canciones", slug)
    ruta = os.path.join(carpeta, "cancion.json")
    correccion = os.path.join(RAIZ, "correcciones", slug + "-letra.txt")
    if not os.path.isfile(correccion):
        return False
    with open(ruta, encoding="utf-8") as f:
        cancion = json.load(f)

    filas = leer_archivo(correccion)
    puestos = []
    for n, momento_txt, texto in filas:
        if not momento_txt.startswith("@"):
            raise SystemExit("linea %d: la letra se ancla con @minuto, no con "
                             "una palabra (la palabra es justo lo que se esta "
                             "corrigiendo)" % n)
        t = momento_txt[1:].strip()
        if ":" in t:
            mm, ss = t.split(":")
            seg = float(mm) * 60 + float(ss)
        else:
            seg = float(t)
        puestos.append((seg, texto))
    puestos.sort()

    ini_b, fin_b = puestos[0][0], puestos[-1][0]
    nuevas = []
    for i, (t, texto) in enumerate(puestos):
        fin = puestos[i + 1][0] if i + 1 < len(puestos) else t + 4.0
        nuevas.append({"inicio": round(t, 3), "fin": round(fin, 3),
                       "texto": texto, "editado": True,
                       "palabras": repartir(texto, t, fin)})
    fin_b = nuevas[-1]["fin"]

    viejas = cancion.get("letra") or []
    fuera = [l for l in viejas if l["fin"] <= ini_b + 0.01 or l["inicio"] >= fin_b - 0.01]
    quitadas = len(viejas) - len(fuera)

    print("letra: %d trozos de Whisper -> %d lineas tuyas (%.1f a %.1f s)"
          % (quitadas, len(nuevas), ini_b, fin_b))
    for l in nuevas:
        print("   %3d:%05.2f  %d palabras" % (l["inicio"] // 60, l["inicio"] % 60,
                                              len(l["palabras"])))
    if ver:
        print("(--ver: no se ha guardado nada)")
        return True

    shutil.copy2(ruta, ruta.replace(".json", ".anterior.json"))
    cancion["letra"] = sorted(fuera + nuevas, key=lambda l: l["inicio"])
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(cancion, f, ensure_ascii=False, indent=1)
    print("letra guardada. para deshacer:  python volver.py " + slug)
    return True


def aplicar(slug, ver=False):
    carpeta = os.path.join(RAIZ, "canciones", slug)
    ruta = os.path.join(carpeta, "cancion.json")
    correccion = os.path.join(RAIZ, "correcciones", slug + ".txt")
    if not os.path.isfile(ruta):
        raise SystemExit("no existe " + ruta)
    if not os.path.isfile(correccion):
        raise SystemExit("no existe " + correccion)

    with open(ruta, encoding="utf-8") as f:
        cancion = json.load(f)

    palabras = []
    for l in cancion.get("letra") or []:
        palabras.extend(l.get("palabras") or [])

    filas = leer_archivo(correccion)
    puestos, desde = [], 0
    for n, ac, ancla in filas:
        try:
            t, desde = momento(ancla, palabras, desde)
            etiqueta, bajo = leer_acorde(ac)
        except ValueError as e:
            raise SystemExit("linea %d: %s" % (n, e))
        puestos.append({"t": round(float(t), 3), "etiqueta": etiqueta,
                        "bajo": bajo, "ancla": ancla})

    puestos.sort(key=lambda x: x["t"])
    if not puestos:
        raise SystemExit("el archivo no tiene ninguna correccion")

    fin_bloque = puestos[-1]["t"]
    nuevos = []
    for i, p in enumerate(puestos):
        fin = puestos[i + 1]["t"] if i + 1 < len(puestos) else None
        if p["etiqueta"] is None:      # un guion: aqui se corta
            continue
        if fin is None:
            fin = p["t"] + 4.0
        nuevos.append(dict({
            "inicio": p["t"], "fin": round(float(fin), 3),
            "pulsos": 0, "etiqueta": p["etiqueta"], "editado": True,
        }, **analisis.nombrar(p["etiqueta"], p["bajo"])))

    ini_bloque = puestos[0]["t"]
    antes = [a for a in cancion["acordes"] if a["fin"] <= ini_bloque + 0.01]
    despues = [a for a in cancion["acordes"] if a["inicio"] >= fin_bloque - 0.01]

    print("%-9s %-10s %s" % ("minuto", "acorde", "ancla"))
    print("-" * 52)
    for a in nuevos:
        nom = a["latino"] + ("/" + a["bajo_latino"] if a.get("bajo") else "")
        anc = next(p["ancla"] for p in puestos if p["t"] == a["inicio"])
        print("%3d:%05.2f  %-10s %s" % (a["inicio"] // 60, a["inicio"] % 60,
                                        nom, anc))
    print()
    print("se reemplaza de %.1f s a %.1f s: %d acordes detectados -> %d tuyos"
          % (ini_bloque, fin_bloque,
             len(cancion["acordes"]) - len(antes) - len(despues), len(nuevos)))

    if ver:
        print("(--ver: no se ha guardado nada)")
        return

    shutil.copy2(ruta, ruta.replace(".json", ".anterior.json"))
    cancion["acordes"] = antes + nuevos + despues
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(cancion, f, ensure_ascii=False, indent=1)
    print("guardado. para deshacer:  python volver.py " + slug)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("slug")
    p.add_argument("--ver", action="store_true",
                   help="enseña como quedaria sin guardar nada")
    p.add_argument("--solo-letra", action="store_true",
                   help="aplica solo correcciones/<slug>-letra.txt")
    a = p.parse_args()
    hubo = aplicar_letra(a.slug, ver=a.ver)
    if not a.solo_letra:
        if hubo:
            print()
        aplicar(a.slug, ver=a.ver)
    elif not hubo:
        raise SystemExit("no existe correcciones/%s-letra.txt" % a.slug)
