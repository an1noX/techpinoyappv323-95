import React from "react";

interface TaxRateProps {
  totalSalesAmount: number;
  vatAmount: number;
  netOfVat: number;
  discount: number;
  withholdingTaxEnabled: boolean;
  withholdingTaxRate: number;
  onWithholdingTaxEnabledChange: (enabled: boolean) => void;
  onWithholdingTaxRateChange: (rate: number) => void;
  withholdingTax: number;
  totalAmountDue: number;
}

const TaxRate: React.FC<TaxRateProps> = ({
  totalSalesAmount,
  vatAmount,
  netOfVat,
  discount,
  withholdingTaxEnabled,
  withholdingTaxRate,
  onWithholdingTaxEnabledChange,
  onWithholdingTaxRateChange,
  withholdingTax,
  totalAmountDue,
}) => (
  <table className="border border-gray-300 text-xs rounded-lg shadow w-full max-w-xs sm:w-auto mx-auto sm:mx-0">
    <tbody>
      <tr>
        <td className="border px-2 py-1 font-semibold truncate">Total Sales</td>
        <td className="border px-2 py-1 truncate">
          (VAT Inclusive)
          <span className="ml-2 font-bold text-green-700">
            ₱{totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </td>
      </tr>
      <tr>
        <td className="border px-2 py-1 truncate">Less: VAT</td>
        <td className="border px-2 py-1 truncate">
          ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
      <tr>
        <td className="border px-2 py-1 truncate">Amount : Net of VAT</td>
        <td className="border px-2 py-1 truncate">
          ₱{netOfVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
      <tr>
        <td className="border px-2 py-1 truncate">Less: Discount</td>
        <td className="border px-2 py-1 truncate">₱{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td className="border px-2 py-1 truncate">Add: VAT</td>
        <td className="border px-2 py-1 truncate">
          ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
      <tr>
        <td className="border px-2 py-1 truncate">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={withholdingTaxEnabled}
              onChange={e => onWithholdingTaxEnabledChange(e.target.checked)}
              className="accent-blue-600"
            />
            Less: Withholding Tax
            <input
              type="number"
              min={0}
              max={100}
              value={withholdingTaxRate}
              onChange={e => onWithholdingTaxRateChange(Number(e.target.value))}
              className="w-12 px-1 py-0.5 border rounded text-xs ml-1"
              disabled={!withholdingTaxEnabled}
            />
            <span className="text-xs">%</span>
          </label>
        </td>
        <td className="border px-2 py-1 truncate">
          ₱{withholdingTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
      <tr>
        <td className="border px-2 py-1 font-bold text-base truncate text-center" colSpan={2}>TOTAL AMOUNT DUE</td>
      </tr>
      <tr>
        <td className="border px-2 py-1 font-bold text-green-700 text-lg text-center" colSpan={2}>
          ₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    </tbody>
  </table>
);

export default TaxRate; 