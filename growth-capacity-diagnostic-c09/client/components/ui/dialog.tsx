import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getHostEmbedViewport } from "@/lib/embed-height";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

const EMBED_INSET = 12;
const EMBED_DIALOG_MAX_HEIGHT = 520;
const EMBED_DIALOG_MAX_WIDTH = 512;

function getEmbeddedViewportFrame(viewport: {
  top: number;
  left: number;
  width: number;
  height: number;
}): React.CSSProperties {
  return {
    top: viewport.top,
    left: viewport.left,
    width: viewport.width,
    height: viewport.height,
  };
}

function getEmbeddedPanelSize(
  viewport: {
    width: number;
    height: number;
  },
  hasHostViewport: boolean,
): React.CSSProperties {
  const pad = EMBED_INSET * 2;
  const isMobile = viewport.width < 768;
  const availableHeight = Math.max(200, viewport.height - pad);

  if (isMobile && !hasHostViewport) {
    const cappedHeight = Math.min(520, Math.floor(availableHeight * 0.85));
    return {
      maxHeight: cappedHeight,
      width: Math.max(280, viewport.width - pad),
      maxWidth: "100%",
    };
  }

  return {
    maxHeight: isMobile
      ? availableHeight
      : Math.min(EMBED_DIALOG_MAX_HEIGHT, availableHeight),
    height: isMobile ? availableHeight : undefined,
    width: isMobile
      ? Math.max(280, viewport.width - pad)
      : Math.min(
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
  }
>(({ className, children, embedded = false, style, ...props }, ref) => {
  const viewport = useVisualViewport(embedded);
  const hostViewport = embedded ? getHostEmbedViewport() : null;
  const hasHostViewport = Boolean(
    hostViewport && hostViewport.width > 0 && hostViewport.height > 0,
  );
  const embeddedFrame = getEmbeddedViewportFrame(viewport);
  const embeddedPanelSize = getEmbeddedPanelSize(viewport, hasHostViewport);

  const embeddedContentClassName = cn(
    "relative z-[51] flex w-full flex-col gap-4 overflow-hidden border bg-background p-0 shadow-lg",
    viewport.width < 768 ? "rounded-t-xl rounded-b-none" : "sm:rounded-xl",
    className,
  );

  if (embedded) {
    const isMobile = viewport.width < 768;
    const alignItems = isMobile && !hasHostViewport ? "items-center" : isMobile ? "items-end" : "items-center";
    const framePadding = isMobile
      ? hasHostViewport
        ? `0 ${EMBED_INSET}px ${EMBED_INSET}px`
        : EMBED_INSET
      : EMBED_INSET;
    return (
      <DialogPortal>
        <DialogPrimitive.Overlay
          className="fixed z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={embeddedFrame}
        />
        <div
          className={cn(
            "fixed z-50 flex justify-center pointer-events-none",
            alignItems,
          )}
          style={{
            ...embeddedFrame,
            padding: framePadding,
          }}
        >
          <DialogPrimitive.Content
            ref={ref}
            style={{ ...embeddedPanelSize, pointerEvents: "auto", ...style }}
            className={embeddedContentClassName}
            {...props}
          >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
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
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
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
