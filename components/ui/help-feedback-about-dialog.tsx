import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageSquare, Info } from "lucide-react"

interface HelpFeedbackAboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSection: "help" | "feedback" | "about"
}

export const HelpFeedbackAboutDialog: React.FC<HelpFeedbackAboutDialogProps> = ({ open, onOpenChange, activeSection }) => {
  const renderContent = () => {
    switch (activeSection) {
      case "help":
        return (
          <>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help Center
            </DialogTitle>
            <DialogDescription>
              Here you can find answers to frequently asked questions and get support for any issues you encounter.
            </DialogDescription>
          </>
        )
      case "feedback":
        return (
          <>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Feedback
            </DialogTitle>
            <DialogDescription>
              We value your feedback! Please let us know how we can improve our service.
            </DialogDescription>
          </>
        )
      case "about":
        return (
          <>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              About
            </DialogTitle>
            <DialogDescription>
              Learn more about our mission and the team behind this project.
            </DialogDescription>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          {renderContent()}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}