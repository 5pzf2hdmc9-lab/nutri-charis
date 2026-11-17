import EmptyState from '../ui/EmptyState';
import BiomarkerPanel from '../../measurements/BiomarkerPanel';
import BodyCompositionCharts from '../../measurements/BodyCompositionCharts';
import AnthroIndices from '../../measurements/AnthroIndices';
import AnthropometricsPanel, { AnthroChipRow } from '../../measurements/AnthropometricsPanel';
import { assertClientAccess, requireSessionUser } from '../../../lib/authAccess';
import { supabase } from '../../../supabaseClient';
import { usePlatform } from '../platformContext';

export default function MeasurementsTab() {
  const {
    activeClientObj,
    activeTab,
    clientMeasurements,
    handleAddMeasurement,
    isAdmin,
    measAnthro,
    measFat,
    measMuscle,
    measWaist,
    measWeight,
    setClients,
    setMeasAnthro,
    setMeasFat,
    setMeasMuscle,
    setMeasWaist,
    setMeasWeight,
    showToast
  } = usePlatform();

  if (activeTab !== 'measurements' || !activeClientObj) return null;

  return (
    <section className="luxury-card" style={{ padding: '20px' }}>
      <h3 className="font-display" style={{ margin: '0 0 13px 0', fontSize: '17.5px', fontWeight: '800', color: '#f8fafc' }}>
        Ανθρωπομετρικές Μετρήσεις & Πρόοδος ({activeClientObj.name})
      </h3>

      <BodyCompositionCharts data={clientMeasurements} />

      {isAdmin && (
        <form
          onSubmit={handleAddMeasurement}
          className="clinical-inset"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '9px'
          }}
        >
          <div>
            <label className="field-label" htmlFor="meas-weight">Βάρος (kg)</label>
            <input id="meas-weight" className="luxury-input font-mono-num" type="number" inputMode="decimal" step="0.1" required value={measWeight} onChange={(e) => setMeasWeight(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="meas-fat">Λίπος (%)</label>
            <input id="meas-fat" className="luxury-input font-mono-num" type="number" inputMode="decimal" step="0.1" value={measFat} onChange={(e) => setMeasFat(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="meas-muscle">Μυϊκή Μάζα (kg)</label>
            <input id="meas-muscle" className="luxury-input font-mono-num" type="number" inputMode="decimal" step="0.1" value={measMuscle} onChange={(e) => setMeasMuscle(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="meas-waist">Μέση (cm)</label>
            <input id="meas-waist" className="luxury-input font-mono-num" type="number" inputMode="decimal" step="0.5" value={measWaist} onChange={(e) => setMeasWaist(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <AnthropometricsPanel isAdmin={isAdmin} values={measAnthro || {}} onChange={setMeasAnthro} />
          </div>
          <button type="submit" className="btn-emerald" style={{ gridColumn: '1 / -1', justifySelf: 'start', padding: '11px 16px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>
            + Καταγραφή
          </button>
        </form>
      )}

      <AnthroIndices
        client={activeClientObj}
        draftValues={measAnthro}
        draftWaist={measWaist}
        measurements={clientMeasurements}
      />

      <div style={{ display: 'grid', gap: '9px' }}>
        {clientMeasurements.length === 0 ? (
          <EmptyState
            icon="▣"
            title="Καμία μέτρηση ακόμα"
            body={
              isAdmin
                ? 'Καταγράψτε βάρος, περιφέρειες και δερματοπτυχές για καμπύλη προόδου.'
                : 'Οι μετρήσεις θα εμφανιστούν εδώ μόλις καταχωρηθούν από τη διατροφολόγο.'
            }
          />
        ) : (
          clientMeasurements.map((m) => (
              <div key={m.id} className="history-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="font-mono-num" style={{ fontSize: '11.5px', color: '#94a3b8' }}>{m.date}</span>
                  <div className="history-metrics font-mono-num">
                    <span className="metric-weight">Βάρος {m.weight} kg</span>
                    {m.body_fat != null && <span className="metric-fat">Λίπος {m.body_fat}%</span>}
                    {m.muscle_mass != null && <span className="metric-muscle">Μυϊκή {m.muscle_mass} kg</span>}
                    {m.waist != null && <span className="metric-waist">Μέση {m.waist} cm</span>}
                  </div>
                </div>
                <AnthroChipRow anthro={m.anthro} />
              </div>
          ))
        )}
      </div>

      <BiomarkerPanel
        history={activeClientObj.questionnaire?.lab_history || []}
        isAdmin={isAdmin}
        onSave={async (nextHistory) => {
          const user = await requireSessionUser();
          assertClientAccess(activeClientObj, user, isAdmin);
          const updatedQ = { ...(activeClientObj.questionnaire || {}), lab_history: nextHistory };
          const { error } = await supabase
            .from('clients')
            .update({ questionnaire: updatedQ })
            .eq('id', activeClientObj.id);
          if (error) throw error;
          setClients((prev) =>
            prev.map((c) => (c.id === activeClientObj.id ? { ...c, questionnaire: updatedQ } : c))
          );
          showToast('Οι αιματολογικοί δείκτες αποθηκεύτηκαν.');
        }}
      />
    </section>
  );
}
