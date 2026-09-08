<template>
<div class="flex flex-col gap-10">

<div class=" relative w-full sm:w-[368px] mt-10 self-stretch min-h-20 p-3 bg-[#5FE9D0]/5 sm:rounded-[10px] blink-border-effect-pink inline-flex justify-end items-start gap-1.5">
    <div class="absolute top-2 right-2 sm:top-[-8px] sm:right-[-8px] flex items-center justify-center w-6 h-6 rounded-full sm:bg-[#EAECF0] sm:shadow-[0_0_4px_0_rgba(0,0,0,0.25)] cursor-pointer">
        <img :src="XCloseIcon" alt="Close Icon" class="h-4 w-4 invert"/>
    </div>
  <div class="w-1 self-stretch bg-white rounded-[10px]" />
  <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
    <div class="size- inline-flex justify-center items-center gap-2">
      <div data-svg-wrapper class="size-5 relative">
        <img :src="CalendarPinkIcon" alt="Calendar Icon" class="h-5 w-5"/>
      </div>
      <div class="justify-start text-[#F06] text-sm font-semibold  leading-5">New event booking received:</div>
    </div>
    <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
      <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
        <div class="size- flex flex-col justify-center items-center">
          <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
          <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
        </div>
      </div>
      <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
        <div class="self-stretch inline-flex justify-start items-center gap-1">
          <div class="flex-1 flex justify-start items-center gap-1">
            <div data-svg-wrapper class="size-3.5 relative">
              <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
              <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
            </div>
            <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
              <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_3292_19308)">
              <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
              <clipPath id="clip0_3292_19308">
              <rect width="16" height="16" fill="white"/>
              </clipPath>
              </defs>
              </svg>
            </div>
          </div>
        </div>
        <div class="self-stretch inline-flex justify-end items-end gap-1.5">
          <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
            <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
          </div>
        </div>
        <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
          <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
          <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
        </div>
      </div>
    </div>
    <div class="self-stretch flex flex-col justify-center items-start gap-2">
      <div class="self-stretch h-9 px-2 py-1 bg-white rounded-[0.25rem] outline outline-1 outline-offset-[-0.50px] outline-[#FF4405] inline-flex justify-center items-center gap-4 cursor-pointer">
        <div data-svg-wrapper class="size-5 relative">
          <img :src="FileBlackIcon" alt="File Icon" class="h-5 w-5"/>
          <div class="absolute top-[-2px] right-[0px]">
              <IndicatorDot size="7" color="#FF4405" />
          </div>
        </div>
        <div class="justify-start text-[#FF4405] text-base font-medium  leading-6">REVIEW</div>
      </div>
    </div>
  </div>
</div>

