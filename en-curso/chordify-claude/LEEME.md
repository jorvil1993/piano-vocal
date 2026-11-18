# Chordify Claude — acordes y letra desde un link de YouTube

Le pasas un link, te devuelve los acordes con su tiempo real, la letra
sincronizada y un panel para ensayar. Lo que el detector saque mal, lo
corriges en el panel y la corrección queda guardada.

## Añadir una canción — los dos pasos, siempre

```
python procesar.py "https://www.youtube.com/watch?v=..."
python revisar.py                # <- NO te la saltes
python servidor.py
```

**`procesar.py` termina sin quejarse aunque haya salido mal.** Ha pasado:
transcripciones que se dejaron media canción y tempos detectados al doble.
Nada de eso se ve en el log, hay que medirlo. Eso es `revisar.py`, y lo que
diga es el veredicto:

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| `faltan N s de canto por transcribir` | Whisper se saltó parte, casi siempre una estrofa que entra floja | `python reletra.py <slug>` |
| `tempo ambiguo` | El tempo y su mitad (o doble) encajan **igual de bien** con los acordes. El dato no lo decide | Oírla y mirar si los puntos 1-2-3-4 van al ritmo que contarías tocando |
| `la rejilla de pulsos va irregular` | El detector de pulso perdió el hilo en algún tramo; los puntos del compás pueden bailar ahí |  Comprobar en el atril; si molesta, reprocesar |
| `casi no hay palabras con tiempo` | Sin tiempos por palabra la hoja de cifrado no puede poner cada acorde sobre su sílaba | `python reletra.py <slug>` |

Una canción instrumental no se revisa la letra: el programa lo detecta solo
comparando la voz aislada con la mezcla.

Y abres `http://localhost:8300` (o la IP que imprime, desde el celular en
la misma red Wi-Fi).

Opciones útiles:

| Comando | Para qué |
|---|---|
| `python procesar.py <url> --sin-letra` | Solo acordes, sin Whisper (mucho más rápido) |
| `python procesar.py <url> --modelo medium` | Whisper más liviano si `large-v3` tarda |
| `python reletra.py <slug>` | Rehace solo la letra, sin repetir demucs ni acordes |
| `python revisar.py <slug>` | Revisa una sola canción en vez de todas |
| `python tono.py <slug> +2` | Deja el audio dos semitonos arriba (el panel lo hace solo) |
| `python tono.py --peso` | Cuánto ocupa el caché de tonos |
| `python tono.py --borrar` | Lo tira entero |

## Subir y bajar el tono

Los botones **− / 0 / +** de la barra de arriba (teclas **+** y **−**) suben
o bajan la canción **entera**: los nombres de los acordes *y el audio*.

Que se muevan las dos cosas a la vez es todo el asunto. Transportar solo los
nombres te haría tocar Fa mientras suena Mi, y mirando la pantalla no habría
forma de notarlo. Por eso, **si el audio no se puede transportar, los acordes
tampoco se mueven**: el panel avisa y se queda como estaba.

El audio lo cambia ffmpeg con `librubberband`, que mueve el tono **dejando la
duración intacta**. Eso es lo que evita resincronizar nada: medido sobre
Destrúyeme a −1, las seis pistas dan 236.040 s antes y 236.040 s después,
deriva 0.000 s. Los tiempos de acordes, letra y pulsos siguen valiendo, y
**el `cancion.json` no se toca**: si corriges un acorde con la canción
transportada, se guarda en el tono del disco.

A la voz se le aplica `formant=preserved`; sin eso, subida dos semitonos,
suena a ardilla.

- La primera vez que pides un tono son ~13 segundos (seis pistas, cuatro a la
  vez). Después es instantáneo: queda en caché.
- El caché **no** va junto a la canción: va a `%LOCALAPPDATA%\chordify-claude\tonos`,
  **fuera de OneDrive**. Son 17 MB por tono y por canción —doce tonos por
  veintinueve canciones serían 6 GB— y todo se rehace en trece segundos.
- El tono se recuerda **por canción**: si dejaste Destrúyeme en −1, vuelve
  en −1. Toca el número para volver al del disco.
- El límite es ±6 semitonos: a +7 estás más cerca bajando 5.

## Qué hace cada archivo

- **`procesar.py`** — el pipeline: descarga → separa voz → detecta acordes → transcribe.
- **`analisis.py`** — el motor musical: pulso, tonalidad y acordes.
- **`servidor.py`** — sirve el panel y guarda las correcciones.
- **`reletra.py`** — reprocesa solo la transcripción.
- **`revisar.py`** — mide si una canción salió bien; se pasa después de procesar.
- **`tono.py`** — sube o baja el audio sin cambiar la velocidad (rubberband).
- **`app/`** — el panel (HTML, CSS, JS).
- **`canciones/<slug>/`** — audio, stems y `cancion.json` de cada canción.

