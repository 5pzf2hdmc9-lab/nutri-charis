import ExchangeCoverage from '../../plan/ExchangeCoverage';
import PlanAdherence from './PlanAdherence';
import PlanAiStudio from './PlanAiStudio';
import PlanTelemetry from './PlanTelemetry';
import PlanWeekPlanner from './PlanWeekPlanner';
import { usePlatform } from '../platformContext';

export default function PlanTab() {
  const { activeClientObj, activeTab } = usePlatform();
  return (
    <>
      {activeTab === 'plan' && activeClientObj && (
        <>
          <PlanAdherence />
          <PlanTelemetry />
          <ExchangeCoverage />
          <PlanWeekPlanner />
          <PlanAiStudio />
        </>
      )}
    </>
  );
}
