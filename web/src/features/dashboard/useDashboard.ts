import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api';

/** [US-018] 홈 대시보드 요약. 로그인 필수(RequireAuth 게이트). */
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.getDashboard() });
}
