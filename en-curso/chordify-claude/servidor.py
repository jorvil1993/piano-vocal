#!/usr/bin/env python3
"""Sirve el panel y guarda las correcciones de acordes y letra.

    python servidor.py     ->  http://localhost:8300
"""
import http.server
import json
import os
import socket
import secrets
import socketserver
import threading
import sys
import ssl
import time
import urllib.parse
from datetime import datetime

RAIZ = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(RAIZ, "app")
CANCIONES = os.path.join(RAIZ, "canciones")
PUERTO = 8300
PUERTO_SEGURO = 8443
CERT = os.path.join(RAIZ, "cert", "cert.pem")
CLAVE_TLS = os.path.join(RAIZ, "cert", "clave.pem")

# Clave de escritura: se genera sola la primera vez y queda en un archivo.
# Sin ella, cualquiera en la misma red Wi-Fi podria sobrescribir las
# correcciones hechas a mano. Leer no pide clave; escribir si.
ARCHIVO_CLAVE = os.path.join(RAIZ, ".clave")
ARCHIVO_PRACTICA = os.path.join(RAIZ, "practica.json")
SESIONES_MIDI = os.path.join(RAIZ, "sesiones-midi")

# ---------------------------------------------------------------- MIDI
#
# El servidor escucha el piano en un hilo aparte. Grabar es un boton en la
# pagina, no un comando: la herramienta tiene que servir a una persona, no
# pedirle que se comporte como una maquina.

GRABACION = {"activa": False, "eventos": [], "inicio": None,
             "puerto": None, "cancion": None, "hilo": None, "parar": None}


def puertos_midi():
    try:
        import mido
        return list(mido.get_input_names())
    except Exception as e:
        print("MIDI no disponible: %s" % e)
        return []


def _bucle_midi(puerto, parar):
    import mido
    try:
        with mido.open_input(puerto) as entrada:
            while not parar.is_set():
                for msg in entrada.iter_pending():
                    if msg.type not in ("note_on", "note_off"):
                        continue
                    GRABACION["eventos"].append({
                        "t": round(time.time() - GRABACION["inicio"], 4),
                        "nota": msg.note,
                        "vel": msg.velocity,
                        "on": msg.type == "note_on" and msg.velocity > 0,
                    })
                parar.wait(0.005)
    except Exception as e:
        print("se corto la escucha MIDI: %s" % e)


def iniciar_grabacion(puerto=None, cancion=None):
    if GRABACION["activa"]:
        return {"error": "ya hay una grabacion en curso"}
    disponibles = puertos_midi()
    if not disponibles:
        return {"error": "no se detecta ningun piano conectado"}

    elegido = puerto if puerto in disponibles else disponibles[0]
    GRABACION.update({"activa": True, "eventos": [], "inicio": time.time(),
                      "puerto": elegido, "cancion": cancion,
                      "parar": threading.Event()})
    GRABACION["hilo"] = threading.Thread(
        target=_bucle_midi, args=(elegido, GRABACION["parar"]), daemon=True)
    GRABACION["hilo"].start()
    print("grabando MIDI desde %s" % elegido)
    return {"ok": True, "puerto": elegido}


def parar_grabacion():
    if not GRABACION["activa"]:
        return {"error": "no hay grabacion en curso"}
    GRABACION["parar"].set()
    if GRABACION["hilo"]:
        GRABACION["hilo"].join(timeout=2)
    GRABACION["activa"] = False

    eventos = GRABACION["eventos"]
    if not eventos:
        return {"ok": True, "notas": 0, "aviso": "no se registro ninguna nota"}

    os.makedirs(SESIONES_MIDI, exist_ok=True)
    marca = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    destino = os.path.join(SESIONES_MIDI, "sesion_%s.json" % marca)
    with open(destino, "w", encoding="utf-8") as f:
        json.dump({
            "fecha": datetime.now().isoformat(timespec="seconds"),
            "puerto": GRABACION["puerto"],
            "cancion": GRABACION["cancion"],
            "duracion": round(eventos[-1]["t"], 2),
            "eventos": eventos,
        }, f, ensure_ascii=False)

    notas = sum(1 for e in eventos if e["on"])
    print("sesion guardada: %s (%d notas)" % (os.path.basename(destino), notas))
    return {"ok": True, "archivo": os.path.basename(destino),
            "notas": notas, "duracion": round(eventos[-1]["t"], 1)}


