import BatchSimulator from '../components/Agent/BatchSimulator';

export default function SimulatorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1>Batch Simulator</h1>
        <p className="subtitle">Run large-scale transaction simulations</p>
      </div>
      <BatchSimulator />
    </div>
  );
}
