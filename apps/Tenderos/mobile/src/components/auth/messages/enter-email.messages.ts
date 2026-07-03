export const enterEmailMessages = {
  placeholder: "Introduce tu correo electrónico",
  hint:
    "Usaremos tu correo para enviarte el código de verificación y " +
    "comunicaciones importantes",
  errors: {
    empty: "Ingresá tu correo electrónico para continuar.",
    invalidFormat:
      "Parece que falta un @ o un dominio. " +
      "Revisá el formato, por ejemplo: tu@correo.com",
    sendFailed:
      "No pudimos enviar el código. " +
      "Revisá que el correo sea correcto o intentá de nuevo en unos minutos.",
  },
} as const;
