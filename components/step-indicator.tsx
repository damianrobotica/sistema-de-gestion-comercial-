import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              step <= currentStep ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : <span className="text-sm font-medium">{step}</span>}
          </div>
          {step < totalSteps && (
            <div className={`h-0.5 flex-1 transition-colors ${step < currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

