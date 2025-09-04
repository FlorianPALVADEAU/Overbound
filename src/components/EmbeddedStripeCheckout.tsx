import React, { useState, useEffect } from 'react'
import { 
  useStripe, 
  useElements, 
  PaymentElement,
  Elements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Embedded Checkout Form Component
interface EmbeddedCheckoutFormProps {
  clientSecret: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
  totalAmount: number;
  currency?: string;
  loading?: boolean;
}

function EmbeddedCheckoutForm({ 
    clientSecret, 
    onSuccess, 
    onError,
    totalAmount,
    currency = 'eur',
    loading = false
    }: EmbeddedCheckoutFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async () => {
        if (!stripe || !elements) {
        return
        }

        setIsProcessing(true)
        setMessage('')

        const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.origin, // Not used with manual confirmation
        },
        redirect: 'if_required', // Handle payment without redirect
        })

        if (error) {
        setMessage(error.message || 'Une erreur est survenue lors du paiement')
        onError?.(error)
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent)
        }

        setIsProcessing(false)
    }



    const formatAmount = (amount: number, currency: string): string => {
        return (amount / 100).toLocaleString('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase()
        })
    }

    return (
        <div className="space-y-6">
        {/* Payment Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center">
            <span className="font-medium">Total à payer</span>
            <span className="text-lg font-bold text-primary">
                {formatAmount(totalAmount, currency)}
            </span>
            </div>
        </div>

        {/* Stripe Payment Element */}
        <div className="border rounded-lg p-4">
            <PaymentElement 
            options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'paypal'],
            }}
            />
        </div>

        {message && (
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
            </Alert>
        )}

        <Button 
            onClick={handleSubmit}
            className="w-full" 
            size="lg"
            disabled={!stripe || loading || isProcessing}
        >
            {isProcessing ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
            </>
            ) : (
            <>
                <CreditCard className="mr-2 h-4 w-4" />
                Payer {formatAmount(totalAmount, currency)}
            </>
            )}
        </Button>

        <div className="text-xs text-center text-muted-foreground">
            <p>🔒 Paiement sécurisé avec Stripe</p>
            <p>Vos données bancaires sont chiffrées et ne sont jamais stockées</p>
        </div>
        </div>
    )
}

// Wrapper component with Stripe Elements Provider
interface EmbeddedStripeCheckoutProps {
  clientSecret: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
  totalAmount: number;
  currency?: string;
  loading?: boolean;
}

export default function EmbeddedStripeCheckout({
  clientSecret,
  onSuccess,
  onError,
  totalAmount,
  currency = 'eur',
  loading = false
}: EmbeddedStripeCheckoutProps) {
  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Préparation du paiement...</p>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
        colorDanger: 'hsl(var(--destructive))',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid hsl(var(--border))',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid hsl(var(--primary))',
          outline: 'none',
          boxShadow: '0 0 0 2px hsl(var(--primary) / 0.2)',
        },
        '.Label': {
          color: 'hsl(var(--foreground))',
          fontSize: '14px',
          fontWeight: '500',
        }
      }
    }
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <EmbeddedCheckoutForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        totalAmount={totalAmount}
        currency={currency}
        loading={loading}
      />
    </Elements>
  )
}