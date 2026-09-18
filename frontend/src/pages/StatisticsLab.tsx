import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { statsAPI } from "../api/client";
import api from "../api/client";
import type { DescriptiveStatsResponse, CoinFlipResponse, DiceRollResponse } from "../api/client";
import "../styles/AlgebraLab.css";

type StatsTab = "descriptive" | "coin" | "dice" | "lottery" | "birthday" | "monty-hall" | "poker" | "roulette";

/* ============================================================
   TIPOS de las 5 situaciones nuevas (coinciden con los schemas del backend)
   ============================================================ */

interface ConvergencePoint {
  trial: number;
  relative_frequency: number;
}

interface MatchProbability {
  matches: number;
  probability: number;
}

interface LotteryResponse {
  pool_size: number;
  numbers_to_pick: number;
  exact_jackpot_probability: number;
  jackpot_probability_display: string;
  match_distribution: MatchProbability[];
  num_trials: number;
  observed_jackpots: number;
  convergence: ConvergencePoint[];
  interpretation: string;
}

interface BirthdayParadoxResponse {
  group_size: number;
  days_in_year: number;
  exact_probability: number;
  num_trials: number;
  observed_matches: number;
  observed_frequency: number;
  convergence: ConvergencePoint[];
  interpretation: string;
}

interface MontyHallResponse {
  num_doors: number;
  exact_stay_probability: number;
  exact_switch_probability: number;
  num_trials: number;
  observed_stay_frequency: number;
  observed_switch_frequency: number;
  convergence_stay: ConvergencePoint[];
  convergence_switch: ConvergencePoint[];
  interpretation: string;
}

interface PokerHandResponse {
  target_hand: string;
  target_hand_label: string;
  exact_probability: number;
  exact_probability_display: string;
  num_trials: number;
  observed_count: number;
  observed_frequency: number;
  convergence: ConvergencePoint[];
  interpretation: string;
}

interface RouletteConvergencePoint {
  spin: number;
  average_net_per_bet: number;
}

interface RouletteResponse {
  wheel_type: string;
  bet_type: string;
  win_probability: number;
  payout_multiplier: number;
  expected_value_per_unit: number;
  house_edge_percent: number;
  num_spins: number;
  final_balance: number;
  convergence: RouletteConvergencePoint[];
  interpretation: string;
}

const POKER_HANDS: { id: string; label: string }[] = [
  { id: "one_pair", label: "Un par" },
  { id: "two_pair", label: "Doble par" },
  { id: "three_of_a_kind", label: "Trío" },
  { id: "straight", label: "Escalera" },
  { id: "flush", label: "Color" },
  { id: "full_house", label: "Full house" },
  { id: "four_of_a_kind", label: "Póker (4 iguales)" },
  { id: "straight_flush", label: "Escalera de color" },
  { id: "royal_flush", label: "Escalera real" },
  { id: "high_card", label: "Carta alta" },
];

