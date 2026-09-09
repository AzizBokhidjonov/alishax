export {
  api,
  request,
  requestExport,
  requestResponse,
  fileNameFrom,
  saveBlob,
  openBlob,
  API_BASE_URL,
} from "./http";
export type { ExportResult, QueryParams } from "./http";
export { ApiError, isApiError, fieldErrors } from "./error";
export type { ErrorCode, KnownErrorCode } from "./error";

export { authApi } from "./endpoints/auth";
export { childrenApi } from "./endpoints/children";
export { guardiansApi } from "./endpoints/guardians";
export { groupsApi } from "./endpoints/groups";
export { attendanceApi } from "./endpoints/attendance";
export { pickupApi } from "./endpoints/pickup";
export {
  tariffsApi,
  discountsApi,
  periodsApi,
  billingApi,
  chargesApi,
  paymentsApi,
  debtsApi,
} from "./endpoints/finance";
export { announcementsApi, notificationsApi } from "./endpoints/comms";
export { landingApi, publicLandingApi, LANDING_TENANT_CODE } from "./endpoints/landing";
export { usersApi, rolesApi, permissionsApi, settingsApi, auditApi } from "./endpoints/admin";
export {
  expensesApi,
  filesApi,
  dashboardApi,
  reportsApi,
  importsApi,
  MAX_UPLOAD_MB,
  ALLOWED_MIME,
} from "./endpoints/misc";
export type { ReportPath, ExpenseListParams } from "./endpoints/misc";

export { toPage, LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from "./types/common";
export type * from "./types";
