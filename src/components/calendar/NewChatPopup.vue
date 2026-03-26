<template>
    <!-- New Chat Popup -->
    <!-- Header -->
    <div class="w-[42.188rem] h-screen overflow-y-auto flex flex-col bg-gray-200 shadow-[0_0_10px_0_rgba(0,0,0,0.25)] backdrop-blur-[50px]">
    <div class="self-stretch min-h-14 px-2 inline-flex justify-between items-center">
        <div class="justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">New Message</div>
        <div  class="relative">
            <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-3 h-3 filter brightness-0 cursor-pointer">
        </div>
    </div>
    <!-- To -->
    <div class="self-stretch h-12 inline-flex flex-col justify-start items-start gap-1.5">
        <div class="self-stretch flex-1 flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex-1 px-3 py-2 bg-white/50 border-b-[1.50px] border-gray-900 inline-flex justify-start items-center gap-2 overflow-hidden">
                <div class="flex-1 flex justify-start items-center gap-2">
                <div class="justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-6 line-clamp-1">To</div>
                <input type="text" placeholder="Search fans and models by username..." class="w-full h-full bg-transparent border-none outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-6 line-clamp-1">
                </div>
                <div data-svg-wrapper class="relative">
                    <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-2.5 h-2.5 cursor-pointer">
                </div>
            </div>
        </div>
    </div>
    <!-- Missed Call Users -->
    <div class="flex flex-col bg-[rgba(242,244,247,0.7)]  shadow-[0_0_8px_0_rgba(0,0,0,0.10)]">
        <div class="flex p-4 flex-col gap-6">
            <div class="flex flex-col gap-6">
                <div class="self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="self-stretch py-1 inline-flex justify-between items-center">
                    <div class="flex-1 justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Missed Call Users</div>
                </div>
                <div class="self-stretch inline-flex justify-start items-start gap-2">
                    <div class="flex-1 flex justify-start items-start gap-2">
                        <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                    <img :src="SmilingPeachIcon" alt="" class="w-[3.625rem] h-[3.625rem] object-fit"/>
                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                                <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                    <div class="justify-center text-slate-700 text-lg font-semibold font-['Poppins'] leading-5 line-clamp-2">User A</div>
                                </div>
                                <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@userA</div>
                            </div>
                            </div>
                            <div  class="w-36 min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                            <div data-svg-wrapper>
                                <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
                            </div>
                            <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 flex justify-start items-start gap-2">
                    <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                    <img :src="SmilingPeachIcon" alt="" class="w-[3.625rem] h-[3.625rem] object-fit"/>
                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                <div class="justify-center text-slate-700 text-lg font-semibold font-['Poppins'] leading-5 line-clamp-2">User A</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@userA</div>
                            </div>
                        </div>
                        <div  class="w-36 min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                        <div data-svg-wrapper>
                            <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
                        </div>
                        <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
                    </div>
                </div>
                </div>
                <div class="flex-1 flex justify-start items-start gap-2">
                <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                    <div class="self-stretch flex flex-col justify-center items-center gap-1">
                        <div class="size- inline-flex justify-start items-center">
                            <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                <img :src="SmilingPeachIcon" alt="" class="w-[3.625rem] h-[3.625rem] object-fit"/>
                            </div>
                        </div>
                        <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="justify-center text-slate-700 text-lg font-semibold font-['Poppins'] leading-5 line-clamp-2">User A</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@userA</div>
                        </div>
                    </div>
                    <div  class="w-36 min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                    <div data-svg-wrapper >
                        <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
                    </div>
                    <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
                </div>
                </div>
            </div>
            <div class="flex-1 flex justify-start items-start gap-2">
                <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                <div class="self-stretch flex flex-col justify-center items-center gap-1">
                    <div class="size- inline-flex justify-start items-center">
                        <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                            <img :src="SmilingPeachIcon" alt="" class="w-[3.625rem] h-[3.625rem] object-fit"/>
                        </div>
                    </div>
                    <div class="self-stretch flex flex-col justify-start items-center gap-1">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="justify-center text-slate-700 text-lg font-semibold font-['Poppins'] leading-5 line-clamp-2">User A</div>
                        </div>
                        <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@userA</div>
                    </div>
                </div>
                <div  class="w-36 min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                <div data-svg-wrapper>
                    <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
                </div>
                <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
                </div>
            </div>
        </div>
    </div>
    </div>
    </div>
    <!-- /Missed Call Users -->
     <!-- Subscribers -->
    <div class="flex flex-col bg-[rgba(242,244,247,0.7)] ">
        <div class="flex flex-col gap-6">
            <div class="self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="self-stretch py-1 inline-flex justify-between items-center">
                <div class="flex-1 justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Subscribers</div>
                </div>
                <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="size-lf-stretch inline-flex justify-start items-start gap-2">
                    <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="flex items-center">
                                    <!-- Image 1 -->
                                    <div class="relative z-30 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
                                    </div>

                                    <!-- Image 2 -->
                                    <div class="relative z-20 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                    <!-- Image 3 -->
                                    <div class="relative z-10 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                <div class="justify-start text-slate-700 text-lg font-semibold font-['Poppins'] leading-7 line-clamp-2">Free Tier</div>
                                <div class="justify-center text-slate-700 text-xs font-medium font-['Poppins'] leading-4">88 subscriber</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@peach, @pear and 86 more...</div>
                            </div>
                        </div>
                        <div  class="self-stretch min-w-14 px-2 py-1 bg-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                            <div data-svg-wrapper>
                                <img :src="MessageCircleIcon" alt="" class="w-4 h-4 object-fit"/>
                            </div>
                            <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message All</div>
                        </div>
                    </div>
                </div>
                <div class="size-lf-stretch inline-flex justify-start items-start gap-2">
                    <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="flex items-center">
                                    <!-- Image 1 -->
                                    <div class="relative z-30 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
                                    </div>

                                    <!-- Image 2 -->
                                    <div class="relative z-20 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                    <!-- Image 3 -->
                                    <div class="relative z-10 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                <div class="justify-start text-slate-700 text-lg font-semibold font-['Poppins'] leading-7 line-clamp-2">Basic Tier</div>
                                <div class="justify-center text-slate-700 text-xs font-medium font-['Poppins'] leading-4">88 subscriber</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@peach, @pear and 86 more...</div>
                            </div>
                        </div>
                        <div  class="self-stretch min-w-14 px-2 py-1 bg-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                            <div data-svg-wrapper>
                                <img :src="MessageCircleIcon" alt="" class="w-4 h-4 object-fit"/>
                            </div>
                            <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message All</div>
                        </div>
                    </div>
                </div>
                <div class="size-lf-stretch inline-flex justify-start items-start gap-2">
                    <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="flex items-center">
                                    <!-- Image 1 -->
                                    <div class="relative z-30 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
                                    </div>

                                    <!-- Image 2 -->
                                    <div class="relative z-20 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                    <!-- Image 3 -->
                                    <div class="relative z-10 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                <div class="justify-start text-slate-700 text-lg font-semibold font-['Poppins'] leading-7 line-clamp-2">VIP Tier</div>
                                <div class="justify-center text-slate-700 text-xs font-medium font-['Poppins'] leading-4">88 subscriber</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@peach, @pear and 86 more...</div>
                            </div>
                        </div>
                        <div  class="self-stretch min-w-14 px-2 py-1 bg-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                            <div data-svg-wrapper>
                                <img :src="MessageCircleIcon" alt="" class="w-4 h-4 object-fit"/>
                            </div>
                            <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message All</div>
                        </div>
                    </div>
                </div>
                <div class="size-lf-stretch inline-flex justify-start items-start gap-2">
                    <div class="flex-1 px-1 inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                            <div class="size- inline-flex justify-start items-center">
                                <div class="flex items-center">
                                    <!-- Image 1 -->
                                    <div class="relative z-30 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
                                    </div>

                                    <!-- Image 2 -->
                                    <div class="relative z-20 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                    <!-- Image 3 -->
                                    <div class="relative z-10 -ml-8 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                        <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover " />
                                    </div>

                                </div>
                            </div>
                            <div class="self-stretch flex flex-col justify-start items-center gap-1">
                            <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                <div class="justify-start text-slate-700 text-lg font-semibold font-['Poppins'] leading-7 line-clamp-2">VVIP Tier</div>
                                <div class="justify-center text-slate-700 text-xs font-medium font-['Poppins'] leading-4">88 subscriber</div>
                            </div>
                            <div class="self-stretch text-center justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">@peach, @pear and 86 more...</div>
                            </div>
                        </div>
                        <div  class="self-stretch min-w-14 px-2 py-1 bg-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                            <div data-svg-wrapper>
                                <img :src="MessageCircleIcon" alt="" class="w-4 h-4 object-fit"/>
                            </div>
                            <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message All</div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </div>
    <!--/ Subscribers -->
    <!-- Top Followers -->

    <div class="self-stretch py-1 inline-flex justify-between items-center">
    <div class="flex-1 justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Top Followers</div>
    <div class="size- min-w-14 px-2 py-1 bg-rose-600 flex justify-center items-center gap-2 cursor-pointer">
        <div data-svg-wrapper>
            <img :src="MessageCircleIcon" alt="" class="w-4 h-4 object-fit"/>
        </div>
        <div class="h-4 flex justify-start items-center gap-1">
        <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message All</div>
        <div class="w-4 self-stretch text-center justify-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight"> 30</div>
        </div>
    </div>
    </div>

    <div class="flex flex-col gap-2 self-stretch">
    <div class="self-stretch px-1 inline-flex justify-between items-center">
        <div class="size- flex justify-start items-center gap-2">
            <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
            </div>
            <div class="size- inline-flex flex-col justify-center items-start gap-1">
                <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">Peachman</div>
                </div>
                <div class="justify-start text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@sammisjelly187</div>
            </div>
        </div>
        <div  class="size- min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
        <div data-svg-wrapper class="relative">
            <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
        </div>
        <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
    </div>
    </div>
    <div class="flex flex-col gap-2 self-stretch">
    <div class="self-stretch px-1 inline-flex justify-between items-center">
        <div class="size- flex justify-start items-center gap-2">
            <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
            </div>
            <div class="size- inline-flex flex-col justify-center items-start gap-1">
                <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">Peachman</div>
                </div>
                <div class="justify-start text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@sammisjelly187</div>
            </div>
        </div>
        <div  class="size- min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
        <div data-svg-wrapper class="relative">
            <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
        </div>
        <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
    </div>
    </div>
    </div>
    <div class="flex flex-col gap-2 self-stretch">
    <div class="self-stretch px-1 inline-flex justify-between items-center">
        <div class="size- flex justify-start items-center gap-2">
            <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
            </div>
            <div class="size- inline-flex flex-col justify-center items-start gap-1">
                <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">Peachman</div>
                </div>
                <div class="justify-start text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@sammisjelly187</div>
            </div>
        </div>
        <div  class="size- min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
        <div data-svg-wrapper class="relative">
            <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
        </div>
        <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
    </div>
    </div>
    </div>
    <div class="flex flex-col gap-2 self-stretch">
    <div class="self-stretch px-1 inline-flex justify-between items-center">
        <div class="size- flex justify-start items-center gap-2">
            <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                <img :src="SmilingPeachIcon" class="w-[3.625rem] h-[3.625rem] object-cover" />
            </div>
            <div class="size- inline-flex flex-col justify-center items-start gap-1">
                <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">Peachman</div>
                </div>
                <div class="justify-start text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@sammisjelly187</div>
            </div>
        </div>
        <div  class="size- min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
        <div data-svg-wrapper class="relative">
            <img :src="MessageCircleIconPink" alt="" class="w-4 h-4 object-fit"/>
        </div>
        <div class="text-center justify-start text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</div>
    </div>
    </div>
    </div>
    <div class="self-stretch text-center justify-start text-pink-500 text-xs font-bold font-['Poppins'] leading-4">View more</div>
    </div>
    <!--/ Top Followers -->
    </div>
    </div>
    </div>
</template>

<script setup>

// icons
import SmilingPeachIcon from '@/assets/images/icons/smiling-peach.png';
import MessageCircleIcon from '@/assets/images/icons/message-circle.webp';
import MessageCircleIconPink from '@/assets/images/icons/message-dots-circle.webp';

</script>