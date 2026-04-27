import { useState } from 'react';
import api from '../api/client';

export function useExport() {
  const [loading, setLoading] = useState(false);

  const download = async ({ period = 'month', type = 'all' } = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/export', {
        params: { period, type },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${type}_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Ошибка экспорта');
    } finally {
      setLoading(false);
    }
  };

  return { download, loading };
}
