import type { Shift } from '../../shared/Shift'

export type AssignmentRole = 'resp' | 'aide' | 'member'

// Rôles proposés partout où l’on choisit un rôle (changement de rôle, ajout d’une personne) :
// une seule liste, donc les deux sélecteurs ne peuvent plus diverger.
export const ASSIGNMENT_ROLE_OPTIONS: readonly { value: AssignmentRole; label: string }[] = [
  { value: 'member', label: 'Bénévole' },
  { value: 'aide', label: 'AIDE' },
  { value: 'resp', label: 'RESP' },
]

export const isAssignmentRole = (value: unknown): value is AssignmentRole =>
  value === 'resp' || value === 'aide' || value === 'member'

// Forme sérialisable d’une affectation : celle qui circule entre l’API et l’interface.
export interface AssignmentSnapshot {
  id?: string
  // null pour un RESP ou un AIDE saisi à la main qui n’a pas candidaté sur le site.
  applicationId: string | null
  displayName: string
  shift: Shift
  zoneKey: string
  role: AssignmentRole
  // true = posé ou déplacé à la main : la répartition automatique n’y touche jamais.
  locked: boolean
}

export class Assignment {
  readonly id?: string
  readonly applicationId: string | null
  readonly displayName: string
  readonly shift: Shift
  readonly zoneKey: string
  readonly role: AssignmentRole
  readonly locked: boolean

  constructor(props: AssignmentSnapshot) {
    this.id = props.id
    this.applicationId = props.applicationId
    this.displayName = props.displayName
    this.shift = props.shift
    this.zoneKey = props.zoneKey
    this.role = props.role
    this.locked = props.locked
  }

  static automatic(applicationId: string, displayName: string, shift: Shift, zoneKey: string): Assignment {
    return new Assignment({ applicationId, displayName, shift, zoneKey, role: 'member', locked: false })
  }

  static manual(props: Omit<AssignmentSnapshot, 'locked'>): Assignment {
    return new Assignment({ ...props, locked: true })
  }

  get isLead(): boolean {
    return this.role !== 'member'
  }

  // Une affectation manuelle (verrouillée, RESP/AIDE ou personne hors candidatures) est
  // conservée telle quelle par la répartition automatique.
  get isManual(): boolean {
    return this.locked || this.isLead || this.applicationId === null
  }

  concerns(applicationId: string, shift: Shift): boolean {
    return this.applicationId === applicationId && this.shift === shift
  }

  toSnapshot(): AssignmentSnapshot {
    return {
      id: this.id,
      applicationId: this.applicationId,
      displayName: this.displayName,
      shift: this.shift,
      zoneKey: this.zoneKey,
      role: this.role,
      locked: this.locked,
    }
  }
}
