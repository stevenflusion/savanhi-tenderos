"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type ReceiptUploadProps = {
  campaignId: string;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function ReceiptUpload({
  campaignId,
  onUpload,
  isUploading,
}: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato de archivo no válido. Usá JPG, PNG, WebP o PDF.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no puede superar los 10 MB.");
      return false;
    }
    setError("");
    return true;
  }

  function handleFile(file: File) {
    if (validateFile(file)) {
      setFile(file);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Seleccioná un archivo para subir.");
      return;
    }
    await onUpload(file);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragOver
            ? "border-black bg-black/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hacé clic o arrastrá el comprobante acá
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP o PDF — Máx. 10 MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!file || isUploading}>
        {isUploading ? "Subiendo..." : "Subir comprobante"}
      </Button>
    </form>
  );
}
