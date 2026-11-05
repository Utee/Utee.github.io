export const stages=['Received','Diagnosed','Approved','In repair','Ready','Collected'];
export const total=j=>j.parts+j.labour;
export const paid=j=>j.payments.reduce((s,p)=>s+p.amount,0);
export const balance=j=>total(j)-paid(j);
export function quote(j,parts,labour){if(!['Received','Diagnosed'].includes(j.status))throw Error('The quote can only change before approval.');if(![parts,labour].every(n=>Number.isSafeInteger(n)&&n>=0)||parts+labour<=0||parts+labour>100000000000)throw Error('Enter a valid quote greater than zero.');if(parts+labour<paid(j))throw Error('The quote cannot be less than payments already recorded.');return {...j,parts,labour,status:'Diagnosed'};}
export function advance(j){const index=stages.indexOf(j.status);if(index<0||index===stages.length-1)throw Error('No further step is available.');if(j.status==='Received')throw Error('Add a diagnosis and quote first.');if(j.status==='Diagnosed')throw Error('The customer must approve the quote first.');if(j.status==='Ready'&&balance(j)>0)throw Error('Settle the outstanding bill before collection.');return {...j,status:stages[index+1]};}
export function approve(j){if(j.status!=='Diagnosed'||total(j)<=0)throw Error('A diagnosis and quote are required before approval.');return {...j,status:'Approved'};}
export function payment(j,amount,method,date){if(!Number.isSafeInteger(amount)||amount<=0||amount>balance(j))throw Error('Payment must be positive and within the outstanding balance.');return {...j,payments:[...j.payments,{amount,method,date}]};}