<!-- When have more notifications -->
<div class=" relative w-full sm:w-[368px] mt-10 self-stretch min-h-20 p-3 bg-[#5FE9D0]/5 rounded-[10px] blink-border-effect-pink inline-flex justify-end items-start gap-1.5">
    <div class="absolute top-2 right-2 sm:top-[-8px] sm:right-[-8px] flex items-center justify-center w-6 h-6 rounded-full sm:bg-[#EAECF0] sm:shadow-[0_0_4px_0_rgba(0,0,0,0.25)] cursor-pointer">
        <img :src="XCloseIcon" alt="Close Icon" class="h-4 w-4 invert"/>
    </div>
    <div class="flex-1 inline-flex flex-col justify-start items-start gap-3">
    
    <!-- Today events -->
    <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-3">
    <div class="size- inline-flex justify-center items-center gap-2">
        <div data-svg-wrapper class="size-5 relative">
        <img :src="CalendarGreenCheckIcon" alt="Calendar Icon" class="h-5 w-5"/>
        </div>
        <div class="justify-start text-[#107569] text-sm font-semibold  leading-5">You have 2 events today:</div>
    </div>
    <div class="flex flex-col gap-4">
        <div class="self-stretch h-[74px] inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center flex-1">
                <div class="justify-center text-[#344054] text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <IndicatorDot size="10" color="#07F468" />
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
        <div class="self-stretch h-[74px] inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center flex-1">
                <div class="justify-center text-[#344054] text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#B54708" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#B54708] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <IndicatorDot size="10" color="#07F468" />
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
    </div>
    </div>

    <div class="size- inline-flex justify-center items-center gap-2">
        <div data-svg-wrapper class="size-5 relative">
        <img :src="CalendarPinkIcon" alt="Calendar Icon" class="h-5 w-5"/>
        </div>
    <div class="justify-start text-[#F06] text-sm font-semibold  leading-5">You have 5 new pending bookings:</div>
    </div>
    <div class="flex flex-col gap-4">
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#B54708" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#B54708] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
    </div>
    <!-- Review button -->
        <div class="flex flex-col gap-3 self-stretch">
        <!-- more section -->
            <span class="text-[#667085] text-sm font-medium ">and 2 more...</span>
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <div class="self-stretch h-9 px-2 py-1 bg-white rounded-[0.25rem] outline outline-1 outline-offset-[-0.50px] outline-[#FF4405] inline-flex justify-center items-center gap-1 cursor-pointer">
                <div data-svg-wrapper class="size-5 relative">
                <img :src="FileBlackIcon" alt="File Icon" class="h-5 w-5"/>
                <div class="absolute top-[-2px] right-[0px]">
                    <IndicatorDot size="7" color="#FF4405" />
                </div>
                </div>
                <div class="justify-start text-[#FF4405] text-base font-medium  leading-6">REVIEW</div>
            </div>
            </div>

             <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <div class="self-stretch h-9 px-2 py-1 bg-[#F06] rounded-[0.25rem] inline-flex justify-center items-center gap-1 cursor-pointer">
                <div class="justify-start text-white text-base font-medium  leading-6">REVIEW IN EVENT PAGE</div>
                <img :src="WhiteArrowUpRightIcon" alt="Arrow Icon" class="h-5 w-5"/>
            </div>
            </div>
        </div>
    </div>
</div>


<!-- When have more notifications -->
<div class=" relative w-full sm:w-[368px] mt-10 self-stretch min-h-20 p-3 bg-[#5FE9D0]/5 sm:rounded-[10px] blink-border-effect-pink inline-flex justify-end items-start gap-1.5">
    <div class="absolute top-2 right-2 sm:top-[-8px] sm:right-[-8px] flex items-center justify-center w-6 h-6 rounded-full sm:bg-[#EAECF0] sm:shadow-[0_0_4px_0_rgba(0,0,0,0.25)] cursor-pointer">
        <img :src="XCloseIcon" alt="Close Icon" class="h-4 w-4 invert"/>
    </div>
    <div class="flex-1 inline-flex flex-col justify-start items-start gap-3">


    <div class="size- inline-flex justify-center items-center gap-2">
        <div data-svg-wrapper class="size-5 relative">
        <img :src="CalendarPinkIcon" alt="Calendar Icon" class="h-5 w-5"/>
        </div>
    <div class="justify-start text-[#F06] text-sm font-semibold  leading-5">You have 5 new pending bookings:</div>
    </div>
    <div class="flex flex-col gap-4">
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#B54708" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#B54708] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
        <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
            <div class="w-1 self-stretch bg-white rounded-[10px]" />
            <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
            <div class="size- flex flex-col justify-center items-center">
                <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
                <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
            </div>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="flex-1 flex justify-start items-center gap-1">
                <div data-svg-wrapper class="size-3.5 relative">
                    <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
                </div>
                <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3292_19308)">
                    <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_3292_19308">
                    <rect width="16" height="16" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                </div>
                </div>
            </div>
            <div class="self-stretch inline-flex justify-end items-end gap-1.5">
                <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
                </div>
            </div>
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>
            </div>
        </div>
    </div>
    <!-- Review button -->
        <div class="flex flex-col gap-3 self-stretch">
        <!-- more section -->
            <span class="text-[#667085] text-sm font-medium ">and 2 more...</span>
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <div class="self-stretch h-9 px-2 py-1 bg-white rounded-[0.25rem] outline outline-1 outline-offset-[-0.50px] outline-[#FF4405] inline-flex justify-center items-center gap-1 cursor-pointer">
                <div data-svg-wrapper class="size-5 relative">
                <img :src="FileBlackIcon" alt="File Icon" class="h-5 w-5"/>
                <div class="absolute top-[-2px] right-[0px]">
                    <IndicatorDot size="7" color="#FF4405" />
                </div>
                </div>
                <div class="justify-start text-[#FF4405] text-base font-medium  leading-6">REVIEW</div>
            </div>
            </div>
        </div>
    </div>
