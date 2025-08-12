export function buildPrompt(question, options){
  let base = `You are given a quiz question with multiple-choice options. Provide ONLY the exact text of the best option. Do not add explanation.`;
  if(options?.length){
    base += `\nOptions:`;
    options.forEach((o,i)=>{ base += `\n${String.fromCharCode(65+i)}. ${o}`; });
  } else {
    base += `\n(No structured options detected; if the selection includes options inline, pick the snippet that best answers.)`;
  }
  base += `\nQuestion/Context:\n${question}`;
  base += `\nAnswer:`;
  return base;
}

export function extractOptions(raw){
  if(!raw) return [];
  const lines = raw.split(/\n|\r/).map(l=>l.trim()).filter(Boolean);
  const optionRegex = /^([A-Da-d0-9])[\).\-]\s*(.+)$/;
  const options = [];
  for(const line of lines){
    const m = line.match(optionRegex);
    if(m) options.push(m[2]);
  }
  return options;
}
