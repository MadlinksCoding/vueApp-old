import FlowHandler from '@/services/flow-system/FlowHandler.js';

/**
 * Filters out users who are already in the chat, chunks the remaining users,
 * and calls the `chat.addParticipants` backend flow in batches.
 * 
 * @param {Object} params
 * @param {string} params.chatId - The ID of the chat
 * @param {Array<string>} params.userIds - The array of user IDs to add
 * @param {string} params.currentUserId - The ID of the user performing the action (for invitedBy)
 * @param {Object} params.chatStore - The Pinia chat store instance
 * @param {string} [params.role='member'] - The role to assign to the new participants
 * @returns {Promise<void>}
 */
export async function addParticipantsInChunks({ chatId, userIds, currentUserId, chatStore, role = 'member' }) {
  if (!chatId || !Array.isArray(userIds) || userIds.length === 0) return;

  // 1. Filter out users who are already participants
  const existingParticipants = chatStore.chatParticipants[chatId] || [];
  const existingIds = new Set(existingParticipants.map(p => String(p.userId || p)));
  
  const newUsersToAdd = userIds
    .map(String)
    .filter(id => !existingIds.has(id));

  if (newUsersToAdd.length === 0) return;

  // 2. Chunk into batches of 500
  const BATCH_SIZE = 500;
  const chunkPromises = [];
  
  for (let i = 0; i < newUsersToAdd.length; i += BATCH_SIZE) {
    const chunk = newUsersToAdd.slice(i, i + BATCH_SIZE);
    chunkPromises.push(FlowHandler.run('chat.addParticipants', {
      chatId,
      userIds: chunk,
      role,
      invitedBy: String(currentUserId)
    }));
  }

  // 3. Await all batches
  await Promise.all(chunkPromises);
}
