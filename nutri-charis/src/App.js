import ErrorBoundary from './components/dashboard/ui/ErrorBoundary';
import NutriCharisPlatform from './components/dashboard/NutriCharisPlatform';

export default function App() {
  return (
    <ErrorBoundary>
      <NutriCharisPlatform />
    </ErrorBoundary>
  );
}
