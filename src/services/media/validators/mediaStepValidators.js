/**
 * Media Uploader Step Validators
 */

export const step1Validator = (form) => {
  if (!form.mediaFile && !form.mediaUrl) {
    return { valid: false, errors: ["Please choose a media file to upload."] };
  }
  if (!form.thumbnailUrl && !form.uploadedThumbnailFile) {
    return { valid: false, errors: ["Please select or upload a thumbnail."] };
  }
  return { valid: true };
};

export const step2Validator = (form) => {
  // If link to subscription is enabled, at least one plan must be selected
  if (form.linkToSubscriptionPlan) {
    if (!form.subscriptionPlanIds || form.subscriptionPlanIds.length === 0) {
      return {
        valid: false,
        errors: ["Please select at least one subscription plan."],
      };
    }
  }

  // If pay to view is enabled, validate price
  if (form.payToViewEnabled) {
    const price = parseFloat(form.payToViewOriginalPrice);
    if (isNaN(price) || price < 1.95 || price > 500) {
      return {
        valid: false,
        errors: ["Please give original price and discounted price."],
      };
    }
  }

  return { valid: true };
};

export const step3Validator = (form) => {
  // Details are generally optional in this uploader, but we can add title check if required
  // if (!form.mediaTitle) return { valid: false, errors: ["Please enter a title."] };
  return { valid: true };
};

export const step4Validator = (form) => {
  // If scheduled publish, date must be set
  // This is handled by substep, but if we are at step 4 and try to go to 5:
  // (Assuming substep is 'schedulePublish')
  // We can't easily check substep here unless we pass it, or we infer from form.scheduledPublishDateTime
  return { valid: true };
};

export const step5Validator = (form) => {
  if (
    !form.termsCheckbox1 ||
    !form.termsCheckbox2 ||
    !form.termsCheckbox3 ||
    !form.termsCheckbox4 ||
    !form.termsCheckbox5
  ) {
    return {
      valid: false,
      errors: ["Please accept all terms and conditions before submitting."],
    };
  }
  return { valid: true };
};
