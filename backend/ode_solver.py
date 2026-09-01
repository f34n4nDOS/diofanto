"""
Utilidades para resolver sistemas de ecuaciones diferenciales ordinarias (ODEs)
y ejecutar simulaciones numéricas.
"""
import numpy as np
from scipy.integrate import odeint
from typing import Callable, Dict, List, Tuple
import re


def parse_ode_system(equations: List[str], variable_names: List[str]) -> Callable:
    """
    Convierte un sistema de ecuaciones diferenciales en texto a una función callable.
    
    Ej: dy/dt = -0.1*y, dz/dt = 0.05*y
    Se convierte a una función que toma (y, z, t) y retorna (dy/dt, dz/dt)
    """
    def system(state, t, params=None):
        # Crear diccionario de variables
        variables = {}
        for i, var_name in enumerate(variable_names):
            variables[var_name] = state[i]
        
        # Agregar parámetros si existen
        if params:
            variables.update(params)
        
        # Agregar constantes matemáticas
        variables['pi'] = np.pi
        variables['e'] = np.e
        
        # Evaluar cada ecuación
        derivatives = []
        for eq in equations:
            try:
                # Reemplazar nombres de funciones numpy
                eq_safe = eq.replace('sin', 'np.sin').replace('cos', 'np.cos')
                eq_safe = eq_safe.replace('exp', 'np.exp').replace('sqrt', 'np.sqrt')
                eq_safe = eq_safe.replace('log', 'np.log').replace('abs', 'np.abs')
                
                result = eval(eq_safe, {"np": np, **variables})
                derivatives.append(float(result))
            except Exception as e:
                raise ValueError(f"Error evaluando ecuación '{eq}': {e}")
        
        return derivatives
    
    return system


