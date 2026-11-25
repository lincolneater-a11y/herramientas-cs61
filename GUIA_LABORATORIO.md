# Laboratorio · guía de activación (v63)

El módulo funciona sin planilla para **calificar valores** (bajo/normal/alto, cálculos, copiar, imprimir). La planilla y Drive sólo hacen falta para **guardar, ver el historial, adjuntar informes y la carga de bioquímica**.

## 1. Subir los archivos al sitio
Suba al repositorio (respetando las carpetas): `index.html`, `sw.js`, `manifest-bioquimica.webmanifest` y la carpeta `laboratorio/` (`index.html`, `lab-data.js`).

## 2. Actualizar el script de la planilla
1. Abra la planilla «Registro compartido CS61» → **Extensiones → Apps Script**.
2. Reemplace todo el contenido de `Codigo.gs` por el archivo nuevo y **vuelva a escribir su CLAVE** en la línea `var CLAVE = '…'`.
3. Menú **▶ Ejecutar** → elija la función **`autorizarDrive`** → acepte los permisos de Drive. Se crea la carpeta «CS61 Laboratorio (PDF)» (privada, en su Drive).
4. **Implementar → Administrar implementaciones → ✏ Editar → Versión: Nueva versión → Implementar.** (La URL no cambia.)

## 3. Código de acceso para bioquímicas/os
1. En Apps Script: ⚙ **Configuración del proyecto → Propiedades del script → Agregar propiedad**: nombre `LAB_KEY`, valor un código propio (distinto de la CLAVE general).
2. Entregue ese código sólo al laboratorio. Con él **sólo** pueden cargar resultados, verificar sus propias cargas y adjuntar informes: no ven nombres, ni valores de otros laboratorios, ni nada del resto de la planilla.
3. En el equipo del laboratorio: abrir el sitio → perfil **Bioquímica / laboratorio** → «Laboratorio · Carga de resultados» → pegar el código → «Guardar código».
4. Para cambiar o quitar el acceso: editar o borrar la propiedad `LAB_KEY`.

## 4. Qué se guarda y dónde
- Hoja **«Laboratorio»** (se crea sola): un estudio por fila con el **código** de la persona (el DNI y el nombre quedan sólo en «Pacientes»), fecha, laboratorio, valores y rangos del laboratorio.
- Informes (PDF/JPG/PNG, hasta 5 MB, máximo 5 por estudio): carpeta de Drive, nombre `CS61-0001_2026-11-25_origen_1.pdf` (sin DNI ni nombre). Los ve quien tenga acceso a esa carpeta.
- Volver a guardar el mismo estudio (misma persona, fecha, origen y laboratorio) lo reemplaza.

## 5. Límites a tener presentes
- Los rangos son orientativos; el rango del laboratorio, si se carga, tiene prioridad.
- Pediatría: sólo hay rangos propios para los estudios bien definidos (glucemia, lípidos, hemoglobina, ferritina, albúmina, sodio, cloro, magnesio, plaquetas, vitamina D, PCR, etc.). Para el resto la herramienta pide cargar el rango del laboratorio.
- Un sitio estático no tiene inicio de sesión: la protección es el código de acceso y la clave de la planilla. No cargue datos de personas sin su consentimiento.
