// import { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import { db } from '../firebase';
// import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
// import { TrashIcon } from '@heroicons/react/24/solid';

// function PricingScreen() {
//   const { productId } = useParams();
//   const [productName, setProductName] = useState('');
//   const [coverages, setCoverages] = useState([]);
//   const [steps, setSteps] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [newStep, setNewStep] = useState({
//     coverage: 'Other',
//     parenBefore: '',
//     stepName: '',
//     parenAfter: '',
//     round: 'None',
//     applicabilityRules: '',
//     table: ''
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const productDoc = await getDoc(doc(db, 'products', productId));
//         if (productDoc.exists()) {
//           setProductName(productDoc.data().name);
//         } else {
//           throw new Error("Product not found");
//         }

//         const coveragesSnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
//         const coverageList = coveragesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setCoverages(coverageList);

//         const stepsSnapshot = await getDocs(collection(db, `products/${productId}/steps`));
//         const stepList = stepsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setSteps(stepList);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         alert("Failed to load data. Please try again.");
//       }
//     };
//     fetchData();
//   }, [productId]);

//   const coverageOptions = [...coverages.map(c => c.name), 'Other'];

//   const filteredSteps = steps.filter(step =>
//     step.stepName.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewStep(prev => ({ ...prev, [name]: value }));
//   };

//   const handleAddStep = async () => {
//     if (!newStep.stepName) {
//       alert('Please enter a step name');
//       return;
//     }
//     try {
//       const stepData = { ...newStep, order: steps.length };
//       const docRef = await addDoc(collection(db, `products/${productId}/steps`), stepData);
//       setSteps([...steps, { ...stepData, id: docRef.id }]);
//       setNewStep({
//         coverage: 'Other',
//         parenBefore: '',
//         stepName: '',
//         parenAfter: '',
//         round: 'None',
//         applicabilityRules: '',
//         table: ''
//       });
//     } catch (error) {
//       console.error("Error adding step:", error);
//       alert("Failed to add step. Please try again.");
//     }
//   };

//   const handleDeleteStep = async (stepId) => {
//     if (window.confirm("Are you sure you want to delete this step?")) {
//       try {
//         await deleteDoc(doc(db, `products/${productId}/steps`, stepId));
//         setSteps(steps.filter(step => step.id !== stepId));
//       } catch (error) {
//         console.error("Error deleting step:", error);
//         alert("Failed to delete step. Please try again.");
//       }
//     }
//   };

//   const onDragEnd = (result) => {
//     if (!result.destination) return;
//     const items = Array.from(steps);
//     const [reorderedItem] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, reorderedItem);
//     setSteps(items);
//     // TODO: Update Firestore with new order
//   };

