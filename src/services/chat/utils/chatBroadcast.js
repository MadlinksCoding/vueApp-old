import FlowHandler from '@/services/flow-system/FlowHandler.js'

const PINNABLE_TYPES = ['requestJoinCallNotification', 'booking_request']

/**
 * Ids to push a socket message to: everyone in the chat except the sender.
 * `fallbackIds` covers chats the store has not loaded participants for yet.
 */
export function resolveRecipients(chatStore, chatId, currentUserId, fallbackIds = []) {
  const stored = chatStore.chatParticipants?.[chatId]
  const source = Array.isArray(stored) && stored.length ? stored : fallbackIds
  return (source || [])
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id) && id !== parseInt(currentUserId, 10))
}

/**
 * Puts an updated booking message back into the store and pushes it over the socket
 * so the other participant's chat re-renders without a refetch.
 */
export function broadcastMessageUpdate({ chatStore, socket, chatId, currentUserId, item, recipientIds = [] }) {
  if (!item || !chatId) return
  chatStore.addMessage(chatId, item)
  chatStore.updateChatLastMessage(chatId, item)

  if (PINNABLE_TYPES.includes(item.content_type)) {
    if (item.is_pinned === false) {
      // Unpinned — clear the stored pinned message only if it is this one
      const current = chatStore.getPinnedMessageByChatId(chatId)
      if (current?.message_id === item.message_id) chatStore.setPinnedMessage(chatId, null)
    } else {
      chatStore.setPinnedMessage(chatId, item)
    }
  }

  socket?.sendChatMessage(item, resolveRecipients(chatStore, chatId, currentUserId, recipientIds))
}

/**
 * Posts an activity-log line into the chat and pushes it to the other participants.
 * `overrideRecipients` targets a specific subset instead of the whole chat.
 */
export async function sendActivityLog({
  chatStore, socket, chatId, currentUserId, text, meta,
  recipientIds = [], overrideRecipients = null,
}) {
  if (!chatId || !text) return null
  const res = await FlowHandler.run('chat.sendChatActivityLog', { chatId, senderId: currentUserId, text, meta })
  if (!res?.ok) return null

  chatStore.addMessage(chatId, res.data.item)
  chatStore.updateChatLastMessage(chatId, res.data.item)
  const recipients = Array.isArray(overrideRecipients)
    ? overrideRecipients.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id) && id !== parseInt(currentUserId, 10))
    : resolveRecipients(chatStore, chatId, currentUserId, recipientIds)
  socket?.sendChatMessage(res.data.item, recipients)
  return res.data.item
}
