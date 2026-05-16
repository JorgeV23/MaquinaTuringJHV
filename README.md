# 🖥️ Simulador de Máquina de Turing (MT)

Simulador interactivo de una Máquina de Turing desarrollado con **HTML**, **CSS** y **JavaScript** puro. Permite visualizar paso a paso el funcionamiento de una MT: lectura de símbolos, escritura en la cinta, movimiento del cabezal y cambios de estado.

---

## 📋 Tabla de Contenidos

1. [¿Qué es una Máquina de Turing?](#-qué-es-una-máquina-de-turing)
2. [Cómo Abrir el Simulador](#-cómo-abrir-el-simulador)
3. [Estructura de la Interfaz](#-estructura-de-la-interfaz)
4. [Configuración de la Máquina](#-configuración-de-la-máquina)
5. [Tabla de Transiciones](#-tabla-de-transiciones)
6. [Botones de Control](#-botones-de-control)
7. [Panel de Visualización](#-panel-de-visualización)
8. [Validaciones](#-validaciones)
9. [Ejemplo Precargado](#-ejemplo-precargado)
10. [Atajos de Teclado](#-atajos-de-teclado)
11. [Tecnologías Utilizadas](#-tecnologías-utilizadas)

---

## 🧠 ¿Qué es una Máquina de Turing?

Una Máquina de Turing es un modelo matemático de computación que define una máquina abstracta. Se compone formalmente de:

| Componente | Símbolo | Descripción |
|---|---|---|
| **Estados** | Q | Conjunto finito de estados posibles |
| **Alfabeto de entrada** | Σ | Símbolos válidos que puede recibir como entrada |
| **Alfabeto de cinta** | Γ | Todos los símbolos que pueden aparecer en la cinta (incluye Σ y el blanco B) |
| **Función de transición** | δ | Reglas que dictan el comportamiento: δ(estado, símbolo) → (nuevo_estado, símbolo_a_escribir, dirección) |
| **Estado inicial** | q₀ | Estado en el que comienza la máquina |
| **Símbolo blanco** | B | Símbolo que representa una celda vacía en la cinta |
| **Estados finales** | F | Conjunto de estados de aceptación |

---

## 🚀 Cómo Abrir el Simulador

1. Descarga o clona los 3 archivos del proyecto en una misma carpeta:
   - `index.html`
   - `styles.css`
   - `script.js`

2. Abre el archivo `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge, etc.):
   - Haz doble clic sobre el archivo, o
   - Clic derecho → "Abrir con" → selecciona tu navegador

> **Nota:** No se requiere servidor web ni instalación de dependencias. Todo funciona localmente.

---

## 🖼️ Estructura de la Interfaz

La interfaz se divide en dos paneles principales:

### Panel Izquierdo — Configuración
Aquí defines todos los parámetros de tu Máquina de Turing:
- Cadena inicial
- Alfabeto de cinta
- Estado inicial y estados finales
- Tabla de transiciones
- Botones de control
- Control de velocidad

### Panel Derecho — Visualización
Aquí observas la ejecución en tiempo real:
- Tarjetas de estado (estado actual, símbolo leído, pasos, estado de la máquina)
- Cinta con celdas y cabezal animado
- Registro de transiciones ejecutadas
- Definición formal de la MT

---

## ⚙️ Configuración de la Máquina

### 1. Cadena Inicial

```
Campo: "Cadena Inicial"
```

- Ingresa la cadena que se escribirá inicialmente en la cinta.
- Puede contener **letras** (a-z, A-Z) y **números** (0-9).
- Cada carácter ocupa una celda de la cinta.
- Se agregan automáticamente celdas en blanco (`B`) al inicio y al final de la cadena.
- **Ejemplo:** `1101101`

> **Importante:** Cada símbolo de la cadena debe pertenecer al alfabeto de cinta (Γ) que definas. Si ingresas un símbolo que no está en Γ, el simulador mostrará un error.

---

### 2. Alfabeto de Cinta (Γ)

```
Campo: "Alfabeto de Cinta (Γ)"
```

- Define los símbolos permitidos en la cinta, **separados por coma**.
- Cada símbolo debe ser **un solo carácter alfanumérico** (letra o número).
- El símbolo blanco `B` se incluye automáticamente, aunque no lo escribas.
- **Ejemplo:** `0, 1, X, B`

Este campo se usa para validar que:
- Todos los caracteres de la **cadena inicial** pertenecen a Γ.
- Todos los símbolos de **lectura y escritura** en las transiciones pertenecen a Γ.

---

### 3. Estado Inicial (q₀)

```
Campo: "Estado Inicial (q₀)"
```

- Nombre del estado en el que la máquina comienza su ejecución.
- Debe empezar con una **letra** y puede contener letras, números y guiones bajos.
- **Ejemplo:** `q0`

> **Validación adicional:** El estado inicial debe aparecer como **estado origen** en al menos una transición. Si defines `q0` como inicial pero ninguna transición parte de `q0`, se mostrará un error.

---

### 4. Estados Finales (F)

```
Campo: "Estados Finales (F)"
```

- Uno o más estados que, al ser alcanzados, indican que la máquina **acepta** la cadena.
- Si hay varios, sepáralos con **coma**.
- Mismo formato que el estado inicial: empezar con letra, solo letras/números/guiones bajos.
- **Ejemplo:** `qf` o `q_accept, q_halt`

---

## 📝 Tabla de Transiciones

La tabla de transiciones define las reglas de comportamiento de la máquina. Cada fila representa una regla:

```
δ(estado_actual, símbolo_leído) → (nuevo_estado, símbolo_a_escribir, dirección)
```

### Columnas de la tabla

| Columna | Descripción | Ejemplo |
|---|---|---|
| **Estado** | Estado actual de la máquina | `q0` |
| **Lee** | Símbolo que el cabezal lee en la celda actual | `1` |
| **→ Estado** | Nuevo estado después de aplicar la transición | `q1` |
| **Escribe** | Símbolo que se escribe en la celda actual | `X` |
| **Dir** | Dirección en la que se mueve el cabezal | `R`, `L` o `S` |

### Direcciones disponibles

| Valor | Significado | Comportamiento |
|---|---|---|
| **R** | Right (Derecha) | El cabezal se mueve una celda a la derecha |
| **L** | Left (Izquierda) | El cabezal se mueve una celda a la izquierda |
| **S** | Stay (Neutro) | El cabezal **no se mueve**, permanece en la misma celda |

### Leer el final de la cadena (símbolo B)

Para detectar el **final de la cadena** (o cualquier celda vacía), usa `B` como símbolo de lectura en una transición:

```
Estado: q0 | Lee: B | → Estado: qf | Escribe: B | Dir: L
```

Esto significa: "Si estoy en `q0` y leo un blanco (`B`), voy al estado `qf`, escribo `B` y me muevo a la izquierda."

También puedes **escribir un símbolo al final** de la cadena antes de terminar:

```
Estado: q0 | Lee: B | → Estado: q1 | Escribe: X | Dir: R
```

Esto escribe `X` donde antes había un blanco y luego avanza a la derecha (donde habrá otro `B`).

### Administración de filas

- **Agregar Transición:** Haz clic en el botón `+ Agregar Transición` para añadir una nueva fila vacía.
- **Eliminar Transición:** Haz clic en el botón `×` al final de la fila que deseas eliminar. Siempre debe quedar al menos una fila.

---

## 🎮 Botones de Control

| Botón | Función |
|---|---|
| **▶ Iniciar** | Valida la configuración e inicializa la máquina. La cinta se renderiza y la máquina queda lista para ejecutar. |
| **⏩ Siguiente Paso** | Ejecuta **un solo paso** de la máquina: lee el símbolo, aplica la transición, escribe, mueve el cabezal y cambia de estado. |
| **⏯ Ejecutar Automáticamente** | Inicia la ejecución automática continua. Cada paso se ejecuta según la velocidad configurada. Al hacer clic nuevamente, **pausa** la ejecución. |
| **🔄 Reiniciar** | Detiene la ejecución, limpia la cinta, el registro y devuelve la máquina a su estado inicial para poder reconfigurar. |

### Control de Velocidad

Debajo de los botones hay un **slider** que controla la velocidad de la ejecución automática:
- **Izquierda (Lenta):** Mayor intervalo entre pasos (~2 segundos)
- **Derecha (Rápida):** Menor intervalo entre pasos (~100ms)

---

## 👁️ Panel de Visualización

### Tarjetas de Estado

Cuatro tarjetas en la parte superior muestran información en tiempo real:

| Tarjeta | Muestra |
|---|---|
| **Estado Actual** | El estado en el que se encuentra la máquina (ej: `q0`, `q1`) |
| **Símbolo Leído** | El símbolo que el cabezal está leyendo en la celda actual |
| **Pasos** | Número total de transiciones ejecutadas |
| **Estado** | Estado de la máquina: `Ejecutando`, `Aceptada ✓`, `Detenida ✗`, o `Detenida` |

Las tarjetas se **resaltan brevemente** en azul cada vez que se actualiza su valor.

### Cinta

- La cinta se muestra como una serie de **cuadros horizontales**, cada uno con un símbolo.
- La celda activa (donde está el cabezal) se resalta en **azul** y se agranda ligeramente.
- Un indicador de **"Cabezal"** con una flecha apunta a la celda activa.
- Debajo de cada celda aparece su **índice numérico** (posición).
- Si la cinta es más larga que el área visible, se puede hacer **scroll horizontal**.
- La vista se desplaza automáticamente para mantener visible la celda activa.

### Registro de Transiciones

Debajo de la cinta, un registro muestra cada transición ejecutada en formato:

```
[Paso N] δ(estado_anterior, símbolo_leído) → (nuevo_estado, símbolo_escrito, dirección)
```

Al finalizar, se muestra un mensaje indicando si la cadena fue **aceptada** (llegó a un estado final) o si la máquina se **detuvo** (no hay transición válida).

### Definición Formal

Al inicializar la máquina, se muestra la **definición formal** completa:

```
Q = { q0, q1, qf }
Σ = { 0, 1 }
Γ = { 0, 1, B, X }
q₀ = q0
B = B
F = { qf }
```

---

## ✅ Validaciones

El simulador valida todos los campos antes de iniciar. Si hay errores, los campos se resaltan en **rojo** con un mensaje descriptivo:

### Reglas de validación por campo

| Campo | Regla | Mensaje de error |
|---|---|---|
| **Cadena Inicial** | Obligatoria. Solo letras y números. Cada carácter debe pertenecer a Γ. | `"Solo se permiten letras (a-z) y números (0-9)"` / `"Símbolo(s) 'X' no pertenecen al alfabeto de cinta"` |
| **Alfabeto de Cinta** | Obligatorio. Símbolos separados por coma. Cada uno debe ser 1 carácter alfanumérico. | `"Define el alfabeto de cinta"` / `"Símbolo(s) inválido(s)"` |
| **Estado Inicial** | Obligatorio. Debe empezar con letra (solo letras, números, guiones bajos). Debe existir como origen en al menos una transición. | `"Estado inválido"` / `"no aparece como estado origen en ninguna transición"` |
| **Estados Finales** | Obligatorio. Mismo formato que estados. Separar múltiples con coma. | `"Estado(s) final(es) inválido(s)"` |
| **Transiciones** | Al menos una fila con todos los campos completos. Símbolos de lectura/escritura deben pertenecer a Γ. | `"Requerido"` / `"Inválido"` / `"X" ∉ Γ` |

### Comportamiento de los errores

- Los campos con error se resaltan con **borde rojo** y una **animación de sacudida**.
- Un **mensaje de error** aparece debajo de cada campo inválido.
- Los errores se **limpian automáticamente** cuando editas el campo corregido.
- Un **toast** (notificación) aparece en la esquina inferior derecha con el mensaje general.

---

## 📌 Ejemplo Precargado

El botón **"📋 Cargar Ejemplo"** carga automáticamente una MT que **reemplaza todos los `1` por `X`**:

### Configuración del ejemplo

| Parámetro | Valor |
|---|---|
| Cadena Inicial | `1101101` |
| Alfabeto de Cinta (Γ) | `0, 1, X, B` |
| Estado Inicial | `q0` |
| Estados Finales | `qf` |

### Transiciones del ejemplo

| Estado | Lee | → Estado | Escribe | Dir |
|---|---|---|---|---|
| q0 | 1 | q0 | X | R |
| q0 | 0 | q0 | 0 | R |
| q0 | B | qf | B | L |

### ¿Cómo funciona?

1. La máquina comienza en `q0` leyendo el primer símbolo de la cadena.
2. Si lee un `1`, lo reemplaza por `X` y avanza a la derecha (→).
3. Si lee un `0`, lo deja igual y avanza a la derecha (→).
4. Cuando lee un `B` (final de la cadena), cambia al estado final `qf` y se mueve a la izquierda.
5. Al llegar a `qf` (estado final), la máquina **acepta** y se detiene.

### Resultado esperado

- **Cinta antes:** `B 1 1 0 1 1 0 1 B`
- **Cinta después:** `B X X 0 X X 0 X B`
- **Pasos:** 7
- **Estado final:** Aceptada ✓

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|---|---|
| **Espacio** | Ejecutar siguiente paso (solo cuando no estás escribiendo en un campo de texto) |

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura y semántica de la interfaz |
| **CSS3** | Diseño visual, animaciones y responsive |
| **JavaScript (ES6+)** | Lógica de la Máquina de Turing, manejo del DOM y validaciones |
| **Google Fonts** | Tipografías Inter (UI) y JetBrains Mono (código/cinta) |

---

## 📁 Estructura de Archivos

```
turing/
├── index.html    → Estructura HTML de la interfaz
├── styles.css    → Estilos, animaciones y diseño visual
├── script.js     → Lógica de la MT, controlador UI y validaciones
└── README.md     → Este archivo de documentación
```

---

## 👨‍💻 Autor

Proyecto desarrollado como parte del curso de **Teoría de la Computación**.

---

> **Tip:** Para crear tu propia Máquina de Turing, primero piensa en qué transformación quieres hacer sobre la cadena, define los estados necesarios, y luego escribe las transiciones una por una. ¡El simulador te ayudará a visualizar si tu diseño es correcto!
