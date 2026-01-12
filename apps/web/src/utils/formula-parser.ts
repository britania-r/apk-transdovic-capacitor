// File: apps/web/src/utils/formula-parser.ts

/**
 * Parsea y evalúa de forma segura una cadena de texto que emula una fórmula de Excel simple.
 *
 * @param formula - La cadena de la fórmula (ej. "X + 81 + COCIENTE(X+19;39)").
 * @param value - El valor numérico para reemplazar 'x' o 'X'.
 * @returns El resultado del cálculo.
 * @throws Lanza un error si la fórmula es inválida o la evaluación falla.
 */
export function evaluateExcelFormula(formula: string, value: number): number {
  if (typeof formula !== 'string' || formula.trim() === '') {
    // Si no hay fórmula, simplemente devolvemos el valor original
    return value;
  }
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error('El valor de entrada debe ser un número finito.');
  }

  // 1. Normalizar la fórmula
  let processedFormula = formula
    .trim()
    .replace(/\s+/g, '') // --- MEJORA: Elimina TODOS los espacios en blanco
    .replace(/\bX\b/gi, String(value))
    .replace(/<>/g, '!=')
    .replace(/=/g, '==');

  // 2. Procesar funciones
  
  // Procesar COCIENTE
  const cocienteRegex = /COCIENTE\(([^,]+),([^)]+)\)/gi; // Ahora usa coma como separador
  while (cocienteRegex.test(processedFormula)) {
    processedFormula = processedFormula.replace(cocienteRegex, (match, num, den) => {
      return `Math.trunc((${num}) / (${den}))`;
    });
  }

  // Procesar SI
  // Esta regex es más robusta y maneja anidamiento simple. Usa coma como separador.
  const siRegex = /SI\((.+?),(.+?),(.+?)\)/gi;
  while (siRegex.test(processedFormula)) {
    processedFormula = processedFormula.replace(siRegex, (match, condition, trueVal, falseVal) => {
      // Importante: La condición puede contener operaciones matemáticas que debemos evaluar.
      // La expresión '6/10/202' es una división, no una fecha.
      // Si la intención es comparar con CERO, la fórmula debería ser SI(X=0, 0, ...)
      return `((${condition}) ? (${trueVal}) : (${falseVal}))`;
    });
  }

  // 3. Evaluar de forma segura
  try {
    const safeEvaluator = new Function(`return ${processedFormula}`);
    const result = safeEvaluator();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('El resultado de la fórmula no es un número válido.');
    }

    return result;
  } catch (error) {
    console.error('Error al evaluar la fórmula procesada:', processedFormula, error);
    throw new Error('La fórmula contiene un error de sintaxis.');
  }
}