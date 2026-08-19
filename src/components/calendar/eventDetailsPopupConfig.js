export function createEventDetailsPopupConfig() {
  return {
    actionType: "slidein",
    from: "right",
    verticalAlign: "stretch",
    offset: "0px",
    speed: "220ms",
    effect: "ease-out",
    showOverlay: true,
    closeOnOutside: true,
    lockScroll: true,
    escToClose: true,
    width: { default: "492px", "<768": "100%" },
    height: { default: "100%" },
    scrollable: false,
    closeSpeed: "220ms",
    closeEffect: "ease-in",
    customClass: "mobile-event-details-sheet",
  };
}
