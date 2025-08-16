'use client'

import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useState } from "react";

const CheckoutPage = ({amount}: {amount: number}) => {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    return (
        <div>
            <h1>Checkout</h1>
            <p>Amount: {amount}</p>
        </div>
    )
}

export default CheckoutPage