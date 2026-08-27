#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os
import sys
import mimetypes
import re

# Asegurar codificación UTF-8 en consola de Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')

class RangeHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    """
    Servidor HTTP de alto rendimiento con soporte nativo de HTTP 206 Partial Content (Range).
    Esto es ESENCIAL para que el navegador y celular puedan saltar (seek) en el audio
    sin que se resetee la canción ni se interrumpa la conexión.
    """
    def do_GET(self):
        # Normalizar ruta
        path = self.path.split('?')[0].split('#')[0]
        if path == '/' or path == '':
            path = '/index.html'

        # Limpiar ruta para evitar directory traversal
        rel_path = os.path.normpath(path.lstrip('/')).replace('\\', '/')
        file_path = os.path.join(DIRECTORY, rel_path)

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.send_error(404, "Archivo no encontrado")
            return

        file_size = os.path.getsize(file_path)
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            if file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.mp3'):
                content_type = 'audio/mpeg'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            else:
                content_type = 'application/octet-stream'

        # Comprobar si el navegador pide un fragmento del archivo (Range)
        range_header = self.headers.get('Range')
        if range_header:
            range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                if start >= file_size:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    return
                end = min(end, file_size - 1)
                length = end - start + 1

                self.send_response(206)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                self.send_header('Content-Length', str(length))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'public, max-age=3600')
                self.end_headers()

                try:
                    with open(file_path, 'rb') as f:
                        f.seek(start)
                        remaining = length
                        while remaining > 0:
                            chunk_size = min(remaining, 64 * 1024)
                            chunk = f.read(chunk_size)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            remaining -= len(chunk)
                except (ConnectionResetError, BrokenPipeError):
                    # El usuario cambió rápidamente de compás, comportamiento normal
                    pass
                return

        # Respuesta estándar HTTP 200
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(file_size))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()

        try:
            with open(file_path, 'rb') as f:
                while True:
                    chunk = f.read(64 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except (ConnectionResetError, BrokenPipeError):
            pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # Silenciar logs innecesarios para mantener la consola limpia
        pass

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    local_ip = get_local_ip()
    url = f"http://{local_ip}:{PORT}"
    local_url = f"http://127.0.0.1:{PORT}"

    print("=" * 60)
    print(" 🎹 PIANOVOCAL COMPANION - SERVIDOR ACTIVO")
    print("=" * 60)
    print(f"\n📱 En tu celular (misma red Wi-Fi): {url}")
    print(f"💻 En esta computadora:           {local_url}")
    print(f"💻 Con localhost:                 http://localhost:{PORT}\n")
    print("Escanea este código QR con la cámara de tu celular:")
    print("-" * 60)

    try:
        import qrcode
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
    except Exception as e:
        print(f"Abre directamente: {url}")

    print("-" * 60)
    print("✓ Soporte HTTP 206 Range (Seeking fluido en audio)")
    print("✓ Conexiones multihilo activas")
    print("Presiona Ctrl + C para detener el servidor.\n")

    # Escuchar en 0.0.0.0 (todas las interfaces de red)
    with ThreadedTCPServer(("0.0.0.0", PORT), RangeHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
