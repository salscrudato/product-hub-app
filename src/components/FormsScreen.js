import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { TrashIcon } from '@heroicons/react/24/solid';
import { useParams, Link } from 'react-router-dom';

function FormsScreen() {
  const [forms, setForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [type, setType] = useState('Proprietary');
  const [category, setCategory] = useState('Base Coverage Form');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'forms'));
        const formList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForms(formList);
      } catch (error) {
        console.error("Error fetching forms:", error);
        alert("Failed to load forms. Please try again.");
      }
    };
    fetchForms();
  }, []);

  const filteredForms = forms.filter(form =>
    form.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.formNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddForm = async () => {
    if (!formName || !formNumber || !effectiveDate) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'forms'), {
        formName,
        formNumber,
        effectiveDate,
        type,
        category
      });
      setFormName('');
      setFormNumber('');
      setEffectiveDate('');
      setType('Proprietary');
      setCategory('Base Coverage Form');
      const querySnapshot = await getDocs(collection(db, 'forms'));
      const formList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setForms(formList);
    } catch (error) {
      console.error("Error adding form:", error);
      alert("Failed to add form. Please try again.");
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      try {
        await deleteDoc(doc(db, 'forms', formId));
        setForms(forms.filter(form => form.id !== formId));
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Failed to delete form. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forms</h1>
        <Link to="/" className="text-accent-orange hover:underline text-lg">Back</Link>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search Forms"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-4">Forms</h2>
      {filteredForms.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-code-bg rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-left text-sm font-medium">Form Name</th>
                <th className="p-3 text-left text-sm font-medium">Form Number</th>
                <th className="p-3 text-left text-sm font-medium">Effective Date</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Category</th>
                <th className="p-3 text-left text-sm font-medium">Applicability</th>
                <th className="p-3 text-left text-sm font-medium">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map(form => (
                <tr key={form.id} className="border-b border-gray-600 hover:bg-gray-800">
                  <td className="p-3">{form.formName}</td>
                  <td className="p-3">{form.formNumber}</td>
                  <td className="p-3">{form.effectiveDate}</td>
                  <td className="p-3">{form.type}</td>
                  <td className="p-3">{form.category}</td>
                  <td className="p-3">
                    <button disabled className="bg-gray-600 text-white px-3 py-1 rounded-md cursor-not-allowed">
                      Applicability
                    </button>
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDeleteForm(form.id)} className="text-red-500 hover:text-red-700" title="Delete form">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-lg">No Forms Found</p>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Form Name"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="Form Number"
          value={formNumber}
          onChange={e => setFormNumber(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="Effective Date (MM/YY)"
          value={effectiveDate}
          onChange={e => setEffectiveDate(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        >
          <option value="Proprietary">Proprietary</option>
          <option value="ISO">ISO</option>
          <option value="NAICS">NAICS</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        >
          <option value="Base Coverage Form">Base Coverage Form</option>
          <option value="Endorsement">Endorsement</option>
          <option value="Exclusion">Exclusion</option>
          <option value="Dec/Quote Letter">Dec/Quote Letter</option>
          <option value="Notice">Notice</option>
          <option value="Other">Other</option>
        </select>
        <button
          onClick={handleAddForm}
          className="bg-accent-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Add Form
        </button>
      </div>
    </div>
  );
}

export default FormsScreen;