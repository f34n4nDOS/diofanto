import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { statsAPI } from "../api/client";
import type { DescriptiveStatsResponse, CoinFlipResponse, DiceRollResponse } from "../api/client";
import "../styles/AlgebraLab.css";

type StatsTab = "descriptive" | "coin" | "dice";

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

  const handleDescriptive = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = dataInput
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map(Number);
      if (data.some((n) => isNaN(n))) {
        throw new Error("Revisá los valores, alguno no es un número válido");
      }
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

  return (
    <div className="algebra-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>🎲 Laboratorio de Probabilidad y Estadística</h1>

      <nav className="tab-nav">
        <button className={`tab-button ${activeTab === "descriptive" ? "active" : ""}`} onClick={() => { setActiveTab("descriptive"); setError(null); }}>
          Estadística descriptiva
        </button>
        <button className={`tab-button ${activeTab === "coin" ? "active" : ""}`} onClick={() => { setActiveTab("coin"); setError(null); }}>
          Simulación de moneda
        </button>
        <button className={`tab-button ${activeTab === "dice" ? "active" : ""}`} onClick={() => { setActiveTab("dice"); setError(null); }}>
          Simulación de dados
        </button>
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
              <button onClick={handleCoin} disabled={loading} className="submit-btn">
                {loading ? "⏳ Simulando..." : "✓ Simular"}
              </button>
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
              <button onClick={handleDice} disabled={loading} className="submit-btn">
                {loading ? "⏳ Simulando..." : "✓ Simular"}
              </button>
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
      </div>
    </div>
  );
}