import { request } from '@/api/interceptor';
import { PlanPageParams, PlanPageRes, PlanParams } from '@/types/modules/plan';
import qs from 'query-string';

export default function getPlanPages(params: PlanPageParams) {
  return request.get<PlanPageRes>('/apis/plan/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}

export function addPlan(params: PlanParams) {
  return request.post<PlanParams>('/apis/plan', params);
}

export function editPlan(params: PlanParams) {
  return request.put<PlanParams>('/apis/plan', params);
}

export function deletePlan(planId: number) {
  return request.delete(`/apis/plan/${planId}`);
}
