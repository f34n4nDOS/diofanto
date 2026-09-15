"""
Laboratorio de IA/ML: tres mini-modelos reales para que el estudiante
vea "por dentro" cómo funcionan una regresión, una red neuronal, y un
modelo de lenguaje — sin necesitar GPU ni datasets enormes.
"""
import re
from collections import defaultdict, Counter

import numpy as np
import sympy
from fastapi import APIRouter, HTTPException
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_moons, make_circles, make_classification

from math_utils import to_latex
import schemas

router = APIRouter(prefix="/api/mllab", tags=["mllab"])

# Límites para mantener el cómputo liviano (esto corre en un servicio
# con recursos compartidos, no en una GPU dedicada).
MAX_REGRESSION_POINTS = 200
MAX_REGRESSION_DEGREE = 8
MAX_CLASSIFICATION_POINTS = 300
MAX_HIDDEN_LAYERS = 3
MAX_NEURONS_PER_LAYER = 32
MAX_EPOCHS = 500
DECISION_BOUNDARY_GRID_SIZE = 25


# ==================== REGRESIÓN ====================

def _generate_synthetic_regression_data(true_function: str, num_points: int, noise: float):
    rng = np.random.default_rng()
    xs = np.linspace(-10, 10, num_points)
    if true_function == "quadratic":
        ys = 0.5 * xs**2 - 2 * xs + 3
    elif true_function == "sine":
        ys = 5 * np.sin(xs) + 0.3 * xs
    else:  # "linear"
        ys = 2 * xs + 1
    ys = ys + rng.normal(0, noise, size=num_points)
    return xs, ys


@router.post("/regression", response_model=schemas.RegressionResponse)
def regression_lab(req: schemas.RegressionRequest):
    try:
        degree = max(1, min(req.degree, MAX_REGRESSION_DEGREE))

        if req.points:
            points = req.points[:MAX_REGRESSION_POINTS]
            xs = np.array([p.x for p in points])
            ys = np.array([p.y for p in points])
        else:
            num_points = max(5, min(req.num_synthetic_points, MAX_REGRESSION_POINTS))
            xs, ys = _generate_synthetic_regression_data(req.true_function, num_points, req.noise)

        if len(xs) < degree + 1:
            raise ValueError(
                f"Hacen falta al menos {degree + 1} puntos para ajustar un polinomio de grado {degree}"
            )

        coeffs = np.polyfit(xs, ys, degree)  # mayor grado primero
        poly = np.poly1d(coeffs)

        y_pred = poly(xs)
        ss_res = float(np.sum((ys - y_pred) ** 2))
        ss_tot = float(np.sum((ys - np.mean(ys)) ** 2))
        r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 1.0
        mse = float(np.mean((ys - y_pred) ** 2))

        # Curva ajustada, muestreada densamente para graficar una línea suave
        x_curve = np.linspace(xs.min(), xs.max(), 150)
        y_curve = poly(x_curve)

        # Ecuación en LaTeX, reusando el mismo formateador que el resto de la app
        x_sym = sympy.symbols("x")
        rounded_coeffs = [round(float(c), 4) for c in coeffs]
        expr = sum(c * x_sym ** (degree - i) for i, c in enumerate(rounded_coeffs))
        equation_str = str(expr)
        equation_latex = to_latex(expr)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo ajustar el modelo: {e}")

    if degree >= len(xs) - 1:
        fit_note = (
            "El grado elegido es igual o mayor a (cantidad de puntos - 1): el modelo puede estar "
            "memorizando los datos en vez de aprender el patrón general (sobreajuste)."
        )
    elif r_squared < 0.3:
        fit_note = (
            "El R² es bajo: el modelo explica poco de la variación de los datos. Probá con otro grado "
            "o revisá si el tipo de curva elegido tiene sentido para estos puntos."
        )
    else:
        fit_note = "El ajuste parece razonable para este conjunto de datos."

    interpretation = (
        f"El modelo explica el {r_squared * 100:.1f}% de la variación en los datos (R² = {r_squared:.4f}). "
        f"{fit_note}"
    )

    return schemas.RegressionResponse(
        points=[schemas.RegressionPoint(x=float(x), y=float(y)) for x, y in zip(xs, ys)],
        fitted_curve=[schemas.RegressionPoint(x=float(x), y=float(y)) for x, y in zip(x_curve, y_curve)],
        coefficients=[float(c) for c in coeffs],
        equation_str=equation_str,
        equation_latex=equation_latex,
        r_squared=round(r_squared, 4),
        mse=round(mse, 4),
        interpretation=interpretation,
    )


# ==================== RED NEURONAL ====================

