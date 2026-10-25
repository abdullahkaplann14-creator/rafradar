import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import type { TransactionInput } from '../types';
import type { ToastKind } from '../components/Toast';

type Notify = (kind: ToastKind, message: string) => void;

export function useAccountingActions(notify: Notify) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['accounting'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const reportError = (error: unknown) => notify('error', errorMessage(error));

  const createTransaction = useMutation({
    mutationFn: (input: TransactionInput) => api.createTransaction(input),
    onError: reportError,
    onSettled: invalidate,
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      api.updateTransaction(id, input),
    onError: reportError,
    onSettled: invalidate,
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onError: reportError,
    onSettled: invalidate,
  });

  return { createTransaction, updateTransaction, deleteTransaction };
}

export type AccountingActions = ReturnType<typeof useAccountingActions>;
