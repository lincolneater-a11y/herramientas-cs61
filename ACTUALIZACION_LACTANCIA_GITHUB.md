# Actualización CS61 · Juegos educativos sobre lactancia

**Integración para el sitio estático del Centro de Salud N.º 61, Barrio Solidaridad.**

## Qué incluye

- **La Oca de la Lactancia:** tablero ilustrado de 25 casillas; 1 a 4 equipos; dado, fichas, turnos, preguntas en casillas especiales, avance adicional por acierto y ganador.
- **Preguntados de lactancia:** ruleta animada, cinco sectores (Mitos, Técnica, Conservación, Sensibilización y Comodín); 1 a 4 equipos, respuestas explicadas, medallas y final al completar las cuatro temáticas.
- **Quiz visual de posturas y acople:** diez preguntas por partida tomadas de una colección de trece desafíos, con imágenes originales del kit, corrección explicada y resultado descargable como CSV anónimo.
- **36 preguntas de opción múltiple** para Oca y Preguntados, separadas de la lógica en `recursos/lactancia/preguntas.json` y fáciles de modificar.
- Gráficos originales seleccionados del kit definitivo (SVG y WebP, más dos vistas previas PNG) y datos de tablero originales. No se ha retocado el diseño de las ilustraciones.
- Accesos desde la portada de la aplicación y desde **Recursos para la comunidad**.
- Actualización del `sw.js` para que los recursos principales estén disponibles **sin conexión después de su primera carga correcta** en el sitio.

Los juegos no recopilan nombres, DNI ni información clínica. No envían resultados a la planilla de Google Scripts existente; el CSV del quiz se guarda directamente en el equipo del usuario.

## La forma más sencilla de subirlo a tu repositorio de GitHub

**Si ya tenés la aplicación publicada**, elegí `CS61_SOLO_ACTUALIZACION_LACTANCIA.zip` para no volver a cargar toda la aplicación:

1. Descomprimí el archivo ZIP en tu computadora. **No subas el ZIP cerrado a GitHub Pages:** GitHub no lo descomprime como página web.
2. Abrí la carpeta local del repositorio con **GitHub Desktop** (o cloná el repositorio si no lo hiciste).
3. Copiá en la raíz de tu repositorio el contenido descomprimido: `index.html`, `sw.js`, `recursos/index.html` y la carpeta completa `recursos/lactancia/`. Permití reemplazar **solo los archivos indicados**, conservando el resto de tu sitio.
4. En GitHub Desktop revisá los cambios, escribí un mensaje como `Agregar juegos de lactancia CS61`, elegí **Commit to main** y luego **Push origin**.
5. Una vez desplegado GitHub Pages, abrí la dirección de tu sitio y entrá en **Recursos para la comunidad → Juegos de lactancia materna**. También podés entrar directamente agregando `/recursos/lactancia/` a la URL de tu sitio.

**Importante:** si modificaste `index.html`, `recursos/index.html` o `sw.js` en GitHub **después** de crear el ZIP original que me compartiste, compará los cambios antes de reemplazarlos, para no perder novedades. La carpeta `recursos/lactancia/` es nueva y no reemplaza los juegos anteriores.

### ¿Y si preferís subir toda la aplicación?

`CS61_APP_COMPLETA_CON_LACTANCIA.zip` incluye una copia completa de la aplicación que adjuntaste, más los tres juegos integrados. Es útil para instalar el proyecto en una carpeta nueva; **no conviene reemplazar un repositorio existente si allí tenés cambios más recientes**.

## Rutas principales

- Portada de la aplicación: `index.html`
- Portada de recursos: `recursos/index.html`
- Juegos de lactancia: `recursos/lactancia/index.html`
- Código: `recursos/lactancia/app.js`
- Estilos: `recursos/lactancia/styles.css`
- Preguntas editables: `recursos/lactancia/preguntas.json`
- Kit gráfico y JSON originales seleccionados: `recursos/lactancia/kit/`
- Caché de la aplicación: `sw.js`

## Cómo probarlo antes de publicar

Con Python instalado, desde la carpeta raíz del repositorio ejecutá:

```bash
python -m http.server 8000
```

Luego abrí `http://localhost:8000/recursos/lactancia/` en el navegador. **No lo abras haciendo doble clic en `index.html`**, ya que muchos navegadores bloquean la carga local de JSON en modo `file://`.

No requiere Node.js, base de datos, API, librerías ni registro. Funciona con JavaScript, HTML y CSS nativos. Las rutas relativas permiten publicarlo en GitHub Pages tanto desde un repositorio de usuario como desde un repositorio de proyecto.

## Revisión sanitaria y límites

El kit gráfico aportó los criterios y las ilustraciones para las posturas, el acople, la extracción manual y el sueño seguro. Las **36 preguntas de Oca/Preguntados y las 13 del Quiz** se redactaron al programar los juegos: representan una propuesta educativa, **no una validación clínica oficial**. Revisar con el servicio de salud antes de utilizarlas como material de referencia institucional.

Se evitaron tiempos exactos de almacenamiento de leche humana y equivalencias fijas de volumen del estómago neonatal, ya que esas indicaciones requieren contextualización y guías específicas. No se dan indicaciones individuales para problemas de lactancia.

## Edición futura

Para cambiar la redacción de preguntas, editá `recursos/lactancia/preguntas.json`. Cada pregunta tiene: `id`, `categoria`, `pregunta`, `opciones` (tres textos), `correcta` (índice `0`, `1` o `2`) y `explicacion`.

Para cambiar preguntas de identificación por imágenes, buscá el arreglo `QUIZ` en `recursos/lactancia/app.js`.

Para incorporar envío de resultados a la planilla de Google en el futuro, hay que adaptar **tanto el código de sincronización como la hoja receptora** para un tipo de juego nuevo. Esta entrega no modifica esa integración preexistente.
