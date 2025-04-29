import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductHub from './components/ProductHub';
import CoverageScreen from './components/CoverageScreen';
import PricingScreen from './components/PricingScreen';
import FormsScreen from './components/FormsScreen';
import StatesScreen from './components/StatesScreen';
import PlaceholderScreen from './components/PlaceholderScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProductHub />} />
        <Route path="/coverage/:productId" element={<CoverageScreen />} />
        <Route path="/pricing/:productId" element={<PricingScreen />} />
        <Route path="/forms" element={<FormsScreen />} />
        <Route path="/states/:productId" element={<StatesScreen />} />
        <Route path="/rules" element={<PlaceholderScreen title="Rules" />} />
        <Route path="/applicability" element={<PlaceholderScreen title="Applicability" />} />
      </Routes>
    </Router>
  );
}

export default App;