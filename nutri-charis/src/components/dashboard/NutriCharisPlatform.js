import { PlatformContext } from './platformContext';
import { usePlatform } from './platformContext';
import { useToast } from '../../hooks/useToast';
import { usePlatformState } from '../../hooks/usePlatformState';
import { useNutriAuth } from '../../hooks/useNutriAuth';
import { usePlatformData } from '../../hooks/usePlatformData';
import { useActiveClient } from '../../hooks/useActiveClient';
import { useCalculator } from '../../hooks/useCalculator';
import { useMealPlanActions } from '../../hooks/useMealPlanActions';
import { useClientRecords } from '../../hooks/useClientRecords';
import { useAppointments } from '../../hooks/useAppointments';
import { useMeasurements } from '../../hooks/useMeasurements';
import AuthBootScreen from './auth/AuthBootScreen';
import PasswordRecoveryScreen from './auth/PasswordRecoveryScreen';
import AuthSplitScreen from './auth/AuthSplitScreen';
import DashboardShell from './layout/DashboardShell';

export default function NutriCharisPlatform() {
  const toast = useToast();
  const state = usePlatformState();
  const auth = useNutriAuth({ ...state, ...toast });
  const data = usePlatformData({ ...state, ...toast, ...auth });
  const client = useActiveClient({ ...state, ...toast, ...auth, ...data });
  const calc = useCalculator({ ...state, ...client });
  const meals = useMealPlanActions({ ...state, ...toast, ...auth, ...data, ...client });
  const records = useClientRecords({ ...state, ...toast, ...auth, ...data, ...client });
  const appts = useAppointments({ ...state, ...toast, ...auth, ...data, ...client });
  const meas = useMeasurements({ ...state, ...toast, ...auth, ...data, ...client });

  const value = { ...state, ...toast, ...auth, ...data, ...client, ...calc, ...meals, ...records, ...appts, ...meas };

  return (
    <PlatformContext.Provider value={value}>
      <PlatformRoutes />
    </PlatformContext.Provider>
  );
}

function PlatformRoutes() {
  const { authLoading, authMode, session } = usePlatform();
  if (authLoading) return <AuthBootScreen />;
  if (authMode === 'recovery') return <PasswordRecoveryScreen />;
  if (!session) return <AuthSplitScreen />;
  return <DashboardShell />;
}