//   return (
//     <div className="min-h-screen bg-dark-bg text-text-white p-6">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Pricing for {productName}</h1>
//         <Link to="/" className="text-accent-orange hover:underline text-lg">Back</Link>
//       </div>
//       <div className="mb-6">
//         <input
//           type="text"
//           placeholder="Search Steps"
//           value={searchQuery}
//           onChange={e => setSearchQuery(e.target.value)}
//           className="w-full p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//       </div>
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="steps">
//           {(provided) => (
//             <div {...provided.droppableProps} ref={provided.innerRef}>
//               {filteredSteps.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="w-full table-auto bg-code-bg rounded-lg">
//                     <thead>
//                       <tr className="bg-gray-700">
//                         <th className="p-3 text-left text-sm font-medium">Coverage</th>
//                         <th className="p-3 text-left text-sm font-medium">Paren</th>
//                         <th className="p-3 text-left text-sm font-medium">Step</th>
//                         <th className="p-3 text-left text-sm font-medium">Paren</th>
//                         <th className="p-3 text-left text-sm font-medium">Round</th>
//                         <th className="p-3 text-left text-sm font-medium">Applicability Rules</th>
//                         <th className="p-3 text-left text-sm font-medium">Table</th>
//                         <th className="p-3 text-left text-sm font-medium">Delete</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredSteps.map((step, index) => (
//                         <Draggable key={step.id} draggableId={step.id} index={index}>
//                           {(provided) => (
//                             <tr
//                               ref={provided.innerRef}
//                               {...provided.draggableProps}
//                               {...provided.dragHandleProps}
//                               className="border-b border-gray-600 hover:bg-gray-800"
//                             >
//                               <td className="p-3">{step.coverage}</td>
//                               <td className="p-3">{step.parenBefore}</td>
//                               <td className="p-3">{step.stepName}</td>
//                               <td className="p-3">{step.parenAfter}</td>
//                               <td className="p-3">{step.round}</td>
//                               <td className="p-3">{step.applicabilityRules}</td>
//                               <td className="p-3">
//                                 {step.table && (
//                                   <button disabled className="bg-gray-600 text-white px-3 py-1 rounded-md">
//                                     {step.table}
//                                   </button>
//                                 )}
//                               </td>
//                               <td className="p-3">
//                                 <button
//                                   onClick={() => handleDeleteStep(step.id)}
//                                   className="text-red-500 hover:text-red-700"
//                                   title="Delete step"
//                                 >
//                                   <TrashIcon className="h-5 w-5" />
//                                 </button>
//                               </td>
//                             </tr>
//                           )}
//                         </Draggable>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="text-center text-lg">No Steps Found</p>
//               )}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//       <div className="mt-8 flex flex-wrap gap-4">
//         <select
//           name="coverage"
//           value={newStep.coverage}
//           onChange={handleInputChange}
//           className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         >
//           {coverageOptions.map(option => (
//             <option key={option} value={option}>{option}</option>
//           ))}
//         </select>
//         <input
//           type="text"
//           name="parenBefore"
//           value={newStep.parenBefore}
//           onChange={handleInputChange}
//           placeholder="Paren Before"
//           className="flex-1 min-w-[100px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//         <input
//           type="text"
//           name="stepName"
//           value={newStep.stepName}
//           onChange={handleInputChange}
//           placeholder="Step Name"
//           className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//         <input
//           type="text"
//           name="parenAfter"
//           value={newStep.parenAfter}
//           onChange={handleInputChange}
//           placeholder="Paren After"
//           className="flex-1 min-w-[100px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//         <select
//           name="round"
//           value={newStep.round}
//           onChange={handleInputChange}
//           className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         >
//           <option value="Dollar">Dollar</option>
//           <option value="Whole Number">Whole Number</option>
//           <option value="1 Decimal">1 Decimal</option>
//           <option value="2 Decimals">2 Decimals</option>
//           <option value="None">None</option>
//         </select>
//         <input
//           type="text"
//           name="applicabilityRules"
//           value={newStep.applicabilityRules}
//           onChange={handleInputChange}
//           placeholder="Applicability Rules"
//           className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//         <input
//           type="text"
//           name="table"
//           value={newStep.table}
//           onChange={handleInputChange}
//           placeholder="Table Name (Optional)"
//           className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
//         />
//         <button
//           onClick={handleAddStep}
//           className="bg-accent-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
//         >
//           Add Step
//         </button>
//       </div>
//     </div>
//   );
// }
// export default PricingScreen;

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { TrashIcon } from '@heroicons/react/24/solid';
import Select from 'react-select';