def estado_grabacion():
    return {
        "activa": GRABACION["activa"],
        "puertos": puertos_midi(),
        "notas": sum(1 for e in GRABACION["eventos"] if e["on"]),
        "segundos": round(time.time() - GRABACION["inicio"], 1)
        if GRABACION["activa"] and GRABACION["inicio"] else 0,
    }


def clave_de_escritura():
    if os.path.exists(ARCHIVO_CLAVE):
        with open(ARCHIVO_CLAVE, encoding="utf-8") as f:
            valor = f.read().strip()
        if valor:
            return valor
    valor = secrets.token_urlsafe(18)
    with open(ARCHIVO_CLAVE, "w", encoding="utf-8") as f:
        f.write(valor)
    return valor


CLAVE = None

for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def leer_practica():
    """Bitacora de practica. Nunca se borra nada: un dia hecho queda hecho."""
    if not os.path.exists(ARCHIVO_PRACTICA):
        return {"sesiones": [], "dominio": {}, "lecciones": []}
    try:
        with open(ARCHIVO_PRACTICA, encoding="utf-8") as f:
            d = json.load(f)
        d.setdefault("sesiones", [])
        d.setdefault("dominio", {})
        d.setdefault("lecciones", [])
        return d
    except Exception as e:
        print("no se pudo leer la bitacora: %s" % e)
        return {"sesiones": [], "dominio": {}, "lecciones": []}


def guardar_practica(datos):
    with open(ARCHIVO_PRACTICA, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)


def listar_canciones():
    salida = []
    if not os.path.isdir(CANCIONES):
        return salida
    for slug in sorted(os.listdir(CANCIONES)):
        ruta = os.path.join(CANCIONES, slug, "cancion.json")
        if not os.path.exists(ruta):
            continue
        try:
            with open(ruta, encoding="utf-8") as f:
                c = json.load(f)
            salida.append({
                "id": c.get("id", slug),
                "titulo": c.get("titulo", slug),
                "artista": c.get("artista", ""),
                "tonalidad": c.get("tonalidad", {}).get("nombre", ""),
                "tempo": c.get("tempo"),
                "duracion": c.get("duracion"),
                "acordes": len(c.get("acordes", [])),
                "editados": sum(1 for a in c.get("acordes", []) if a.get("editado")),
            })
        except Exception as e:
            print("no se pudo leer %s: %s" % (ruta, e))
    return salida


def acordes_de_todas():
    """Solo la secuencia de acordes de cada cancion, sin letra ni notas.

    El entrenador global necesita saber que acordes existen en toda la
    biblioteca. Bajar los cancion.json enteros son 870 KB para cinco
    canciones (y crece con el piano transcrito); asi son 27 KB. Se manda
    la etiqueta cruda y el cliente la simplifica con las mismas funciones
    que usa la hoja de cifrado: el criterio de "sencillo" vive en un solo
    sitio, en cifrado.js.
    """
    salida = []
    if not os.path.isdir(CANCIONES):
        return salida
    for slug in sorted(os.listdir(CANCIONES)):
        ruta = os.path.join(CANCIONES, slug, "cancion.json")
        if not os.path.exists(ruta):
            continue
        try:
            with open(ruta, encoding="utf-8") as f:
                c = json.load(f)
            salida.append({
                "id": c.get("id", slug),
                "titulo": c.get("titulo", slug),
                "acordes": [
                    {"etiqueta": a.get("etiqueta"), "anglo": a.get("anglo"),
                     "latino": a.get("latino")}
                    for a in c.get("acordes", []) if a.get("anglo")
                ],
            })
        except Exception as e:
            print("no se pudo leer %s: %s" % (ruta, e))
    return salida


