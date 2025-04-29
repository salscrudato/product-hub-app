import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

function CoverageScreen() {
  const { productId } = useParams();
  const [coverages, setCoverages] = useState([]);
  const [productName, setProductName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Base coverage');
  const [formNumber, setFormNumber] = useState('');
  const [itCode, setItCode] = useState('');
  const [statCode, setStatCode] = useState('');
  const [editingCoverageId, setEditingCoverageId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        setProductName(productDoc.data().name);

        const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
        const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoverages(coverageList);
      } catch (error) {
        console.error("Error fetching coverages:", error);
        alert("Failed to load coverages. Please try again.");
      }
    };
    fetchData();
  }, [productId]);

  const filteredCoverages = coverages.filter(coverage =>
    coverage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coverage.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCoverage = async () => {
    if (!name || !description || !formNumber) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await addDoc(collection(db, `products/${productId}/coverages`), {
        name,
        description,
        type,
        formNumber,
        itCode,
        statCode
      });
      setName('');
      setDescription('');
      setType('Base coverage');
      setFormNumber('');
      setItCode('');
      setStatCode('');
      const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
      const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoverages(coverageList);
    } catch (error) {
      console.error("Error adding coverage:", error);
      alert("Failed to add coverage. Please try again.");
    }
  };

  const handleDeleteCoverage = async (coverageId) => {
    if (window.confirm("Are you sure you want to delete this coverage?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/coverages`, coverageId));
        setCoverages(coverages.filter(coverage => coverage.id !== coverageId));
      } catch (error) {
        console.error("Error deleting coverage:", error);
        alert("Failed to delete coverage. Please try again.");
      }
    }
  };

  const handleEditCoverage = (coverage) => {
    setEditingCoverageId(coverage.id);
    setName(coverage.name);
    setDescription(coverage.description);
    setType(coverage.type);
    setFormNumber(coverage.formNumber);
    setItCode(coverage.itCode || '');
    setStatCode(coverage.statCode || '');
  };

  const handleUpdateCoverage = async () => {
    if (!name || !description || !formNumber) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await updateDoc(doc(db, `products/${productId}/coverages`, editingCoverageId), {
        name,
        description,
        type,
        formNumber,
        itCode,
        statCode
      });
      setEditingCoverageId(null);
      setName('');
      setDescription('');
      setType('Base coverage');
      setFormNumber('');
      setItCode('');
      setStatCode('');
      const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
      const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoverages(coverageList);
    } catch (error) {
      console.error("Error updating coverage:", error);
      alert("Failed to update coverage. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coverages for {productName}</h1>
        <Link to="/" className="text-accent-orange hover:underline text-lg">Back</Link>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search Coverages"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
      </div>
      {filteredCoverages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-code-bg rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Description</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Form Number</th>
                <th className="p-3 text-left text-sm font-medium">IT Code</th>
                <th className="p-3 text-left text-sm font-medium">Stat Code</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoverages.map(coverage => (
                <tr key={coverage.id} className="border-b border-gray-600 hover:bg-gray-800">
                  <td className="p-3">{coverage.name}</td>
                  <td className="p-3">{coverage.description}</td>
                  <td className="p-3">{coverage.type}</td>
                  <td className="p-3">{coverage.formNumber}</td>
                  <td className="p-3">{coverage.itCode || '-'}</td>
                  <td className="p-3">{coverage.statCode || '-'}</td>
                  <td className="p-3 flex space-x-2">
                    <button onClick={() => handleEditCoverage(coverage)} className="text-blue-500 hover:text-blue-700" title="Edit coverage">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteCoverage(coverage.id)} className="text-red-500 hover:text-red-700" title="Delete coverage">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-lg">No Coverages Found</p>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Coverage Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="Short Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        >
          <option value="Base coverage">Base coverage</option>
          <option value="Endorsement">Endorsement</option>
        </select>
        <input
          type="text"
          placeholder="Form Number"
          value={formNumber}
          onChange={e => setFormNumber(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="IT Code (Optional)"
          value={itCode}
          onChange={e => setItCode(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="Stat Code (Optional)"
          value={statCode}
          onChange={e => setStatCode(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <button
          onClick={editingCoverageId ? handleUpdateCoverage : handleAddCoverage}
          className="bg-accent-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {editingCoverageId ? 'Update Coverage' : 'Add Coverage'}
        </button>
      </div>
    </div>
  );
}
export default CoverageScreen;