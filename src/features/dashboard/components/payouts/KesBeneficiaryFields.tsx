import { Button } from '../../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { useCreateKeStablecoinQuoteMutation } from '../../hooks/useKeStablecoinPayoutMutations.ts'
import type { KePayoutFormPayload } from '../../services/kePayoutSchemas.ts'
import type { NuvionPayoutFormPayload } from '../../services/nuvionPayoutSchemas.ts'
import type { KeStablecoinQuote } from '../../services/keStablecoinPayoutSchemas.ts'
import {
  defaultChainForStablecoin,
  type KeStablecoinCurrency,
} from '../../services/keStablecoinPayoutSchemas.ts'
import { normalizeKenyaMsisdn } from '../../utils/kenyaMarket.ts'
import { NuvionBeneficiaryFields } from './NuvionBeneficiaryFields.tsx'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface KesBeneficiaryFieldsProps {
  kePayload: KePayoutFormPayload
  setKePayload: React.Dispatch<React.SetStateAction<KePayoutFormPayload>>
  nuvionPayload: NuvionPayoutFormPayload
  setNuvionPayload: React.Dispatch<React.SetStateAction<NuvionPayoutFormPayload>>
  nuvionEntityApproved: boolean
  stablecoinQuote: KeStablecoinQuote | null
  setStablecoinQuote: React.Dispatch<React.SetStateAction<KeStablecoinQuote | null>>
}

const stablecoinOptions = [
  { label: 'USDT', value: 'USDT' },
  { label: 'USDC', value: 'USDC' },
] as const

const chainOptions = [
  { label: 'Default for currency', value: '' },
  { label: 'TRON', value: 'tron' },
  { label: 'Ethereum', value: 'ethereum' },
] as const