class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.0 cierra la conexion despues de CADA respuesta. Cargar una
    # cancion son seis mp3 y un monton de peticiones por rango: con
    # keep-alive se reutiliza la conexion en vez de abrir una nueva cada vez.
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=APP, **kwargs)

    def log_message(self, formato, *args):
        pass  # sin ruido en consola

    def end_headers(self):
        if getattr(self, "_cachear", False):
            # El audio de una cancion no cambia nunca. Con no-store el
            # navegador volvia a bajarse los 32 MB cada vez que volvias a
            # ella; por wifi eso son los segundos de espera en los que
            # parecia que se habia quedado colgado.
            self.send_header("Cache-Control",
                             "public, max-age=31536000, immutable")
        else:
            # El JSON si cambia: se editan acordes y se guardan
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, datos, codigo=200):
        cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        self._cachear = False       # se reusa la instancia con keep-alive
        ruta = urllib.parse.urlparse(self.path).path

        if ruta == "/api/clave":
            return self._json({"clave": CLAVE})

        if ruta == "/api/practica":
            return self._json(leer_practica())

        if ruta == "/api/midi/estado":
            return self._json(estado_grabacion())

        if ruta == "/api/canciones":
            return self._json(listar_canciones())

        if ruta == "/api/acordes":
            return self._json(acordes_de_todas())

        if ruta.startswith("/canciones/"):
            relativa = urllib.parse.unquote(ruta[len("/canciones/"):])
            destino = os.path.normpath(os.path.join(CANCIONES, relativa))
            # No salir de la carpeta de canciones
            if not destino.startswith(os.path.normpath(CANCIONES)):
                return self._json({"error": "ruta invalida"}, 403)
            if not os.path.isfile(destino):
                return self._json({"error": "no existe"}, 404)
            return self._enviar_archivo(destino)

        return super().do_GET()

    def _enviar_archivo(self, destino):
        tipos = {".mp3": "audio/mpeg", ".json": "application/json; charset=utf-8",
                 ".wav": "audio/wav"}
        ext = os.path.splitext(destino)[1]
        tipo = tipos.get(ext, "application/octet-stream")
        self._cachear = ext in (".mp3", ".wav")
        tam = os.path.getsize(destino)
        rango = self.headers.get("Range")

        # El audio necesita Range para poder saltar sin descargar todo
        if rango and rango.startswith("bytes="):
            ini, _, fin = rango[6:].partition("-")
            ini = int(ini) if ini else 0
            fin = int(fin) if fin else tam - 1
            fin = min(fin, tam - 1)
            largo = max(0, fin - ini + 1)
            self.send_response(206)
            self.send_header("Content-Type", tipo)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", "bytes %d-%d/%d" % (ini, fin, tam))
            self.send_header("Content-Length", str(largo))
            self.end_headers()
            with open(destino, "rb") as f:
                f.seek(ini)
                self._volcar(f, largo)
            return

        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(tam))
        self.end_headers()
        with open(destino, "rb") as f:
            self._volcar(f, tam)

    # A trozos: el navegador empieza a recibir antes y no se cargan seis
    # ficheros enteros en memoria a la vez
    def _volcar(self, f, largo, trozo=256 * 1024):
        while largo > 0:
            datos = f.read(min(trozo, largo))
            if not datos:
                break
            self.wfile.write(datos)
            largo -= len(datos)

    def do_POST(self):
        self._cachear = False       # se reusa la instancia con keep-alive
        ruta = urllib.parse.urlparse(self.path).path

        if ruta == "/api/midi/grabar":
            if self.headers.get("X-Clave") != CLAVE:
                return self._json({"error": "clave incorrecta"}, 403)
            largo = int(self.headers.get("Content-Length", 0))
            cuerpo = {}
            if largo:
                try:
                    cuerpo = json.loads(self.rfile.read(largo).decode("utf-8"))
                except Exception:
                    cuerpo = {}
            return self._json(iniciar_grabacion(cancion=cuerpo.get("cancion")))

        if ruta == "/api/midi/parar":
            if self.headers.get("X-Clave") != CLAVE:
                return self._json({"error": "clave incorrecta"}, 403)
            return self._json(parar_grabacion())

        if ruta == "/api/practica":
            if self.headers.get("X-Clave") != CLAVE:
                return self._json({"error": "clave incorrecta"}, 403)
            largo = int(self.headers.get("Content-Length", 0))
            try:
                sesion = json.loads(self.rfile.read(largo).decode("utf-8"))
            except Exception as e:
                return self._json({"error": "json invalido: %s" % e}, 400)

            datos = leer_practica()
            # Una sesion por dia: si ya existe, se suma en vez de duplicar
            hoy = sesion.get("fecha")
            previa = next((s for s in datos["sesiones"] if s.get("fecha") == hoy), None)
            if previa:
                previa["minutos"] = previa.get("minutos", 0) + sesion.get("minutos", 0)
                # Lecciones completadas: se guardan una sola vez
            lec = sesion.get("leccion")
            if lec and lec not in datos["lecciones"]:
                datos["lecciones"].append(lec)

            for e in sesion.get("ejercicios", []):
                    if e not in previa.setdefault("ejercicios", []):
                        previa["ejercicios"].append(e)
            else:
                datos["sesiones"].append(sesion)

            # Lecciones completadas: se guardan una sola vez
            lec = sesion.get("leccion")
            if lec and lec not in datos["lecciones"]:
                datos["lecciones"].append(lec)

            for e in sesion.get("ejercicios", []):
                d = datos["dominio"].setdefault(e, {"veces": 0, "ultimo": None})
                d["veces"] += 1
                d["ultimo"] = hoy

            guardar_practica(datos)
            print("practica: %s (+%d min, %s)" % (hoy, sesion.get("minutos", 0),
                                                  ",".join(sesion.get("ejercicios", []))))
            return self._json({"ok": True, "dias": len(datos["sesiones"])})

        if not ruta.startswith("/api/guardar/"):
            return self._json({"error": "ruta desconocida"}, 404)

        slug = urllib.parse.unquote(ruta[len("/api/guardar/"):]).strip("/")
        carpeta = os.path.normpath(os.path.join(CANCIONES, slug))
        if not carpeta.startswith(os.path.normpath(CANCIONES)) or not os.path.isdir(carpeta):
            return self._json({"error": "cancion no encontrada"}, 404)

        if self.headers.get("X-Clave") != CLAVE:
            return self._json({"error": "clave incorrecta"}, 403)

        largo = int(self.headers.get("Content-Length", 0))
        try:
            datos = json.loads(self.rfile.read(largo).decode("utf-8"))
        except Exception as e:
            return self._json({"error": "json invalido: %s" % e}, 400)

        destino = os.path.join(carpeta, "cancion.json")
        # Copia de seguridad antes de pisar: las correcciones a mano
        # son trabajo que no se puede rehacer solo
        if os.path.exists(destino):
            respaldo = os.path.join(carpeta, "cancion.respaldo.json")
            with open(destino, encoding="utf-8") as f:
                previo = f.read()
            with open(respaldo, "w", encoding="utf-8") as f:
                f.write(previo)

        with open(destino, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=1)

        editados = sum(1 for a in datos.get("acordes", []) if a.get("editado"))
        print("guardado %s (%d acordes corregidos)" % (slug, editados))
        return self._json({"ok": True, "editados": editados})


