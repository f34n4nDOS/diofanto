"""
Laboratorio de IA/ML: mini-modelos reales para que el estudiante vea
"por dentro" cómo funcionan una regresión, una red neuronal, un modelo
de lenguaje de n-gramas, un tokenizador BPE, embeddings por
co-ocurrencia, el mecanismo de atención, y un agente con herramientas.
"""
import re
import ast
import operator
from collections import defaultdict, Counter

import numpy as np
import sympy
from fastapi import APIRouter, HTTPException
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_moons, make_circles, make_classification

from math_utils import to_latex
from ai_model_interpreter import OPENROUTER_MODELS, _call_model
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

        x_curve = np.linspace(xs.min(), xs.max(), 150)
        y_curve = poly(x_curve)

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


# ==================== TOKENIZACIÓN (BPE) ====================

MAX_BPE_TRAINING_CHARS = 5000
MAX_BPE_MERGES = 300


def _train_bpe(text: str, num_merges: int):
    words = re.findall(r"[a-záéíóúñü]+|[^\sa-záéíóúñü]", text.lower())
    word_freqs = Counter(words)
    splits = {word: list(word) for word in word_freqs}

    merges: list[tuple[str, str]] = []
    for _ in range(num_merges):
        pair_counts: Counter = Counter()
        for word, freq in word_freqs.items():
            symbols = splits[word]
            for i in range(len(symbols) - 1):
                pair_counts[(symbols[i], symbols[i + 1])] += freq

        if not pair_counts:
            break
        best_pair, best_count = pair_counts.most_common(1)[0]
        if best_count < 2:
            break  # no vale la pena fusionar algo que aparece una sola vez

        merges.append(best_pair)
        for word in list(splits.keys()):
            symbols = splits[word]
            merged = []
            i = 0
            while i < len(symbols):
                if i < len(symbols) - 1 and symbols[i] == best_pair[0] and symbols[i + 1] == best_pair[1]:
                    merged.append(symbols[i] + symbols[i + 1])
                    i += 2
                else:
                    merged.append(symbols[i])
                    i += 1
            splits[word] = merged

    return merges


def _apply_bpe(text: str, merges: list[tuple[str, str]]) -> list[str]:
    words = re.findall(r"[a-záéíóúñü]+|[^\sa-záéíóúñü]", text.lower())
    tokens: list[str] = []
    for word in words:
        symbols = list(word)
        for pair in merges:
            i = 0
            merged = []
            while i < len(symbols):
                if i < len(symbols) - 1 and symbols[i] == pair[0] and symbols[i + 1] == pair[1]:
                    merged.append(symbols[i] + symbols[i + 1])
                    i += 2
                else:
                    merged.append(symbols[i])
                    i += 1
            symbols = merged
        tokens.extend(symbols)
    return tokens


@router.post("/tokenize", response_model=schemas.TokenizeResponse)
def tokenize_lab(req: schemas.TokenizeRequest):
    try:
        training_text = (req.training_text.strip() if req.training_text and req.training_text.strip() else DEFAULT_CORPUS)
        training_text = training_text[:MAX_BPE_TRAINING_CHARS]
        text_to_tokenize = req.text_to_tokenize.strip() if req.text_to_tokenize.strip() else training_text[:200]
        num_merges = max(0, min(req.num_merges, MAX_BPE_MERGES))

        merges = _train_bpe(training_text, num_merges)
        tokens = _apply_bpe(text_to_tokenize, merges)
        naive_tokens = text_to_tokenize.split()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo tokenizar: {e}")

    if num_merges == 0 or not merges:
        merge_note = "Con cero fusiones, el tokenizador todavía no aprendió nada: cada letra es su propio token."
    elif len(merges) < num_merges:
        merge_note = f"El texto de entrenamiento solo dio para aprender {len(merges)} fusiones útiles antes de quedarse sin pares repetidos."
    else:
        merge_note = "Con más fusiones aprendidas, las piezas se van acercando a palabras completas."

    interpretation = (
        f"El texto tiene {len(text_to_tokenize)} caracteres y {len(naive_tokens)} palabras separadas por "
        f"espacio, pero el tokenizador BPE lo dividió en {len(tokens)} tokens (piezas de subpalabra). "
        f"{merge_note}"
    )

    return schemas.TokenizeResponse(
        tokens=tokens,
        naive_word_tokens=naive_tokens,
        char_count=len(text_to_tokenize),
        naive_word_count=len(naive_tokens),
        token_count=len(tokens),
        num_merges_learned=len(merges),
        sample_merges=[f"{a}+{b}→{a}{b}" for a, b in merges[:15]],
        interpretation=interpretation,
    )


