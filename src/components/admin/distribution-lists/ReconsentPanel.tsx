'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Send, TestTube } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatRow } from '@/components/ds'
import {
  fetchReconsentPreview,
  isReportComplete,
  sendReconsentCampaign,
  sendReconsentTest,
  type ReconsentPreview,
  type ReconsentSendReport,
} from '@/lib/email/reconsentClient'

type Notice = { tone: 'success' | 'error'; text: string }

/** Re-consent mail: count who is concerned, test on yourself, send, resume if the run stopped early. */
export function ReconsentPanel() {
  const [preview, setPreview] = useState<ReconsentPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [report, setReport] = useState<ReconsentSendReport | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true)
    const result = await fetchReconsentPreview()
    if (result.ok) {
      setPreview(result.data)
      setPreviewError(null)
    } else {
      setPreviewError(result.error)
    }
    setLoadingPreview(false)
  }, [])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  const handleTest = async () => {
    setTesting(true)
    setNotice(null)
    const result = await sendReconsentTest()
    setNotice(
      result.ok ? { tone: 'success', text: result.data.message } : { tone: 'error', text: result.error },
    )
    setTesting(false)
  }

  const handleSend = async () => {
    setConfirmOpen(false)
    setSending(true)
    setNotice(null)
    const result = await sendReconsentCampaign()
    if (result.ok) {
      setReport(result.data)
      setNotice(
        isReportComplete(result.data)
          ? { tone: 'success', text: 'Envoi terminé.' }
          : { tone: 'error', text: 'Envoi incomplet. Relance-le pour continuer.' },
      )
    } else {
      setNotice({ tone: 'error', text: result.error })
    }
    setSending(false)
    void loadPreview()
  }

  const resuming = report !== null && !isReportComplete(report)
  const total = preview?.total ?? 0
  const busy = sending || testing

  return (
    <Card variant="info">
      <CardHeader>
        <CardTitle>Re-consentement aux emails</CardTitle>
        <CardDescription>
          Demande aux abonnés sans preuve de consentement de choisir les emails qu'ils veulent recevoir. Sans
          réponse, ils ne reçoivent plus de marketing.
          {preview?.subject ? ` Objet : « ${preview.subject} »` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {previewError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        ) : null}

        <StatRow
          compact
          stats={[
            { label: 'À contacter', value: loadingPreview && !preview ? '…' : total, unit: 'personnes' },
            { label: 'Ont confirmé', value: loadingPreview && !preview ? '…' : (preview?.confirmed ?? 0), unit: 'au moins une liste' },
          ]}
        />

        {report ? (
          <StatRow
            compact
            stats={[
              { label: 'Envoyés', value: report.sent, unit: 'cette fois' },
              { label: 'Déjà envoyés', value: report.alreadyDone, unit: 'avant' },
              { label: 'Restants', value: report.remaining, unit: 'à reprendre' },
              { label: 'Échecs', value: report.failed, unit: report.suppressed ? `${report.suppressed} bloqués` : 'aucun blocage' },
            ]}
          />
        ) : null}

        {report?.aborted ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Envoi interrompu : {report.aborted}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert variant={notice.tone === 'error' ? 'destructive' : 'default'}>
            {notice.tone === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{notice.text}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTest} disabled={busy}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
            M'envoyer un test
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={busy || total === 0}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {resuming ? "Reprendre l'envoi" : `Envoyer à ${total} personnes`}
          </Button>
          <Button variant="ghost" onClick={() => void loadPreview()} disabled={busy || loadingPreview}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingPreview ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Les adresses déjà servies ne reçoivent jamais le mail deux fois. Les gros envois s'arrêtent après environ
          45 secondes : relance simplement l'envoi jusqu'à zéro restant.
        </p>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer le mail de re-consentement ?</AlertDialogTitle>
            <AlertDialogDescription>
              {resuming
                ? `Le serveur reprend là où il s'est arrêté : ${report?.remaining ?? 0} adresse(s) restantes.`
                : `Un vrai email part à ${total} personnes. Cette action est irréversible. Pense à utiliser « M'envoyer un test » avant.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSend()}>Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
