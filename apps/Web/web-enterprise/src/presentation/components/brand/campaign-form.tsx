"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CampaignFormData = {
  name: string;
  description: string;
  storeTiers: string[];
  neighborhood: string;
  radiusKm: number;
  minStores: number;
  maxStores: number;
  couponPrefix: string;
  couponCount: number;
  discountValue: number;
  feeFixed: number;
  cpo: number;
  endDate: string;
};

const INITIAL_DATA: CampaignFormData = {
  name: "",
  description: "",
  storeTiers: [],
  neighborhood: "",
  radiusKm: 5,
  minStores: 1,
  maxStores: 10,
  couponPrefix: "SAV",
  couponCount: 100,
  discountValue: 0,
  feeFixed: 0,
  cpo: 0,
  endDate: "",
};

const TIER_OPTIONS = [
  { value: "gold", label: "Gold" },
  { value: "plata", label: "Plata" },
  { value: "bronze", label: "Bronze" },
];

type CampaignFormProps = {
  onSubmit: (data: CampaignFormData) => Promise<void>;
  isSubmitting: boolean;
};

export function CampaignForm({ onSubmit, isSubmitting }: CampaignFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<CampaignFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  function update<K extends keyof CampaignFormData>(
    field: K,
    value: CampaignFormData[K],
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1(): boolean {
    const newErrors: typeof errors = {};

    if (!data.name.trim()) newErrors.name = "El nombre es obligatorio.";
    if (!data.neighborhood.trim()) newErrors.neighborhood = "El barrio es obligatorio.";
    if (data.storeTiers.length === 0) newErrors.storeTiers = "Seleccioná al menos un nivel.";
    if (data.minStores < 1) newErrors.minStores = "Mínimo 1 tienda.";
    if (data.maxStores < data.minStores) newErrors.maxStores = "Debe ser mayor o igual al mínimo.";
    if (!data.endDate) newErrors.endDate = "La fecha de fin es obligatoria.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: typeof errors = {};

    if (!data.couponPrefix.trim()) newErrors.couponPrefix = "El prefijo es obligatorio.";
    if (data.couponCount < 1) newErrors.couponCount = "Mínimo 1 cupón.";
    if (data.discountValue <= 0) newErrors.discountValue = "El descuento debe ser mayor a 0.";
    if (data.feeFixed <= 0) newErrors.feeFixed = "La tarifa fija debe ser mayor a 0.";
    if (data.cpo < 0) newErrors.cpo = "El CPO no puede ser negativo.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) {
      handleNext();
      return;
    }

    if (!validateStep2()) return;
    await onSubmit(data);
  }

  const inputClass = (hasError: boolean) =>
    `w-full ${hasError ? "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200" : ""}`;

  function toggleTier(tier: string) {
    const current = data.storeTiers;
    if (current.includes(tier)) {
      update("storeTiers", current.filter((t) => t !== tier));
    } else {
      update("storeTiers", [...current, tier]);
    }
  }

  const upfrontFee = data.feeFixed > 0 ? data.feeFixed * 0.5 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step >= 1 ? "bg-black text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          1
        </span>
        <div className="h-px w-12 bg-border" />
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step >= 2 ? "bg-black text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </span>
      </div>

      {/* Step 1: Campaign details + store targeting */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Detalles de la campaña</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <Input
              className={inputClass(Boolean(errors.name))}
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ej: Descuento Primavera"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Descripción opcional de la campaña"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Niveles de tienda</label>
            <div className="flex flex-wrap gap-2">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => toggleTier(tier.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    data.storeTiers.includes(tier.value)
                      ? "border-black bg-black text-white"
                      : "border-input hover:border-black"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
            {errors.storeTiers && (
              <p className="mt-1 text-xs text-rose-600">{errors.storeTiers}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Barrio</label>
              <Input
                className={inputClass(Boolean(errors.neighborhood))}
                value={data.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="Ej: Palermo"
              />
              {errors.neighborhood && (
                <p className="mt-1 text-xs text-rose-600">{errors.neighborhood}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Radio (km)</label>
              <Input
                type="number"
                min={0}
                step={0.5}
                className={inputClass(Boolean(errors.radiusKm))}
                value={data.radiusKm}
                onChange={(e) => update("radiusKm", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Mín. tiendas</label>
              <Input
                type="number"
                min={1}
                className={inputClass(Boolean(errors.minStores))}
                value={data.minStores}
                onChange={(e) => update("minStores", Number(e.target.value))}
              />
              {errors.minStores && (
                <p className="mt-1 text-xs text-rose-600">{errors.minStores}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Máx. tiendas</label>
              <Input
                type="number"
                min={1}
                className={inputClass(Boolean(errors.maxStores))}
                value={data.maxStores}
                onChange={(e) => update("maxStores", Number(e.target.value))}
              />
              {errors.maxStores && (
                <p className="mt-1 text-xs text-rose-600">{errors.maxStores}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fecha de fin</label>
            <Input
              type="date"
              className={inputClass(Boolean(errors.endDate))}
              value={data.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.endDate}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" onClick={handleNext}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Coupon configuration + fee preview */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Configuración de cupones</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Prefijo</label>
              <Input
                className={inputClass(Boolean(errors.couponPrefix))}
                value={data.couponPrefix}
                onChange={(e) => update("couponPrefix", e.target.value)}
                placeholder="SAV"
              />
              {errors.couponPrefix && (
                <p className="mt-1 text-xs text-rose-600">{errors.couponPrefix}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min={1}
                className={inputClass(Boolean(errors.couponCount))}
                value={data.couponCount}
                onChange={(e) => update("couponCount", Number(e.target.value))}
              />
              {errors.couponCount && (
                <p className="mt-1 text-xs text-rose-600">{errors.couponCount}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Valor del descuento ($)</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              className={inputClass(Boolean(errors.discountValue))}
              value={data.discountValue}
              onChange={(e) => update("discountValue", Number(e.target.value))}
            />
            {errors.discountValue && (
              <p className="mt-1 text-xs text-rose-600">{errors.discountValue}</p>
            )}
          </div>

          <h3 className="pt-4 text-lg font-semibold">Tarifas</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Fee fijo ($)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                className={inputClass(Boolean(errors.feeFixed))}
                value={data.feeFixed}
                onChange={(e) => update("feeFixed", Number(e.target.value))}
              />
              {errors.feeFixed && (
                <p className="mt-1 text-xs text-rose-600">{errors.feeFixed}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                CPO — Costo por canje ($)
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                className={inputClass(Boolean(errors.cpo))}
                value={data.cpo}
                onChange={(e) => update("cpo", Number(e.target.value))}
              />
              {errors.cpo && (
                <p className="mt-1 text-xs text-rose-600">{errors.cpo}</p>
              )}
            </div>
          </div>

          {/* Fee preview */}
          {data.feeFixed > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-2 text-sm font-medium">Resumen de tarifas</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee fijo total</span>
                  <span>${data.feeFixed.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago inicial (50%)</span>
                  <span className="font-medium">
                    ${upfrontFee.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPO por canje</span>
                  <span>${data.cpo.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBack}>
              Anterior
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear campaña"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export type { CampaignFormData };
