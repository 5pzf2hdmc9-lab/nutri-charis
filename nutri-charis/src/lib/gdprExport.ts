import type { ClientRow } from './authAccess';

export type GdprExportBundle = {
  exportedAt: string;
  regulation: 'GDPR Art.20 Data Portability';
  controller: string;
  client: Record<string, unknown>;
  appointments: unknown[];
  measurements: unknown[];
};

/** Build a machine-readable JSON export for GDPR Art.20 portability. */
export function buildClientExportBundle(opts: {
  client: ClientRow;
  appointments: unknown[];
  measurements: unknown[];
  controller?: string;
}): GdprExportBundle {
  const { client, appointments, measurements } = opts;
  const clientId = String(client.id);
  return {
    exportedAt: new Date().toISOString(),
    regulation: 'GDPR Art.20 Data Portability',
    controller: opts.controller || 'Χάρις Φωτούδη — NutriCharis',
    client: { ...client },
    appointments: (appointments || []).filter((a) => {
      const row = a as { client_id?: unknown; client?: unknown };
      return String(row.client_id ?? row.client ?? '') === clientId;
    }),
    measurements: (measurements || []).filter((m) => {
      const row = m as { client_id?: unknown; client?: unknown };
      return String(row.client_id ?? row.client ?? '') === clientId;
    })
  };
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[^\w.\-α-ωΑ-Ωάέήίόύώ]+/gi, '_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
