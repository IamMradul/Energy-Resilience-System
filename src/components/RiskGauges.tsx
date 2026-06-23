import React from 'react';
export default function RiskGauges() { return <div className="flex h-full gap-4 items-center justify-around"><Gauge title="Hormuz" score={78} /> <Gauge title="Red Sea" score={65} /> <Gauge title="Malacca" score={22} /> <Gauge title="Cape of Good Hope" score={15} /></div>; }

function Gauge({title, score}: {title: string, score: number}) {
  const color = score > 70 ? 'text-danger' : score > 40 ? 'text-warning' : 'text-success';
  return <div className="flex flex-col items-center"><div className={`text-4xl font-bold ${color}`}>{score}</div><div className="text-sm text-gray-400 mt-2">{title}</div></div>;
}