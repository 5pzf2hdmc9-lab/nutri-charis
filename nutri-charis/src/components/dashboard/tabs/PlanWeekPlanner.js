import PlanWeekMatrix from './PlanWeekMatrix';
import PlanWeekMobile from './PlanWeekMobile';
import PlanWeekToolbar from './PlanWeekToolbar';

export default function PlanWeekPlanner() {
  return (
    <section className="luxury-card" style={{ padding: '18px 20px' }}>
      <PlanWeekToolbar />
      <PlanWeekMatrix />
      <PlanWeekMobile />
    </section>
  );
}