def _generate_synthetic_classification_data(dataset_type: str, num_points: int, noise: float):
    noise = max(0.01, min(noise, 1.0))
    if dataset_type == "circles":
        X, y = make_circles(n_samples=num_points, noise=noise, factor=0.5, random_state=42)
    elif dataset_type == "xor":
        rng = np.random.default_rng(42)
        X = rng.uniform(-1, 1, size=(num_points, 2))
        y = ((X[:, 0] > 0) ^ (X[:, 1] > 0)).astype(int)
        X = X + rng.normal(0, noise * 0.3, X.shape)
    elif dataset_type == "linear":
        X, y = make_classification(
            n_samples=num_points, n_features=2, n_redundant=0, n_informative=2,
            n_clusters_per_class=1, flip_y=noise * 0.2, random_state=42,
        )
    else:  # "moons"
        X, y = make_moons(n_samples=num_points, noise=noise, random_state=42)
    return X, y


@router.post("/neural-network", response_model=schemas.NeuralNetworkResponse)
def neural_network_lab(req: schemas.NeuralNetworkRequest):
    try:
        if req.points:
            points = req.points[:MAX_CLASSIFICATION_POINTS]
            X = np.array([[p.x, p.y] for p in points])
            y = np.array([p.label for p in points])
            if len(set(y.tolist())) < 2:
                raise ValueError("Los datos necesitan ejemplos de las dos clases (0 y 1) para poder entrenar")
        else:
            num_points = max(20, min(req.num_synthetic_points, MAX_CLASSIFICATION_POINTS))
            X, y = _generate_synthetic_classification_data(req.dataset_type, num_points, req.noise)

        hidden_layers = [
            max(1, min(n, MAX_NEURONS_PER_LAYER)) for n in req.hidden_layer_sizes[:MAX_HIDDEN_LAYERS]
        ] or [8]
        epochs = max(10, min(req.epochs, MAX_EPOCHS))
        learning_rate = max(0.0001, min(req.learning_rate, 1.0))

        mlp = MLPClassifier(
            hidden_layer_sizes=tuple(hidden_layers),
            max_iter=epochs,
            learning_rate_init=learning_rate,
            random_state=42,
        )
        mlp.fit(X, y)
        accuracy = float(mlp.score(X, y))
        loss_curve = [round(float(v), 5) for v in mlp.loss_curve_]

        # Grilla para pintar la frontera de decisión: para cada punto del
        # plano, qué probabilidad le asigna la red a la clase 1.
        x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
        y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
        xx = np.linspace(x_min, x_max, DECISION_BOUNDARY_GRID_SIZE)
        yy = np.linspace(y_min, y_max, DECISION_BOUNDARY_GRID_SIZE)
        grid = np.array([[gx, gy] for gy in yy for gx in xx])
        probs = mlp.predict_proba(grid)[:, 1]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo entrenar la red: {e}")

    if accuracy > 0.97:
        acc_note = "Precisión muy alta — con pocos datos esto puede ser señal de sobreajuste, no solo de que 'aprendió bien'."
    elif accuracy < 0.6:
        acc_note = "Precisión baja: probá agregar más neuronas, más épocas, o revisar si el patrón es separable con esta arquitectura."
    else:
        acc_note = "La red encontró una frontera de decisión razonable para este problema."

    interpretation = (
        f"Después de {epochs} épocas, la red clasifica correctamente el {accuracy * 100:.1f}% de los "
        f"datos de entrenamiento. {acc_note}"
    )

    return schemas.NeuralNetworkResponse(
        points=[schemas.ClassifierPoint(x=float(px), y=float(py), label=int(pl)) for (px, py), pl in zip(X, y)],
        decision_boundary=[
            schemas.GridPoint(x=float(gx), y=float(gy), probability=round(float(p), 4))
            for (gx, gy), p in zip(grid, probs)
        ],
        accuracy=round(accuracy, 4),
        loss_curve=loss_curve,
        interpretation=interpretation,
    )


# ==================== MODELO DE LENGUAJE (N-GRAMAS) ====================

DEFAULT_CORPUS = """
La matemática es el lenguaje con el que la naturaleza escribe sus reglas.
Un número primo es un número que solo se puede dividir por uno y por sí mismo.
El límite de una función describe el valor al que se acerca a medida que la
variable se aproxima a un punto determinado. La derivada mide qué tan rápido
cambia una función en cada instante, y la integral mide el área bajo la curva
que esa función dibuja. Una ecuación diferencial describe cómo cambia una
cantidad a lo largo del tiempo, y resolver esa ecuación permite predecir el
comportamiento futuro del sistema. En probabilidad, un evento aleatorio tiene
una distribución que describe qué tan probable es cada resultado posible. Una
red neuronal aprende ajustando muchos parámetros pequeños hasta que sus
predicciones se acercan a los valores reales observados en los datos de
entrenamiento. Un modelo de lenguaje aprende a predecir la palabra siguiente
observando muchísimos textos, y esa capacidad de predicción es la base de
como funcionan los asistentes conversacionales modernos. La estadística
descriptiva resume un conjunto de datos con medidas como la media, la
mediana y la desviación estándar, mientras que la estadística inferencial
intenta sacar conclusiones generales a partir de una muestra pequeña.
""".strip()

