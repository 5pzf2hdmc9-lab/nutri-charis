import { buildAnthroPayload } from '../components/measurements/AnthropometricsPanel';
import { guardClientWrite } from '../lib/authAccess';
import { parseAnthro, parseMeasurement } from '../lib/practiceSchemas';
import { supabase } from '../supabaseClient';

export function useMeasurements(deps) {
  const {
    activeClientObj,
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
    setMeasurements,
    showToast
  } = deps;

  const clearMeasForm = () => {
    setMeasWeight('');
    setMeasFat('');
    setMeasMuscle('');
    setMeasWaist('');
    setMeasAnthro({});
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!activeClientObj || !measWeight) return;
    try {
      const user = await guardClientWrite(activeClientObj, isAdmin);
      const parsedAnthro = parseAnthro(buildAnthroPayload(measAnthro || {}));
      if (!parsedAnthro.success) {
        showToast('⚠️ Περιφέρειες 15–200 cm και δερματοπτυχές 1–80 mm.');
        return;
      }
      const parsed = parseMeasurement({
        client_id: activeClientObj.id,
        date: new Date().toISOString().slice(0, 10),
        weight: measWeight,
        body_fat: measFat,
        muscle_mass: measMuscle,
        waist: measWaist,
        anthro: parsedAnthro.data
      });
      if (!parsed.success) {
        showToast(`⚠️ ${parsed.error.issues?.[0]?.message || 'Μη έγκυρη μέτρηση.'}`);
        return;
      }
      const payload = { ...parsed.data, dietitian_id: user.id };
      const { data, error } = await supabase.from('measurements').insert([payload]).select();
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      if (data?.[0]) {
        setMeasurements((prev) => [...prev, data[0]]);
        const { error: weightErr } = await supabase
          .from('clients')
          .update({ weight: parsed.data.weight })
          .eq('id', parsed.data.client_id);
        if (weightErr) {
          clearMeasForm();
          showToast(`⚠️ Η μέτρηση σώθηκε, το βάρος φακέλου όχι: ${weightErr.message}`);
          return;
        }
        setClients((prev) =>
          prev.map((c) =>
            String(c.id) === String(parsed.data.client_id) ? { ...c, weight: parsed.data.weight } : c
          )
        );
        clearMeasForm();
        showToast('✓ Η μέτρηση αποθηκεύτηκε & ενημερώθηκε το βάρος!');
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  return { handleAddMeasurement };
}
