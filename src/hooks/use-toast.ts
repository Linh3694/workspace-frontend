import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "loading";
}

export function useToast() {
  const toast = (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      sonnerToast(options);
      return;
    }
    
    const { title, description, variant = "default" } = options;
    const message = title ? (description ? `${title}: ${description}` : title) : description || '';
    
    switch (variant) {
      case "destructive":
        sonnerToast.error(message);
        break;
      case "success":
        sonnerToast.success(message);
        break;
      case "loading":
        sonnerToast.loading(message);
        break;
      default:
        sonnerToast(message);
        break;
    }
  };

  return {
    toast,
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast.info,
    warning: sonnerToast.warning,
    dismiss: sonnerToast.dismiss,
  }
}

// Export a standalone toast function that matches the expected API
export const toast = (options: ToastOptions | string) => {
  if (typeof options === 'string') {
    sonnerToast(options);
    return;
  }
  
  const { title, description, variant = "default" } = options;
  const message = title ? (description ? `${title}: ${description}` : title) : description || '';
  
  switch (variant) {
    case "destructive":
      sonnerToast.error(message);
      break;
    case "success":
      sonnerToast.success(message);
      break;
    case "loading":
      sonnerToast.loading(message);
      break;
    default:
      sonnerToast(message);
      break;
  }
} 