import { useAppStore } from '@/store';

export default function useGlobalLoading() {
  const appStore = useAppStore();

  const showLoading = () => {
    appStore.showLoading();
  };

  const hideLoading = () => {
    appStore.hideLoading();
  };

  const setLoading = (loading: boolean) => {
    appStore.setLoading(loading);
  };

  return {
    showLoading,
    hideLoading,
    setLoading,
  };
}
