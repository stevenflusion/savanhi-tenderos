export const personNameMessages = {
  placeholder: "Cuentanos como te llamas",
  hint:
    "Así te conocerán tus clientes. Usa tu nombre real para generar " +
    "confianza.",
  errors: {
    empty: "Decinos tu nombre para que podamos presentarte a tus clientes.",
    tooShort: "El nombre debe tener al menos 3 caracteres.",
    invalidChars:
      "El nombre solo puede contener letras y espacios. " +
      "Sin números ni símbolos.",
  },
} as const;
