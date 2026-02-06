/**
 * Improved step indicator component with better visual feedback
 */

import { Check } from 'lucide-react';

const steps = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Type' },
  { number: 3, label: 'Style' },
  { number: 4, label: 'Generate' },
];

export const StepIndicator = ({ currentStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Square */}
            <div className="relative flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${
                    currentStep > step.number
                      ? 'bg-silver text-black scale-100'
                      : currentStep === step.number
                      ? 'bg-gradient-silver text-black scale-110 shadow-glow border-2 border-silver'
                      : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium whitespace-nowrap
                  ${
                    currentStep >= step.number
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative top-[-12px]">
                <div
                  className={`
                    h-full transition-all duration-500
                    ${
                      currentStep > step.number
                        ? 'bg-silver'
                        : 'bg-border'
                    }
                  `}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
