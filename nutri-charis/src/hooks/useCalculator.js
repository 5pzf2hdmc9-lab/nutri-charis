import { useEffect, useMemo } from 'react';
import { calculateMetabolism } from '../lib/nutrition-math';

export function useCalculator(deps) {
  const { activeClientObj, calcActivity, calcAge, calcBodyFat, calcGender, calcHeight, calcWeight, latestBodyFat, setCalcActivity, setCalcAge, setCalcBodyFat, setCalcGender, setCalcHeight, setCalcWeight, setFdaAiOverride } = deps;
  useEffect(() => {
    if (!activeClientObj) return;
    setCalcGender(activeClientObj.gender || 'female');
    setCalcAge(String(activeClientObj.age || 30));
    setCalcWeight(String(activeClientObj.weight || 65));
    setCalcHeight(String(activeClientObj.height || 165));
    setCalcBodyFat(latestBodyFat !== null ? String(latestBodyFat) : '');
    setCalcActivity(Number(activeClientObj.questionnaire?.activityLevel) || 1.375);
    setFdaAiOverride(null);
  }, [activeClientObj?.id, activeClientObj?.age, activeClientObj?.weight, activeClientObj?.height, activeClientObj?.gender, activeClientObj?.questionnaire?.activityLevel, latestBodyFat]);

  const calcResult = useMemo(
    () =>
      calculateMetabolism({
        gender: calcGender,
        age: calcAge,
        weight: calcWeight,
        height: calcHeight,
        activity: calcActivity,
        bodyFat: calcBodyFat
      }),
    [calcGender, calcAge, calcWeight, calcHeight, calcActivity, calcBodyFat]
  );
  return { calcResult };
}
