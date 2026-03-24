<template>
  <div class="bg-[#F6F7F9]- p-4 gap-6 rounded-lg shadow-xl w-full max-w-[460px] flex flex-col font-['Poppins'] relative">
      
      <!-- Header -->
      <div class="flex items-center justify-between ">
        <h2 class="text-gray-700 text-sm font-semibold">Adjust Event Details</h2>
        <button class="text-[#98A2B3] hover:text-gray-700 transition-colors">
          <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-2.5 h-2.5">
        </button>
      </div>

      <!-- Content Container -->
      <div class=" pb-6 overflow-y-auto max-h-[85vh] flex flex-col gap-6">
        
        <!-- Personal Request -->
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 text-base font-medium">Personal request</label>
          <div class="bg-white p-3.5 border border-[#EAECF0] rounded text-[13.5px] text-[#344054] leading-relaxed break-words shadow-sm">
            'I would like you to cosplay a specific Pokémon in ths costume i found on amazon...I can reimburse you for the costume: <a href="#" class="text-[#2B35FF] underline underline-offset-2 break-all">https://www.amazon.com/MUFENG-Cosplay-Costume-Halloween-Trainer/dp/B07XYLX8XR/ref=sr_1_8?crid=S6RNG7JA5HMT&amp;dib=eyJ2IjoiMSJ9._8oMRTER8wa...</a>
          </div>
        </div>

        <!-- Session Duration -->
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 text-base font-medium">Session duration</label>
          <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder=""
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">Minutes</div>
          </div>
        </div>
        <!-- Additional Request -->
        <div class="flex flex-col gap-3">
          <label class="text-gray-700 text-base font-medium">Additional request</label>
          <div class="flex flex-col gap-3.5 mt-0.5">
            <label class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <CheckboxGroup />
                <span class="text-gray-950 text-base font-medium transition-colors">Record our session</span>
              </div>
              <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ 1000 Tokens</span>
            </label>
            <label class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <CheckboxGroup />
                <span class="text-gray-950 text-base font-medium transition-colors">Make video exclusive</span>
              </div>
              <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ 450 Tokens</span>
            </label>
            <label class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <CheckboxGroup />
                <span class="text-gray-950 text-base font-medium transition-colors">Cosplay</span>
              </div>
              <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ 450 Tokens</span>
            </label>
            <label class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <CheckboxGroup />
                <span class="text-gray-950 text-base font-medium transition-colors">Topless</span>
              </div>
              <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ 800 Tokens</span>
            </label>
          </div>
        </div>

        <!-- Your remarks -->
        <div class="flex flex-col gap-2 mt-1">
          <label class="text-gray-700 text-base font-medium flex items-baseline gap-1.5">
            Your remarks <span class="text-gray-700 font-normal italic text-xs">Optional</span>
          </label>
          <textarea rows="4" readonly class="w-full bg-white border border-[#EAECF0] shadow-sm rounded-md p-3.5 text-[13.5px] text-[#344054] outline-none focus:border-gray-300 resize-none leading-relaxed">I charge a flat rate of 500 tokens for each personal request. for you I need to charge USD 40 worth of tokens more for the special costume you requested on top of that.</textarea>
        </div>

        <!-- Adjustment -->
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 text-base font-medium">Adjustment</label>
          <BaseInput type="number" placeholder="" inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
        </div>

        <!-- Footer / Total Price -->
        <div class="flex flex-col gap-0.5 mb-1">
          <div class="text-gray-700 text-base font-medium">Total price after adjustment</div>
          <div class="flex items-end justify-between w-full mt-1">
            <div class="flex flex-col gap-0">
              <div class="text-xl font-bold text-gray-950 leading-[1.2] tracking-tight">1337 Tokens</div>
              <div class="text-gray-950 text-base font-medium">(<span class="text-gray-950 font-bold">332.9 Tokens</span> before adjustment)</div>
            </div>
                <ButtonComponent text="SUBMIT" variant="polygonLeft" btnBg="#07f468" btnHoverBg="black" btnText="black" btnHoverText="#07f468" />
          </div>
        </div>

      </div>
    </div>
</template>

<script setup>
// Static Adjust Event Details UI Component
import BaseInput from "@/components/dev/input/BaseInput.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
</script>