if __name__ == "__main__":
    CLAVE = clave_de_escritura()
    canciones = listar_canciones()
    print("=" * 62)
    print(" CHORDIFY CLAUDE - panel de acordes")
    print("=" * 62)
    print("\n  En esta computadora:  http://localhost:%d" % PUERTO)
    print("  En el celular:        http://%s:%d\n" % (ip_local(), PUERTO))
    if canciones:
        for c in canciones:
            print("  - %s (%s, %s)" % (c["titulo"][:48], c["tonalidad"], c["id"]))
    else:
        print("  (todavia no hay canciones: corre procesar.py con un link)")
    print("\n  Ctrl+C para detener.\n")

    socketserver.ThreadingTCPServer.allow_reuse_address = True

    # HTTPS ademas del HTTP normal. No es por seguridad: la API que impide
    # que la pantalla se apague SOLO existe en conexiones seguras, y en el
    # celular por http:// el navegador ni siquiera la ofrece.
    seguro = None
    if os.path.exists(CERT) and os.path.exists(CLAVE_TLS):
        try:
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ctx.load_cert_chain(CERT, CLAVE_TLS)
            seguro = socketserver.ThreadingTCPServer(("", PUERTO_SEGURO), Handler)
            seguro.socket = ctx.wrap_socket(seguro.socket, server_side=True)
            threading.Thread(target=seguro.serve_forever, daemon=True).start()
            print("  PARA QUE LA PANTALLA NO SE APAGUE, entra por:")
            print("     https://%s:%d" % (ip_local(), PUERTO_SEGURO))
            print("  La primera vez el navegador avisa que el certificado no")
            print("  es de confianza: es normal, esta firmado aqui mismo.")
            print("  Toca 'Configuracion avanzada' y 'Continuar'. Una sola vez.\n")
        except Exception as e:
            print("  (sin HTTPS: %s)\n" % e)
    else:
        print("  (sin HTTPS: falta el certificado en cert/)\n")

    with socketserver.ThreadingTCPServer(("", PUERTO), Handler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
            if seguro:
                seguro.shutdown()