function PricingScreen() {
  const { productId } = useParams();
  const [productName, setProductName] = useState('');
  const [coverages, setCoverages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [selectedCoveragesFilter, setSelectedCoveragesFilter] = useState([]);
  const [selectedStatesFilter, setSelectedStatesFilter] = useState([]);
  const [newStep, setNewStep] = useState({
    stepType: 'factor',
    coverage: 'Base Coverage',
    parenBefore: '',
    stepName: '',
    parenAfter: '',
    type: 'User Input',
    table: '',
    rounding: 'none',
    rules: '',
    states: [],
    upstreamId: '',
    operand: ''
  });

  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const stateOptions = allStates.map(s => ({ value: s, label: s }));
  const coverageOptions = coverages.map(c => ({ value: c.name, label: c.name }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          setProductName(productDoc.data().name);
        } else {
          throw new Error("Product not found");
        }

        const coveragesSnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
        const coverageList = coveragesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoverages(coverageList);

        const stepsSnapshot = await getDocs(collection(db, `products/${productId}/steps`));
        const stepList = stepsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSteps(stepList);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again.");
      }
    };
    fetchData();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStep(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStep = async () => {
    try {
      let stepData;
      if (newStep.stepType === 'factor') {
        if (!newStep.stepName || !newStep.coverage) {
          alert('Please fill in required fields');
          return;
        }
        stepData = {
          stepType: 'factor',
          coverage: newStep.coverage,
          parenBefore: newStep.parenBefore,
          stepName: newStep.stepName,
          parenAfter: newStep.parenAfter,
          type: newStep.type,
          table: newStep.table,
          rounding: newStep.rounding,
          rules: newStep.rules,
          states: newStep.states,
          upstreamId: newStep.upstreamId,
          order: steps.length
        };
      } else {
        if (!newStep.operand) {
          alert('Please select an operand');
          return;
        }
        stepData = {
          stepType: 'operand',
          operand: newStep.operand,
          order: steps.length
        };
      }
      const docRef = await addDoc(collection(db, `products/${productId}/steps`), stepData);
      setSteps([...steps, { ...stepData, id: docRef.id }]);
      setNewStep({
        stepType: 'factor',
        coverage: 'Base Coverage',
        parenBefore: '',
        stepName: '',
        parenAfter: '',
        type: 'User Input',
        table: '',
        rounding: 'none',
        rules: '',
        states: [],
        upstreamId: '',
        operand: ''
      });
    } catch (error) {
      console.error("Error adding step:", error);
      alert("Failed to add step. Please try again.");
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/steps`, stepId));
        setSteps(steps.filter(step => step.id !== stepId));
      } catch (error) {
        console.error("Error deleting step:", error);
        alert("Failed to delete step. Please try again.");
      }
    }
  };

  const isStepMatchingFilters = (step) => {
    if (step.stepType === 'operand') return true;
    const coverageMatch = selectedCoveragesFilter.length === 0 || selectedCoveragesFilter.some(c => c.value === step.coverage);
    const statesMatch = selectedStatesFilter.length === 0 || (step.states && selectedStatesFilter.some(s => step.states.includes(s.value)));
    return coverageMatch && statesMatch;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pricing for {productName}</h1>
        <Link to="/" className="text-accent-orange hover:underline text-lg">Back</Link>
      </div>
      <div className="mb-6 flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Filter by Coverages</label>
          <Select
            isMulti
            options={coverageOptions}
            value={selectedCoveragesFilter}
            onChange={setSelectedCoveragesFilter}
            className="text-black"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Filter by States</label>
          <Select
            isMulti
            options={stateOptions}
            value={selectedStatesFilter}
            onChange={setSelectedStatesFilter}
            className="text-black"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto bg-code-bg rounded-lg">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-left text-sm font-medium">Coverages</th>
              <th className="p-3 text-left text-sm font-medium">Paren</th>
              <th className="p-3 text-left text-sm font-medium">Step</th>
              <th className="p-3 text-left text-sm font-medium">Paren</th>
              <th className="p-3 text-left text-sm font-medium">Type</th>
              <th className="p-3 text-left text-sm font-medium">Table</th>
              <th className="p-3 text-left text-sm font-medium">Rounding</th>
              <th className="p-3 text-left text-sm font-medium">Rules</th>
              <th className="p-3 text-left text-sm font-medium">States</th>
              <th className="p-3 text-left text-sm font-medium">Upstream ID</th>
              <th className="p-3 text-left text-sm font-medium">Delete</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => {
              const isMatching = isStepMatchingFilters(step);
              return (
                <tr
                  key={step.id}
                  className={`border-b border-gray-600 ${isMatching ? '' : 'opacity-50'}`}
                >
                  <td className="p-3">{step.stepType === 'factor' ? step.coverage : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.parenBefore : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.stepName : step.operand}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.parenAfter : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.type : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? (step.table ? <button disabled className="bg-gray-600 text-white px-3 py-1 rounded-md">View</button> : 'N/A') : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.rounding : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? <button disabled className="bg-gray-600 text-white px-3 py-1 rounded-md cursor-not-allowed">Rules</button> : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? (step.states ? step.states.join(', ') : '') : ''}</td>
                  <td className="p-3">{step.stepType === 'factor' ? step.upstreamId : ''}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete step"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <select
          name="stepType"
          value={newStep.stepType}
          onChange={handleInputChange}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        >
          <option value="factor">Factor</option>
          <option value="operand">Operand</option>
        </select>
        {newStep.stepType === 'factor' ? (
          <>
            <select
              name="coverage"
              value={newStep.coverage}
              onChange={handleInputChange}
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              {coverages.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="parenBefore"
              value={newStep.parenBefore}
              onChange={handleInputChange}
              placeholder="Paren Before"
              className="flex-1 min-w-[100px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <input
              type="text"
              name="stepName"
              value={newStep.stepName}
              onChange={handleInputChange}
              placeholder="Step Name"
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <input
              type="text"
              name="parenAfter"
              value={newStep.parenAfter}
              onChange={handleInputChange}
              placeholder="Paren After"
              className="flex-1 min-w-[100px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <select
              name="type"
              value={newStep.type}
              onChange={handleInputChange}
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              <option value="User Input">User Input</option>
              <option value="Table">Table</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              name="table"
              value={newStep.table}
              onChange={handleInputChange}
              placeholder="Table Name (Optional)"
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <select
              name="rounding"
              value={newStep.rounding}
              onChange={handleInputChange}
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              <option value="none">None</option>
              <option value="Whole Number">Whole Number</option>
              <option value="1 Decimal">1 Decimal</option>
              <option value="2 Decimals">2 Decimals</option>
              <option value="Other">Other</option>
            </select>
            <Select
              isMulti
              name="states"
              options={stateOptions}
              value={newStep.states.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setNewStep(prev => ({ ...prev, states: selected ? selected.map(s => s.value) : [] }))}
              className="flex-1 min-w-[200px] text-black"
            />
            <input
              type="text"
              name="upstreamId"
              value={newStep.upstreamId}
              onChange={handleInputChange}
              placeholder="Upstream ID"
              className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </>
        ) : (
          <select
            name="operand"
            value={newStep.operand}
            onChange={handleInputChange}
            className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
          >
            <option value="">Select Operand</option>
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">*</option>
            <option value="/">/</option>
            <option value="=">=</option>
          </select>
        )}
        <button
          onClick={handleAddStep}
          className="bg-accent-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Add Step
        </button>
      </div>
    </div>
  );
}

export default PricingScreen;