# ==================== EMBEDDINGS (CO-OCURRENCIA + SVD) ====================

def _build_cooccurrence_embeddings(tokens: list[str], window: int, dim: int, max_vocab: int):
    freq = Counter(tokens)
    vocab = [w for w, _ in freq.most_common(max_vocab)]
    vocab_set = set(vocab)
    index = {w: i for i, w in enumerate(vocab)}
    n = len(vocab)
    co = np.zeros((n, n))

    for i, tok in enumerate(tokens):
        if tok not in vocab_set:
            continue
        for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
            if i == j:
                continue
            other = tokens[j]
            if other in vocab_set:
                co[index[tok], index[other]] += 1

    weighted = np.log1p(co)  # suaviza las frecuencias, evita que una palabra muy común domine todo

    actual_dim = max(1, min(dim, n))
    U, S, _Vt = np.linalg.svd(weighted, full_matrices=False)
    coords = U[:, :actual_dim] * S[:actual_dim]

    if coords.shape[1] < dim:
        pad = np.zeros((coords.shape[0], dim - coords.shape[1]))
        coords = np.hstack([coords, pad])

    return vocab, coords


@router.post("/embeddings", response_model=schemas.EmbeddingsResponse)
def embeddings_lab(req: schemas.EmbeddingsRequest):
    try:
        corpus_text = req.corpus.strip() if req.corpus and req.corpus.strip() else DEFAULT_CORPUS
        tokens = _tokenize(corpus_text[:8000])
        max_vocab = max(10, min(req.max_words, 60))
        window = max(1, min(req.window, 6))

        if len(set(tokens)) < 8:
            raise ValueError("El texto es muy corto o muy repetitivo para generar embeddings útiles. Agregá más texto variado.")

        vocab, coords = _build_cooccurrence_embeddings(tokens, window, dim=2, max_vocab=max_vocab)

        focus_word = req.focus_word.strip().lower() if req.focus_word else None
        nearest: list[tuple[str, float]] = []
        if focus_word and focus_word in vocab:
            idx = vocab.index(focus_word)
            dists = np.linalg.norm(coords - coords[idx], axis=1)
            order = np.argsort(dists)
            for i in order:
                if vocab[i] == focus_word:
                    continue
                nearest.append((vocab[i], float(dists[i])))
                if len(nearest) >= 6:
                    break

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudieron calcular los embeddings: {e}")

    if focus_word and focus_word not in vocab:
        note = f"'{focus_word}' no aparece con suficiente frecuencia en el texto para tener un embedding propio."
    elif nearest:
        note = f"Las palabras más cercanas a '{focus_word}' en este mapa son: {', '.join(w for w, _ in nearest[:3])}."
    else:
        note = "Elegí una palabra del vocabulario (abajo) para ver cuáles quedaron más cerca de ella."

    interpretation = (
        f"Cada palabra quedó ubicada según con qué otras palabras aparece cerca en el texto (ventana de "
        f"{window} palabras). Palabras que se usan en contextos parecidos tienden a quedar cerca en este "
        f"mapa — esa es la idea central detrás de los embeddings que usan los modelos de lenguaje reales, "
        f"aunque ellos aprenden vectores de cientos de dimensiones con una red neuronal entrenada sobre "
        f"textos muchísimo más grandes. {note}"
    )

    return schemas.EmbeddingsResponse(
        words=[schemas.EmbeddingPoint(word=w, x=float(c[0]), y=float(c[1])) for w, c in zip(vocab, coords)],
        focus_word=focus_word,
        nearest_words=[schemas.WordDistance(word=w, distance=round(d, 4)) for w, d in nearest],
        interpretation=interpretation,
    )


