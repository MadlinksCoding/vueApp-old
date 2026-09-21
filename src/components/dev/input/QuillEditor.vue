<template>
    <div
        class="tier-description-quill-container flex flex-col px-3.5 py-2.5 border-b border-[#D0D5DD] rounded-t-sm shadow-sm bg-white/30 w-full max-w-full overflow-hidden dark:bg-[#181a1b4d] dark:border-[#3b4043]">
        <div ref="quillEditor" class="max-w-full overflow-hidden"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import EditorIconB from '@/assets/images/icons/editor-icon-b.svg';
import EditorIconI from '@/assets/images/icons/editor-icon-i.svg';
import EditorIconCopy from '@/assets/images/icons/editor-icon-copy.svg';
import EditorIconDots from '@/assets/images/icons/editor-icon-dots.svg';
import EditorIconNum from '@/assets/images/icons/editor-icon-num.svg';

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Description...'
    }
});

const emit = defineEmits(['update:modelValue']);

const quillEditor = ref(null);
let quillInstance = null;
let isUpdating = false;

onMounted(() => {
    // Quill Setup
    const icons = Quill.import('ui/icons');
    icons['bold'] = `<img src="${EditorIconB}" alt="bold" style="width:30px;">`;
    icons['italic'] = `<img src="${EditorIconI}" alt="italic" style="width:30px;">`;
    icons['link'] = `<img src="${EditorIconCopy}" alt="link" style="width:30px;">`;
    icons['list']['ordered'] = `<img src="${EditorIconNum}" alt="ol" style="width:30px;">`;
    icons['list']['bullet'] = `<img src="${EditorIconDots}" alt="ul" style="width:30px;">`;

    quillInstance = new Quill(quillEditor.value, {
        modules: {
            toolbar: [
                ['bold', 'italic', 'link', { 'list': 'ordered' }, { 'list': 'bullet' }]
            ]
        },
        placeholder: props.placeholder,
        theme: 'snow'
    });

    // Load Content from State
    if (props.modelValue) {
    quillInstance.clipboard.dangerouslyPasteHTML(props.modelValue);
}

    // Update Parent State on Change
    quillInstance.on('text-change', () => {
        isUpdating = true;
        emit('update:modelValue', quillInstance.root.innerHTML);
        setTimeout(() => { isUpdating = false; }, 0);
    });

    // Styling Fixes
    const container = quillEditor.value.closest('.tier-description-quill-container');
    const toolbar = container.querySelector('.ql-toolbar.ql-snow');
    if (toolbar) {
        toolbar.style.border = 'none';
        toolbar.classList.add('!border-0', 'dark:!border-[#3b4043]', '!px-0', '!pt-0', '!pb-2');
        toolbar.querySelectorAll('button').forEach(b => {
            b.classList.add('!w-auto', '!min-w-[30px]', '!h-auto', '!p-1', 'rounded', 'hover:!bg-black/5', 'dark:hover:!bg-[#323232]', 'flex', 'items-center', 'justify-center');
        });
    }
    const editorContainer = container.querySelector('.ql-container.ql-snow');
    if (editorContainer) {
        editorContainer.style.border = 'none';
        editorContainer.classList.add('!border-0', '!font-sans', '!text-base');
    }
    const editor = container.querySelector('.ql-editor');
    if (editor) {
        editor.classList.add('!px-0', '!py-2', '!text-[#101828]', 'dark:!text-[#dbd8d3]', 'min-h-[80px]', '!break-all', '!whitespace-pre-wrap', '!max-w-full', '!overflow-x-hidden');
    }
});

watch(() => props.modelValue, (newValue) => {
    if (!quillInstance || isUpdating) return;

    const currentHtml = quillInstance.root.innerHTML;

    if (newValue !== currentHtml) {
        const selection = quillInstance.getSelection();

        quillInstance.setContents([]);
        quillInstance.clipboard.dangerouslyPasteHTML(newValue || '');

        if (selection) {
            quillInstance.setSelection(selection);
        }
    }
});
</script>
