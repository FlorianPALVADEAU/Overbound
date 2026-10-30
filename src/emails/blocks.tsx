import * as React from 'react'
import { Button, Img, Section, Text } from '@react-email/components'
import { getEmailPhotoUrl, type EmailPhoto } from '@/lib/email/config'

/**
 * Building blocks shared by the transactional emails. Inline styles only (Gmail strips <style>),
 * tables for layout, no emoji. Colors follow the site: dark #141414, action green #26AA26.
 */
export const EMAIL_COLORS = {
  ink: '#141414',
  text: '#2b2f33',
  muted: '#5b6068',
  line: '#e4e6e1',
  surface: '#f6f7f4',
  action: '#26AA26',
  actionText: '#0b0b0b',
  eyebrow: '#1c7a1c',
  warning: '#b45309',
  warningSurface: '#fff7ed',
  warningLine: '#fed7aa',
} as const

export const EMAIL_FONT = 'Arial, Helvetica, sans-serif'

export function HeroPhoto({ photo, alt }: { photo: EmailPhoto; alt: string }) {
  return (
    <Img
      src={getEmailPhotoUrl(photo)}
      alt={alt}
      width="600"
      style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto' }}
    />
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: '0 0 8px 0',
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: EMAIL_COLORS.eyebrow,
      }}
    >
      {children}
    </Text>
  )
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: '0 0 16px 0',
        fontSize: '30px',
        lineHeight: '34px',
        fontWeight: 800,
        letterSpacing: '-0.5px',
        textTransform: 'uppercase',
        color: EMAIL_COLORS.ink,
      }}
    >
      {children}
    </Text>
  )
}

export function Paragraph({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <Text
      style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        lineHeight: '26px',
        color: muted ? EMAIL_COLORS.muted : EMAIL_COLORS.text,
      }}
    >
      {children}
    </Text>
  )
}

export function SmallPrint({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '20px', color: EMAIL_COLORS.muted }}>
      {children}
    </Text>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: '32px 0 12px 0',
        fontSize: '13px',
        lineHeight: '18px',
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: EMAIL_COLORS.ink,
      }}
    >
      {children}
    </Text>
  )
}