# ==================== ATENCIÓN ====================

def _softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    shifted = x - np.max(x, axis=axis, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.sum(exp, axis=axis, keepdims=True)


@router.post("/attention", response_model=schemas.AttentionResponse)
def attention_lab(req: schemas.AttentionRequest):
    try:
        corpus_text = req.corpus.strip() if req.corpus and req.corpus.strip() else DEFAULT_CORPUS
        sentence = req.sentence.strip() or "el modelo de lenguaje predice la palabra siguiente"
        sentence_tokens = _tokenize(sentence)[:15]

        if len(sentence_tokens) < 2:
            raise ValueError("Escribí una oración con al menos dos palabras")

        corpus_tokens = _tokenize(corpus_text[:8000])
        combined_tokens = corpus_tokens + sentence_tokens * 3
        max_vocab = max(40, min(len(set(combined_tokens)), 120))

        vocab, coords = _build_cooccurrence_embeddings(combined_tokens, window=4, dim=16, max_vocab=max_vocab)
        index_map = {w: i for i, w in enumerate(vocab)}

        vectors = []
        for w in sentence_tokens:
            if w in index_map:
                vectors.append(coords[index_map[w]])
            else:
                vectors.append(np.zeros(coords.shape[1]))
        V = np.array(vectors)
        d = V.shape[1]

        scores = (V @ V.T) / np.sqrt(d)
        temperature = max(0.05, req.temperature)
        weights = _softmax(scores / temperature, axis=-1)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular la atención: {e}")

    last_word = sentence_tokens[-1]
    last_row = weights[-1]
    top_idx = int(np.argmax(last_row[:-1])) if len(last_row) > 1 else 0
    top_word = sentence_tokens[top_idx] if len(sentence_tokens) > 1 else last_word

    interpretation = (
        f"Cada fila de esta matriz sirve para predecir la palabra en esa posición: muestra cuánto 'mira' "
        f"a cada una de las demás palabras de la oración (las filas suman 1, como corresponde a una "
        f"distribución de probabilidad vía softmax). Por ejemplo, para predecir después de '{last_word}', "
        f"el modelo le presta más atención a '{top_word}'. Un transformer real usa tres matrices "
        f"aprendidas (Q, K, V) en vez de comparar los embeddings directamente como hacemos acá, pero la "
        f"fórmula del mecanismo — similitud, escalado por √d, y softmax — es exactamente la misma."
    )

    return schemas.AttentionResponse(
        tokens=sentence_tokens,
        attention_matrix=[[round(float(v), 4) for v in row] for row in weights],
        interpretation=interpretation,
    )


# ==================== AGENTE (ReAct + calculadora, LLM real vía OpenRouter) ====================

_SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval_arithmetic(expr: str) -> float:
    """
    Evalúa una expresión aritmética simple (+ - * / ** % paréntesis) de
    forma segura. Solo acepta números y estos operadores — nada de
    nombres, llamadas a función, ni ningún otro tipo de nodo de Python.
    """
    node = ast.parse(expr, mode="eval").body

    def _eval(n):
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in _SAFE_OPERATORS:
            return _SAFE_OPERATORS[type(n.op)](_eval(n.left), _eval(n.right))
        if isinstance(n, ast.UnaryOp) and type(n.op) in _SAFE_OPERATORS:
            return _SAFE_OPERATORS[type(n.op)](_eval(n.operand))
        raise ValueError("Expresión no permitida")

    return _eval(node)


AGENT_SYSTEM_PROMPT = """Sos un asistente que resuelve problemas paso a paso, y podés usar UNA herramienta: una calculadora.

Cuando necesites calcular algo, respondé EXACTAMENTE en este formato, sin nada más:
Pensamiento: <tu razonamiento breve>
Acción: calculadora[<expresión aritmética, solo números y + - * / ** ( )>]

Cuando ya tengas la respuesta final, respondé EXACTAMENTE en este formato:
Pensamiento: <tu razonamiento breve>
Respuesta final: <la respuesta>

No respondas nada más que estos dos formatos. No inventes resultados de la calculadora: siempre pedí la acción y esperá la observación antes de calcular el siguiente paso."""

MAX_AGENT_STEPS = 4


def _parse_agent_turn(text: str) -> dict:
    thought_match = re.search(r"Pensamiento:\s*(.+?)(?:\n|$)", text)
    action_match = re.search(r"Acci[oó]n:\s*calculadora\[(.+?)\]", text)
    final_match = re.search(r"Respuesta final:\s*(.+)", text, re.DOTALL)
    return {
        "thought": thought_match.group(1).strip() if thought_match else None,
        "action_expression": action_match.group(1).strip() if action_match else None,
        "final_answer": final_match.group(1).strip() if final_match else None,
    }


def _call_model_with_fallback(system_prompt: str, user_content: str) -> str:
    last_error = None
    for model_id in OPENROUTER_MODELS:
        try:
            return _call_model(model_id, system_prompt, user_content)
        except Exception as e:
            last_error = e
            continue
    raise ValueError(f"Ningún modelo de la lista pudo responder. Último error: {last_error}")


def _run_agent(question: str, max_steps: int = MAX_AGENT_STEPS) -> list[dict]:
    conversation = f"Pregunta: {question}\n"
    steps: list[dict] = []

    for _ in range(max_steps):
        raw = _call_model_with_fallback(AGENT_SYSTEM_PROMPT, conversation)
        parsed = _parse_agent_turn(raw)
        step = {**parsed, "observation": None}

        if parsed["action_expression"] is not None:
            try:
                result = _safe_eval_arithmetic(parsed["action_expression"])
                observation = str(result)
            except Exception:
                observation = "Error: expresión inválida, no se pudo calcular"
            step["observation"] = observation
            conversation += f"{raw}\nObservación: {observation}\n"
            steps.append(step)
            continue

        if parsed["final_answer"] is not None:
            steps.append(step)
            break

        step["final_answer"] = raw.strip()
        steps.append(step)
        break

    return steps


@router.post("/agent", response_model=schemas.AgentResponse)
def agent_lab(req: schemas.AgentRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Escribí una pregunta para el agente")

    try:
        raw_steps = _run_agent(question)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"No se pudo ejecutar el agente: {e}")

    steps = [
        schemas.AgentStep(
            step_number=i + 1,
            thought=s.get("thought"),
            action_expression=s.get("action_expression"),
            observation=s.get("observation"),
            final_answer=s.get("final_answer"),
        )
        for i, s in enumerate(raw_steps)
    ]
    final_answer = next((s.final_answer for s in reversed(steps) if s.final_answer), None)
    num_tool_calls = sum(1 for s in steps if s.action_expression is not None)

    interpretation = (
        f"El agente pensó en {len(steps)} paso(s) y usó la calculadora {num_tool_calls} vez(veces) antes "
        f"de responder. Esta es la idea central de un 'agente': en vez de responder directo, el modelo "
        f"decide si necesita usar una herramienta externa, la usa, lee el resultado, y sigue razonando "
        f"con esa información nueva — el mismo patrón (a mayor escala, con más herramientas) que usan "
        f"los asistentes de IA que navegan la web, ejecutan código, o consultan bases de datos."
    )

    return schemas.AgentResponse(
        question=question,
        steps=steps,
        final_answer=final_answer,
        interpretation=interpretation,
    )