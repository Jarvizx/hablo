# Hablo

**Escucha las respuestas de Claude Code en voz alta, en tu idioma.**

[Read in English](README.md)

Hablo es un plugin para Claude Code que lee las respuestas en voz alta. Pone un botón **Escuchar** debajo de cada respuesta, añade el comando `/speak` y elige una voz natural según el idioma de cada respuesta. Usa las voces que vienen con macOS: gratis, sin conexión y sin claves de API.

## Para qué

- Descansar la vista y escuchar una respuesta larga mientras miras el código.
- Baja visión, dislexia o, simplemente, preferir escuchar.
- Practicar la comprensión oral de un idioma que estás aprendiendo.

## Funciones

- **`[ ⏵ Escuchar ]` debajo de cada respuesta:** púlsalo para escucharla. Mientras lee, se convierte en `[ ⏹ Parar ]`.
- **`/speak`:** lee el texto que hayas seleccionado con el ratón o, si no hay selección, la última respuesta. Si lo vuelves a lanzar, para.
- **Tu idioma:** detecta español, inglés, portugués, francés, alemán e italiano, y usa una voz natural instalada en tu Mac para cada uno.
- **Texto limpio:** quita bloques de código, enlaces, tablas y símbolos de markdown antes de leer.
- **Privado:** nada sale de tu equipo. Mira [qué ejecuta Hablo](#qué-ejecuta-hablo-y-qué-datos-usa).

## Instalación

En el prompt de Claude Code:

```
/plugin install hablo --marketplace Jarvizx/hablo
```

Responde `y` para añadir el marketplace y elige el ámbito (user por defecto).

## Uso

| Comando | Qué hace |
| --- | --- |
| `/speak` | Lee la selección o la última respuesta. Si ya está leyendo, para. |
| `/speak parar` | Para la lectura. |
| `/speak voces` | Muestra la voz de cada idioma. |
| `/speak <texto>` | Lee ese texto. Útil para probar una voz. |

También funcionan en inglés: `stop`, `voices`.

El botón Escuchar aparece donde Claude Code permite hacer clic: el modo de pantalla completa de la terminal y la app de escritorio. En los demás casos, usa `/speak`.

## Ajustes

Se cambian en `/config`, en Hablo:

| Ajuste | Por defecto | Descripción |
| --- | --- | --- |
| `rate` | `0` | Palabras por minuto, hasta 500. `0` usa la velocidad del sistema. |
| `voices` | vacío | Una voz por idioma, por ejemplo `es=Mónica, en=Daniel`. Vacío elige una automáticamente. |
| `autoRead` | `false` | Lee cada respuesta en cuanto Claude termina. |

Para escuchar una voz antes de elegirla, ejecuta `say -v Mónica "Hola"` en una terminal, y `say -v '?'` para verlas todas.

### Voces mejores

macOS tiene voces **Enhanced** y **Premium** gratuitas que suenan mucho más naturales que las básicas. Descárgalas en **Ajustes del Sistema › Accesibilidad › Contenido leído › Voz del sistema › Gestionar voces**. Hablo las prefiere automáticamente.

## Compatibilidad

| Dónde | Estado |
| --- | --- |
| macOS, terminal y app de escritorio | ✅ Soportado |
| Extensión de VS Code | ⚠️ El botón pasa el kit de tests, sin probar en un VS Code real |
| Linux, Windows | ⚠️ Usa el sintetizador del sistema que encuentre Claude Code, sin elegir voz ni parar. Sin probar. Se busca ayuda, mira el [roadmap](ROADMAP.md) |
| SSH, VS Code Remote, contenedores | ❌ El sonido sale en la máquina donde corre Claude Code, no en la tuya |

Hablo es un [mod](https://code.claude.com/docs/en/plugins/mods/overview): un plugin de function hooks. Esa API está en acceso anticipado y puede cambiar entre versiones de Claude Code. Hablo está probado en Claude Code 2.1.292.

## Qué ejecuta Hablo y qué datos usa

Hablo no usa la red y no envía nada a ningún sitio. La voz la genera macOS en tu equipo.

| Qué | Cuándo | Para qué |
| --- | --- | --- |
| `say -v '?'` | Una vez por sesión, la primera vez que lee | Lista las voces instaladas en tu Mac |
| `/bin/sh -c 'echo $$; exec say …'`, con el texto por la entrada estándar | Cada vez que lee | Lee el texto e imprime el id del proceso para poder pararlo |
| `kill <pid>` | Cuando paras una lectura | Termina ese proceso `say` |

Lee:

- **El texto de una respuesta, o el que hayas seleccionado,** solo para leerlo en voz alta.
- **Las variables de entorno `LC_ALL`, `LC_MESSAGES` y `LANG`,** para mostrar sus mensajes en inglés o en español.

Guarda la última respuesta en la memoria de la sesión para `/speak`, y nada en disco. Tus ajustes viven en el `settings.json` de Claude Code, como los de cualquier plugin.

## Contribuir

Los issues y pull requests son bienvenidos, sobre todo idiomas nuevos y soporte para Linux o Windows. Empieza por [CONTRIBUTING.md](CONTRIBUTING.md) y el [roadmap](ROADMAP.md). Puedes escribir en español o en inglés.

## Licencia

[MIT](LICENSE) © Robin Buitrago

Hablo es un proyecto independiente. No está afiliado, respaldado ni patrocinado por Anthropic. Claude y Claude Code son marcas de Anthropic.
