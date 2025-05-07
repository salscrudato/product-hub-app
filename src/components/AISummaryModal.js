import React from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

// [Styled components and modal implementation as provided in the plan]

const Backdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
  z-index: 1000;
`;
const Modal = styled.div`
  background: #fff; border-radius: 8px; padding: 24px; width: 600px;
  max-height: 80vh; overflow-y: auto; position: relative;
  font-family: 'Inter', sans-serif; color: #1F2937;
`;
const CloseBtn = styled.button`
  position: absolute; top: 12px; right: 12px; background: #E5E7EB;
  border: none; border-radius: 50%; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  &:hover { background: #D1D5DB; }
`;
const Section = styled.div` margin-bottom: 16px; `;
const Heading = styled.h3` margin-bottom: 8px; font-weight: 600; `;

export default function AISummaryModal({ open, onClose, loading, summary }) {
  if (!open) return null;
  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={e=>e.stopPropagation()}>
        <CloseBtn onClick={onClose}><FiX /></CloseBtn>
        {loading ? (
          <p>Loading summary...</p>
        ) : summary ? (
          <>
            <Section><strong>Form Type:</strong> {summary.formType}</Section>
            <Section><strong>Form Name:</strong> {summary.formName}</Section>
            <Section>{summary.overview}</Section>
            <Section>
              <Heading>Coverages:</Heading>
              <ul>
                {summary.coverages.map(c => (
                  <li key={c.name}>
                    <strong>{c.name}:</strong> {c.description}
                    {c.subCoverages?.length > 0 && (
                      <ul>
                        {c.subCoverages.map(sub=>(
                          <li key={sub.name}><strong>{sub.name}:</strong> {sub.description}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
            <Section>
              <Heading>Key Conditions/Exclusions:</Heading>
              <ul>
                {summary.conditions.map((cond,i)=><li key={i}>{cond}</li>)}
              </ul>
            </Section>
          </>
        ) : (
          <p>No summary available.</p>
        )}
      </Modal>
    </Backdrop>
  );
}