## La consola de 6 pistas

Con el modelo `htdemucs_6s`, cada canción se separa en **voz, batería,
bajo, guitarra, piano y resto**. En el panel tienes un canal por pista con
su deslizador, **M** (silenciar) y **S** (solo), más tres presets: **Banda**,
**Solo voz** y **Voz baja + ritmo**.

Las teclas **1 a 6** activan el solo de cada pista, como en una consola real.

**Guitarra acústica y eléctrica no se separan.** Las dos caen juntas en el
stem `guitarra`: ningún modelo público las distingue, porque la diferencia
entre ambas es de timbre, no de contenido separable como sí lo son la voz
o la batería. El stem de piano también es el más flojo de los seis — es el
que peor entrenado está en el modelo. Júzgalo por oído.

Si prefieres el modelo de 4 pistas (más rápido y con stems más limpios),
cambia `MODELO_DEMUCS` en `procesar.py` a `"htdemucs"` y quita `guitar` y
`piano` de `STEMS` y `ARMONICOS`.

Pero las pistas no son solo para mezclar: **cada análisis usa la entrada
que le conviene.**

| Análisis | Entrada | Por qué |
|---|---|---|
| Acordes | bajo + guitarra + piano + resto | La percusión es ruido de banda ancha que ensucia el cromagrama |
| Pulso | batería + bajo | Sin armonía ni voz el detector no duda entre el tempo y su doble |
| Letra | voz | Sin instrumentos encima, Whisper acierta mucho más |

Esto último se midió, no se supuso. Sobre esta canción:

| Entrada del pulso | `start_bpm=120` | `start_bpm=80` |
|---|---|---|
| Mezcla completa | 143.55 ✗ | 69.84 ✓ |
| Batería + bajo | 69.84 ✓ | 69.84 ✓ |

Con la mezcla completa el resultado depende de adivinarle el valor inicial.
Sobre la percusión acierta siempre. Por eso el pipeline arma dos mezclas
auxiliares (`_armonico.wav` y `_ritmo.wav`), las usa y las borra.

## Cómo funciona la sincronía

**No hay ningún BPM del que se calculen posiciones.** El detector mide
dónde cae cada pulso y guarda el tiempo real de cada acorde en
`cancion.json`. El panel busca por tiempo (búsqueda binaria) contra el
reloj del audio, así que no se puede desfasar por acumulación.

El BPM que se muestra es informativo, no se usa para posicionar nada.

## Precisión esperada

| Qué | Cómo sale |
|---|---|
| Tonalidad y tempo | Muy confiable |
| Acordes mayores y menores | Bien, ~80-85% |
| sus4, dim, séptimas | Ahí es donde falla; se corrigen a mano |
| Letra | ~90%, con tiempos por palabra |
| Intros sin tempo fijo | El pulso va estimado (`"estimado": true`) |

Por eso existe el modo **Corregir**: el detector te deja el 80% hecho y
tú arreglas por oído lo que importa. Cada corrección queda marcada con
`"editado": true` y **`reletra.py` no la pisa**.

## El panel

- **Espacio** reproduce/pausa, **←/→** saltan 5 s, **Ctrl+S** guarda.
- Teclas 1-4: solo de voz, batería, bajo y resto. Presets arriba de la consola.
- **Do Re Mi / C D E** cambia la notación.
- **+** y **−** suben y bajan el tono de la canción entera, audio incluido.
- **Corregir**: toca un acorde para abrir la paleta, o una línea para editar el texto.

Antes de sobrescribir, el servidor deja una copia en `cancion.respaldo.json`.

## Requisitos

Python 3.12, ffmpeg y yt-dlp en el PATH, y estos paquetes:

```
pip install librosa soundfile demucs
pip install --index-url https://download.pytorch.org/whl/cu130 torch torchaudio
pip install --no-deps openai-whisper && pip install tiktoken more-itertools tqdm
```

**Ojo con torch:** si instalas `openai-whisper` con sus dependencias, pip
reemplaza torch por la versión CPU y la GPU deja de usarse. Por eso va con
`--no-deps`. Para verificar:

```
python -c "import torch; print(torch.cuda.is_available())"
```

Sin GPU funciona igual, pero cada canción pasa de ~2 minutos a media hora.
