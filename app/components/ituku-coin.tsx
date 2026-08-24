type CoinSize = "xs" | "sm" | "md" | "lg";

const coinSizes: Record<CoinSize, number> = {
  xs: 14,
  sm: 18,
  md: 28,
  lg: 42,
};

export function ItukuCoinIcon({ size = "sm" }: { size?: CoinSize }) {
  const dimension = coinSizes[size];
  return (
    <svg
      aria-label="Ituku Coin"
      role="img"
      width={dimension}
      height={dimension}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="14" fill="#F3C94B" stroke="#B17B12" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10.5" stroke="#FFECA5" strokeWidth="1" />
      <path d="M19.5 11.7c-.8-.8-1.9-1.2-3.3-1.2-2 0-3.5 1-3.5 2.6 0 3.8 7.2 1.5 7.2 5.3 0 1.7-1.5 2.8-3.8 2.8-1.5 0-2.8-.5-3.7-1.5M16 8.7v14.6" stroke="#704C08" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ItukuCoinAmount({ amount, size = "sm" }: { amount: number; size?: CoinSize }) {
  return <span className="ituku-coin-amount"><ItukuCoinIcon size={size} />{amount.toLocaleString("en-US")}</span>;
}

export function ItukuCoinBalance({ amount, label = "Ituku Coins" }: { amount: number; label?: string }) {
  return <span className="ituku-coin-balance"><ItukuCoinAmount amount={amount} size="md" /><small>{label}</small></span>;
}