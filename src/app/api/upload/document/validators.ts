const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

export const validateDocument = (file: File) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Type de fichier non autorisé (PDF, JPG, JPEG ou PNG uniquement)'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Fichier trop volumineux (max 2MB)'
  }

  return null
}