export function KesBeneficiaryFields({
  kePayload,
  setKePayload,
  nuvionPayload,
  setNuvionPayload,
  nuvionEntityApproved,
  stablecoinQuote,
  setStablecoinQuote,
}: KesBeneficiaryFieldsProps) {
  const quoteMutation = useCreateKeStablecoinQuoteMutation()

  async function handleGetQuote() {
    setStablecoinQuote(null)
    try {
      const quote = await quoteMutation.mutateAsync({
        amount: kePayload.amount.trim(),
        currency: kePayload.stablecoinCurrency,
      })
      setStablecoinQuote(quote)
    } catch {
      // Surfaced via mutation error.
    }
  }

  return (
    <div className="space-y-4">
      <div className="payout-field-grid">
        <h2 className="payout-panel-section-title sm:col-span-2">
          Kenya payout method
        </h2>
        <p className="payout-panel-section-desc sm:col-span-2">
          Debit your KES wallet via M-Pesa, Nuvion bank transfer, or convert out
          to USDT/USDC.
        </p>

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className={`dash-btn-outline ${kePayload.channel === 'momo' ? 'ring-2 ring-(--color-primary)' : ''}`}
            onClick={() => {
              setKePayload((previous) => ({ ...previous, channel: 'momo' }))
              setStablecoinQuote(null)
            }}
          >
            M-Pesa
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`dash-btn-outline ${kePayload.channel === 'bank' ? 'ring-2 ring-(--color-primary)' : ''}`}
            onClick={() => {
              setKePayload((previous) => ({ ...previous, channel: 'bank' }))
              setStablecoinQuote(null)
              setNuvionPayload((previous) => ({
                ...previous,
                currency: 'KES',
                destinationType: 'kes_bank',
                amount: kePayload.amount || previous.amount,
              }))
            }}
          >
            Bank transfer (Nuvion)
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`dash-btn-outline ${kePayload.channel === 'stablecoin' ? 'ring-2 ring-(--color-primary)' : ''}`}
            onClick={() => {
              setKePayload((previous) => ({
                ...previous,
                channel: 'stablecoin',
              }))
              setStablecoinQuote(null)
            }}
          >
            USDT / USDC
          </Button>
        </div>
      </div>

      {kePayload.channel === 'bank' ? (
        nuvionEntityApproved ? (
          <NuvionBeneficiaryFields
            nuvionPayload={nuvionPayload}
            setNuvionPayload={setNuvionPayload}
            lockDestinationType
          />
        ) : (
          <p className="payout-alert payout-alert--inline">
            Approve your Nuvion entity in Settings → Markets before sending KES
            bank transfers.
          </p>
        )
      ) : kePayload.channel === 'stablecoin' ? (
        <div className="payout-field-grid payout-field-grid--two">
          <h2 className="payout-panel-section-title sm:col-span-2">
            Stablecoin destination
          </h2>
          <p className="payout-panel-section-desc sm:col-span-2">
            Get a quote for the KES → stablecoin rate, then enter the wallet
            that should receive the funds.
          </p>

          <label className="payout-field">
            <span className="payout-field-label">Stablecoin</span>
            <DropdownSelect
              ariaLabel="Select stablecoin"
              options={[...stablecoinOptions]}
              value={kePayload.stablecoinCurrency}
              onChange={(value) => {
                setStablecoinQuote(null)
                setKePayload((previous) => ({
                  ...previous,
                  stablecoinCurrency: value as KeStablecoinCurrency,
                }))
              }}
              className="payout-field-select w-full"
            />
          </label>

          <label className="payout-field">
            <span className="payout-field-label">Chain (optional)</span>
            <DropdownSelect
              ariaLabel="Select chain"
              options={[...chainOptions]}
              value={kePayload.chain}
              onChange={(value) =>
                setKePayload((previous) => ({
                  ...previous,
                  chain: value as KePayoutFormPayload['chain'],
                }))
              }
              className="payout-field-select w-full"
            />
          </label>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="dash-btn-primary"
              disabled={
                quoteMutation.isPending ||
                !/^\d+(\.\d{1,2})?$/.test(kePayload.amount.trim())
              }
              onClick={() => void handleGetQuote()}
            >
              {quoteMutation.isPending ? 'Getting quote…' : 'Get quote'}
            </Button>
            <p className="payout-field-hint">
              Defaults to{' '}
              {defaultChainForStablecoin(kePayload.stablecoinCurrency)} if chain
              is left blank.
            </p>
          </div>

          {quoteMutation.isError ? (
            <p className="payout-alert payout-alert--inline sm:col-span-2">
              {quoteMutation.error.message}
            </p>
          ) : null}

          {stablecoinQuote ? (
            <div className="sm:col-span-2 rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-4 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
              <p>
                <span className="text-(--color-secondary)">You send:</span>{' '}
                {formatPayoutMoney(
                  'KES',
                  stablecoinQuote.sourceAmount ?? kePayload.amount,
                )}
              </p>
              <p className="mt-2">
                <span className="text-(--color-secondary)">You receive:</span>{' '}
                {stablecoinQuote.destinationAmount
                  ? `${stablecoinQuote.destinationAmount} ${kePayload.stablecoinCurrency}`
                  : '—'}
              </p>
              <p className="mt-2">
                <span className="text-(--color-secondary)">Rate:</span>{' '}
                {stablecoinQuote.rate || '—'}
              </p>
              {stablecoinQuote.expiresAt ? (
                <p className="mt-2 text-(--color-secondary)">
                  Quote expires {new Date(stablecoinQuote.expiresAt).toLocaleString()}
                  . Request a fresh quote if confirmation takes too long.
                </p>
              ) : (
                <p className="mt-2 text-(--color-secondary)">
                  Request a fresh quote if confirmation takes too long.
                </p>
              )}
            </div>
          ) : null}

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Recipient address</span>
            <Input
              placeholder="Wallet address"
              value={kePayload.recipientAddress}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  recipientAddress: event.target.value.trim(),
                }))
              }
              className="font-[ui-monospace,monospace] text-sm"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Beneficiary name</span>
            <Input
              placeholder="Jane Doe"
              value={kePayload.accountName}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  accountName: event.target.value,
                }))
              }
            />
          </label>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Narration (optional)</span>
            <Input
              placeholder="Supplier payment"
              value={kePayload.description}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
      ) : (
        <div className="payout-field-grid">
          <h2 className="payout-panel-section-title sm:col-span-2">
            M-Pesa recipient
          </h2>
          <p className="payout-panel-section-desc sm:col-span-2">
            Send KES to a Kenyan M-Pesa number. Confirm the phone number before
            continuing.
          </p>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Recipient name</span>
            <Input
              placeholder="Jane Doe"
              value={kePayload.accountName}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  accountName: event.target.value,
                }))
              }
            />
          </label>

          <label className="payout-field">
            <span className="payout-field-label">M-Pesa number</span>
            <Input
              placeholder="254712345678"
              inputMode="tel"
              autoComplete="tel"
              value={kePayload.accountNumber}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  accountNumber: event.target.value.replace(/[^\d+]/g, ''),
                }))
              }
              onBlur={() =>
                setKePayload((previous) => ({
                  ...previous,
                  accountNumber: normalizeKenyaMsisdn(previous.accountNumber),
                }))
              }
            />
          </label>

          <label className="payout-field">
            <span className="payout-field-label">Confirm M-Pesa number</span>
            <Input
              placeholder="254712345678"
              inputMode="tel"
              autoComplete="off"
              value={kePayload.confirmAccountNumber}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  confirmAccountNumber: event.target.value.replace(/[^\d+]/g, ''),
                }))
              }
              onBlur={() =>
                setKePayload((previous) => ({
                  ...previous,
                  confirmAccountNumber: normalizeKenyaMsisdn(
                    previous.confirmAccountNumber,
                  ),
                }))
              }
            />
          </label>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Description (optional)</span>
            <Input
              placeholder="Supplier payment"
              value={kePayload.description}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
      )}
    </div>
  )
}