</div>



<!-- Event with adjustments -->
  <div class="relative w-full sm:w-[368px] mt-10 self-stretch min-h-20 p-3 bg-[#5FE9D0]/5 sm:rounded-[10px] blink-border-effect-pink inline-flex justify-end items-start gap-1.5">
    <div class="absolute top-2 right-2 sm:top-[-8px] sm:right-[-8px] flex items-center justify-center w-6 h-6 rounded-full sm:bg-[#EAECF0] sm:shadow-[0_0_4px_0_rgba(0,0,0,0.25)] cursor-pointer">
        <img :src="XCloseIcon" alt="Close Icon" class="h-4 w-4 invert"/>
    </div>
  <div class="w-1 self-stretch bg-[#FDB022] rounded-[10px]" />
  <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
    <div class="size- inline-flex justify-center items-start gap-2">
      <div data-svg-wrapper class="size-5 relative">
        <img :src="notificationState.icon" :alt="notificationState.text" class="min-h-5 min-w-5"/>
      </div>
      <div :class="notificationState.textColor" class="justify-start text-sm font-semibold leading-5 pr-4">{{ notificationState.text }}</div>
    </div>
    <div class="self-stretch h-20 inline-flex justify-start items-center gap-1.5">
      <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
        <div class="size- flex flex-col justify-center items-center">
          <div class="justify-center text-gray-900 text-xs font-semibold  leading-4">APRIL</div>
          <div class="size-5 justify-center text-gray-900 text-lg font-semibold  leading-7">25</div>
        </div>
      </div>
      <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
        <div class="self-stretch inline-flex justify-start items-center gap-1">
          <div class="flex-1 flex justify-start items-center gap-1">
            <div data-svg-wrapper class="size-3.5 relative">
              <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
              <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
            </div>
            <img :src="GreenCheckIcon" alt="Green Check Icon" class="h-4 w-4"/>
            <div class="flex items-center justify-center h-3.5 w-3.5 rounded-full bg-[#FF4405]">
                <img :src="CloseWhiteIcon" alt="Close White Icon" class="h-2 w-2"/>
            </div>
          </div>
        </div>
        <div class="self-stretch inline-flex justify-end items-end gap-1.5">
          <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2">
            <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
          </div>
        </div>
        <div class="flex flex-1 justify-between items-center self-stretch">
            <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
              <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
              <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
            </div>

            <!-- Details link -->
            <a href="#" class="flex items-center gap-1">
                <span class="text-sm font-medium text-[#B54708]">Details</span>
                <img :src="ArrowUpRightIcon" alt="Arrow Up Right Icon" />
            </a>
        </div>
      </div>
    </div>
    <!-- Review adjustment  -->
    <div class="self-stretch flex flex-col justify-center items-start gap-2">
      <div class="self-stretch h-9 px-2 py-1 bg-[#F06] rounded-[0.25rem] inline-flex justify-center items-center gap-1 cursor-pointer">
        <div data-svg-wrapper class="size-5 relative">
          <img :src="FileBlackIcon" alt="File Icon" class="h-5 w-5 invert"/>
          <div class="absolute top-[-2px] right-[0px]">
          </div>
        </div>
        <div class="justify-start text-white text-base font-medium  leading-6">REVIEW ADJUSTMENT</div>
      </div>
    </div>
  </div>
</div>


