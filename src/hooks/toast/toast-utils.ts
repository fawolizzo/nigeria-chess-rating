import { actionTypes, ToasterToast, dispatch } from './toast-state';

// Counter to generate unique IDs
let count = 0;

// Generate unique ID for toast
export function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Toast function to create/update/dismiss toasts
export type Toast = {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => void;
};

// Create a toast
export function toast(props: Omit<ToasterToast, 'id'>): Toast {
  const id = generateId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Dismiss one or all toasts
export const dismissToast = (toastId?: string) => {
  dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
};