export default function StatisticsLab() {
  const [activeTab, setActiveTab] = useState<StatsTab>("descriptive");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Descriptiva
  const [dataInput, setDataInput] = useState("4, 8, 6, 5, 3, 8, 9, 2, 8");
  const [statsResult, setStatsResult] = useState<DescriptiveStatsResponse | null>(null);

  // Moneda
  const [numFlips, setNumFlips] = useState("1000");
  const [coinResult, setCoinResult] = useState<CoinFlipResponse | null>(null);

  // Dados
  const [numRolls, setNumRolls] = useState("600");
  const [numSides, setNumSides] = useState("6");
  const [diceResult, setDiceResult] = useState<DiceRollResponse | null>(null);

  // Lotería
  const [poolSize, setPoolSize] = useState(45);
  const [numbersToPick, setNumbersToPick] = useState(6);
  const [lotteryTrials, setLotteryTrials] = useState(10000);
  const [lotteryResult, setLotteryResult] = useState<LotteryResponse | null>(null);

  // Cumpleaños
  const [groupSize, setGroupSize] = useState(23);
  const [birthdayTrials, setBirthdayTrials] = useState(5000);
  const [birthdayResult, setBirthdayResult] = useState<BirthdayParadoxResponse | null>(null);

  // Monty Hall
  const [numDoors, setNumDoors] = useState(3);
  const [montyTrials, setMontyTrials] = useState(5000);
  const [montyResult, setMontyResult] = useState<MontyHallResponse | null>(null);

  // Póker
  const [targetHand, setTargetHand] = useState("one_pair");
  const [pokerTrials, setPokerTrials] = useState(20000);
  const [pokerResult, setPokerResult] = useState<PokerHandResponse | null>(null);

  // Ruleta
  const [wheelType, setWheelType] = useState("european");
  const [betType, setBetType] = useState("red_black");
  const [betAmount, setBetAmount] = useState(1);
  const [numSpins, setNumSpins] = useState(2000);
  const [rouletteResult, setRouletteResult] = useState<RouletteResponse | null>(null);

  const handleDescriptive = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = dataInput.split(",").map((v) => v.trim()).filter((v) => v.length > 0).map(Number);
      if (data.some((n) => isNaN(n))) throw new Error("Revisá los valores, alguno no es un número válido");
      const result = await statsAPI.descriptive(data);
      setStatsResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al calcular estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleCoin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await statsAPI.simulateCoin(Number(numFlips));
      setCoinResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al simular");
    } finally {
      setLoading(false);
    }
  };

  const handleDice = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await statsAPI.simulateDice(Number(numRolls), Number(numSides));
      setDiceResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al simular");
    } finally {
      setLoading(false);
    }
  };

  async function handleLottery(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<LotteryResponse>("/api/probability/lottery", {
        pool_size: poolSize,
        numbers_to_pick: numbersToPick,
        num_trials: lotteryTrials,
      });
      setLotteryResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al calcular");
    } finally {
      setLoading(false);
    }
  }

  async function handleBirthday(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<BirthdayParadoxResponse>("/api/probability/birthday-paradox", {
        group_size: groupSize,
        days_in_year: 365,
        num_trials: birthdayTrials,
      });
      setBirthdayResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al calcular");
    } finally {
      setLoading(false);
    }
  }

  async function handleMontyHall(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<MontyHallResponse>("/api/probability/monty-hall", {
        num_doors: numDoors,
        num_trials: montyTrials,
      });
      setMontyResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al calcular");
    } finally {
      setLoading(false);
    }
  }

  async function handlePoker(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<PokerHandResponse>("/api/probability/poker-hand", {
        target_hand: targetHand,
        num_trials: pokerTrials,
      });
      setPokerResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al calcular");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoulette(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<RouletteResponse>("/api/probability/roulette", {
        wheel_type: wheelType,
        bet_type: betType,
        bet_amount: betAmount,
        num_spins: numSpins,
      });
      setRouletteResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al calcular");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="algebra-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>🎲 Laboratorio de Probabilidad y Estadística</h1>

      <nav className="tab-nav">
        <button className={`tab-button ${activeTab === "descriptive" ? "active" : ""}`} onClick={() => { setActiveTab("descriptive"); setError(null); }}>Estadística descriptiva</button>
        <button className={`tab-button ${activeTab === "coin" ? "active" : ""}`} onClick={() => { setActiveTab("coin"); setError(null); }}>Moneda</button>
        <button className={`tab-button ${activeTab === "dice" ? "active" : ""}`} onClick={() => { setActiveTab("dice"); setError(null); }}>Dados</button>
        <button className={`tab-button ${activeTab === "lottery" ? "active" : ""}`} onClick={() => { setActiveTab("lottery"); setError(null); }}>🎰 Lotería</button>
        <button className={`tab-button ${activeTab === "birthday" ? "active" : ""}`} onClick={() => { setActiveTab("birthday"); setError(null); }}>🎂 Cumpleaños</button>
        <button className={`tab-button ${activeTab === "monty-hall" ? "active" : ""}`} onClick={() => { setActiveTab("monty-hall"); setError(null); }}>🚪 Monty Hall</button>
        <button className={`tab-button ${activeTab === "poker" ? "active" : ""}`} onClick={() => { setActiveTab("poker"); setError(null); }}>🃏 Póker</button>
        <button className={`tab-button ${activeTab === "roulette" ? "active" : ""}`} onClick={() => { setActiveTab("roulette"); setError(null); }}>🎡 Ruleta</button>
      </nav>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="tab-content">
        {activeTab === "descriptive" && (
          <div className="form-card">
            <h2>Estadística Descriptiva</h2>
            <div className="form-group">
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>Datos (separados por coma)</label>
                <input value={dataInput} onChange={(e) => setDataInput(e.target.value)} placeholder="ej: 4, 8, 6, 5, 3" />
              </div>
              <button onClick={handleDescriptive} disabled={loading} className="submit-btn" style={{ gridColumn: "1 / -1" }}>
                {loading ? "⏳ Calculando..." : "✓ Calcular"}
              </button>
            </div>

            {statsResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>n</strong><span>{statsResult.count}</span></div>
                  <div className="detail-item"><strong>Media</strong><span>{statsResult.mean}</span></div>
                  <div className="detail-item"><strong>Mediana</strong><span>{statsResult.median}</span></div>
                  <div className="detail-item"><strong>Moda</strong><span>{statsResult.mode ?? "no hay una única"}</span></div>
                  <div className="detail-item"><strong>Varianza</strong><span>{statsResult.variance}</span></div>
                  <div className="detail-item"><strong>Desvío estándar</strong><span>{statsResult.std_dev}</span></div>
                  <div className="detail-item"><strong>Mínimo</strong><span>{statsResult.min_value}</span></div>
                  <div className="detail-item"><strong>Máximo</strong><span>{statsResult.max_value}</span></div>
                </div>
                <div className="steps-section">
                  <h4>Tabla de frecuencias</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={statsResult.frequency_table}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="value" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="absolute" name="Frecuencia absoluta" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "coin" && (
          <div className="form-card">
            <h2>Simulación de Lanzamiento de Moneda</h2>
            <div className="form-group">
              <div className="form-field">
                <label>Cantidad de lanzamientos</label>
                <input type="number" value={numFlips} onChange={(e) => setNumFlips(e.target.value)} min={1} max={100000} />
              </div>
              <button onClick={handleCoin} disabled={loading} className="submit-btn">{loading ? "⏳ Simulando..." : "✓ Simular"}</button>
            </div>
            {coinResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Caras</strong><span>{coinResult.heads_count}</span></div>
                  <div className="detail-item"><strong>Cecas</strong><span>{coinResult.tails_count}</span></div>
                  <div className="detail-item"><strong>Frec. relativa (cara)</strong><span>{coinResult.heads_relative_frequency}</span></div>
                  <div className="detail-item"><strong>Probabilidad teórica</strong><span>{coinResult.theoretical_probability}</span></div>
                </div>
                <div className="steps-section">
                  <h4>Convergencia hacia la probabilidad teórica</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={coinResult.convergence}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trial" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={0.5} stroke="#dc2626" strokeDasharray="4 3" label="0.5 teórico" />
                      <Line type="monotone" dataKey="relative_frequency" name="Frec. relativa (cara)" stroke="#4f46e5" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "dice" && (
          <div className="form-card">
            <h2>Simulación de Lanzamiento de Dados</h2>
            <div className="form-group">
              <div className="form-field">
                <label>Cantidad de tiradas</label>
                <input type="number" value={numRolls} onChange={(e) => setNumRolls(e.target.value)} min={1} max={100000} />
              </div>
              <div className="form-field">
                <label>Caras del dado</label>
                <input type="number" value={numSides} onChange={(e) => setNumSides(e.target.value)} min={2} />
              </div>
              <button onClick={handleDice} disabled={loading} className="submit-btn">{loading ? "⏳ Simulando..." : "✓ Simular"}</button>
            </div>
            {diceResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Tiradas</strong><span>{diceResult.num_rolls}</span></div>
                  <div className="detail-item"><strong>Media obtenida</strong><span>{diceResult.mean_result}</span></div>
                </div>
                <div className="steps-section">
                  <h4>Frecuencia relativa por cara (vs. teórica)</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={diceResult.frequency_table}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="value" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="relative" name="Observada" fill="#4f46e5" />
                      <Bar dataKey="theoretical" name="Teórica" fill="#a5b4fc" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- LOTERÍA ---------- */}
        {activeTab === "lottery" && (
          <div className="form-card">
            <h2>🎰 Lotería: ¿qué tan improbable es ganar?</h2>
            <p>Elegís k números de un bolillero de n. Calculamos la probabilidad exacta del pleno, y simulamos sorteos para verlo en la práctica.</p>
            <form onSubmit={handleLottery} className="form-group">
              <div className="form-field">
                <label>Tamaño del bolillero (n)</label>
                <input type="number" min={5} max={90} value={poolSize} onChange={(e) => setPoolSize(parseInt(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Números a elegir (k)</label>
                <input type="number" min={1} max={poolSize} value={numbersToPick} onChange={(e) => setNumbersToPick(parseInt(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Sorteos a simular</label>
                <input type="number" min={100} max={50000} value={lotteryTrials} onChange={(e) => setLotteryTrials(parseInt(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="submit-btn" style={{ gridColumn: "1 / -1" }}>{loading ? "⏳ Calculando..." : "✓ Calcular y simular"}</button>
            </form>

            {lotteryResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Probabilidad del pleno</strong><span>{lotteryResult.jackpot_probability_display}</span></div>
                  <div className="detail-item"><strong>Sorteos simulados</strong><span>{lotteryResult.num_trials.toLocaleString()}</span></div>
                  <div className="detail-item"><strong>Plenos observados</strong><span>{lotteryResult.observed_jackpots}</span></div>
                </div>
                <p style={{ marginTop: 12 }}>{lotteryResult.interpretation}</p>
                <div className="steps-section">
                  <h4>Probabilidad de acertar exactamente j números</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={lotteryResult.match_distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="matches" label={{ value: "Aciertos", position: "insideBottom", offset: -2 }} />
                      <YAxis />
                      <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(6) : v)} />
                      <Bar dataKey="probability" name="Probabilidad" fill="#7c3aed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- CUMPLEAÑOS ---------- */}
        {activeTab === "birthday" && (
          <div className="form-card">
            <h2>🎂 La paradoja del cumpleaños</h2>
            <p>¿Cuántas personas hacen falta en una sala para que sea más probable que dos compartan cumpleaños? Menos de lo que parece.</p>
            <form onSubmit={handleBirthday} className="form-group">
              <div className="form-field">
                <label>Personas en el grupo</label>
                <input type="number" min={2} max={365} value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Grupos a simular</label>
                <input type="number" min={100} max={50000} value={birthdayTrials} onChange={(e) => setBirthdayTrials(parseInt(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="submit-btn">{loading ? "⏳ Calculando..." : "✓ Calcular y simular"}</button>
            </form>

            {birthdayResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Probabilidad exacta</strong><span>{(birthdayResult.exact_probability * 100).toFixed(2)}%</span></div>
                  <div className="detail-item"><strong>Frec. observada</strong><span>{(birthdayResult.observed_frequency * 100).toFixed(2)}%</span></div>
                </div>
                <p style={{ marginTop: 12 }}>{birthdayResult.interpretation}</p>
                <div className="steps-section">
                  <h4>Convergencia hacia la probabilidad teórica</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={birthdayResult.convergence}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trial" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <ReferenceLine y={birthdayResult.exact_probability} stroke="#dc2626" strokeDasharray="4 3" label="teórico" />
                      <Line type="monotone" dataKey="relative_frequency" name="Frec. relativa" stroke="#4f46e5" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- MONTY HALL ---------- */}
        {activeTab === "monty-hall" && (
          <div className="form-card">
            <h2>🚪 El problema de Monty Hall</h2>
            <p>Elegís una puerta, el presentador abre otra vacía, ¿te conviene cambiar? Sí — y acá vas a ver por qué, con números.</p>
            <form onSubmit={handleMontyHall} className="form-group">
              <div className="form-field">
                <label>Cantidad de puertas</label>
                <input type="number" min={3} max={20} value={numDoors} onChange={(e) => setNumDoors(parseInt(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Partidas a simular</label>
                <input type="number" min={100} max={50000} value={montyTrials} onChange={(e) => setMontyTrials(parseInt(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="submit-btn">{loading ? "⏳ Calculando..." : "✓ Calcular y simular"}</button>
            </form>

            {montyResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>P(ganar quedándose)</strong><span>{(montyResult.exact_stay_probability * 100).toFixed(1)}%</span></div>
                  <div className="detail-item"><strong>P(ganar cambiando)</strong><span>{(montyResult.exact_switch_probability * 100).toFixed(1)}%</span></div>
                </div>
                <p style={{ marginTop: 12 }}>{montyResult.interpretation}</p>
                <div className="steps-section">
                  <h4>Convergencia: quedarse vs. cambiar</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={montyResult.convergence_stay.map((p, i) => ({
                      trial: p.trial,
                      quedarse: p.relative_frequency,
                      cambiar: montyResult.convergence_switch[i]?.relative_frequency,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trial" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={montyResult.exact_stay_probability} stroke="#9ca3af" strokeDasharray="4 3" />
                      <ReferenceLine y={montyResult.exact_switch_probability} stroke="#9ca3af" strokeDasharray="4 3" />
                      <Line type="monotone" dataKey="quedarse" stroke="#dc2626" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="cambiar" stroke="#16a34a" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- PÓKER ---------- */}
        {activeTab === "poker" && (
          <div className="form-card">
            <h2>🃏 Probabilidad de manos de póker</h2>
            <p>De un mazo de 52 cartas, ¿qué tan seguido sale cada tipo de mano en 5 cartas?</p>
            <form onSubmit={handlePoker} className="form-group">
              <div className="form-field">
                <label>Mano a analizar</label>
                <select value={targetHand} onChange={(e) => setTargetHand(e.target.value)}>
                  {POKER_HANDS.map((h) => (
                    <option key={h.id} value={h.id}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Manos a repartir</label>
                <input type="number" min={100} max={50000} value={pokerTrials} onChange={(e) => setPokerTrials(parseInt(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="submit-btn">{loading ? "⏳ Calculando..." : "✓ Calcular y simular"}</button>
            </form>

            {pokerResult && (
              <div className="result-card">
                <h3>✓ Resultado: {pokerResult.target_hand_label}</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Probabilidad exacta</strong><span>{pokerResult.exact_probability_display}</span></div>
                  <div className="detail-item"><strong>Manos repartidas</strong><span>{pokerResult.num_trials.toLocaleString()}</span></div>
                  <div className="detail-item"><strong>Veces que salió</strong><span>{pokerResult.observed_count}</span></div>
                </div>
                <p style={{ marginTop: 12 }}>{pokerResult.interpretation}</p>
                {pokerResult.convergence.length > 0 && (
                  <div className="steps-section">
                    <h4>Convergencia hacia la probabilidad teórica</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={pokerResult.convergence}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="trial" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={pokerResult.exact_probability} stroke="#dc2626" strokeDasharray="4 3" label="teórico" />
                        <Line type="monotone" dataKey="relative_frequency" name="Frec. relativa" stroke="#4f46e5" dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------- RULETA ---------- */}
        {activeTab === "roulette" && (
          <div className="form-card">
            <h2>🎡 Ruleta: por qué la banca siempre gana</h2>
            <p>Elegí tu apuesta y mirá cómo, en el largo plazo, el resultado converge a la ventaja matemática del casino.</p>
            <form onSubmit={handleRoulette} className="form-group">
              <div className="form-field">
                <label>Tipo de rueda</label>
                <select value={wheelType} onChange={(e) => setWheelType(e.target.value)}>
                  <option value="european">Europea (37 casilleros, un solo cero)</option>
                  <option value="american">Americana (38 casilleros, doble cero)</option>
                </select>
              </div>
              <div className="form-field">
                <label>Tipo de apuesta</label>
                <select value={betType} onChange={(e) => setBetType(e.target.value)}>
                  <option value="red_black">Rojo/Negro (paga 1 a 1)</option>
                  <option value="even_odd">Par/Impar (paga 1 a 1)</option>
                  <option value="dozen">Docena (paga 2 a 1)</option>
                  <option value="straight">Número pleno (paga 35 a 1)</option>
                </select>
              </div>
              <div className="form-field">
                <label>Monto apostado por tirada</label>
                <input type="number" min={0.01} step={0.5} value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Tiradas a simular</label>
                <input type="number" min={100} max={50000} value={numSpins} onChange={(e) => setNumSpins(parseInt(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="submit-btn" style={{ gridColumn: "1 / -1" }}>{loading ? "⏳ Calculando..." : "✓ Calcular y simular"}</button>
            </form>

            {rouletteResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <div className="result-details">
                  <div className="detail-item"><strong>Probabilidad de ganar</strong><span>{(rouletteResult.win_probability * 100).toFixed(2)}%</span></div>
                  <div className="detail-item"><strong>Pago</strong><span>{rouletteResult.payout_multiplier} a 1</span></div>
                  <div className="detail-item"><strong>Ventaja de la banca</strong><span>{rouletteResult.house_edge_percent.toFixed(2)}%</span></div>
                  <div className="detail-item"><strong>Balance final simulado</strong><span>{rouletteResult.final_balance >= 0 ? "+" : ""}{rouletteResult.final_balance}</span></div>
                </div>
                <p style={{ marginTop: 12 }}>{rouletteResult.interpretation}</p>
                <div className="steps-section">
                  <h4>Ganancia/pérdida promedio por apuesta, a lo largo del tiempo</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={rouletteResult.convergence}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="spin" />
                      <YAxis />
                      <Tooltip />
                      <ReferenceLine y={rouletteResult.expected_value_per_unit * betAmount} stroke="#dc2626" strokeDasharray="4 3" label="EV teórico" />
                      <ReferenceLine y={0} stroke="#9ca3af" />
                      <Line type="monotone" dataKey="average_net_per_bet" name="Promedio observado" stroke="#4f46e5" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}