MAX_NGRAM_N = 4
MIN_NGRAM_N = 2


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúñü]+", text.lower())


def _build_ngram_model(tokens: list[str], n: int) -> dict[tuple[str, ...], Counter]:
    model: dict[tuple[str, ...], Counter] = defaultdict(Counter)
    for i in range(len(tokens) - n + 1):
        context = tuple(tokens[i : i + n - 1])
        next_word = tokens[i + n - 1]
        model[context][next_word] += 1
    return model


def _predict_next(model, context, temperature: float, top_k: int = 8):
    counter = model.get(context)
    if not counter:
        return []
    words = list(counter.keys())
    counts = np.array([counter[w] for w in words], dtype=float)
    temp = max(0.05, temperature)
    adjusted = counts ** (1.0 / temp)
    probs = adjusted / adjusted.sum()
    order = np.argsort(-probs)[:top_k]
    return [(words[i], float(probs[i])) for i in order]


def _generate_text(model, vocabulary: list[str], start_context, n: int, num_words: int, temperature: float, rng):
    context = start_context
    generated = list(context)
    for _ in range(num_words):
        candidates = _predict_next(model, context, temperature, top_k=max(1, len(model.get(context, {}))))
        if not candidates:
            next_word = vocabulary[rng.integers(0, len(vocabulary))] if vocabulary else ""
        else:
            words = [w for w, _ in candidates]
            probs = np.array([p for _, p in candidates])
            probs = probs / probs.sum()
            next_word = rng.choice(words, p=probs)
        if not next_word:
            break
        generated.append(next_word)
        context = tuple(generated[-(n - 1) :]) if n > 1 else tuple()
    return " ".join(generated)


@router.post("/language-model", response_model=schemas.LanguageModelResponse)
def language_model_lab(req: schemas.LanguageModelRequest):
    try:
        n = max(MIN_NGRAM_N, min(req.n, MAX_NGRAM_N))
        corpus_text = req.corpus.strip() if req.corpus and req.corpus.strip() else DEFAULT_CORPUS
        tokens = _tokenize(corpus_text)

        if len(tokens) < n * 3:
            raise ValueError(
                "El texto es muy corto para este tamaño de n-grama. Agregá más texto o reducí n."
            )

        model = _build_ngram_model(tokens, n)
        vocabulary = sorted(set(tokens))

        prompt_tokens = _tokenize(req.prompt) if req.prompt else []
        if n > 1 and len(prompt_tokens) >= n - 1:
            context = tuple(prompt_tokens[-(n - 1) :])
        elif n == 1:
            context = tuple()
        else:
            # Prompt insuficiente o vacío: arrancamos de un contexto real
            # visto en el corpus, elegido al azar.
            rng_seed = np.random.default_rng()
            contexts = list(model.keys())
            context = contexts[rng_seed.integers(0, len(contexts))] if contexts else tuple()

        predictions = _predict_next(model, context, req.temperature, top_k=8)
        num_words = max(1, min(req.num_words_to_generate, 60))

        rng = np.random.default_rng()
        generated = _generate_text(model, vocabulary, context, n, num_words, req.temperature, rng)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo entrenar el modelo de lenguaje: {e}")

    context_display = " ".join(context) if context else "(inicio aleatorio, no diste suficiente contexto)"
    times_seen = sum(model.get(context, {}).values())

    interpretation = (
        f"Con el contexto \"{context_display}\", el modelo vio ese patrón {times_seen} veces en el texto "
        f"y arma la lista de palabras posibles a partir de esas frecuencias. Los modelos de lenguaje "
        f"modernos (los que usan los chatbots) hacen conceptualmente lo mismo — predicen una distribución "
        f"de probabilidad sobre la palabra siguiente y eligen una — pero en vez de contar repeticiones como "
        f"acá, usan una red neuronal entrenada con muchísimo más texto para estimar esa distribución."
    )

    return schemas.LanguageModelResponse(
        corpus_word_count=len(tokens),
        vocabulary_size=len(vocabulary),
        n=n,
        next_word_predictions=[
            schemas.NextWordPrediction(word=w, probability=round(p, 4)) for w, p in predictions
        ],
        generated_text=generated,
        interpretation=interpretation,
    )