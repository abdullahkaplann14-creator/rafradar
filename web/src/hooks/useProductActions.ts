import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import type { ItemInput, ItemStatus } from '../types';
import type { ToastKind } from '../components/Toast';

type Notify = (kind: ToastKind, message: string) => void;
const KEY = ['dashboard'] as const;

export function useProductActions(notify: Notify) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: KEY });
  };
  const reportError = (error: unknown) => notify('error', errorMessage(error));

  const createItem = useMutation({
    mutationFn: (input: ItemInput) => api.createItem(input),
    onError: reportError,
    onSettled: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ItemInput> }) =>
      api.updateItem(id, input),
    onError: reportError,
    onSettled: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.deleteItem(id),
    onError: reportError,
    onSettled: invalidate,
  });

  const resolveItem = useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: Exclude<ItemStatus, 'active'> }) =>
      api.resolveItem(id, outcome),
    onError: reportError,
    onSettled: invalidate,
  });

  const reopenItem = useMutation({
    mutationFn: (id: string) => api.reopenItem(id),
    onError: reportError,
    onSettled: invalidate,
  });

  const loadDemo = useMutation({
    mutationFn: () => api.loadDemo(),
    onError: reportError,
    onSettled: invalidate,
  });

  return {
    createItem,
    updateItem,
    deleteItem,
    resolveItem,
    reopenItem,
    loadDemo,
  };
}

export type ProductActions = ReturnType<typeof useProductActions>;
