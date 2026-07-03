export const storePhotosMessages = {
  hint:
    "Agregá fotos de tu local para que los clientes lo identifiquen " +
    "fácilmente.",
  maxReached: (max: number) =>
    `Límite de ${max} fotos alcanzado. Eliminá una para agregar otra.`,
  photosCount: (current: number, max: number) =>
    `${current} de ${max} fotos agregadas`,
  maxHint: (max: number) => `Máximo ${max} fotos`,
  errors: {
    camera:
      "No pudimos abrir la cámara. Revisá los permisos o intentá desde la galería.",
    gallery:
      "No pudimos acceder a tus fotos. Revisá los permisos en Configuración.",
    save: "Error al guardar las fotos. Intentá de nuevo.",
  },
} as const
