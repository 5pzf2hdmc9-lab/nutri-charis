import PrintableExcelSheet from './PrintableExcelSheet';
import ClinicalDietPrintView from '../../plan/ClinicalDietPrintView';
import { DAYS, MEAL_TYPES } from '../../../constants/dietPlan';
import { usePlatform } from '../platformContext';

export default function PrintMounts() {
  const { activeBmr, activeClientObj, activeTargetKcal, activeTdee, pdfTheme, shoppingList } = usePlatform();
  return (
    <>
      <div className="print-only-sheet print-excel-sheet">
        <PrintableExcelSheet
          id="printable-excel-sheet"
          theme={pdfTheme}
          clientObj={activeClientObj}
          mealPlan={activeClientObj?.meal_plan || {}}
        />
      </div>
      <div className="print-only-sheet print-clinical-sheet">
        <ClinicalDietPrintView
          id="clinical-diet-print"
          clientObj={activeClientObj}
          mealPlan={activeClientObj?.meal_plan || {}}
          days={DAYS}
          mealTypes={MEAL_TYPES}
          shoppingList={shoppingList}
          targetKcal={activeTargetKcal}
          bmr={activeBmr}
          tdee={activeTdee}
        />
      </div>
    </>
  );
}
