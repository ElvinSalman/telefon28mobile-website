"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useText } from "./hooks";
export function Modal({
  open,
  close,
  title,
  children,
}: {
  open: boolean;
  close: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useText();
  return (
    <D.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <D.Portal>
        <D.Overlay className="scrim" />
        <D.Content className="modal" aria-describedby={undefined}>
          <div className="row">
            <D.Title>{title}</D.Title>
            <D.Close className="icon" aria-label={t("close")}>
              <X />
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
