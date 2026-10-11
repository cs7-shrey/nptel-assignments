import data from '@/data/assignments.json';
export function GET(){return Response.json(data,{headers:{'Content-Disposition':`attachment; filename="${data.courseId}-assignments.json"`}});}
