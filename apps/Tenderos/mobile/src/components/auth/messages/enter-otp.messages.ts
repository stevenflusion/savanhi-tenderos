export const enterOtpMessages = {
  sentTo: (email: string) => `Te enviamos tu código a ${email}.`,
  hint: "Revisalo en introdúcelo a continuación.",
  title: "Ingresa el codigo de verificación",
  errors: {
    incorrect:
      "El código no es correcto. Revisalo e intentá de nuevo. " +
      "Podés solicitar uno nuevo.",
    expired: "El código expiró. Tocá «Reenviar código» para recibir uno nuevo.",
  },
  resend: {
    idle: "Reenviar código",
    loading: "Reenviando...",
    success: "Código reenviado. Revisá tu correo.",
    question: "¿No recibiste el código?",
  },
};