<!-- Event starts in 5 min -->
  <div class="relative w-full sm:w-[368px] self-stretch min-h-20 p-3 bg-[#5FE9D0]/5 sm:rounded-[10px] blink-border-effect-pink inline-flex justify-end items-start gap-1.5">
    <div class="absolute top-2 right-2 sm:top-[-8px] sm:right-[-8px] flex items-center justify-center w-6 h-6 rounded-full sm:bg-[#EAECF0] sm:shadow-[0_0_4px_0_rgba(0,0,0,0.25)] cursor-pointer">
        <img :src="XCloseIcon" alt="Close Icon" class="h-4 w-4 invert"/>
    </div>
  <div class="w-1 self-stretch bg-[#FDB022] rounded-[10px]" />
  <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
    <div class="size- inline-flex justify-center items-start gap-2">
      <div data-svg-wrapper class="size-5 relative">
        <img :src="AlarmGreenIcon" :alt="notificationState.text" class="min-h-5 min-w-5"/>
      </div>
      <div class="justify-start text-sm text-[#107569] font-semibold leading-5">Event starts in 5 min:</div>
    </div>
    <div class="self-stretch inline-flex justify-start items-center gap-1.5">
      <div data-property-1="DATE" class="w-14 self-stretch min-h-12 py-2 inline-flex flex-col justify-start items-center gap-2">
        <div class="size- flex flex-col justify-start items-center flex-1">
           <div class="justify-center text-slate-700 text-xs font-semibold  leading-4">2:15pm - 9:30pm</div>
        </div>
      </div>
      <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
        <div class="self-stretch inline-flex justify-between items-center gap-1">
            <div class="flex-1 flex justify-start items-center gap-1">
            <div data-svg-wrapper class="size-3.5 relative">
              <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.88849 5.16446C5.29449 6.01007 5.84795 6.80261 6.54887 7.50353C7.24979 8.20445 8.04234 8.75791 8.88795 9.16391C8.96068 9.19883 8.99705 9.21629 9.04307 9.22971C9.20661 9.27738 9.40743 9.24314 9.54593 9.14396C9.5849 9.11606 9.61824 9.08271 9.68493 9.01603C9.88886 8.8121 9.99083 8.71013 10.0934 8.64346C10.4801 8.39205 10.9786 8.39205 11.3652 8.64346C11.4678 8.71013 11.5698 8.8121 11.7737 9.01603L11.8874 9.12971C12.1974 9.43971 12.3524 9.59472 12.4366 9.76119C12.604 10.0923 12.604 10.4833 12.4366 10.8143C12.3524 10.9808 12.1974 11.1358 11.8874 11.4458L11.7954 11.5378C11.4865 11.8467 11.332 12.0012 11.122 12.1192C10.8889 12.2501 10.527 12.3442 10.2597 12.3434C10.0188 12.3427 9.85416 12.296 9.5249 12.2025C7.75542 11.7003 6.08571 10.7527 4.69272 9.35968C3.29973 7.9667 2.35212 6.29699 1.84989 4.5275C1.75643 4.19824 1.70971 4.03361 1.70899 3.79273C1.70819 3.52543 1.80232 3.16348 1.93323 2.93043C2.05121 2.72041 2.20568 2.56594 2.51463 2.25699L2.60659 2.16504C2.91659 1.85503 3.0716 1.70003 3.23807 1.61583C3.56915 1.44837 3.96014 1.44837 4.29121 1.61583C4.45768 1.70003 4.61269 1.85503 4.9227 2.16504L5.03637 2.27871C5.24031 2.48265 5.34228 2.58462 5.40894 2.68716C5.66036 3.07384 5.66036 3.57235 5.40894 3.95903C5.34228 4.06157 5.24031 4.16354 5.03637 4.36748C4.96969 4.43416 4.93635 4.4675 4.90844 4.50647C4.80927 4.64497 4.77502 4.84579 4.8227 5.00933C4.83611 5.05535 4.85357 5.09172 4.88849 5.16446Z" stroke="#0E9384" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div data-emphasized="true" data-icon="false" data-size="caption" class="size- flex justify-start items-center gap-2">
              <div class="justify-start text-[#0E9384] text-sm font-semibold  leading-5">Maid cafe simulator</div>
            </div>
            <div data-svg-wrapper data-property-1="pending" data-size="Default" class="size-4 relative">
              <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_3292_19308)">
              <path d="M6.06004 5.99967C6.21678 5.55412 6.52614 5.17841 6.93334 4.9391C7.34055 4.69978 7.8193 4.6123 8.28482 4.69215C8.75035 4.772 9.17258 5.01402 9.47676 5.37536C9.78093 5.7367 9.94741 6.19402 9.94671 6.66634C9.94671 7.99967 7.94671 8.66634 7.94671 8.66634M8.00004 11.333H8.00671M14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967Z" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
              <clipPath id="clip0_3292_19308">
              <rect width="16" height="16" fill="white"/>
              </clipPath>
              </defs>
              </svg>
            </div>
          </div>
        <div class="flex items-center gap-1">
            <IndicatorDot size="7" color="#FF4405" />
            <span class="text-sm font-medium  leading-5 text-[#FF4405]">in 5 min</span>
        </div>
        </div>
        <div class="flex flex-1 gap-2 self-stretch flex-col justify-between items-center">
            <div class="flex flex-1 justify-between items-center self-stretch">
                <div data-property-1="single user" class="size- inline-flex justify-start items-center gap-1">
                  <img class="size-5 rounded-full object-cover" src="https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" alt="Ellipse 284" />
                  <div class="justify-center text-gray-900 text-xs font-normal  leading-4">The grape gatsby</div>
                </div>

            </div>
                <!-- Join call button -->
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <div class="blink-border-effect-green self-stretch h-9 px-2 py-1 bg-[#07F468] rounded-[0.25rem] inline-flex justify-center items-center gap-1 cursor-pointer">
                <div data-svg-wrapper class="size-5 relative">
                <img :src="IncomingCallIcon" alt="Incoming Call Icon" class="h-5 w-5 invert"/>
                <div class="absolute top-[-2px] right-[0px]">
                </div>
                </div>
                <div class="justify-start text-base font-medium  leading-6">JOIN CALL</div>
            </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script setup>
