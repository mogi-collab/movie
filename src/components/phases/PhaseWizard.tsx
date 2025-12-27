import React, { useState } from 'react';

interface PhaseWizardProps {
  onFinish?: (data: Record<string, any>) => void;
}

export default function PhaseWizard({ onFinish }: PhaseWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<{ theme?: string }>({});

  return (
    <div>
      <h2>Phase Wizard</h2>
      <div data-testid="step-indicator">Step {step}</div>

      {step === 1 && (
        <div>
          <label>
            Core theme
            <input
              type="text"
              value={data.theme || ''}
              onChange={(e) => setData((d) => ({ ...d, theme: e.target.value }))}
              data-testid="theme-input"
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div>
          <div data-testid="summary">Summary: {data.theme || '(none)'}</div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setStep(Math.max(1, step - 1))} data-testid="back">Back</button>
        {step < 2 ? (
          <button onClick={() => setStep(step + 1)} data-testid="next">Next</button>
        ) : (
          <button
            onClick={() => {
              onFinish?.(data);
            }}
            data-testid="finish"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
