export const businessLocationMessages = {
  placeholder: "Buscá una dirección en Ecuador",
  hint:
    "Buscá tu dirección o usá el GPS. " +
    "Después podés ajustar el pin en el mapa.",
  mapHint: "Podés mover el pin para ajustar la posición exacta",
  confirmSuccess: "Ubicación confirmada",
  errors: {
    gpsDenied:
      "No tenemos acceso a tu ubicación. " +
      "Podés buscar la dirección manualmente en el buscador.",
    gpsFailed:
      "No pudimos obtener tu ubicación. " +
      "Intentá con el buscador de direcciones.",
    noSelection:
      "Seleccioná o buscá tu dirección para que los clientes te encuentren.",
    save: "Error al guardar la ubicación. Intentá de nuevo.",
  },
  gps: {
    loading: "Obteniendo ubicación...",
    idle: "Usar mi ubicación actual",
  },
} as const
