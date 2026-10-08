const NAME_PATTERN = /^[\p{L}][\p{L}\s'’.-]*$/u

const capitalizeParts = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, separator: string, letter: string) => `${separator}${letter.toUpperCase()}`)

export interface PersonNameErrors {
  firstName?: string
  lastName?: string
}

// Nom d’une personne saisi en deux champs. Le nom complet est toujours rendu sous la même
// forme (« Prénom NOM »), quelle que soit la façon dont la personne a tapé.
export class PersonName {
  private constructor(
    readonly firstName: string,
    readonly lastName: string,
  ) {}

  static validate(firstName: string, lastName: string): PersonNameErrors {
    const errors: PersonNameErrors = {}
    const first = firstName.trim()
    const last = lastName.trim()
    if (first.length < 2 || !NAME_PATTERN.test(first)) errors.firstName = 'Indique ton prénom.'
    if (last.length < 2 || !NAME_PATTERN.test(last)) errors.lastName = 'Indique ton nom de famille.'
    return errors
  }

  // null si l’un des deux champs est invalide : valider avant avec `validate`.
  static create(firstName: string, lastName: string): PersonName | null {
    if (Object.keys(PersonName.validate(firstName, lastName)).length > 0) return null
    return new PersonName(capitalizeParts(firstName.trim()), lastName.trim().toLocaleUpperCase('fr-FR'))
  }

  // Préremplissage depuis un nom complet existant : premier mot = prénom, reste = nom.
  static split(fullName: string): { firstName: string; lastName: string } {
    const [firstName = '', ...rest] = fullName.trim().split(/\s+/)
    return { firstName, lastName: rest.join(' ') }
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }
}