import { computed } from "vue";

import CalendarPinkIcon from "@/assets/images/icons/calendar-icon-pink.svg";
import CalendarGreenCheckIcon from "@/assets/images/icons/calendar-check-green.svg";
import CalendarCrossIcon from "@/assets/images/icons/calendar-cross.svg";
import FilePinkIcon from "@/assets/images/icons/file-search-pink.svg";
import AlarmGreenIcon from "@/assets/images/icons/alarm-green.svg";
import FileBlackIcon from "@/assets/images/icons/file-search-02.svg";
import IndicatorDot from "@/components/icons/IndicatorDot.vue";
import XCloseIcon from "@/assets/images/icons/x-close-white.svg";
import ArrowUpRightIcon from "@/assets/images/icons/arrow-up-right-brown.svg";
import IncomingCallIcon from "@/assets/images/icons/phone-incoming-02.svg";
import WhiteArrowUpRightIcon from "@/assets/images/icons/arrow-up-right-white.svg";
import GreenCheckIcon from "@/assets/images/icons/green-check.svg";
import CloseWhiteIcon from "@/assets/images/icons/x-close-white.svg";

const props = defineProps({
  state: {
    type: String,
    default: "declined",
  },
});

const notificationStates = {
  accepted: {
    icon: CalendarGreenCheckIcon,
    text: "@grapegatsby has accepted your price adjustment:",
    textColor: "text-[#107569]",
  },
  declined: {
    icon: CalendarCrossIcon,
    text: "@grapegatsby has declined your price adjustment:",
    textColor: "text-[#FF4405]",
  },
  requestSent: {
    icon: CalendarPinkIcon,
    text: "Your price adjustment request has been sent:",
    textColor: "text-[#F06]",
  },
};

const notificationState = computed(() => {
  return notificationStates[props.state] || notificationStates.accepted;
});

</script>
<style scoped>
@keyframes blink-border-pink {
  0%, 100% {
    box-shadow: 0 0 12px 0 rgba(255, 0, 102, 0.25);
  }

  50% {
    box-shadow: 0 0 18px 0 rgba(255, 0, 102, 0.4);
  }
}

.blink-border-effect-pink {
  animation: blink-border-pink 1.5s ease-in-out infinite;
}
</style>
