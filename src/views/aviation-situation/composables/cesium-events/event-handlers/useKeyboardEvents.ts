// src/views/aviation-situation/composables/event-handlers/useKeyboardEvents.ts
import { useMagicKeys } from '@vueuse/core'; // 确保引入 watch
import { onUnmounted,watch } from 'vue';

export const useKeyboardEvents = (
  onEscPress: () => void,
  onBackspacePress: () => void,
  // 可选：指定仅在特定操作类型下生效
  shouldListen: () => boolean = () => true
) => {
  const keys = useMagicKeys();

  // 获取具体的按键 Ref
  const escKey = keys['Escape']; // 推荐使用标准键名 'Escape'，'Esc' 可能因浏览器/库版本而异，VueUse 通常支持别名，但 'Escape' 最稳
  const backspaceKey = keys['Backspace'];

  // 定义停止监听的回调函数
  const stopEscWatch = watch(escKey, (isPressed) => {
    if (isPressed && shouldListen()) {
      // 防止长按重复触发（可选，取决于需求，通常 keydown 逻辑需要自己处理防抖或仅响应一次变化）
      // 如果希望像 keydown 一样连续触发，watch 可能不够，需用原生事件。
      // 但针对 "删除最后一个点" 或 "退出模式"，通常只需要响应一次按下动作。
      onEscPress();
    }
  });

  const stopBackspaceWatch = watch(backspaceKey, (isPressed) => {
    if (isPressed && shouldListen()) {
      onBackspacePress();
    }
  });

  // 解绑逻辑
  const unbindKeyboardEvents = () => {
    stopEscWatch();
    stopBackspaceWatch();
  };

  onUnmounted(() => {
    unbindKeyboardEvents();
  });

  return {
    keys,
    unbindKeyboardEvents
  };
};
