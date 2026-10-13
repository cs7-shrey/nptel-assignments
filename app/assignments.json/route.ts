import data from '@/data/assignments.json';
export function GET(){return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
