export default function QuantityControl({ label = "Qty", value, max = 99, disabled = false, onChange, className = "" }) {
  const safeMax = Math.max(1, Number(max) || 99);

  const setQuantity = (nextValue) => {
    const nextQuantity = Math.min(safeMax, Math.max(1, Number(nextValue) || 1));
    onChange(nextQuantity);
  };

  return (
    <div className={`quantity-control ${className}`}>
      <span>{label}</span>
      <div className="quantity-stepper">
        <button type="button" disabled={disabled || value <= 1} onClick={() => setQuantity(value - 1)} aria-label="Decrease quantity">
          &minus;
        </button>
        <input
          type="number"
          min="1"
          max={safeMax}
          value={value}
          disabled={disabled}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <button type="button" disabled={disabled || value >= safeMax} onClick={() => setQuantity(value + 1)} aria-label="Increase quantity">
          +
        </button>
      </div>
    </div>
  );
}
