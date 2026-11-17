import LegalModal from '../../LegalModal';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormColumn from './AuthFormColumn';
import { usePlatform } from '../platformContext';

export default function AuthSplitScreen() {
  const { legalDoc, setLegalDoc } = usePlatform();
  return (
    <div className="auth-split-grid">
      <AuthBrandPanel />
      <AuthFormColumn />
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
