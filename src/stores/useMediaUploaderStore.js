import { defineStore } from "pinia";
import { reactive, ref, watch, computed } from "vue";
import router from "@/router";
import { 
  step1Validator, 
  step2Validator, 
  step3Validator, 
  step4Validator, 
  step5Validator 
} from '@/services/media/validators/mediaStepValidators';

export const useMediaUploaderStore = defineStore("mediaUploader", () => {
  // Use router directly to get reactive current route
  const currentRoute = computed(() => router.currentRoute.value);

  // --- STATE ---
  const step = ref(1);
  const substep = ref("chooseScreenshot"); // Default as requested: "Choose screenshot"

  const validators = reactive({
    1: step1Validator,
    2: step2Validator,
    3: step3Validator,
    4: step4Validator,
    5: step5Validator
  });

  const form = reactive({
    mediaType: "",
    mediaId: "",
    src: null,
    thumbnailOption: "siteDefaultPlaceholder",
    thumbnailUrl: "",
    blurThumbnail: false,
    blurThumbnailLevel: "low",
    showPreviewTrailer_Screenshot: false,
    showPreviewTrailer_Placeholder: false,
    showPreviewTrailer_Upload: false,
    uploadedThumbnailFile: null,
    previewTrailerSource: "siteGenerated",
    previewTrailerUrl: "",
    linkToSubscriptionPlan: false,
    subscriptionPlanIds: [],
    postToSocials_Immediate: false,
    postToSocials_Schedule: false,
    payToViewEnabled: false,
    payToViewOriginalPrice: null,
    payToViewDiscountedPrice: null,
    mediaTitle: "",
    description: "",
    tags: [],
    coPerformerIds: [],
    publishType: "publishImmediatelyAfterApproval",
    scheduledPublishDateTime: "",
    featureOnComingSoon: false,
    preOrderPrice: null,
    postToSocialsOnPublish: false,
    socialPostMessage: "",
    socialThumbnailMode: "useOriginal",
    socialThumbnailCustomImageSrc: "",
    socialThumbnailCustomVideoSrc: "",
    showOnDiscoveryPage: false,
    showOnProfilePage: false,
    termsCheckbox1: false,
    termsCheckbox2: false,
    termsCheckbox3: false,
    termsCheckbox4: false,
    termsCheckbox5: false,
    // --- TIER DATA ---
    tier_name: "",
    tier_description: "",
    tier_originalPrice: null,
    tier_discountPrice: null,
    tier_backgroundUrl: "",
    tier_backgroundFile: null,
    tier_freeTokens: null,
    tier_merchDiscount: null,
    tier_applyMerch: false,
    tier_payToViewDiscount: null,
    tier_applyPayToView: false,
    tier_customRequestDiscount: null,
    tier_applyCustom: false,
  });

  const ui = reactive({
    isValidating: false,
    errors: {},
    uploadProgress: 0,
    isUploading: false,
  });

  // --- ACTIONS ---

  function setStep(newStep) {
    if (newStep > step.value) {
      if (!validateStep(step.value)) return;
    }
    
    // Guardian: Ensure substep is valid for the new step
    if (newStep === 1) {
      const step1Substeps = ['chooseScreenshot', 'usePlaceholder', 'uploadThumbnail'];
      if (!step1Substeps.includes(substep.value)) {
        substep.value = 'chooseScreenshot';
      }
    } else if (newStep === 4) {
      const step4Substeps = ['publishImmediately', 'schedulePublish'];
      if (!step4Substeps.includes(substep.value)) {
        substep.value = 'publishImmediately';
      }
    } else {
      // Steps 2, 3, 5 don't have sub-tabs currently
      substep.value = "";
    }

    step.value = newStep;
    syncToUrl();
  }

  function setSubstep(newSubstep) {
    substep.value = newSubstep;
    syncToUrl();
  }

  function updateFormField(path, value) {
    // Simple path updater for nested fields if needed, or direct access
    // For now, simple direct assignment is assumed in components
    form[path] = value;
  }

  function addValidator(step, validatorFn) {
    validators[step] = validatorFn;
  }

  function validateStep(step) {
    const validator = validators[step];
    if (validator) {
      const { valid, errors } = validator(form);
      if (!valid) {
        if (errors && errors.length > 0) {
          alert(errors[0]); // Simple alert for now, similar to legacy
        }
        return false;
      }
    }
    return true;
  }

  function syncToUrl() {
    // Optimization: Use a local variable to check if params actually changed
    const currentParams = new URLSearchParams(window.location.search);
    const newStep = String(step.value);
    const newSubstep = String(substep.value);

    if (currentParams.get('media_step') === newStep && currentParams.get('media_sub') === newSubstep) {
      return; // No change needed
    }

    const params = new URLSearchParams();
    params.set('media_step', newStep);
    params.set('media_sub', newSubstep);
    
    // Use replaceState to avoid cluttering history and keep it fast
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  function initializeFromUrl() {
    const qStep = currentRoute.value.query.media_step;
    const qSub = currentRoute.value.query.media_sub;

    if (qStep) {
      const parsed = parseInt(qStep, 10);
      if (!isNaN(parsed)) step.value = parsed;
    }
    
    if (qSub) {
      substep.value = qSub;
    } else {
        // Force default "chooseScreenshot" if not in URL and on step 1
        if (step.value === 1) {
            substep.value = "chooseScreenshot";
        }
    }
  }

  async function submitUploader() {
    ui.isValidating = true;
    try {
      console.log("🚀 [STORE] Submitting Media...", JSON.parse(JSON.stringify(form)));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error("Submission error:", error);
      return false;
    } finally {
      ui.isValidating = false;
    }
  }

  function reset() {
    step.value = 1;
    substep.value = "chooseScreenshot";
    // Reset form fields to defaults if needed
  }

  return {
    step,
    substep,
    form,
    ui,
    validators,
    setStep,
    setSubstep,
    updateFormField,
    addValidator,
    validateStep,
    initializeFromUrl,
    submitUploader,
    reset,
  };
}, {
    persist: {
        key: 'media_uploader_persistence',
        storage: localStorage,
        paths: ['form', 'step', 'substep']
    }
});
