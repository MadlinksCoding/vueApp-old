<script setup>
defineProps({
  walletBalance: {
    type: Number,
    required: true
  },
  topUpAmount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  remainingBalance: { // Balance after booking (Wallet + TopUp - Total)
    type: Number,
    required: true
  }
});

const emit = defineEmits(['back']);
</script>

<template>
  <div class="flex flex-col w-full h-full">
    
    <div 
      class="inline-flex justify-start items-center gap-0.5 cursor-pointer"
      @click="emit('back')"
    >
      <div class="w-4 h-4 relative overflow-hidden">
        <img src="/images/arrow-left.svg" alt="">
      </div>
      <div class="justify-start text-white text-xs font-medium font-['Poppins'] leading-4">
        Back
      </div>
    </div>

    <div class="flex flex-col gap-3 md:pb-10">
      <div class="flex flex-col gap-6 py-3">
          <div class="flex flex-col gap-1">
            <div class="opacity-70 justify-start text-white text-xs font-normal font-['Poppins'] leading-4">
                TOP UP AMOUNT
            </div>
            <div class="flex flex-col gap-6">
                <div class="inline-flex justify-start items-center gap-1">
                  <div class="relative">
                      <img class="w-10 h-10" src="/images/token.svg" alt="">
                  </div>
                  <div class="flex-1 h-11 px-1 border-b border-gray-400 inline-flex flex-col justify-center items-start gap-2">
                      <div class="h-11 inline-flex w-full justify-between items-center gap-1">
                        <div class="flex-1 justify-start text-white text-3xl font-normal font-['Poppins'] leading-9">
                            {{ topUpAmount.toLocaleString() }}
                        </div>
                        <div class="inline-flex flex-col justify-start items-end">
                            <div class="px-1 bg-green-500 inline-flex justify-center items-center gap-2.5">
                              <div class="text-right justify-center text-gray-900 text-xs font-semibold font-['Poppins'] leading-4">
                                  -20%
                              </div>
                            </div>
                            <div class="text-right justify-end text-white text-sm font-semibold font-['Poppins'] leading-5">
                              =USD$ 123.45
                            </div>
                        </div>
                      </div>
                  </div>
                </div>
            </div>
          </div>

          <div class="inline-flex justify-start items-center gap-2">
            <div class="flex-1 p-2.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-white/50 flex justify-center items-center gap-2.5"><div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">500</div></div>
            <div class="flex-1 p-2.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-white/50 flex justify-center items-center gap-2.5"><div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">1,000</div></div>
            <div class="flex-1 p-2.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-white/50 flex justify-center items-center gap-2.5"><div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">2,000</div></div>
            <div class="flex-1 p-2.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-white/50 flex justify-center items-center gap-2.5"><div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">5,000</div></div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="h-6 inline-flex justify-start items-center gap-2">
                <div class="w-5 h-5 relative flex justify-center items-center"><img src="/images/creditIcon.png" alt=""></div>
                <div class="justify-center text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">PAYMENT METHOD</div>
            </div>
            <div class="px-4 bg-black/50 rounded-md outline outline-1 outline-offset-[-1px] outline-gray-200/50 flex flex-col gap-6">
                <div class="py-2 inline-flex justify-start items-center gap-2">
                  <div class="flex-1 inline-flex flex-col justify-center items-start gap-1">
                      <div class="w-56 h-6 justify-center text-gray-200 text-base font-medium font-['Poppins'] leading-6">Chan Tai Man</div>
                      <div class="justify-center text-gray-200 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">VISA-1234</div>
                  </div>
                  <div class="w-4 h-4 relative overflow-hidden"><img src="/images/chevron-down.webp" alt=""></div>
                </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="h-6 inline-flex justify-start items-center gap-2">
                <div class="w-5 h-5 relative overflow-hidden"><img src="/images/at-sign.png" alt=""></div>
                <div class="justify-center text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">ACCOUNT EMAIL</div>
            </div>
            <div class="inline-flex justify-start items-end">
                <div class="py-1 flex justify-center items-center gap-2">
                  <div class="w-10 h-9 relative"><img class="w-9 h-9 left-[2.28px] top-0 absolute" src="https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png" /></div>
                  <div class="inline-flex flex-col justify-center items-start">
                      <div class="inline-flex justify-start items-center gap-1">
                        <div class="justify-start text-white text-xs font-semibold font-['Poppins'] leading-4 line-clamp-1">mangoes</div>
                        <div data-size="xs" class="w-2.5 h-2.5 relative overflow-hidden"><img src="/images/svgviewer-png-output-22.webp" alt=""></div>
                      </div>
                      <div class="justify-start text-gray-500 text-xs font-medium font-['Poppins'] leading-4">mangoes@email.com</div>
                  </div>
                </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="h-6 inline-flex justify-start items-center gap-2">
                <div class="w-5 h-5 relative overflow-hidden"><img src="/images/maps-travel-icon.svg" alt=""></div>
                <div class="justify-center text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">SHIPPING ADDRESS</div>
            </div>
            <div class="flex flex-col gap-3">
                <div class="w-full flex gap-4">
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">Last name</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="Last name" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">First name</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="First name" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                </div>
                <div class="w-full flex">
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">Address Line 1</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="Address Line 1" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                </div>
                <div class="w-full flex">
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">Address Line 2</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="Address Line 2" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                </div>
                <div class="w-full flex gap-4">
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">Postal Code</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="Postal Code" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">City</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="City" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                </div>
                <div class="w-full flex gap-4">
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">Country</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="Country" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                  <div class="w-full flex flex-col gap-[6px] flex-1">
                    <span class="text-sm font-medium leading-tight text-white">State</span>
                    <div class="flex py-2 px-3 border-b border-gray-300 bg-white/10">
                      <input type="text" placeholder="State" class="flex-1 bg-transparent focus:outline-none focus:ring-0 text-white text-sm">
                    </div>
                  </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-none flex items-center">
                <input type="checkbox" checked class="w-4 h-4
                        appearance-none
                        border border-white
                        rounded
                        focus:outline-none focus:ring-0
                        bg-transparent
                        cursor-pointer
                        checked:bg-green
                        checked:border-green
                        checked:bg-[url('../assets/check.svg')]
                        checked:bg-center
                        checked:bg-no-repeat
                        checked:bg-[length:10px_10px]" />

              </div>
              <span class="text-sm leading-tight text-gray-400">Save this address for future use.</span>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="h-6 inline-flex justify-start items-center gap-2">
                <div class="w-5 h-5 relative overflow-hidden"><img src="/images/maps-travel-icon.svg" alt=""></div>
                <div class="justify-center text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">BILLING ADDRESS</div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-none flex items-center">
                <input type="checkbox" checked class="w-4 h-4
                        appearance-none
                        border border-white
                        rounded
                        focus:outline-none focus:ring-0
                        bg-transparent
                        cursor-pointer
                        checked:bg-green
                        checked:border-green
                        checked:bg-[url('../assets/check.svg')]
                        checked:bg-center
                        checked:bg-no-repeat
                        checked:bg-[length:10px_10px]" />

              </div>
              <span class="text-sm leading-tight text-gray-400">Same as Shipping Address</span>
            </div>
          </div>
      </div>

      <div class="rounded-lg bg-white/10 flex flex-col overflow-hidden">
        <div class="flex flex-col gap-3 w-full p-5">
          <h3 class="text-sm text-[#22CCEE] leading-[20px]">PAYMENT SUMMARY</h3>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-2">
                <h4 class="text-xs leading-[18px] text-[#98A2B3]">WALLET TOP UP</h4>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">Original balance</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ walletBalance.toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">Top up amount</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <span class="text-sm font-medium text-white">+</span>
                    <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ topUpAmount.toLocaleString() }}</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">Balance after top up</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ (walletBalance + topUpAmount).toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">Session total</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <span class="text-sm font-medium text-white">-</span>
                    <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ totalPrice }}</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-semibold text-white">Balance after booking</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                    <p class="text-sm font-semibold text-white">{{ remainingBalance.toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-semibold text-white">Top up payment</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"></div>
                    <p class="text-sm font-semibold text-white">USD$ 23.45</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-start text-white">
                  <p class="text-xl font-semibold leading-[30px] text-white">Amount Due Today</p>
                  <div class="flex flex-col">
                    <div class="flex justify-end items-center gap-0.5">
                      <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                      <p class="text-xl font-semibold">USD$256.44</p>
                    </div>
                    <span class="text-xs font-medium text-[#98A2B3] whitespace-nowrap">=USD$ 224.99</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>