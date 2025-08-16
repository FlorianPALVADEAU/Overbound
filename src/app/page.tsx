'use client'
function CheckoutButton({ ticketId }: { ticketId: string }) {
  const onClick = async () => {
    const res = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ ticketId }) })
    const { url } = await res.json()
    window.location.href = url
  }
  return <button onClick={onClick} className="btn">S’inscrire</button>
}

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <CheckoutButton ticketId="123" />
    </div>
  );
}
