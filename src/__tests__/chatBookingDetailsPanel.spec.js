import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const chatWindow = source("src/components/ui/chat/ChatWindow.vue");
const widget = source("src/components/ui/chat/ChatFloatingWidget.vue");
const bubble = source("src/components/ui/chat/BookingRequestBubble.vue");

describe("booking details opened from a chat bubble", () => {
  it("announces the details panel, and only the details panel", () => {
    expect(chatWindow).toContain("'booking-details-visibility'");
    // The decision prompt and the adjust popup are meant to sit over a chat that
    // stays where it is, so neither may raise this.
    expect(chatWindow).toContain("if (isOpen && bookingDetailsTakeover.value) emit('booking-details-visibility', true)");
    expect(chatWindow).not.toMatch(/emit\('booking-details-visibility', true\)[\s\S]{0,80}bookingDecision/);
  });

  it("hands the screen over from Review booking but not from a View details link", () => {
    // Both open the same panel; only one stands in for the conversation.
    expect(bubble).toContain("$emit('review-booking')");
    expect(chatWindow.match(/@review-booking="openBookingDetail\((msg|message), \{ takeover: true \}\)"/g) || [])
      .toHaveLength(2);
    expect(chatWindow).toContain("async function openBookingDetail(message, { takeover = false } = {})");
    for (const link of chatWindow.match(/@view-details="openBookingDetail\([^)]*\)"/g) || []) {
      expect(link).not.toContain("takeover");
    }
    // Open chat asks to go back to the conversation, so the takeover is dropped
    // rather than taking the chat down with the panel.
    expect(chatWindow).toContain('@open-chat="returnToChatFromDetails"');
    const returnHandler = chatWindow.slice(
      chatWindow.indexOf("function returnToChatFromDetails()"),
      chatWindow.indexOf("// Only the details panel hides the conversation behind it"),
    );
    expect(returnHandler).toContain("bookingDetailsTakeover.value = false");
    // Reopening the panel after a decline taken from a bubble is not a takeover.
    const afterDecision = chatWindow.slice(
      chatWindow.indexOf("function handleBookingDecisionClosed()"),
      chatWindow.indexOf("function confirmBookingDecision("),
    );
    expect(afterDecision).toContain("bookingDetailsTakeover.value = false");
  });

  it("reports the close only once the panel has finished closing", () => {
    const handler = chatWindow.slice(
      chatWindow.indexOf("function handleBookingDetailsClosed()"),
      chatWindow.indexOf("watch(showBookingPopup"),
    );
    // `closed` fires after the transition; tearing the window down any earlier
    // would orphan the teleported panel.
    expect(handler).toContain("emit('booking-details-visibility', false)");
    // Only when the panel had taken the screen over in the first place.
    expect(handler).toContain("if (bookingDetailsTakeover.value) {");
    expect(chatWindow).toContain('@closed="handleBookingDetailsClosed"');
  });

  it("keeps the window mounted while the panel is up and drops it afterwards", () => {
    expect(widget).toContain("function onBookingDetailsVisibility(uid, isOpen)");
    const handler = widget.slice(
      widget.indexOf("function onBookingDetailsVisibility(uid, isOpen)"),
      widget.indexOf("function closeAll()"),
    );
    // Mounted while open: the window owns the panel and every popup it opens.
    expect(handler).toContain("bookingDetailsUid.value = uid");
    expect(handler).toContain("closeChatWindow(uid, { openList: false })");
    // The list must not spring open in the window's place on a narrow host.
    expect(widget).toContain("function closeChatWindow(uid, { openList = true } = {})");
    expect(widget).toContain("if (openList && hostWidth.value < 1024");
  });

  it("un-hides itself if the window disappears without reporting the close", () => {
    // closeAll() from the host, or the open-chat limit trimming the window, would
    // otherwise leave the whole widget invisible with nothing left to close it.
    expect(widget).toContain("openChats.value.some((chat) => chat.uid === bookingDetailsUid.value)");
  });

  it("hides both the window stack and the list while the panel is up", () => {
    expect(widget.match(/bookingDetailsOpen \? 'invisible pointer-events-none' : ''/g) || [])
      .toHaveLength(2);
    expect(widget).toContain('@booking-details-visibility="onBookingDetailsVisibility(chat.uid, $event)"');
  });
});

describe("fan top-up from the details panel", () => {
  const requestBlock = chatWindow.slice(
    chatWindow.indexOf("// Insufficient tokens — need topup for the difference only"),
    chatWindow.indexOf("// Reached only from the confirmed decision popup"),
  );

  it("leaves the panel up while the fan pays", () => {
    expect(requestBlock).toContain("closeBookingDecision({ force: true })");
    expect(requestBlock).not.toContain("showBookingPopup.value = false");
    expect(requestBlock).toContain("_pendingTopupDetailsOpen.value = showBookingPopup.value");
  });

  it("closes the panel once the confirmation lands", () => {
    const successBlock = chatWindow.slice(
      chatWindow.indexOf("if (e.data.type === 'FS_CHAT_TOPUP_SUCCESS')"),
      chatWindow.indexOf("} else if (e.data.type === 'FS_CHAT_TOPUP_FAILED')"),
    );
    expect(successBlock).toContain("if (detailsWereOpen) showBookingPopup.value = false");
    // After the confirmation, not before it.
    expect(successBlock.indexOf("_doConfirmCounter"))
      .toBeLessThan(successBlock.indexOf("showBookingPopup.value = false"));
  });

  it("leaves the panel alone when the top-up fails", () => {
    const failureBlock = chatWindow.slice(
      chatWindow.indexOf("} else if (e.data.type === 'FS_CHAT_TOPUP_FAILED')"),
      chatWindow.indexOf("} else if (e.data.type === 'FS_CHAT_PRODUCT_REFRESH')"),
    );
    expect(failureBlock).not.toContain("showBookingPopup");
  });
});