export function CtaButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const primary = variant === 'primary'
  return (
    <Section style={{ margin: '8px 0 24px 0', textAlign: 'center' }}>
      <Button
        href={href}
        style={{
          display: 'inline-block',
          boxSizing: 'border-box',
          padding: '16px 32px',
          borderRadius: '12px',
          backgroundColor: primary ? EMAIL_COLORS.action : '#ffffff',
          border: primary ? `2px solid ${EMAIL_COLORS.action}` : `2px solid ${EMAIL_COLORS.ink}`,
          color: primary ? EMAIL_COLORS.actionText : EMAIL_COLORS.ink,
          fontFamily: EMAIL_FONT,
          fontSize: '16px',
          fontWeight: 700,
          lineHeight: '20px',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        {children}
      </Button>
    </Section>
  )
}

export interface FactRow {
  label: string
  value: React.ReactNode
}

/** Label and value pairs in a bordered card. Rows with an empty value are skipped. */
export function FactList({ title, rows }: { title?: string; rows: FactRow[] }) {
  const visible = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== '')
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        backgroundColor: EMAIL_COLORS.surface,
        border: `1px solid ${EMAIL_COLORS.line}`,
        borderRadius: '12px',
        margin: '0 0 24px 0',
      }}
    >
      <tbody>
        {title ? (
          <tr>
            <td
              colSpan={2}
              style={{
                padding: '16px 20px 4px 20px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: EMAIL_COLORS.ink,
              }}
            >
              {title}
            </td>
          </tr>
        ) : null}
        {visible.map((row, index) => (
          <tr key={row.label}>
            <td
              valign="top"
              style={{
                padding: `${index === 0 && !title ? 16 : 8}px 12px ${index === visible.length - 1 ? 16 : 8}px 20px`,
                width: '38%',
                fontSize: '14px',
                lineHeight: '20px',
                color: EMAIL_COLORS.muted,
              }}
            >
              {row.label}
            </td>
            <td
              valign="top"
              style={{
                padding: `${index === 0 && !title ? 16 : 8}px 20px ${index === visible.length - 1 ? 16 : 8}px 0`,
                fontSize: '15px',
                lineHeight: '20px',
                fontWeight: 700,
                color: EMAIL_COLORS.ink,
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A framed message. `warning` is for what makes the participant lose something if ignored. */
export function Callout({
  title,
  children,
  tone = 'info',
}: {
  title: string
  children: React.ReactNode
  tone?: 'info' | 'warning'
}) {
  const warning = tone === 'warning'
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        backgroundColor: warning ? EMAIL_COLORS.warningSurface : EMAIL_COLORS.surface,
        border: `1px solid ${warning ? EMAIL_COLORS.warningLine : EMAIL_COLORS.line}`,
        borderRadius: '12px',
        margin: '0 0 24px 0',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '16px 20px' }}>
            <Text
              style={{
                margin: '0 0 6px 0',
                fontSize: '15px',
                lineHeight: '22px',
                fontWeight: 700,
                color: warning ? EMAIL_COLORS.warning : EMAIL_COLORS.ink,
              }}
            >
              {title}
            </Text>
            <div style={{ fontSize: '15px', lineHeight: '23px', color: EMAIL_COLORS.text }}>{children}</div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface Step {
  title: string
  text: React.ReactNode
}

/** Numbered steps. The number sits in its own table cell so it never wraps under the text. */
export function Steps({ items }: { items: Step[] }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 24px 0' }}>
      <tbody>
        {items.map((step, index) => (
          <tr key={step.title}>
            <td valign="top" width={48} style={{ padding: '0 0 16px 0', width: '48px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  lineHeight: '36px',
                  borderRadius: '18px',
                  backgroundColor: EMAIL_COLORS.ink,
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </div>
            </td>
            <td valign="top" style={{ padding: '0 0 16px 0' }}>
              <Text style={{ margin: '0 0 2px 0', fontSize: '16px', lineHeight: '24px', fontWeight: 700, color: EMAIL_COLORS.ink }}>
                {step.title}
              </Text>
              <Text style={{ margin: 0, fontSize: '15px', lineHeight: '23px', color: EMAIL_COLORS.text }}>{step.text}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Plain bullet list written as a table so it renders the same everywhere. */
export function Checklist({ items }: { items: React.ReactNode[] }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 24px 0' }}>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td valign="top" width={28} style={{ padding: '0 0 10px 0', width: '28px', fontSize: '16px', fontWeight: 800, color: EMAIL_COLORS.eyebrow }}>
              ✓
            </td>
            <td valign="top" style={{ padding: '0 0 10px 0', fontSize: '15px', lineHeight: '23px', color: EMAIL_COLORS.text }}>
              {item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A short value to read or copy at a glance (promo code, reward). Dashed frame, large text. */
export function Highlight({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ border: `2px dashed ${EMAIL_COLORS.ink}`, borderRadius: '12px', margin: '0 0 24px 0' }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '20px 16px' }}>
            {label ? (
              <Text style={{ margin: '0 0 6px 0', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: EMAIL_COLORS.muted }}>
                {label}
              </Text>
            ) : null}
            <Text style={{ margin: 0, fontSize: '26px', lineHeight: '32px', fontWeight: 800, letterSpacing: '1px', color: EMAIL_COLORS.ink }}>
              {children}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/** The user's own text echoed back, kept visually apart from our wording. */
export function QuoteBox({ children }: { children: React.ReactNode }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ backgroundColor: EMAIL_COLORS.surface, border: `1px solid ${EMAIL_COLORS.line}`, borderRadius: '12px', margin: '0 0 24px 0' }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '16px 20px', fontSize: '15px', lineHeight: '23px', color: EMAIL_COLORS.text, whiteSpace: 'pre-wrap' }}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
