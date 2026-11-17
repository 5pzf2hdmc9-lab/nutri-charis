import { sanitizeText } from './authAccess';

export const BILLING_STATUS_LABEL = {
  paid: 'Εξοφλημένο',
  pending: 'Εκκρεμές',
  overdue: 'Ληξιπρόθεσμο'
};

export const BILLING_STATUS_CLASS = {
  paid: 'status-badge--success',
  pending: 'status-badge--warn',
  overdue: 'status-badge--danger'
};

export function monthKey(iso) {
  return String(iso || '').slice(0, 7);
}

/** Open a printable internal package summary (not a tax invoice). */
export function printPackageReceipt({ client, pkg }) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) return;
  const name = sanitizeText(client?.name, 120);
  const title = sanitizeText(pkg.package_name, 120);
  w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"/><title>Απόδειξη — ${title}</title>
    <style>body{font-family:Georgia,serif;padding:32px;color:#111}h1{font-size:20px;margin:0 0 8px}
    .meta{color:#444;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:16px}
    td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
    .foot{margin-top:28px;font-size:11px;color:#666}</style></head><body>
    <h1>NutriCharis · Χάρις Φωτούδη</h1>
    <div class="meta">Σύνοψη πακέτου συνεδριών · ${new Date().toLocaleDateString('el-GR')}</div>
    <table>
      <tr><th>Πελάτης</th><td>${name}</td></tr>
      <tr><th>Πακέτο</th><td>${title}</td></tr>
      <tr><th>Συνεδρίες</th><td>${pkg.used_sessions}/${pkg.total_sessions}</td></tr>
      <tr><th>Ποσό</th><td>${Number(pkg.amount_eur).toFixed(2)} €</td></tr>
      <tr><th>Κατάσταση</th><td>${BILLING_STATUS_LABEL[pkg.payment_status] || pkg.payment_status}</td></tr>
      <tr><th>Τρόπος πληρωμής</th><td>${sanitizeText(pkg.payment_method, 80) || '—'}</td></tr>
      <tr><th>Σημειώσεις</th><td>${sanitizeText(pkg.notes, 400) || '—'}</td></tr>
    </table>
    <p class="foot">Μη φορολογικό παραστατικό — εσωτερική σύνοψη γραφείου. Ιατρική αποποίηση: το περιεχόμενο δεν υποκαθιστά ιατρική συμβουλή.</p>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
  w.document.close();
}
