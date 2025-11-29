
export default function TurnGlow({ active }:{ active:boolean }){
  return (
    <div className={active ? 'turn-glow on' : 'turn-glow'}>
      {active ? 'YOUR TURN' : 'Opponent...'}
    </div>
  );
}