def solve_ode_system(
    equations: List[str],
    variable_names: List[str],
    initial_conditions: List[float],
    t_max: float,
    num_points: int = 1000,
    parameters: Dict = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Resuelve un sistema de ODEs usando integración numérica.
    
    Returns:
        (time_array, solution_matrix) donde solution_matrix tiene shape (num_points, len(variables))
    """
    try:
        system = parse_ode_system(equations, variable_names)
        t = np.linspace(0, t_max, num_points)
        
        # Resolver usando odeint
        solution = odeint(system, initial_conditions, t, args=(parameters,))
        
        return t, solution
    
    except Exception as e:
        raise ValueError(f"Error resolviendo sistema ODE: {e}")


def add_stochastic_noise(
    values: np.ndarray,
    noise_level: float = 0.01,
    noise_type: str = "gaussian"
) -> np.ndarray:
    """
    Añade ruido estocástico a los valores simulados.
    
    noise_type: "gaussian" (normal), "poisson", o "uniform"
    noise_level: desviación estándar o amplitud del ruido
    """
    if noise_type == "gaussian":
        noise = np.random.normal(0, noise_level * np.abs(values), values.shape)
    elif noise_type == "poisson":
        noise = np.random.poisson(noise_level * np.abs(values)) - noise_level * np.abs(values)
    elif noise_type == "uniform":
        noise = np.random.uniform(-noise_level * np.abs(values), noise_level * np.abs(values), values.shape)
    else:
        raise ValueError(f"Tipo de ruido no soportado: {noise_type}")
    
    return values + noise


# ==================== MODELOS PREDEFINIDOS ====================

class PredefinedModels:
    """Colección de modelos epidemiológicos y ecológicos predefinidos."""
    
    @staticmethod
    def covid19_model(S, I, R, t, params):
        """Modelo COVID-19 extendido con muerte"""
        beta = params.get('transmission_rate', 0.5)  # Contactos × probabilidad
        gamma = params.get('recovery_rate', 1/10)  # 10 días
        mu = params.get('mortality_rate', 0.01)  # 1% mortalidad
        
        N = S + I + R
        dS = -beta * S * I / N
        dI = beta * S * I / N - gamma * I - mu * I
        dR = gamma * I
        dD = mu * I  # Muertes
        
        return [dS, dI, dR]
    
    @staticmethod
    def predator_prey_lotka_volterra(x, y, t, params):
        """Modelo depredador-presa de Lotka-Volterra"""
        a = params.get('prey_growth', 1.0)  # Crecimiento presas
        b = params.get('predation_rate', 0.1)  # Predación
        c = params.get('predator_efficiency', 0.1)  # Eficiencia depredador
        d = params.get('predator_death', 0.1)  # Muerte depredador
        
        dx = a * x - b * x * y  # Presas
        dy = c * b * x * y - d * y  # Depredadores
        
        return [dx, dy]
    
    @staticmethod
    def rossiter_model(S, I, R, t, params):
        """Modelo Rossiter (malaria con latencia)"""
        alpha = params.get('infection_rate', 0.01)
        beta = params.get('recovery_rate', 0.1)
        sigma = params.get('reinfection_rate', 0.05)
        
        N = S + I + R
        dS = -alpha * S * I / N + sigma * R
        dI = alpha * S * I / N - beta * I
        dR = beta * I - sigma * R
        
        return [dS, dI, dR]
    
    @staticmethod
    def climate_tipping_point(T, C, t, params):
        """Modelo de punto de inflexión climático"""
        forcing = params.get('radiative_forcing', 0.01)  # Forzamiento
        feedback = params.get('climate_feedback', 0.5)  # Retroalimentación
        recovery = params.get('recovery_rate', 0.001)  # Recuperación
        tipping_point = params.get('tipping_threshold', 2.0)
        
        dT = forcing + feedback * T - recovery * (T - tipping_point) ** 2
        dC = T - C  # Concentración de CO2 rezagada
        
        return [dT, dC]
    
    @staticmethod
    def tuberculosis_model(S, E, I, R, t, params):
        """Modelo TB con estado latente"""
        beta = params.get('transmission_rate', 0.0005)
        sigma = params.get('progression_rate', 0.1)  # Latente -> activa
        gamma = params.get('recovery_rate', 0.2)
        
        N = S + E + I + R
        dS = -beta * S * I / N
        dE = beta * S * I / N - sigma * E
        dI = sigma * E - gamma * I
        dR = gamma * I
        
        return [dS, dE, dI, dR]
    
    @staticmethod
    def resource_competition(N1, N2, t, params):
        """Competencia de dos especies por recursos"""
        r1 = params.get('growth_rate_1', 0.5)
        r2 = params.get('growth_rate_2', 0.4)
        K = params.get('carrying_capacity', 1000)
        alpha = params.get('competition_coeff', 0.5)  # Efecto de N2 en N1
        beta = params.get('competition_coeff_inv', 0.7)  # Efecto de N1 en N2
        
        dN1 = r1 * N1 * (1 - (N1 + alpha * N2) / K)
        dN2 = r2 * N2 * (1 - (N2 + beta * N1) / K)
        
        return [dN1, dN2]


def get_model_description(model_name: str) -> str:
    """Retorna descripción de un modelo predefinido."""
    descriptions = {
        "covid19": "Modelo SIR extendido para COVID-19 con mortalidad",
        "predator_prey": "Dinámicas depredador-presa (Lotka-Volterra)",
        "rossiter": "Modelo de malaria con estado latente",
        "climate": "Modelo de puntos de inflexión climáticos",
        "tuberculosis": "Modelo SEIR para tuberculosis",
        "competition": "Competencia entre dos especies",
    }
    return descriptions.get(model_name, "Modelo desconocido")


def get_model_equations(model_name: str) -> List[str]:
    """Retorna las ecuaciones diferenciales de un modelo."""
    equations = {
        "covid19": [
            "dS/dt = -β·S·I/N",
            "dI/dt = β·S·I/N - γ·I - μ·I",
            "dR/dt = γ·I",
        ],
        "predator_prey": [
            "dx/dt = a·x - b·x·y",
            "dy/dt = c·b·x·y - d·y",
        ],
        "rossiter": [
            "dS/dt = -α·S·I/N + σ·R",
            "dI/dt = α·S·I/N - β·I",
            "dR/dt = β·I - σ·R",
        ],
        "climate": [
            "dT/dt = forcing + feedback·T - recovery·(T - threshold)²",
            "dC/dt = T - C",
        ],
        "tuberculosis": [
            "dS/dt = -β·S·I/N",
            "dE/dt = β·S·I/N - σ·E",
            "dI/dt = σ·E - γ·I",
            "dR/dt = γ·I",
        ],
        "competition": [
            "dN₁/dt = r₁·N₁·(1 - (N₁ + α·N₂)/K)",
            "dN₂/dt = r₂·N₂·(1 - (N₂ + β·N₁)/K)",
        ],
    }
    return equations.get(model_name, [])


def get_default_parameters(model_name: str) -> Dict:
    """Retorna parámetros por defecto para un modelo."""
    defaults = {
        "covid19": {
            "transmission_rate": 0.5,
            "recovery_rate": 0.1,
            "mortality_rate": 0.01,
        },
        "predator_prey": {
            "prey_growth": 1.0,
            "predation_rate": 0.1,
            "predator_efficiency": 0.1,
            "predator_death": 0.1,
        },
        "rossiter": {
            "infection_rate": 0.01,
            "recovery_rate": 0.1,
            "reinfection_rate": 0.05,
        },
        "climate": {
            "radiative_forcing": 0.01,
            "climate_feedback": 0.5,
            "recovery_rate": 0.001,
            "tipping_threshold": 2.0,
        },
        "tuberculosis": {
            "transmission_rate": 0.0005,
            "progression_rate": 0.1,
            "recovery_rate": 0.2,
        },
        "competition": {
            "growth_rate_1": 0.5,
            "growth_rate_2": 0.4,
            "carrying_capacity": 1000,
            "competition_coeff": 0.5,
            "competition_coeff_inv": 0.7,
        },
    }
    return defaults.get(model_name, {})
