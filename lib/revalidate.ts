'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateConversations(path: string) {
  revalidatePath(path)
}

export async function revalidateData(path: string) {
  revalidatePath(path)
}