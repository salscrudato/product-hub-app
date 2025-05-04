import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductHub from './components/ProductHub';
import CoverageScreen from './components/CoverageScreen';
import PricingScreen from './components/PricingScreen';
import FormsScreen from './components/FormsScreen';
import StatesScreen from './components/StatesScreen';
import TableScreen from './components/TableScreen';
import PlaceholderScreen from './components/PlaceholderScreen';
import styled from 'styled-components';

const AppContainer = styled.div`
  font-family: 'Inter', sans-serif;
  background-color: #f5f5f5;
  color: #333;
  min-height: 100vh;
`;

function App() {
  return (
    <AppContainer>
      <Router>
        <Routes>
          <Route path="/" element={<ProductHub />} />
          <Route path="/coverage/:productId" element={<CoverageScreen />} />
          <Route path="/pricing/:productId" element={<PricingScreen />} />
          <Route path="/forms" element={<FormsScreen />} />
          <Route path="/states/:productId" element={<StatesScreen />} />
          <Route path="/table/:productId/:stepId" element={<TableScreen />} />
          <Route path="/rules" element={<PlaceholderScreen title="Rules" />} />
          <Route path="/applicability" element={<PlaceholderScreen title="Applicability" />} />
        </Routes>
      </Router>
    </AppContainer>
  );
}

export default App;