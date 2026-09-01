# Sistema de diseño — Diofanto

Concepto central: **el cuaderno cuadriculado del estudiante**. En vez de cards
grises idénticas, cada área de la matemática tiene un color de acento fijo
(wayfinding por color), y el fondo evoca la hoja cuadriculada de forma sutil,
solo en zonas de "hero"/vacías — nunca como ruido detrás de contenido denso.

## 1. Color

Los tokens existentes (`--primary`, `--secondary`, `--success`, `--warning`,
`--error`, `--neutral-*`, `--spacing-*`, `--shadow-*`, `--border-radius*`) se
mantienen sin cambios de nombre para no romper el CSS ya escrito. Se agregan:

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#1E2340` | Texto principal — azul-negro cálido, alternativa a neutral-900 para headings |
| `--paper` | `#F7F8FC` | Fondo base de la app (reemplaza el gradiente gris genérico) |
| `--grid-line` | `#E3E8FA` | Líneas del cuadriculado de fondo, solo para `.grid-paper` |
| `--spark` | `#F5A524` | Acento cálido — favoritos, rachas, logros |
| `--spark-dark` | `#D6890A` | Hover/estado activo de `--spark` |

### Colores por área (wayfinding)

| Área | Token | Hex | Labs que agrupa |
|---|---|---|---|
| Álgebra | `--subject-algebra` | `#7C3AED` | Álgebra |
| Geometría | `--subject-geometry` | `#2563EB` | Geometría |
| Cálculo | `--subject-calculus` | `#16A34A` | Funciones, Derivadas, Límites, Integrales |
| Estadística | `--subject-statistics` | `#F5A524` | Probabilidad y Estadística |

Cada `SubjectCard` recibe el color vía la prop `subject`, y ese mismo color se
reutiliza en el ícono, el borde lateral, y (a futuro) en los gráficos de esa
sección — así el usuario aprende a ubicarse por color, no solo por texto.

## 2. Tipografía

| Rol | Fuente | Token CSS |
|---|---|---|
| Display / títulos | Baloo 2 (redondeada, cálida) | `--font-display` |
| Cuerpo / UI | Plus Jakarta Sans (humanista, legible) | `--font-body` |

Los resultados matemáticos (KaTeX) usan su propia tipografía (Computer
Modern) — no se fuerza una fuente ahí. En cambio, se enmarcan visualmente con
la clase `.math-panel`, un panel con fondo levemente tintado tipo "pizarra
clara" que separa la voz matemática de la voz de la interfaz.

## 3. Principios

1. **Wayfinding por color de materia**, no cards uniformes grises.
2. **Cuadriculado como motivo de fondo**, usado con moderación (clase
   `.grid-paper`, solo en heroes/secciones vacías).
3. **Un solo elemento con gradiente por pantalla** — se retira el gradiente
   de todos los `<h1>` (quedaba genérico); se reserva para el CTA principal
   o el wordmark de marca.
4. **Los resultados matemáticos se enmarcan**, no flotan sobre fondo blanco
   plano — usar `.math-panel` alrededor de cualquier `<MathDisplay block />`.
5. Acciones destructivas o de salida (cerrar sesión) usan un estilo
   "ghost"/secundario, nunca el mismo peso visual que un CTA primario.

## 4. Archivos entregados

- `index.css` — reemplaza el actual; agrega tokens nuevos, importa
  tipografías, agrega `.grid-paper` y `.math-panel` como utilidades globales.
- `components/SubjectCard.tsx` + `components/SubjectCard.css` — card
  reutilizable con color por materia, para reemplazar la lista de `<Link>`
  del Dashboard.
- `pages/Dashboard.tsx` + `styles/Dashboard.css` — dashboard rearmado usando
  `SubjectCard` en grilla, agrupado por las 7 labs existentes.

## 5. Pendiente (no incluido en esta entrega)

- Aplicar `.math-panel` dentro de `MathDisplay.tsx` o en cada lab que lo usa
  (`FunctionLab`, `DerivativeLab`, etc.) — no lo tocamos todavía para no
  meternos con las 6 páginas de una sola vez.
- Reemplazar el gradiente de `.submit-btn` en `AlgebraLab.css`,
  `FunctionLab.css`, etc. por el color de la materia correspondiente, si
  querés extender el wayfinding a los botones también.
