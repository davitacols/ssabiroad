import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Info, MapPin } from "lucide-react"

interface DetectionResult {
  success: boolean
  confidence: number
  description?: string
  address?: string
  features?: {
    architecture?: string[]
    materials?: string[]
    style?: string[]
  }
}

interface DetectionResultDialogProps {
  showResult: boolean
  setShowResult: (show: boolean) => void
  detectionResult: DetectionResult | null
}

export default function DetectionResultDialog({
  showResult,
  setShowResult,
  detectionResult,
}: DetectionResultDialogProps) {
  return (
    <Dialog open={showResult} onOpenChange={setShowResult}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detection Result</DialogTitle>
        </DialogHeader>
        {detectionResult && (
          <div className="space-y-4">
            {detectionResult.success ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <Info className="w-5 h-5" />
                  <span>Building detected with {(detectionResult.confidence * 100).toFixed(1)}% confidence</span>
                </div>
                {detectionResult.description && (
                  <p className="text-gray-600 dark:text-gray-300">{detectionResult.description}</p>
                )}
                {detectionResult.address && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-5 h-5" />
                    <span>{detectionResult.address}</span>
                  </div>
                )}
                {detectionResult.features && (
                  <div className="space-y-2">
                    {Object.entries(detectionResult.features).map(([category, items]) => (
                      <div key={category}>
                        <p className="font-medium capitalize">{category}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {items.map((item) => (
                            <span
                              key={item}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Detection Failed</AlertTitle>
                <AlertDescription>
                  Unable to identify the building. Please try again with a clearer image.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

