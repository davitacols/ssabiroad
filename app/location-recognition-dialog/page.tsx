import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CameraRecognition } from "./camera-recognition"

interface LocationRecognitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocationRecognitionDialog({ open, onOpenChange }: LocationRecognitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Location Scan</DialogTitle>
          <DialogDescription>Use your camera to quickly identify locations.</DialogDescription>
        </DialogHeader>
        <CameraRecognition />
      </DialogContent>
    </Dialog>
  )
}

