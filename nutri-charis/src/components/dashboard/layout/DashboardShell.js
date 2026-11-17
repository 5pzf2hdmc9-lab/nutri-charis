import LegalModal from '../../LegalModal';
import MedicalFooter from '../../MedicalFooter';
import ClientExecutiveRibbon from './ClientExecutiveRibbon';
import DashboardHeader from './DashboardHeader';
import MobileNavDock from './MobileNavDock';
import ClientEditModal from '../modals/ClientEditModal';
import GeminiApiKeyModal from '../modals/GeminiApiKeyModal';
import MealCellEditModal from '../modals/MealCellEditModal';
import PdfPreviewModal from '../modals/PdfPreviewModal';
import WeekTemplatesModal from '../modals/WeekTemplatesModal';
import PrintMounts from '../print/PrintMounts';
import AppointmentsTab from '../tabs/AppointmentsTab';
import CalculatorTab from '../tabs/CalculatorTab';
import ClientsTab from '../tabs/ClientsTab';
import MeasurementsTab from '../tabs/MeasurementsTab';
import PlanTab from '../tabs/PlanTab';
import ProfileTab from '../tabs/ProfileTab';
import DataSkeleton from '../ui/DataSkeleton';
import EmptyState from '../ui/EmptyState';
import ToastBanner from '../ui/ToastBanner';
import ShoppingListModal from '../../plan/ShoppingListModal';
import { usePlatform } from '../platformContext';

export default function DashboardShell() {
  const { activeClientObj, activeTab, clients, dataError, dataLoading, isAdmin, legalDoc, setActiveTab, setLegalDoc, setShowNewClientForm, setShowShoppingModal, shoppingList, showShoppingModal, showToast } = usePlatform();
  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', paddingBottom: '64px' }}>
      {(dataError || (!dataLoading && clients.length === 0)) && (
        <div className="no-print" style={{ maxWidth: '1460px', margin: '10px auto 0', padding: '0 14px' }}>
          {dataError && (
            <div role="alert" className="status-badge status-badge--danger" style={{ display: 'block', borderRadius: 12, padding: '10px 14px' }}>
              {dataError}
            </div>
          )}
        </div>
      )}
      <PrintMounts />
      <DashboardHeader />
      <MobileNavDock />
      <main className="app-main-container no-print" style={{ maxWidth: '1460px', width: '100%', margin: '18px auto 0 auto', padding: '0 22px', display: 'grid', gap: '14px' }}>
        {dataLoading && <DataSkeleton />}
        {!dataLoading && !activeClientObj && activeTab !== 'clients' && (
          <EmptyState
            glyph="▣"
            title={isAdmin ? 'Δεν υπάρχει ενεργός φάκελος πελάτη' : 'Ο φάκελός σας δεν είναι ακόμα διαθέσιμος'}
            body={
              isAdmin
                ? 'Δημιουργήστε τον πρώτο κλινικό φάκελο ή επιλέξτε πελάτη από το μητρώο για να συνεχίσετε με πλάνο, μετρήσεις και ραντεβού.'
                : 'Μόλις ο διαιτολόγος συνδέσει τον λογαριασμό σας, θα εμφανιστεί εδώ το εξατομικευμένο πλάνο.'
            }
            actionLabel={isAdmin ? '+ Νέος φάκελος πελάτη' : null}
            onAction={
              isAdmin
                ? () => {
                    setActiveTab('clients');
                    setShowNewClientForm(true);
                  }
                : undefined
            }
          />
        )}
        <ClientExecutiveRibbon />
        <PlanTab />
        <ClientsTab />
        <ProfileTab />
        <AppointmentsTab />
        <MeasurementsTab />
        <CalculatorTab />
      </main>
      <PdfPreviewModal />
      <WeekTemplatesModal />
      <ShoppingListModal
        open={showShoppingModal && Boolean(activeClientObj)}
        clientName={activeClientObj?.name}
        shoppingList={shoppingList}
        onClose={() => setShowShoppingModal(false)}
        onCopied={(msg) => showToast(`✓ ${msg}`)}
      />
      <MealCellEditModal />
      <ClientEditModal />
      <GeminiApiKeyModal />
      <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '0 14px 88px' }}>
        <MedicalFooter onOpenLegal={setLegalDoc} />
      </div>
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
      <ToastBanner />
    </div>
  );
}
