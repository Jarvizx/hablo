# Hablo

**Escucha las respuestas de Claude Code en voz alta, en tu idioma.**

[Read in English](README.md)

Hablo es un plugin para Claude Code que lee las respuestas en voz alta: para descansar la vista, para escuchar mientras miras el código o para practicar un idioma que estás aprendiendo. Pone un botón **Escuchar** debajo de cada respuesta, añade el comando `/hablo` y elige una voz natural según el idioma de cada respuesta. Usa las voces que vienen con macOS y con Windows: gratis, sin conexión y sin claves de API.

## Instalación

En el prompt de Claude Code:

```
/plugin install hablo --marketplace Jarvizx/hablo
```

Responde `y` para añadir el marketplace y elige el ámbito (user por defecto). No hay nada que configurar.

**Requisitos:** Claude Code 2.1.287 o posterior, en macOS o Windows.

## Uso

- **`[ ⏵ Escuchar ]` debajo de cada respuesta:** púlsalo para escucharla. Mientras lee, la fila muestra `✻ Leyendo…  [ ■ Parar ]`. El botón aparece en el modo de pantalla completa de Claude Code (actívalo con `/tui fullscreen`) y en la app de escritorio.
- **`/hablo`:** lee el texto que hayas seleccionado con el ratón o la última respuesta. Si lo vuelves a lanzar, para, aunque Claude esté trabajando. No escribe nada en la conversación, así el contexto de Claude queda limpio.

| Comando | Qué hace |
| --- | --- |
| `/hablo` | Lee la selección o la última respuesta. Si ya está leyendo, para. |
| `/hablo parar` | Para la lectura. |
| `/hablo <texto>` | Lee ese texto. |
| `/hablo voces` | Muestra la voz de cada idioma y tus ajustes. |

Hablo detecta español, inglés, portugués, francés, alemán e italiano, y al leer se salta los bloques de código, los enlaces y los símbolos de markdown.

## Ajustes

Funciona sin configurar nada. Para cambiarlo:

| Comando | Qué hace |
| --- | --- |
| `/hablo velocidad 220` | Palabras por minuto, hasta 500. `0` vuelve a la velocidad del sistema. |
| `/hablo voz es Mónica` | La voz de un idioma. `/hablo voz es` vuelve a la automática. |
| `/hablo auto sí` | Lee cada respuesta en cuanto Claude termina. `no` lo desactiva. |

También funcionan en inglés: `stop`, `voices`, `rate`, `voice`, y `on` u `off` después de `auto`. Los ajustes se guardan en tu equipo para todas las sesiones.

**Voces mejores:** macOS tiene voces **Enhanced** y **Premium** gratuitas que suenan mucho más naturales. Descárgalas en **Ajustes del Sistema › Accesibilidad › Contenido leído › Voz del sistema › Gestionar voces**, y Hablo las prefiere automáticamente. En Windows, añade idiomas en **Configuración › Hora e idioma › Voz**.

## Compatibilidad

| Dónde | Estado |
| --- | --- |
| macOS, terminal | ✅ Probado |
| Windows, terminal | ✅ Probado en Windows 11 |
| VS Code, terminal integrada | ✅ Probado |
| App de escritorio (pestaña Code) | ⚠️ La API de mods dibuja ahí y los tests lo cubren, pero aún no se ha probado a mano |
| Extensión de VS Code, panel de chat | ⚠️ Sin botón: Claude Code no dibuja nada de los mods ahí. `/hablo` está sin probar |
| Linux | ⚠️ Usa el sintetizador que encuentre Claude Code, sin elegir voz ni parar. Sin probar, se busca ayuda |
| SSH, VS Code Remote, contenedores | ❌ El sonido sale en la máquina donde corre Claude Code, no en la tuya |

Hablo es un [mod](https://code.claude.com/docs/en/plugins/mods/overview), un plugin de function hooks, probado en Claude Code 2.1.292. La API de mods aún puede cambiar entre versiones.

## Qué ejecuta Hablo y qué datos usa

Hablo no usa la red y no envía nada a ningún sitio. La voz la genera tu sistema operativo en tu equipo.

| Qué | Cuándo | Para qué |
| --- | --- | --- |
| `say -v '?'` | Una vez por sesión, en macOS | Lista las voces instaladas en tu Mac |
| `/bin/sh -c 'echo $$; exec say …'`, con el texto por la entrada estándar | En cada lectura, en macOS | Lee el texto e imprime el id del proceso para poder pararlo |
| `kill <pid>` | Al parar una lectura, en macOS | Termina ese proceso `say` |
| `powershell.exe` con `System.Speech` | Una vez por sesión y en cada lectura, en Windows | Lista las voces de Windows y lee el texto, que recibe en base64 por la entrada estándar |
| `taskkill /PID <pid> /F` | Al parar una lectura, en Windows | Termina ese proceso de PowerShell |

Lee:

- **El texto de una respuesta, o el que hayas seleccionado,** solo para leerlo en voz alta.
- **Las variables de entorno `LC_ALL`, `LC_MESSAGES` y `LANG`,** para mostrar sus mensajes en inglés o en español, y **`OS`**, para reconocer Windows.

Guarda la última respuesta en la memoria de la sesión, para `/hablo`. En disco solo guarda tus ajustes (velocidad, una voz por idioma y `auto`), en su propio archivo bajo `~/.claude/plugins/store/`.

## Contribuir

Los issues y pull requests son bienvenidos, sobre todo idiomas nuevos y soporte para Linux. Empieza por [CONTRIBUTING.md](CONTRIBUTING.md), que también explica cómo funciona Hablo, y el [roadmap](ROADMAP.md). Puedes escribir en español o en inglés.

## Licencia

[MIT](LICENSE) © Robin Buitrago

Hablo es un proyecto independiente. No está afiliado, respaldado ni patrocinado por Anthropic. Claude y Claude Code son marcas de Anthropic.
