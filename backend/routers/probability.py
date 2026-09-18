"""
Situaciones de probabilidad de la vida real: lotería, la paradoja del
cumpleaños, el problema de Monty Hall, manos de póker, y la ruleta.
Cada endpoint calcula la probabilidad EXACTA por combinatoria, y además
corre una simulación de Monte Carlo para mostrar cómo la frecuencia
observada converge hacia ese valor teórico.
"""
import random
from collections import Counter
from math import comb

import numpy as np
from fastapi import APIRouter, HTTPException

import schemas

router = APIRouter(prefix="/api/probability", tags=["probability"])

MAX_TRIALS = 50000


# ==================== LOTERÍA ====================

@router.post("/lottery", response_model=schemas.LotteryResponse)
def lottery_lab(req: schemas.LotteryRequest):
    try:
        n = req.pool_size
        k = req.numbers_to_pick
        num_trials = max(100, min(req.num_trials, MAX_TRIALS))

        if k < 1 or k > n:
            raise ValueError("La cantidad de números a elegir tiene que estar entre 1 y el tamaño del bolillero")
        if n > 90:
            raise ValueError("Por rendimiento, el bolillero no puede ser mayor a 90 números")

        total_combinations = comb(n, k)
        exact_jackpot_probability = 1.0 / total_combinations

        # Distribución hipergeométrica: P(acertar exactamente j de los k
        # números elegidos), para j = 0..k.
        match_distribution = []
        for j in range(k + 1):
            ways = comb(k, j) * comb(n - k, k - j)
            match_distribution.append(
                schemas.MatchProbability(matches=j, probability=ways / total_combinations)
            )

        # Simulación: el "jugador" siempre elige el mismo conjunto fijo
        # {0, 1, ..., k-1} — por simetría, da exactamente lo mismo que
        # cualquier otro conjunto de k números.
        player_set = set(range(k))
        pool = list(range(n))
        observed_jackpots = 0
        convergence = []
        for trial in range(1, num_trials + 1):
            draw = set(random.sample(pool, k))
            if draw == player_set:
                observed_jackpots += 1
            if trial % max(1, num_trials // 300) == 0 or trial == num_trials:
                convergence.append(
                    schemas.ConvergencePoint(trial=trial, relative_frequency=observed_jackpots / trial)
                )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular: {e}")

    display = f"1 en {total_combinations:,.0f}".replace(",", ".")

    if observed_jackpots == 0:
        rarity_note = (
            f"En {num_trials:,} simulaciones no salió ni una sola vez el pleno — totalmente esperable, "
            f"porque la probabilidad exacta es {display}. Esa es justamente la lección: para que la "
            f"frecuencia empírica se acerque a un valor tan chico, hacen falta muchísimos más intentos "
            f"que los que cualquier simulación razonable puede correr."
        ).replace(",", ".")
    else:
        rarity_note = (
            f"Con {num_trials:,} simulaciones, salió el pleno {observed_jackpots} vez/veces "
            f"({observed_jackpots / num_trials:.6f} de frecuencia observada) — cerca del valor exacto."
        ).replace(",", ".")

    interpretation = (
        f"Elegir {k} números correctos entre {n} tiene una probabilidad exacta de {exact_jackpot_probability:.9f} "
        f"({display}). {rarity_note}"
    )

    return schemas.LotteryResponse(
        pool_size=n,
        numbers_to_pick=k,
        exact_jackpot_probability=exact_jackpot_probability,
        jackpot_probability_display=display,
        match_distribution=match_distribution,
        num_trials=num_trials,
        observed_jackpots=observed_jackpots,
        convergence=convergence,
        interpretation=interpretation,
    )


# ==================== PARADOJA DEL CUMPLEAÑOS ====================

@router.post("/birthday-paradox", response_model=schemas.BirthdayParadoxResponse)
def birthday_paradox_lab(req: schemas.BirthdayParadoxRequest):
    try:
        m = req.group_size
        days = req.days_in_year
        num_trials = max(100, min(req.num_trials, MAX_TRIALS))

        if m < 2 or m > days:
            raise ValueError("El tamaño del grupo tiene que ser al menos 2, y no puede superar la cantidad de días del año")

        # P(sin coincidencias) = producto de (días - i) / días, para i=0..m-1
        prob_no_match = 1.0
        for i in range(m):
            prob_no_match *= (days - i) / days
        exact_probability = 1.0 - prob_no_match

        observed_matches = 0
        convergence = []
        for trial in range(1, num_trials + 1):
            birthdays = [random.randint(1, days) for _ in range(m)]
            if len(set(birthdays)) < m:
                observed_matches += 1
            if trial % max(1, num_trials // 300) == 0 or trial == num_trials:
                convergence.append(
                    schemas.ConvergencePoint(trial=trial, relative_frequency=observed_matches / trial)
                )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular: {e}")

    observed_frequency = observed_matches / num_trials

    interpretation = (
        f"Con {m} personas en la sala (y {days} días posibles), la probabilidad exacta de que al menos "
        f"dos compartan la misma fecha de cumpleaños es {exact_probability * 100:.2f}%. La simulación de "
        f"{num_trials:,} grupos aleatorios dio una frecuencia de {observed_frequency * 100:.2f}%, cerca del "
        f"valor teórico. Lo contraintuitivo: con solo 23 personas ya supera el 50%, aunque el año tenga 365 días."
    ).replace(",", ".")

    return schemas.BirthdayParadoxResponse(
        group_size=m,
        days_in_year=days,
        exact_probability=exact_probability,
        num_trials=num_trials,
        observed_matches=observed_matches,
        observed_frequency=observed_frequency,
        convergence=convergence,
        interpretation=interpretation,
    )


# ==================== MONTY HALL ====================

@router.post("/monty-hall", response_model=schemas.MontyHallResponse)
def monty_hall_lab(req: schemas.MontyHallRequest):
    try:
        n = req.num_doors
        num_trials = max(100, min(req.num_trials, MAX_TRIALS))

        if n < 3:
            raise ValueError("Hacen falta al menos 3 puertas para que el problema tenga sentido")

        # El presentador, sabiendo dónde está el premio, abre todas las
        # puertas vacías salvo una entre las que el jugador no eligió.
        # Resultado matemático (para cualquier n >= 3):
        #   P(ganar quedándose) = 1/n
        #   P(ganar cambiando)  = (n-1)/n
        exact_stay_probability = 1.0 / n
        exact_switch_probability = (n - 1) / n

        stay_wins = 0
        switch_wins = 0
        convergence_stay = []
        convergence_switch = []
        for trial in range(1, num_trials + 1):
            prize_door = random.randrange(n)
            player_pick = random.randrange(n)
            if player_pick == prize_door:
                stay_wins += 1
            else:
                # El presentador va a dejar sin abrir, entre las puertas
                # no elegidas, únicamente la del premio — así que cambiar
                # siempre gana cuando la elección inicial fue incorrecta.
                switch_wins += 1

            if trial % max(1, num_trials // 300) == 0 or trial == num_trials:
                convergence_stay.append(schemas.ConvergencePoint(trial=trial, relative_frequency=stay_wins / trial))
                convergence_switch.append(schemas.ConvergencePoint(trial=trial, relative_frequency=switch_wins / trial))

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular: {e}")

    interpretation = (
        f"Con {n} puertas, quedarse con la elección original gana el {exact_stay_probability * 100:.1f}% de "
        f"las veces, pero cambiar de puerta gana el {exact_switch_probability * 100:.1f}%. La razón: cambiar "
        f"solo pierde si acertaste de entrada (probabilidad 1/{n}) — en cualquier otro caso, el presentador "
        f"ya dejó la puerta del premio como la única alternativa disponible. Con la simulación de "
        f"{num_trials:,} partidas, quedarse ganó el {(stay_wins / num_trials) * 100:.1f}% y cambiar el "
        f"{(switch_wins / num_trials) * 100:.1f}%."
    ).replace(",", ".")

    return schemas.MontyHallResponse(
        num_doors=n,
        exact_stay_probability=exact_stay_probability,
        exact_switch_probability=exact_switch_probability,
        num_trials=num_trials,
        observed_stay_frequency=stay_wins / num_trials,
        observed_switch_frequency=switch_wins / num_trials,
        convergence_stay=convergence_stay,
        convergence_switch=convergence_switch,
        interpretation=interpretation,
    )


# ==================== MANOS DE PÓKER ====================

# Conteos combinatorios clásicos para una mano de 5 cartas de un mazo de
# 52 (sin comodines), sobre un total de C(52,5) = 2.598.960 manos posibles.
POKER_HAND_COUNTS = {
    "royal_flush": 4,
    "straight_flush": 36,
    "four_of_a_kind": 624,
    "full_house": 3744,
    "flush": 5108,
    "straight": 10200,
    "three_of_a_kind": 54912,
    "two_pair": 123552,
    "one_pair": 1098240,
    "high_card": 1302540,
}

POKER_HAND_LABELS = {
    "royal_flush": "Escalera real",
    "straight_flush": "Escalera de color",
    "four_of_a_kind": "Póker (4 iguales)",
    "full_house": "Full house",
    "flush": "Color",
    "straight": "Escalera",
    "three_of_a_kind": "Trío",
    "two_pair": "Doble par",
    "one_pair": "Un par",
    "high_card": "Carta alta",
}

TOTAL_POKER_HANDS = comb(52, 5)


def _classify_poker_hand(cards: list[tuple[int, int]]) -> str:
    """cards: lista de 5 tuplas (rango 2-14, palo 0-3). Devuelve el tipo de mano."""
    ranks = sorted(c[0] for c in cards)
    suits = [c[1] for c in cards]
    rank_counts = Counter(ranks)
    counts = sorted(rank_counts.values(), reverse=True)
    is_flush = len(set(suits)) == 1

    unique_ranks = sorted(set(ranks))
    is_straight = False
    if len(unique_ranks) == 5:
        if unique_ranks[-1] - unique_ranks[0] == 4:
            is_straight = True
        elif unique_ranks == [2, 3, 4, 5, 14]:  # escalera "rueda": A-2-3-4-5
            is_straight = True

    if is_straight and is_flush:
        if set(unique_ranks) == {10, 11, 12, 13, 14}:
            return "royal_flush"
        return "straight_flush"
    if counts == [4, 1]:
        return "four_of_a_kind"
    if counts == [3, 2]:
        return "full_house"
    if is_flush:
        return "flush"
    if is_straight:
        return "straight"
    if counts == [3, 1, 1]:
        return "three_of_a_kind"
    if counts == [2, 2, 1]:
        return "two_pair"
    if counts == [2, 1, 1, 1]:
        return "one_pair"
    return "high_card"


@router.post("/poker-hand", response_model=schemas.PokerHandResponse)
def poker_hand_lab(req: schemas.PokerHandRequest):
    try:
        target = req.target_hand
        if target not in POKER_HAND_COUNTS:
            raise ValueError(f"Mano no reconocida: {target}")
        num_trials = max(100, min(req.num_trials, MAX_TRIALS))

        exact_probability = POKER_HAND_COUNTS[target] / TOTAL_POKER_HANDS

        deck = [(rank, suit) for rank in range(2, 15) for suit in range(4)]
        observed_count = 0
        convergence = []
        for trial in range(1, num_trials + 1):
            hand = random.sample(deck, 5)
            if _classify_poker_hand(hand) == target:
                observed_count += 1
            if trial % max(1, num_trials // 300) == 0 or trial == num_trials:
                convergence.append(
                    schemas.ConvergencePoint(trial=trial, relative_frequency=observed_count / trial)
                )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular: {e}")

    display = f"1 en {round(1 / exact_probability):,.0f}".replace(",", ".")

    if observed_count == 0:
        rarity_note = (
            f"En {num_trials:,} manos repartidas no salió ninguna — totalmente esperable para una mano "
            f"tan poco frecuente ({display})."
        ).replace(",", ".")
    else:
        rarity_note = (
            f"En {num_trials:,} manos repartidas, salió {observed_count} vez/veces "
            f"({observed_count / num_trials:.6f} de frecuencia observada)."
        ).replace(",", ".")

    interpretation = (
        f"La probabilidad exacta de recibir '{POKER_HAND_LABELS[target]}' en una mano de 5 cartas es "
        f"{exact_probability:.8f} ({display}). {rarity_note}"
    )

    return schemas.PokerHandResponse(
        target_hand=target,
        target_hand_label=POKER_HAND_LABELS[target],
        exact_probability=exact_probability,
        exact_probability_display=display,
        num_trials=num_trials,
        observed_count=observed_count,
        observed_frequency=observed_count / num_trials,
        convergence=convergence,
        interpretation=interpretation,
    )


# ==================== RULETA ====================

ROULETTE_BETS = {
    # bet_type: (probabilidad_de_ganar_por_casillero, multiplicador_de_pago "X" en "X a 1")
    "straight": (1, 35),
    "red_black": (18, 1),
    "even_odd": (18, 1),
    "dozen": (12, 2),
}


@router.post("/roulette", response_model=schemas.RouletteResponse)
def roulette_lab(req: schemas.RouletteRequest):
    try:
        if req.bet_type not in ROULETTE_BETS:
            raise ValueError(f"Tipo de apuesta no reconocido: {req.bet_type}")
        num_slots = 38 if req.wheel_type == "american" else 37
        winning_slots, payout_multiplier = ROULETTE_BETS[req.bet_type]
        bet_amount = max(0.01, req.bet_amount)
        num_spins = max(100, min(req.num_spins, MAX_TRIALS))

        win_probability = winning_slots / num_slots
        # Ganancia esperada por unidad apostada: p*(pago+1) - 1
        # (el +1 es porque al ganar también recuperás tu apuesta original)
        expected_value_per_unit = win_probability * (payout_multiplier + 1) - 1
        house_edge_percent = -expected_value_per_unit * 100

        balance = 0.0
        convergence = []
        for spin in range(1, num_spins + 1):
            landing = random.randrange(num_slots)
            win = landing < winning_slots  # cualquier partición fija de casilleros sirve, por simetría
            net = bet_amount * payout_multiplier if win else -bet_amount
            balance += net
            if spin % max(1, num_spins // 300) == 0 or spin == num_spins:
                convergence.append(
                    schemas.RouletteConvergencePoint(spin=spin, average_net_per_bet=balance / spin)
                )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular: {e}")

    interpretation = (
        f"Esta apuesta gana el {win_probability * 100:.2f}% de las veces y paga {payout_multiplier} a 1. "
        f"En promedio, por cada unidad apostada perdés {house_edge_percent:.2f}% — esa es la ventaja de la "
        f"banca. Después de {num_spins:,} tiradas apostando siempre lo mismo, terminaste con un balance de "
        f"{'ganancia' if balance >= 0 else 'pérdida'} de {abs(balance):.2f}, cerca de lo que predice la "
        f"esperanza matemática: no importa cuánto juegues, en el largo plazo la banca siempre termina ganando."
    ).replace(",", ".")

    return schemas.RouletteResponse(
        wheel_type=req.wheel_type,
        bet_type=req.bet_type,
        win_probability=win_probability,
        payout_multiplier=payout_multiplier,
        expected_value_per_unit=round(expected_value_per_unit, 6),
        house_edge_percent=round(house_edge_percent, 4),
        num_spins=num_spins,
        final_balance=round(balance, 2),
        convergence=convergence,
        interpretation=interpretation,
    )