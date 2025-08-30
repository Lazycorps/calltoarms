import { defineStore } from "pinia";
import { ref } from "vue";

export interface SnackbarConfig {
  message: string;
  color?: "success" | "error" | "warning" | "info";
  timeout?: number;
  action?: {
    text: string;
    handler: () => void;
  };
}

export const useSnackbarStore = defineStore("snackbar", () => {
  // État
  const show = ref(false);
  const message = ref("");
  const color = ref<"success" | "error" | "warning" | "info">("success");
  const timeout = ref(4000);
  const action = ref<SnackbarConfig["action"] | null>(null);

  // Actions
  function showSnackbar(config: SnackbarConfig) {
    message.value = config.message;
    color.value = config.color || "success";
    timeout.value = config.timeout || 4000;
    action.value = config.action || null;
    show.value = true;
  }

  function showSuccess(message: string, timeout?: number) {
    showSnackbar({
      message,
      color: "success",
      timeout,
    });
  }

  function showError(message: string, timeout?: number) {
    showSnackbar({
      message,
      color: "error",
      timeout,
    });
  }

  function showWarning(message: string, timeout?: number) {
    showSnackbar({
      message,
      color: "warning",
      timeout,
    });
  }

  function showInfo(message: string, timeout?: number) {
    showSnackbar({
      message,
      color: "info",
      timeout,
    });
  }

  function hide() {
    show.value = false;
    // Réinitialiser l'action après un délai pour éviter les bugs de fermeture
    setTimeout(() => {
      action.value = null;
    }, 300);
  }

  function executeAction() {
    if (action.value?.handler) {
      action.value.handler();
      hide();
    }
  }

  return {
    // État
    show,
    message,
    color,
    timeout,
    action,

    // Actions
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hide,
    executeAction,
  };
});