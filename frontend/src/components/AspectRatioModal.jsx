import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASPECT_RATIOS } from "@/lib/aspectRatios";

export const AspectRatioModal = ({ isOpen, onClose, onSelect, onConfirm, selectedRatio }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-elegant max-w-xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Select Aspect Ratio</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Choose dimensions for your generated image
          </p>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            {ASPECT_RATIOS.map((ratio) => {
              // Size logic: Ultra Wide, Tall, Wide are 50% bigger
              let sizeClass = 'max-w-[120px]'; // default
              if (['ultrawide', 'tall', 'wide'].includes(ratio.id)) {
                sizeClass = 'max-w-[180px]'; // 50% bigger
              } else if (['square', 'portrait'].includes(ratio.id)) {
                sizeClass = 'max-w-[80px]'; // smaller
              }

              return (
                <button
                  key={ratio.id}
                  onClick={() => onSelect(ratio)}
                  className={`relative flex flex-col items-center transition-all ${sizeClass} mx-auto`}
                >
                  {/* Aspect ratio preview box with silver outline - no rounded corners */}
                  <div
                    className={`w-full mb-2 transition-all border-2 ${selectedRatio?.id === ratio.id
                        ? "border-silver bg-gradient-silver shadow-glow"
                        : "border-silver/40 bg-transparent hover:border-silver/70"
                      }`}
                    style={{
                      aspectRatio: ratio.ratio.replace(":", " / "),
                    }}
                  >
                    {selectedRatio?.id === ratio.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-silver flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-black" />
                      </div>
                    )}
                  </div>

                  <p className="font-medium text-xs text-foreground">{ratio.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ratio.ratio}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRatio) {
                  onConfirm(selectedRatio);
                }
              }}
              disabled={!selectedRatio}
              className="flex-1 bg-gradient-silver hover:opacity-90 text-black font-semibold"
            >
              {selectedRatio && <span className="mr-2">52</span>}
              Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
