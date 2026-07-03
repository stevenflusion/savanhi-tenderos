export const paymentMethodMessages = {
  hint: "Elegí cómo preferís recibir el pago de tus clientes.",
  efectivo: {
    hint: "Podés cambiarlo después desde tu perfil.",
  },
  pichincha: {
    title: "Datos bancarios",
    accountName: {
      placeholder: "Nombre y apellido del titular",
      hint: "El nombre debe coincidir con el de la cuenta bancaria.",
      errors: {
        empty: "Necesitamos el nombre del titular para validar la cuenta.",
      },
    },
    accountNumber: {
      placeholder: "Número de cuenta",
      hint: "Mínimo 10 dígitos, sin guiones ni espacios.",
      errors: {
        empty: "Ingresá el número de cuenta bancaria.",
        tooShort:
          "El número de cuenta debe tener al menos 10 dígitos. " +
          "Verificá que esté completo.",
        invalidFormat: "Solo números, sin guiones ni espacios.",
      },
    },
    accountType: {
      hint: "Seleccioná el tipo de cuenta asociada.",
      errors: {
        empty: "Elegí si es cuenta de ahorro o corriente para continuar.",
      },
    },
  },
  errors: {
    save: "Error al guardar el método de pago. Intentá de nuevo.",
  },
} as const
