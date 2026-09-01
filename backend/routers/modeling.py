"""
Router para el laboratorio de modelaje matemático.
Permite construir y analizar modelos matemáticos complejos.
"""
import numpy as np
from fastapi import APIRouter, HTTPException
from sympy import symbols, sympify, diff, solve, Eq, lambdify, simplify
from math_utils import parse_expression, to_latex
import schemas
from ode_solver import (
    solve_ode_system, 
    add_stochastic_noise, 
    PredefinedModels,
    get_model_description,
    get_model_equations,
    get_default_parameters,
)
from scipy.integrate import odeint
import json

router = APIRouter(prefix="/api/modeling", tags=["modeling"])


@router.post("/build-model", response_model=schemas.BuildModelResponse)
def build_model(req: schemas.BuildModelRequest):
    """
    Construye un modelo matemático a partir de ecuaciones.
    Permite definir variables, parámetros y relaciones.
    """
    try:
        equations = []
        for eq_str in req.equations:
            eq = parse_expression(eq_str)
            equations.append(eq)
        
        if not equations:
            raise ValueError("Debe proporcionar al menos una ecuación")
        
        # Análisis del modelo
        all_symbols = set()
        for eq in equations:
            all_symbols.update(eq.free_symbols)
        
        variables = [str(s) for s in all_symbols if str(s) not in req.parameters]
        
        # Información del modelo
        model_info = {
            "num_equations": len(equations),
            "variables": variables,
            "parameters": req.parameters,
            "total_symbols": len(all_symbols)
        }
        
        return schemas.BuildModelResponse(
            success=True,
            message="Modelo construido correctamente",
            model_info=model_info,
            equations=[str(eq) for eq in equations],
            equations_latex=[to_latex(eq) for eq in equations]
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en el modelo: {e}")


@router.post("/predict", response_model=schemas.PredictResponse)
def predict(req: schemas.PredictRequest):
    """
    Realiza predicciones usando el modelo definido.
    Evalúa la expresión para valores específicos.
    """
    try:
        expr = parse_expression(req.expression)
        var_symbols = {var: float(val) for var, val in req.variable_values.items()}
        
        # Sustituir variables
        result = expr
        for var, val in var_symbols.items():
            result = result.subs(symbols(var), val)
        
        prediction_value = float(result)
        
        return schemas.PredictResponse(
            expression=str(expr),
            expression_latex=to_latex(expr),
            variable_values=req.variable_values,
            prediction=prediction_value,
            prediction_rounded=round(prediction_value, 4)
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en la predicción: {e}")


@router.post("/sensitivity-analysis", response_model=schemas.SensitivityResponse)
def sensitivity_analysis(req: schemas.SensitivityRequest):
    """
    Análisis de sensibilidad: cómo cambia el resultado
    cuando varían los parámetros.
    """
    try:
        expr = parse_expression(req.expression)
        param = symbols(req.parameter)
        
        # Derivada parcial respecto al parámetro
        partial_deriv = diff(expr, param)
        
        # Evaluamos la sensibilidad en el punto base
        var_symbols = {var: float(val) for var, val in req.base_values.items()}
        sensitivity_value = float(partial_deriv.subs(
            {symbols(var): val for var, val in var_symbols.items()}
        ))
        
        # Calculamos cambios en un rango
        changes = []
        param_values = np.linspace(
            req.parameter_min,
            req.parameter_max,
            req.num_points
        )
        
        for p_val in param_values:
            var_symbols_copy = var_symbols.copy()
            var_symbols_copy[req.parameter] = p_val
            
            result = expr
            for var, val in var_symbols_copy.items():
                result = result.subs(symbols(var), val)
            
            changes.append({
                "parameter_value": float(p_val),
                "output": float(result)
            })
        
        return schemas.SensitivityResponse(
            parameter=req.parameter,
            base_values=req.base_values,
            sensitivity_at_base=round(sensitivity_value, 4),
            sensitivity_interpretation=get_sensitivity_interpretation(sensitivity_value),
            parameter_changes=changes,
            derivative_expression=str(partial_deriv),
            derivative_latex=to_latex(partial_deriv)
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en análisis de sensibilidad: {e}")


@router.post("/optimization", response_model=schemas.OptimizationResponse)
def optimization(req: schemas.OptimizationRequest):
    """
    Encuentra puntos críticos y extremos de la función objetivo.
    """
    try:
        objective = parse_expression(req.objective_function)
        var = symbols(req.variable)
        
        # Primera derivada
        first_deriv = diff(objective, var)
        
        # Encontrar puntos críticos
        critical_points = []
        try:
            solutions = solve(Eq(first_deriv, 0), var)
            for sol in solutions:
                if sol.is_real:
                    x_val = float(sol)
                    # Evaluar segunda derivada para clasificar
                    second_deriv = diff(first_deriv, var)
                    second_val = float(second_deriv.subs(var, sol))
                    
                    if second_val > 0:
                        point_type = "Mínimo local"
                    elif second_val < 0:
                        point_type = "Máximo local"
                    else:
                        point_type = "Punto de inflexión"
                    
                    y_val = float(objective.subs(var, sol))
                    critical_points.append({
                        "x": x_val,
                        "y": y_val,
                        "type": point_type,
                        "second_derivative": round(second_val, 4)
                    })
        except Exception:
            pass
        
        return schemas.OptimizationResponse(
            objective_function=str(objective),
            objective_latex=to_latex(objective),
            variable=req.variable,
            first_derivative=str(first_deriv),
            first_derivative_latex=to_latex(first_deriv),
            critical_points=critical_points,
            optimization_type=req.optimization_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en optimización: {e}")


@router.post("/plot-model", response_model=schemas.PlotModelResponse)
def plot_model(req: schemas.PlotModelRequest):
    """
    Genera datos para graficar el modelo.
    """
    try:
        expr = parse_expression(req.expression)
        
        # Substituir parámetros
        for param, val in req.parameters.items():
            expr = expr.subs(symbols(param), val)
        
        free_syms = expr.free_symbols
        if len(free_syms) > 1:
            raise ValueError("La expresión debe tener una sola variable para graficar")
        
        var = list(free_syms)[0] if free_syms else symbols("x")
        f = lambdify(var, expr, modules=["numpy"])
        
        xs = np.linspace(req.x_min, req.x_max, req.num_points)
        with np.errstate(all="ignore"):
            ys = f(xs)
        
        # Limpiar infinitos y NaN
        valid_mask = np.isfinite(ys)
        xs_valid = xs[valid_mask]
        ys_valid = ys[valid_mask]
        
        points = [
            {"x": round(float(x), 4), "y": round(float(y), 4)}
            for x, y in zip(xs_valid, ys_valid)
        ]
        
        return schemas.PlotModelResponse(
            expression=str(expr),
            expression_latex=to_latex(expr),
            points=points,
            x_min=req.x_min,
            x_max=req.x_max,
            domain_note=f"Dominio: [{req.x_min}, {req.x_max}]"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al graficar: {e}")


def get_sensitivity_interpretation(sensitivity_value: float) -> str:
    """
    Interpreta el valor de sensibilidad.
    """
    abs_val = abs(sensitivity_value)
    if abs_val < 0.1:
        return "Muy baja sensibilidad: el parámetro tiene poco efecto"
    elif abs_val < 1:
        return "Baja sensibilidad: cambios pequeños del parámetro"
    elif abs_val < 10:
        return "Sensibilidad moderada: el parámetro tiene efecto notable"
    else:
        return "Alta sensibilidad: el parámetro tiene gran impacto"


# ==================== SIMULACIÓN EVOLUTIVA ====================

@router.post("/simulate-growth", response_model=schemas.SimulationResponse)
def simulate_growth(req: schemas.SimulationRequest):
    """
    Simula crecimiento poblacional o similar usando tasas de cambio.
    Modelos soportados: Malthus, Logístico, Exponencial.
    """
    try:
        simulation_data = []
        
        if req.model_type == "malthus":
            # Modelo de Malthus: P(t) = P0 * e^(r*t)
            P0 = req.initial_value
            r = req.rate_parameters.get("growth_rate", 0.01)
            
            for t in np.linspace(0, req.time_periods, req.num_points):
                P_t = P0 * np.exp(r * t)
                simulation_data.append({
                    "time": float(t),
                    "value": float(P_t),
                    "rate_of_change": float(r * P_t)
                })
        
        elif req.model_type == "logistic":
            # Modelo Logístico: dP/dt = r*P*(1 - P/K)
            # Solución: P(t) = K / (1 + ((K - P0)/P0)*e^(-r*t))
            P0 = req.initial_value
            r = req.rate_parameters.get("growth_rate", 0.01)
            K = req.rate_parameters.get("carrying_capacity", P0 * 2)
            
            for t in np.linspace(0, req.time_periods, req.num_points):
                P_t = K / (1 + ((K - P0) / P0) * np.exp(-r * t))
                simulation_data.append({
                    "time": float(t),
                    "value": float(P_t),
                    "rate_of_change": float(r * P_t * (1 - P_t / K))
                })
        
        elif req.model_type == "compound_interest":
            # Interés compuesto: A(t) = P0 * (1 + r/n)^(n*t)
            # Simplificado a continuo: A(t) = P0 * e^(r*t)
            P0 = req.initial_value
            r = req.rate_parameters.get("interest_rate", 0.05)
            
            for t in np.linspace(0, req.time_periods, req.num_points):
                A_t = P0 * np.exp(r * t)
                simulation_data.append({
                    "time": float(t),
                    "value": float(A_t),
                    "rate_of_change": float(r * A_t)
                })
        
        elif req.model_type == "decay":
            # Decaimiento exponencial: N(t) = N0 * e^(-λ*t)
            N0 = req.initial_value
            lambda_rate = req.rate_parameters.get("decay_rate", 0.01)
            
            for t in np.linspace(0, req.time_periods, req.num_points):
                N_t = N0 * np.exp(-lambda_rate * t)
                simulation_data.append({
                    "time": float(t),
                    "value": float(N_t),
                    "rate_of_change": float(-lambda_rate * N_t)
                })
        
        elif req.model_type == "vital_rates":
            # Modelo de tasas vitales: dP/dt = (birth_rate - death_rate) * P
            P = req.initial_value
            birth_rate = req.rate_parameters.get("birth_rate", 0.02)
            death_rate = req.rate_parameters.get("death_rate", 0.01)
            net_rate = birth_rate - death_rate
            
            for t in np.linspace(0, req.time_periods, req.num_points):
                P_t = P * np.exp(net_rate * t)
                simulation_data.append({
                    "time": float(t),
                    "value": float(P_t),
                    "rate_of_change": float(net_rate * P_t)
                })
        
        else:
            raise ValueError(f"Modelo no soportado: {req.model_type}")
        
        # Análisis final
        final_value = simulation_data[-1]["value"] if simulation_data else req.initial_value
        final_rate = simulation_data[-1]["rate_of_change"] if simulation_data else 0
        percent_change = ((final_value - req.initial_value) / req.initial_value * 100) if req.initial_value != 0 else 0
        
        return schemas.SimulationResponse(
            model_type=req.model_type,
            initial_value=req.initial_value,
            final_value=final_value,
            percent_change=round(percent_change, 2),
            rate_parameters=req.rate_parameters,
            time_periods=req.time_periods,
            simulation_data=simulation_data,
            interpretation=interpret_simulation_result(req.model_type, percent_change, final_value, req.initial_value)
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en simulación: {e}")


@router.post("/climate-forecast", response_model=schemas.ClimateForecastResponse)
def climate_forecast(req: schemas.ClimateForecastRequest):
    """
    Predice cambios climáticos basado en parámetros como:
    - Temperatura inicial
    - Tasa de cambio climático
    - Variabilidad estacional
    """
    try:
        forecast_data = []
        
        T_base = req.initial_temperature
        trend = req.warming_trend  # cambio por año
        seasonal_amplitude = req.seasonal_amplitude  # amplitud de variación
        
        months_data = []
        for month in range(req.months_to_forecast):
            # Tendencia lineal + componente estacional
            years_passed = month / 12.0
            trend_component = T_base + trend * years_passed
            
            # Variación estacional (ciclo anual)
            seasonal_component = seasonal_amplitude * np.sin(2 * np.pi * (month % 12) / 12)
            
            T_month = trend_component + seasonal_component
            
            # Agregamos ruido pequeño (variabilidad)
            noise = np.random.normal(0, req.variability)
            T_month += noise
            
            months_data.append({
                "month": int(month),
                "temperature": round(float(T_month), 2),
                "trend_only": round(float(trend_component), 2)
            })
        
        # Estadísticas del pronóstico
        temps = [d["temperature"] for d in months_data]
        final_temp = temps[-1]
        avg_temp = np.mean(temps)
        max_temp = np.max(temps)
        min_temp = np.min(temps)
        
        return schemas.ClimateForecastResponse(
            initial_temperature=req.initial_temperature,
            months_to_forecast=req.months_to_forecast,
            warming_trend=req.warming_trend,
            final_temperature=round(final_temp, 2),
            average_temperature=round(avg_temp, 2),
            max_temperature=round(max_temp, 2),
            min_temperature=round(min_temp, 2),
            forecast_data=months_data,
            interpretation=interpret_climate_forecast(req.warming_trend, avg_temp - req.initial_temperature)
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en pronóstico climático: {e}")


@router.post("/multi-compartment-model", response_model=schemas.MultiCompartmentResponse)
def multi_compartment_model(req: schemas.MultiCompartmentRequest):
    """
    Simula un modelo de múltiples compartimentos (e.g., SEIR para epidemiología).
    S: Susceptible, E: Expuesto, I: Infectado, R: Recuperado
    """
    try:
        # Parámetros del modelo SEIR
        S = req.initial_values.get("S", 99000)
        E = req.initial_values.get("E", 0)
        I = req.initial_values.get("I", 100)
        R = req.initial_values.get("R", 0)
        
        N = S + E + I + R  # Población total
        
        beta = req.transmission_rate  # Tasa de transmisión
        sigma = req.incubation_rate  # Tasa de incubación (1/incubation_period)
        gamma = req.recovery_rate  # Tasa de recuperación
        
        simulation_data = []
        
        for day in range(req.days_to_simulate):
            # Ecuaciones diferenciales SEIR
            dS = -beta * S * I / N
            dE = beta * S * I / N - sigma * E
            dI = sigma * E - gamma * I
            dR = gamma * I
            
            # Actualizar compartimentos
            S += dS
            E += dE
            I += dI
            R += dR
            
            # Asegurar valores no negativos
            S = max(0, S)
            E = max(0, E)
            I = max(0, I)
            R = max(0, R)
            
            simulation_data.append({
                "day": day,
                "susceptible": int(S),
                "exposed": int(E),
                "infected": int(I),
                "recovered": int(R),
                "total": int(N)
            })
        
        # Estadísticas
        peak_infected = max([d["infected"] for d in simulation_data])
        peak_day = next(d["day"] for d in simulation_data if d["infected"] == peak_infected)
        total_infected = req.initial_values.get("I", 100) + simulation_data[-1]["recovered"]
        
        return schemas.MultiCompartmentResponse(
            model_type="SEIR",
            days_to_simulate=req.days_to_simulate,
            initial_values=req.initial_values,
            transmission_rate=beta,
            recovery_rate=gamma,
            peak_infected=peak_infected,
            peak_day=peak_day,
            total_infected=total_infected,
            simulation_data=simulation_data,
            interpretation=interpret_epidemiological_model(peak_infected, peak_day, total_infected, N)
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en modelo multicompartimiento: {e}")


# ==================== FUNCIONES DE INTERPRETACIÓN ====================

def interpret_simulation_result(model_type: str, percent_change: float, final_value: float, initial_value: float) -> str:
    """
    Interpreta los resultados de una simulación.
    """
    if model_type == "malthus":
        if percent_change > 0:
            return f"Crecimiento exponencial: la población se multiplicó por {final_value/initial_value:.2f}x"
        else:
            return f"Decrecimiento exponencial: la población se redujo a {(final_value/initial_value)*100:.1f}%"
    
    elif model_type == "logistic":
        if percent_change > 0:
            return f"Crecimiento limitado: la población alcanzó capacidad de carga aproximada"
        else:
            return f"Descenso hacia equilibrio: sistema se estabiliza"
    
    elif model_type == "compound_interest":
        return f"Interés compuesto: el capital creció {percent_change:.2f}%"
    
    elif model_type == "decay":
        return f"Decaimiento: {abs(percent_change):.2f}% de la cantidad inicial se desintegró"
    
    elif model_type == "vital_rates":
        if percent_change > 0:
            return f"Tasa de natalidad > mortalidad: población creció {percent_change:.2f}%"
        else:
            return f"Tasa de mortalidad > natalidad: población decreció {abs(percent_change):.2f}%"
    
    return "Simulación completada"


def interpret_climate_forecast(warming_trend: float, temp_change: float) -> str:
    """
    Interpreta resultados de pronósticos climáticos.
    """
    if warming_trend > 0.1:
        return f"Tendencia de calentamiento significativo: +{warming_trend:.3f}°C/año"
    elif warming_trend > 0:
        return f"Calentamiento gradual: +{warming_trend:.3f}°C/año"
    elif warming_trend < -0.1:
        return f"Enfriamiento significativo: {warming_trend:.3f}°C/año"
    else:
        return "Temperatura relativamente estable"


def interpret_epidemiological_model(peak_infected: int, peak_day: int, total_infected: int, population: int) -> str:
    """
    Interpreta modelo epidemiológico.
    """
    attack_rate = (total_infected / population) * 100
    return f"Pico de {peak_infected} infectados el día {peak_day}. Tasa de ataque: {attack_rate:.1f}%"


# ==================== NUEVOS ENDPOINTS ====================

@router.get("/predefined-models", response_model=schemas.PredefinedModelsListResponse)
def list_predefined_models():
    """
    Retorna lista de modelos predefinidos disponibles.
    """
    models = [
        {
            "id": "covid19",
            "name": "COVID-19",
            "description": get_model_description("covid19"),
            "equations": get_model_equations("covid19"),
            "variables": ["S", "I", "R"],
        },
        {
            "id": "predator_prey",
            "name": "Depredador-Presa",
            "description": get_model_description("predator_prey"),
            "equations": get_model_equations("predator_prey"),
            "variables": ["Presas", "Depredadores"],
        },
        {
            "id": "rossiter",
            "name": "Malaria (Rossiter)",
            "description": get_model_description("rossiter"),
            "equations": get_model_equations("rossiter"),
            "variables": ["S", "I", "R"],
        },
        {
            "id": "climate",
            "name": "Puntos de Inflexión Climáticos",
            "description": get_model_description("climate"),
            "equations": get_model_equations("climate"),
            "variables": ["Temperatura", "CO2"],
        },
        {
            "id": "tuberculosis",
            "name": "Tuberculosis",
            "description": get_model_description("tuberculosis"),
            "equations": get_model_equations("tuberculosis"),
            "variables": ["S", "E", "I", "R"],
        },
        {
            "id": "competition",
            "name": "Competencia de Especies",
            "description": get_model_description("competition"),
            "equations": get_model_equations("competition"),
            "variables": ["Especie 1", "Especie 2"],
        },
    ]
    
    return schemas.PredefinedModelsListResponse(
        total=len(models),
        models=models
    )


@router.post("/simulate-predefined-model", response_model=schemas.PredefinedModelSimulationResponse)
def simulate_predefined_model(req: schemas.PredefinedModelSimulationRequest):
    """
    Ejecuta un modelo predefinido con parámetros personalizados.
    """
    try:
        model_name = req.model_type
        initial_conditions = req.initial_conditions
        t_max = req.time_periods
        parameters = req.parameters
        
        # Mapeo de modelos
        model_map = {
            "covid19": lambda: odeint(
                lambda state, t: PredefinedModels.covid19_model(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
            "predator_prey": lambda: odeint(
                lambda state, t: PredefinedModels.predator_prey_lotka_volterra(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
            "rossiter": lambda: odeint(
                lambda state, t: PredefinedModels.rossiter_model(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
            "climate": lambda: odeint(
                lambda state, t: PredefinedModels.climate_tipping_point(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
            "tuberculosis": lambda: odeint(
                lambda state, t: PredefinedModels.tuberculosis_model(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
            "competition": lambda: odeint(
                lambda state, t: PredefinedModels.resource_competition(*state, t, parameters),
                initial_conditions, np.linspace(0, t_max, req.num_points)
            ),
        }
        
        if model_name not in model_map:
            raise ValueError(f"Modelo no reconocido: {model_name}")
        
        t = np.linspace(0, t_max, req.num_points)
        solution = model_map[model_name]()
        
        # Preparar datos para retornar
        simulation_data = []
        for i, time_val in enumerate(t):
            point_data = {
                "time": float(time_val),
                "values": {f"var_{j}": float(solution[i, j]) for j in range(solution.shape[1])}
            }
            simulation_data.append(point_data)
        
        return schemas.PredefinedModelSimulationResponse(
            model_type=model_name,
            initial_conditions=initial_conditions,
            time_periods=t_max,
            parameters=parameters,
            simulation_data=simulation_data,
            interpretation=f"Simulación de {model_name} completada"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en simulación: {e}")


@router.post("/parameter-sensitivity-analysis", response_model=schemas.ParameterSensitivityResponse)
def parameter_sensitivity_analysis(req: schemas.ParameterSensitivityRequest):
    """
    Análisis de sensibilidad: cómo varía la salida al cambiar un parámetro.
    """
    try:
        parameter_values = np.linspace(req.param_min, req.param_max, req.num_points)
        sensitivity_results = []
        
        for param_val in parameter_values:
            # Actualizar el parámetro
            params_copy = req.parameters.copy()
            params_copy[req.parameter_name] = param_val
            
            # Resolver modelo
            t = np.linspace(0, req.time_periods, 100)
            
            model_map = {
                "covid19": lambda p: odeint(
                    lambda state, t: PredefinedModels.covid19_model(*state, t, p),
                    req.initial_conditions, t
                ),
                "predator_prey": lambda p: odeint(
                    lambda state, t: PredefinedModels.predator_prey_lotka_volterra(*state, t, p),
                    req.initial_conditions, t
                ),
            }
            
            if req.model_type not in model_map:
                raise ValueError(f"Modelo no soportado para análisis: {req.model_type}")
            
            solution = model_map[req.model_type](params_copy)
            final_value = solution[-1, 0]  # Usar primer compartimento
            
            sensitivity_results.append({
                "parameter_value": float(param_val),
                "final_output": float(final_value)
            })
        
        return schemas.ParameterSensitivityResponse(
            model_type=req.model_type,
            parameter_name=req.parameter_name,
            parameter_min=req.param_min,
            parameter_max=req.param_max,
            sensitivity_data=sensitivity_results,
            interpretation=f"Sensibilidad del parámetro {req.parameter_name} analizada"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en análisis de sensibilidad: {e}")


@router.post("/stochastic-simulation", response_model=schemas.StochasticSimulationResponse)
def stochastic_simulation(req: schemas.StochasticSimulationRequest):
    """
    Ejecuta múltiples simulaciones con ruido aleatorio para análisis de incertidumbre.
    """
    try:
        t = np.linspace(0, req.time_periods, req.num_points)
        
        # Ejecutar múltiples simulaciones
        all_simulations = []
        
        model_map = {
            "covid19": lambda p: odeint(
                lambda state, t: PredefinedModels.covid19_model(*state, t, p),
                req.initial_conditions, t
            ),
            "predator_prey": lambda p: odeint(
                lambda state, t: PredefinedModels.predator_prey_lotka_volterra(*state, t, p),
                req.initial_conditions, t
            ),
        }
        
        if req.model_type not in model_map:
            raise ValueError(f"Modelo no soportado: {req.model_type}")
        
        for run in range(req.num_simulations):
            # Agregar ruido a los parámetros
            params_noisy = req.parameters.copy()
            for key in params_noisy:
                params_noisy[key] *= (1 + np.random.normal(0, req.parameter_noise))
            
            solution = model_map[req.model_type](params_noisy)
            
            # Agregar ruido a los valores
            solution_noisy = add_stochastic_noise(
                solution,
                req.measurement_noise,
                req.noise_type
            )
            
            all_simulations.append(solution_noisy)
        
        all_simulations = np.array(all_simulations)
        
        # Calcular estadísticas
        mean_trajectory = np.mean(all_simulations, axis=0)
        std_trajectory = np.std(all_simulations, axis=0)
        percentile_5 = np.percentile(all_simulations, 5, axis=0)
        percentile_95 = np.percentile(all_simulations, 95, axis=0)
        
        # Preparar respuesta
        statistics_data = []
        for i, time_val in enumerate(t):
            statistics_data.append({
                "time": float(time_val),
                "mean": float(mean_trajectory[i, 0]),
                "std": float(std_trajectory[i, 0]),
                "percentile_5": float(percentile_5[i, 0]),
                "percentile_95": float(percentile_95[i, 0]),
            })
        
        return schemas.StochasticSimulationResponse(
            model_type=req.model_type,
            num_simulations=req.num_simulations,
            parameter_noise=req.parameter_noise,
            measurement_noise=req.measurement_noise,
            noise_type=req.noise_type,
            statistics_data=statistics_data,
            interpretation="Análisis de incertidumbre completado"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en simulación estocástica: {e}")


@router.post("/compare-scenarios", response_model=schemas.ScenarioComparisonResponse)
def compare_scenarios(req: schemas.ScenarioComparisonRequest):
    """
    Compara múltiples escenarios (diferentes sets de parámetros).
    """
    try:
        t = np.linspace(0, req.time_periods, req.num_points)
        scenarios_results = []
        
        model_map = {
            "covid19": lambda p: odeint(
                lambda state, t: PredefinedModels.covid19_model(*state, t, p),
                req.initial_conditions, t
            ),
            "predator_prey": lambda p: odeint(
                lambda state, t: PredefinedModels.predator_prey_lotka_volterra(*state, t, p),
                req.initial_conditions, t
            ),
        }
        
        if req.model_type not in model_map:
            raise ValueError(f"Modelo no soportado: {req.model_type}")
        
        for scenario in req.scenarios:
            solution = model_map[req.model_type](scenario.parameters)
            
            scenario_data = []
            for i, time_val in enumerate(t):
                scenario_data.append({
                    "time": float(time_val),
                    "value": float(solution[i, 0])
                })
            
            scenarios_results.append({
                "scenario_name": scenario.name,
                "parameters": scenario.parameters,
                "data": scenario_data,
                "final_value": float(solution[-1, 0])
            })
        
        return schemas.ScenarioComparisonResponse(
            model_type=req.model_type,
            num_scenarios=len(req.scenarios),
            time_periods=req.time_periods,
            scenarios=scenarios_results,
            interpretation="Comparación de escenarios completada"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error comparando escenarios: {e}")


@router.post("/export-simulation")
def export_simulation(req: schemas.ExportSimulationRequest):
    """
    Exporta datos de simulación en formato CSV o JSON.
    """
    try:
        if req.format == "csv":
            # Convertir a CSV
            output = "time,value\n"
            for point in req.simulation_data:
                output += f"{point['time']},{point['value']}\n"
            
            return {
                "filename": f"simulation_{req.model_name}.csv",
                "content_type": "text/csv",
                "data": output
            }
        
        elif req.format == "json":
            return {
                "filename": f"simulation_{req.model_name}.json",
                "content_type": "application/json",
                "data": json.dumps(req.simulation_data, indent=2)
            }
        
        else:
            raise ValueError(f"Formato no soportado: {req.format}")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exportando datos: {e}")
