import { request } from '@/api/interceptor';
import qs from 'query-string';
import { LoginLogPageRes, LoginLogPageParams } from '@/types/modules/log';

export default function getLoginLogPages(params: LoginLogPageParams) {
  return request.get<LoginLogPageRes>('/apis/logs/login/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}
