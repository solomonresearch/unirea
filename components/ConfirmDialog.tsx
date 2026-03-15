'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Șterge',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9000,
          }}
        />
        <DialogPrimitive.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9001,
            background: 'var(--white)',
            borderRadius: 18,
            padding: '28px 22px 22px',
            width: 'calc(100vw - 48px)',
            maxWidth: 312,
            boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
            outline: 'none',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={20} color="var(--rose)" />
          </div>

          {/* Title */}
          <DialogPrimitive.Title
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--ink)',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </DialogPrimitive.Title>

          {/* Description */}
          <DialogPrimitive.Description
            style={{
              fontSize: 11,
              color: 'var(--ink3)',
              fontFamily: "'Space Mono', monospace",
              lineHeight: 1.6,
              textAlign: 'center',
              marginBottom: 22,
            }}
          >
            {description}
          </DialogPrimitive.Description>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <DialogPrimitive.Close
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--cream2)',
                color: 'var(--ink2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Anulează
            </DialogPrimitive.Close>
            <button
              onClick={() => { onConfirm(); onOpenChange(false) }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: 'var(--rose)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
