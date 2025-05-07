// GlobalSearch.jsx – hierarchy-aware, clickable results
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import Fuse from 'fuse.js';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

/* ---------- styled bits ---------- */
const SearchBox = styled.input`
  padding:12px;width:100%;font-size:16px;border:1px solid #ccc;
  border-radius:8px;margin-bottom:16px;outline:none;
`;
const ResultItem = styled.div`
  padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;
  background:#fff;cursor:pointer;&:hover{background:#F3F4F6;}
`;
const Label = styled.span`
  font-size:12px;background:#4f46e5;color:#fff;padding:2px 8px;
  border-radius:4px;margin-right:8px;
`;
const Path = styled.span`color:#6B7280;margin-left:4px;`;

/* ---------- component ---------- */
export default function GlobalSearch() {
  const [query,setQuery] = useState('');
  const [index,setIndex] = useState(null);
  const [results,setResults] = useState([]);
  const navigate = useNavigate();

  /* build in-memory index once */
  useEffect(()=>{(async()=>{
    const productSnap  = await getDocs(collection(db,'products'));
    const productMap   = Object.fromEntries(productSnap.docs.map(d=>[d.id,d.data().name]));

    const coverageSnap = await getDocs(collectionGroup(db,'coverages'));
    const formSnap     = await getDocs(collection(db,'forms'));
    const stepSnap     = await getDocs(collectionGroup(db,'steps'));

    const docs = [];

    productSnap.docs.forEach(d=>{
      docs.push({id:d.id,name:d.data().name,type:'Product'});
    });

    coverageSnap.docs.forEach(d=>{
      const productId=d.ref.parent.parent.id;
      docs.push({
        id:d.id,name:d.data().name,type:'Coverage',
        productId,productName:productMap[productId]
      });
    });

    formSnap.docs.forEach(d=>{
      const data=d.data();
      docs.push({
        id:d.id,name:data.formName||data.formNumber,type:'Form',
        formNumber:data.formNumber,productId:data.productId,
        productName:productMap[data.productId]||''
      });
    });

    stepSnap.docs.forEach(d=>{
      const data=d.data(); const productId=d.ref.parent.parent.id;
      docs.push({
        id:d.id,name:data.stepName||data.operand,type:'Step',
        productId,productName:productMap[productId]||''
      });
    });

    setIndex(new Fuse(docs,{keys:['name','formNumber','productName'],threshold:0.3}));
  })();},[]);

  /* run search */
  useEffect(()=>{
    if(!index||!query.trim()){setResults([]);return;}
    setResults(index.search(query).map(r=>r.item));
  },[query,index]);

  /* click handler */
  const handleClick = item=>{
    switch(item.type){
      case 'Product':   return navigate(`/coverage/${item.id}`);
      case 'Coverage':  return navigate(`/coverage/${item.productId}`);
      case 'Form':      return navigate(`/forms?formId=${item.id}`);
      case 'Step':      return navigate(`/pricing/${item.productId}?highlight=${item.id}`);
      default: return;
    }
  };

  const breadcrumb = item=>{
    switch(item.type){
      case 'Coverage': return `→ Product: ${item.productName}`;
      case 'Form':     return `→ Product: ${item.productName}`;
      case 'Step':     return `→ Product: ${item.productName}`;
      default: return '';
    }
  };

  return (
    <div>
      <SearchBox
        placeholder="Search any product, coverage, form, or step…"
        value={query}
        onChange={e=>setQuery(e.target.value)}
      />
      {results.map(r=>(
        <ResultItem key={`${r.type}-${r.id}`} onClick={()=>handleClick(r)}>
          <Label>{r.type}</Label>{r.name}<Path>{breadcrumb(r)}</Path>
        </ResultItem>
      ))}
    </div>
  );
}