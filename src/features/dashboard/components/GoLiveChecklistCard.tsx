import { getAuthUser } from '../../auth/services/authSession.ts'
import { useKycDocumentsQuery, useKycPersonsQuery } from '../../kyc/hooks/useKycQueries.ts'
import {
  KybIconBuilding,
  KybIconCheck,
  KybIconDocument,
  KybIconInfo,
  KybIconPeople,
  KybIconShield,
} from '../../kyc/components/kycWizardIcons.tsx'
import { useKycDialogStore } from '../../../store/kycDialogStore.ts'
import {
  useKycFlowStore,
  type KycWizardStep,
} from '../../../store/kycFlowStore.ts'

type ChecklistStatus = 'complete' | 'not_started' | 'in_progress'

interface ChecklistItem {
  id: KycWizardStep
  title: string
  description: string
  estimateMinutes: number
  status: ChecklistStatus
}

function statusLabel(status: ChecklistStatus) {
  if (status === 'complete') {
    return 'Complete'
  }
  if (status === 'in_progress') {
    return 'In progress'
  }
  return 'Not started'
}

function isStepDone(
  lastSuccessfulStep: KycWizardStep | null | undefined,
  step: Exclude<KycWizardStep, 'submit'>,
) {
  if (!lastSuccessfulStep) {
    return false
  }
  const order: KycWizardStep[] = ['business', 'persons', 'documents', 'submit']
  return order.indexOf(lastSuccessfulStep) >= order.indexOf(step)
}

interface GoLiveChecklistCardProps {
  kycStatus?: 'pending' | 'verified' | 'rejected'
  businessProfileStatus?: string
}

export function GoLiveChecklistCard({
  kycStatus,
  businessProfileStatus,
}: GoLiveChecklistCardProps) {
  const openDialog = useKycDialogStore((state) => state.openDialog)
  const merchantId = getAuthUser()?.merchantId
  const progress = useKycFlowStore((state) =>
    merchantId ? state.progressByMerchant[merchantId] : undefined,
  )
  const personsQuery = useKycPersonsQuery(Boolean(merchantId))
  const documentsQuery = useKycDocumentsQuery(Boolean(merchantId))

  const isSubmitted =
    progress?.isSubmitted ||
    (kycStatus === 'pending' && businessProfileStatus === 'submitted')

  const personCount = personsQuery.data?.items.length ?? 0
  const documentCount = documentsQuery.data?.items.length ?? 0
  const lastStep = progress?.lastSuccessfulStep ?? null

  const businessDone =
    isSubmitted || isStepDone(lastStep, 'business')
  const personsDone =
    isSubmitted || isStepDone(lastStep, 'persons') || personCount > 0
  const documentsDone =
    isSubmitted || isStepDone(lastStep, 'documents') || documentCount > 0

  const items: ChecklistItem[] = [
    {
      id: 'business',
      title: 'Business profile',
      description: 'Legal name, registration number, industry and addresses',
      estimateMinutes: 5,
      status: businessDone
        ? 'complete'
        : lastStep === null
          ? 'in_progress'
          : 'not_started',
    },
    {
      id: 'persons',
      title: 'Directors & UBOs',
      description: 'At least one director or beneficial owner with ID details',
      estimateMinutes: 5,
      status: personsDone
        ? 'complete'
        : businessDone
          ? 'in_progress'
          : 'not_started',
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Registration certificate, trade license, or identity docs',
      estimateMinutes: 3,
      status: documentsDone
        ? 'complete'
        : personsDone
          ? 'in_progress'
          : 'not_started',
    },
  ]

  const completedCount = items.filter((item) => item.status === 'complete').length
  const remainingMinutes = items
    .filter((item) => item.status !== 'complete')
    .reduce((sum, item) => sum + item.estimateMinutes, 0)

  const overallStatus: ChecklistStatus = isSubmitted
    ? 'complete'
    : completedCount === 0
      ? 'not_started'
      : completedCount === items.length
        ? 'complete'
        : 'in_progress'

  const overallBadge =
    isSubmitted
      ? 'Under review'
      : overallStatus === 'complete'
        ? 'Ready to submit'
        : overallStatus === 'in_progress'
          ? 'In progress'
          : 'Not started'

  return (
    <section className="go-live-card app-page-enter">
      <header className="go-live-card-head">
        <div className="go-live-card-head-main">
          <span className="go-live-card-shield" aria-hidden>
            <KybIconShield />
          </span>
          <div className="min-w-0">
            <div className="go-live-card-title-row">
              <h2 className="go-live-card-title">Go Live with Transacty</h2>
              <span
                className={`go-live-badge ${
                  isSubmitted || overallStatus === 'complete'
                    ? 'go-live-badge--success'
                    : overallStatus === 'in_progress'
                      ? 'go-live-badge--progress'
                      : 'go-live-badge--muted'
                }`}
              >
                {overallBadge}
              </span>
            </div>
            <p className="go-live-card-desc">
              Complete these steps to verify your business. Progress saves
              automatically — about 10 minutes total.
            </p>
          </div>
        </div>
      </header>

      <div className="go-live-progress">
        <span>
          {completedCount} / {items.length}
        </span>
        <span>
          {isSubmitted
            ? 'Submitted for review'
            : remainingMinutes > 0
              ? `~${remainingMinutes} min left`
              : 'Ready to submit'}
        </span>
      </div>
      <div className="go-live-progress-track" aria-hidden>
        <div
          className="go-live-progress-fill"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="go-live-list">
        {items.map((item) => {
          const Icon =
            item.status === 'complete'
              ? KybIconCheck
              : item.id === 'business'
                ? KybIconBuilding
                : item.id === 'persons'
                  ? KybIconPeople
                  : KybIconDocument

          return (
            <li key={item.id}>
              <button
                type="button"
                className="go-live-row"
                onClick={() => openDialog()}
              >
                <span
                  className={`go-live-row-icon${
                    item.status === 'complete' ? ' go-live-row-icon--done' : ''
                  }`}
                  aria-hidden
                >
                  <Icon />
                </span>
                <span className="go-live-row-copy">
                  <span className="go-live-row-title">{item.title}</span>
                  <span className="go-live-row-desc">{item.description}</span>
                </span>
                <span className="go-live-row-meta">
                  <span className="go-live-row-time">~{item.estimateMinutes} min</span>
                  <span
                    className={`go-live-badge ${
                      item.status === 'complete'
                        ? 'go-live-badge--success'
                        : item.status === 'in_progress'
                          ? 'go-live-badge--progress'
                          : 'go-live-badge--muted'
                    }`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="go-live-card-foot">
        <KybIconInfo />
        <p>
          {isSubmitted
            ? 'Your package is with compliance. Most reviews finish within 1–2 business days.'
            : 'After you submit, verification usually takes 1–2 business days.'}
        </p>
      </footer>
    </section>
  )
}
