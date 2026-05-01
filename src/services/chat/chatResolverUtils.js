import { useChatStore } from '@/stores/useChatStore';
import FlowHandler from '@/services/flow-system/FlowHandler';

export function isMessageReadByUser(msg, userId) {
  const senderId = msg?.sender_id ?? null;
  if (senderId !== null && String(userId) === String(senderId)) return true;
  const receipts = Array.isArray(msg?.read_receipts) ? msg.read_receipts : [];
  return receipts.some((r) => String(r.user_id ?? r) === String(userId));
}

export async function resolveAndSyncChat(chatId) {
  const chatStore = useChatStore();

  const chatRes = await FlowHandler.run('chat.getChat', { chatId });
  if (chatRes?.ok && chatRes.data?.item) {
    const item = chatRes.data.item;
    chatStore.prependChat(item);

    const participantIds = (item.participants || []).map(String).filter(Boolean);
    const missingIds = participantIds.filter((id) => !chatStore.chatUsersData[id]);
    if (missingIds.length > 0) {
      FlowHandler.run('chat.fetchChatUsersData', { userIds: missingIds }).then((res) => {
        if (res?.ok) chatStore.setChatUsersDataAction({ users: res.data?.users });
      });
    }
  }

  return chatRes?.data?.item ?? null;
}
