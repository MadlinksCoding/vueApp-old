import { resolveUserId } from "@/utils/resolveUserId";

import { useChatStore } from '@/stores/useChatStore';
import FlowHandler from '@/services/flow-system/FlowHandler';

export function isMessageReadByUser(msg, userId) {
  const senderId = msg?.sender_id ?? null;
  if (senderId !== null && String(userId) === String(senderId)) return true;
  const receipts = Array.isArray(msg?.read_receipts) ? msg.read_receipts : [];
  return receipts.some((r) => String(r.user_id ?? r) === String(userId));
}

/**
 * Finds the direct (non-group) chat shared by exactly two participants.
 *
 * `chatParticipants` entries are ids or objects depending on where they were
 * filled in, so both shapes are normalised before comparing.
 */
export function findDirectChat(chatStore, userIdA, userIdB, { bookingRequestOnly = false } = {}) {
  const a = Number(userIdA);
  const b = Number(userIdB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  return (chatStore.userChats || []).find((chat) => {
    if (chat.is_group === true || chat.is_group === 1 || chat.type === 'group') return false;
    const parts = (chatStore.chatParticipants[chat.chat_id] || [])
      .map((participant) => Number(participant?.user_id ?? participant?.userId ?? participant?.id ?? participant));
    if (parts.length !== 2 || !parts.includes(a) || !parts.includes(b)) return false;
    return bookingRequestOnly ? chat.metadata?.is_booking_request === true : true;
  }) || null;
}

export async function ensureChatUsersData(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;

  const chatStore = useChatStore();
  
  // Deduplicate and filter out users already in store
  const missingIds = [...new Set(userIds.map(String))].filter(
    (id) => id && !chatStore.chatUsersData[id]
  );

  if (missingIds.length === 0) return;

  // Chunk into batches of 500 to avoid API limits (e.g. 4000 users)
  const CHUNK_SIZE = 500;
  const chunks = [];
  for (let i = 0; i < missingIds.length; i += CHUNK_SIZE) {
    chunks.push(missingIds.slice(i, i + CHUNK_SIZE));
  }

  console.log('chunks of userIds to fetch for chat:', chunks);
  // Fetch all chunks in parallel and store
  await Promise.all(
    chunks.map((chunk) =>
      FlowHandler.run('chat.fetchChatUsersData', { userIds: chunk }, {
        pipeline: { concurrency: { keyByPayload: true } }
      }).then((res) => {
        if (res?.ok && res.data?.users) {
          chatStore.setChatUsersDataAction({ users: res.data.users });
        }
      })
    )
  );
}



export async function resolveAndSyncChat(chatId) {
  const chatStore = useChatStore();
  const userId = resolveUserId();

  const chatRes = await FlowHandler.run('chat.getChat', { chatId, userId });
  if (chatRes?.ok && chatRes.data?.item) {
    const item = chatRes.data.item;
    chatStore.prependChat(item);

    const participantIds = (item.participants || []).map(String).filter(Boolean);
    ensureChatUsersData(participantIds);
  }

  return chatRes?.data?.item ?? null;
}
