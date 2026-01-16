/**
 * Google Drive Sync Service
 * Stores and retrieves app progress data from user's Google Drive appdata folder
 * This folder is private to the app and not visible in the user's Drive
 */

import { ProgressData, exportProgress, importProgress } from './localProgress'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const PROGRESS_FILENAME = 'daymark-progress.json'

interface DriveFile {
  id: string
  name: string
  modifiedTime: string
}

/**
 * Find the progress file in appdata folder
 */
async function findProgressFile(accessToken: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${PROGRESS_FILENAME}'`,
    fields: 'files(id, name, modifiedTime)',
  })

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    throw new Error(`Failed to search Drive: ${response.status}`)
  }

  const data = await response.json()
  return data.files?.[0] || null
}

/**
 * Read progress data from Google Drive
 */
export async function loadProgressFromDrive(accessToken: string): Promise<ProgressData | null> {
  try {
    const file = await findProgressFile(accessToken)
    if (!file) {
      return null
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
      }
      throw new Error(`Failed to read file: ${response.status}`)
    }

    const data = await response.json()
    return data as ProgressData
  } catch (error) {
    console.error('Error loading from Drive:', error)
    throw error
  }
}

/**
 * Save progress data to Google Drive
 */
export async function saveProgressToDrive(accessToken: string): Promise<void> {
  const progressData = exportProgress()
  const file = await findProgressFile(accessToken)

  if (file) {
    // Update existing file
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
      }
      throw new Error(`Failed to update file: ${response.status}`)
    }
  } else {
    // Create new file
    const metadata = {
      name: PROGRESS_FILENAME,
      parents: ['appDataFolder'],
    }

    const form = new FormData()
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    form.append(
      'file',
      new Blob([JSON.stringify(progressData)], { type: 'application/json' })
    )

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
      }
      throw new Error(`Failed to create file: ${response.status}`)
    }
  }
}

/**
 * Sync progress: load from Drive and merge with local data
 * Returns true if data was loaded from Drive, false if using local data
 */
export async function syncProgressFromDrive(accessToken: string): Promise<boolean> {
  try {
    const driveData = await loadProgressFromDrive(accessToken)

    if (!driveData) {
      // No data in Drive, save current local data to Drive
      await saveProgressToDrive(accessToken)
      return false
    }

    // Compare timestamps to decide which is newer
    const localBackupTime = localStorage.getItem('daymark-progress-backup-time')
    const driveTime = new Date(driveData.exportedAt).getTime()
    const localTime = localBackupTime ? new Date(localBackupTime).getTime() : 0

    if (driveTime > localTime) {
      // Drive data is newer, import it
      importProgress(driveData)
      return true
    } else {
      // Local data is newer, save to Drive
      await saveProgressToDrive(accessToken)
      return false
    }
  } catch (error) {
    console.error('Sync error:', error)
    throw error
  }
}

/**
 * Get the last sync time from Drive file metadata
 */
export async function getLastSyncTime(accessToken: string): Promise<string | null> {
  try {
    const file = await findProgressFile(accessToken)
    return file?.modifiedTime || null
  } catch {
    return null
  }
}

/**
 * Delete progress file from Drive (for testing/reset purposes)
 */
export async function deleteProgressFromDrive(accessToken: string): Promise<void> {
  const file = await findProgressFile(accessToken)
  if (!file) return

  const response = await fetch(`${DRIVE_API_BASE}/files/${file.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete file: ${response.status}`)
  }
}
