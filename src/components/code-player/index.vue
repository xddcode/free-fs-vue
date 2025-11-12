<script lang="ts" setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import * as monaco from 'monaco-editor';
  import { useAppStore } from '@/store';

  const appStore = useAppStore();

  interface Props {
    url: string; // 文件 URL
    language?: string; // 文件语言 (如 'javascript', 'css')
  }
  const props = defineProps<Props>();
  const editorContainer = ref<HTMLElement | null>(null);
  let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;

  /**
   * 映射文件后缀到 Monaco 语言 ID
   */
  const mapLanguage = (ext: string | undefined): string => {
    if (!ext) return 'plaintext';
    switch (ext) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'less':
        return 'less';
      case 'html':
        return 'html';
      case 'xml':
        return 'xml';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
        return 'cpp';
      case 'go':
        return 'go';
      case 'sh':
        return 'shell';
      case 'vue':
        return 'html';
      // 默认返回纯文本
      default:
        return 'plaintext';
    }
  };

  /**
   * 加载文件内容
   */
  const fetchAndSetContent = async (url: string) => {
    if (!url || !editorInstance) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const text = await response.text();
      editorInstance.setValue(text);
    } catch (error) {
      console.error('Error fetching file content:', error);
      editorInstance.setValue(`// 加载文件失败: ${url}\n// ${error}`);
    }
  };

  /**
   * 更新编辑器语言
   */
  const updateLanguage = (lang: string | undefined) => {
    if (!editorInstance) return;
    const model = editorInstance.getModel();
    if (model) {
      const languageId = mapLanguage(lang);
      monaco.editor.setModelLanguage(model, languageId);
    }
  };

  // 4. 在组件挂载时初始化编辑器
  onMounted(() => {
    if (editorContainer.value) {
      editorInstance = monaco.editor.create(editorContainer.value, {
        value: '// 正在加载内容...',
        language: mapLanguage(props.language),
        theme: appStore.theme === 'dark' ? 'vs-dark' : 'vs-light', // 主题 ('vs-dark' 或 'vs-light')
        readOnly: true, // 预览模式设为只读
        automaticLayout: true, // 自动布局, 适应容器大小
        minimap: {
          enabled: true, // 是否显示小地图
        },
      });

      // 初始化时加载内容
      fetchAndSetContent(props.url);
    }
  });

  onUnmounted(() => {
    if (editorInstance) {
      editorInstance.dispose();
      editorInstance = null;
    }
  });

  watch(
    () => props.url,
    (newUrl) => {
      fetchAndSetContent(newUrl);
    }
  );

  watch(
    () => props.language,
    (newLang) => {
      updateLanguage(newLang);
    }
  );
</script>

<template>
  <div ref="editorContainer" class="code-editor-container"></div>
</template>

<style scoped lang="less">
  .code-editor-container {
    width: 100%;
    height: 100%;
  }
</style>
