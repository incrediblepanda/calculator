import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useHostEmbedScriptActive } from "@/hooks/use-host-embed-script";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

const EMBED_INSET = 12;
const EMBED_DIALOG_MAX_HEIGHT = 520;
const EMBED_DIALOG_MAX_WIDTH = 512;

const EMBED_OVERLAY_CLASS =
  "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

function MobileEmbedBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 bg-black/50"
    />
  );
}

function getEmbeddedDesktopPanelSize(viewport: {
  width: number;
  height: number;
}): React.CSSProperties {
  const pad = EMBED_INSET * 2;
  const availableHeight = Math.max(200, viewport.height - pad);

  return {
    maxHeight: Math.min(EMBED_DIALOG_MAX_HEIGHT, availableHeight),
    width: Math.min(
      EMBED_DIALOG_MAX_WIDTH,
      Math.max(280, viewport.width - pad),
    ),
    maxWidth: "100%",
  };
}

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Pin overlay and panel to the visible iframe slice when the host page has scrolled. */
    embedded?: boolean;
    /** Hide the default top-right close — use when the header renders its own close control. */
    hideCloseButton?: boolean;
  }
>(({ className, children, embedded = false, hideCloseButton = false, style, ...props }, ref) => {
  const viewport = useVisualViewport(embedded);
  const isMobileEmbed = embedded && viewport.width < 768;
  const hostScriptActive = useHostEmbedScriptActive(isMobileEmbed);
  const embeddedDesktopPanelSize = getEmbeddedDesktopPanelSize(viewport);

  const closeButton = hideCloseButton ? null : (
    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  );

  if (embedded) {
    if (isMobileEmbed) {
      if (hostScriptActive) {
        // Host locks its scroll and reports the visible slice of the (full
        // content height) iframe; pin the dialog to that slice so the header
        // and close button stay on screen.
        return (
          <DialogPortal>
            <DialogPrimitive.Overlay className={EMBED_OVERLAY_CLASS} />
            <DialogPrimitive.Content
              ref={ref}
              style={{
                pointerEvents: "auto",
                position: "fixed",
                top: viewport.top,
                left: viewport.left,
                width: viewport.width,
                height: viewport.height,
                ...style,
              }}
              className={cn(
                "z-[51] flex min-h-0 flex-col gap-0 overflow-hidden border-0 bg-background p-0 shadow-lg",
                className,
              )}
              {...props}
            >
              {children}
              {closeButton}
            </DialogPrimitive.Content>
          </DialogPortal>
        );
      }

      return (
        <DialogPortal>
          <MobileEmbedBackdrop />
          <div className="fixed inset-0 z-[51] flex items-center justify-center pointer-events-none p-3">
            <DialogPrimitive.Content
              ref={ref}
              style={{
                pointerEvents: "auto",
                height: "min(520px, 85dvh)",
                maxHeight: "min(520px, 85dvh)",
                ...style,
              }}
              className={cn(
                "relative z-[52] flex w-full min-h-0 flex-col gap-0 overflow-hidden rounded-xl border bg-background p-0 shadow-lg",
                className,
              )}
              {...props}
            >
              {children}
            </DialogPrimitive.Content>
          </div>
        </DialogPortal>
      );
    }

    return (
      <DialogPortal>
        <DialogPrimitive.Overlay className={EMBED_OVERLAY_CLASS} />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ padding: EMBED_INSET }}
        >
          <DialogPrimitive.Content
            ref={ref}
            style={{
              ...embeddedDesktopPanelSize,
              pointerEvents: "auto",
              ...style,
            }}
            className={cn(
              "relative z-[51] flex w-full min-h-0 max-h-full flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:rounded-xl",
              className,
            )}
            {...props}
          >
            {children}
            {closeButton}
          </DialogPrimitive.Content>
        </div>
      </DialogPortal>
    );
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        style={style}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {children}
        {closeButton}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
