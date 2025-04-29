import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import USAmap from 'react-usa-map';
import { TrashIcon } from '@heroicons/react/24/solid';

const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

function StatesScreen() {
  const { productId } = useParams();
  const [productName, setProductName] = useState('');
  const [selectedStates, setSelectedStates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newState, setNewState] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProductName(data.name);
          setSelectedStates(data.availableStates || []);
        } else {
          throw new Error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product data. Please try again.");
      }
    };
    fetchProduct();
  }, [productId]);

  const mapHandler = (event) => {
    const stateCode = event.target.dataset.name;
    if (selectedStates.includes(stateCode)) {
      setSelectedStates(selectedStates.filter(state => state !== stateCode));
    } else {
      setSelectedStates([...selectedStates, stateCode]);
    }
  };

  const configMap = () => {
    const config = {};
    allStates.forEach(state => {
      config[state] = {
        fill: selectedStates.includes(state) ? '#F28C38' : '#D3D3D3'
      };
    });
    return config;
  };

  const handleAddState = () => {
    if (newState && !selectedStates.includes(newState)) {
      setSelectedStates([...selectedStates, newState]);
      setNewState('');
    }
  };

  const handleRemoveState = (state) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  const handleSelectAll = () => {
    setSelectedStates([...allStates]);
  };

  const handleClearAll = () => {
    setSelectedStates([]);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        availableStates: selectedStates
      });
      alert("State availability saved successfully!");
    } catch (error) {
      console.error("Error saving states:", error);
      alert("Failed to save state availability. Please try again.");
    }
  };

  const filteredStates = selectedStates.filter(state =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-bg text-text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">State Availability for {productName}</h1>
        <Link to="/" className="text-accent-orange hover:underline text-lg">Back</Link>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold mb-4">US Map</h2>
          <USAmap customize={configMap()} onClick={mapHandler} />
        </div>
        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold mb-4">Applicable States</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={newState}
              onChange={e => setNewState(e.target.value)}
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              <option value="">Select State</option>
              {allStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <button
              onClick={handleAddState}
              className="bg-accent-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add State
            </button>
            <button
              onClick={handleSelectAll}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
            >
              Save
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search States"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </div>
          {filteredStates.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full table-auto bg-code-bg rounded-lg">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-left text-sm font-medium">State</th>
                    <th className="p-3 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStates.map(state => (
                    <tr key={state} className="border-b border-gray-600 hover:bg-gray-800">
                      <td className="p-3">{state}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveState(state)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove state"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-lg">No States Selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatesScreen;