"""Deja el titulo y el artista presentables.

YouTube devuelve cosas como "Ana Bolivar - 3. Nada Guardaste (Audio Oficial)
- Nada Guardaste EP (2015)". En la lista del atril eso no hay quien lo lea.
Aqui se quita todo lo que no es el nombre de la cancion: el canal, el disco,
el ano, los "(VIDEO OFICIAL)", los feats y los numeros de pista.

Vive en su propio archivo porque lo usan `procesar.py` (al dar de alta una
cancion) y el arreglo de las que ya estaban. Una sola definicion.
"""
import re
import unicodedata

# Un parentesis que solo diga esto es ruido y se va entero
RUIDO_PARENTESIS = re.compile(
    r"^(?:video|audio|v[ií]deo)?\s*"
    r"(?:oficial|official|lyric[s]?|letra|lyric\s*video|video\s*lyric|"
    r"visualizer|hd|4k|en\s*vivo|live(?:\s*session)?|cover|"
    r"audio\s*oficial|video\s*oficial|\d{4})\s*$",
    re.IGNORECASE)

# Un tramo suelto que tampoco aporta
RUIDO_TRAMO = re.compile(
    r"^(?:live\s*session|lyric\s*video|video\s*lyric|letra|audio|video|"
    r"m[uú]sica\s+cat[oó]lica|topic|official\s*video|visualizer|"
    r".*\bEP\b.*|\d{4})$",
    re.IGNORECASE)

# "3. Nada Guardaste" -> "Nada Guardaste"
NUMERO_PISTA = re.compile(r"^\s*\d{1,2}\s*[.\-)]\s*")

# "Te Confieso ft Alonso Barboza" -> "Te Confieso"
FEAT = re.compile(r"\s+(?:ft\.?|feat\.?|con)\s+.*$", re.IGNORECASE)

# Palabras que en un titulo en espanol van en minuscula (salvo la primera)
MENUDAS = {"a", "al", "ante", "con", "contra", "de", "del", "desde", "e",
           "el", "en", "entre", "hacia", "hasta", "la", "las", "lo", "los",
           "mi", "ni", "o", "para", "por", "que", "se", "si", "sin", "sobre",
           "su", "sus", "te", "tu", "un", "una", "y"}


def _plano(s):
    """Sin tildes y en minuscula, para comparar nombres."""
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def _titular(s):
    """Baja los GRITOS a mayusculas de titulo, palabra por palabra.

    Se hace palabra a palabra y no con la frase entera porque un titulo
    como "REGRESAR A TI (Quiero Adorarte)" mezcla las dos cosas: mirando
    la frase completa parecia que no estaba en mayusculas y se quedaba
    gritando.
    """
    salida = []
    for i, p in enumerate(s.split(" ")):
        if not p:
            continue
        letras = [c for c in p if c.isalpha()]
        if not letras or not all(c.isupper() for c in letras):
            salida.append(p)                  # ya venia bien escrita
            continue
        bajo = p.lower()
        nucleo = re.sub(r"[^a-záéíóúñü]", "", bajo)
        salida.append(bajo if i and nucleo in MENUDAS else bajo.capitalize())
    return " ".join(salida)


def limpiar_artista(artista, titulo=""):
    a = re.sub(r"\s*-\s*Topic\s*$", "", artista or "").strip()
    # "T R I S A G I O N" -> "TRISAGION"
    if a and re.fullmatch(r"(?:[A-Za-zÁÉÍÓÚÑáéíóúñ]\s+)+[A-Za-zÁÉÍÓÚÑáéíóúñ]", a):
        a = a.replace(" ", "")
    # Si el titulo escribe el mismo nombre con tildes, gana el del titulo:
    # el canal suele venir sin acentos ("ESTACION CERO" frente a
    # "ESTACIÓN CERO"). Se quitan antes los parentesis, porque el nombre
    # viene pegado a ellos ("ESTACIÓN CERO (VIDEO OFICIAL)") y si no, no
    # llegaba a compararse.
    if a and titulo:
        limpio = re.sub(r"\([^()]*\)|\[[^\]]*\]", " ", titulo)
        for trozo in re.split(r"\s*[-|,]\s*", limpio):
            trozo = trozo.strip()
            if trozo and _plano(trozo) == _plano(a) and trozo != a:
                a = trozo
                break
    return _titular(a).strip()


def limpiar_titulo(titulo, artista=""):
    t = (titulo or "").strip()
    art = _plano(limpiar_artista(artista, titulo))

    # Lo que va detras de una barra suele ser el sello o la sesion
    t = t.split("|")[0].strip()

    # Fuera los parentesis que solo son etiquetas de YouTube, y los que
    # repiten el nombre del artista
    def poda(m):
        dentro = m.group(1).strip()
        if RUIDO_PARENTESIS.match(dentro):
            return " "
        if art and art in _plano(dentro):
            return " "
        return m.group(0)
    t = re.sub(r"\(([^()]*)\)", poda, t)
    t = re.sub(r"\[[^\]]*\]", " ", t)

    # De los tramos separados por guion, el primero que no sea ruido ni el
    # nombre del artista. "HASTA EL FINAL - ESTACION CERO - MUSICA CATOLICA"
    # deja "HASTA EL FINAL".
    tramos = [x.strip() for x in re.split(r"\s+-\s+|\s+–\s+", t) if x.strip()]
    elegido = ""
    for tr in tramos:
        limpio = NUMERO_PISTA.sub("", tr).strip()
        if not limpio:
            continue
        if RUIDO_TRAMO.match(limpio):
            continue
        if art and _plano(limpio) == art:
            continue
        elegido = limpio
        break
    if not elegido:
        elegido = NUMERO_PISTA.sub("", t).strip()

    elegido = FEAT.sub("", elegido)
    elegido = re.sub(r"\s{2,}", " ", elegido).strip(" -–,")
    return _titular(elegido) or (titulo or "").strip()


def limpiar_nombres(titulo, artista):
    """Devuelve (titulo, artista) listos para enseñar."""
    a = limpiar_artista(artista, titulo)
    return limpiar_titulo(titulo, artista), a
