import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import type {
  AssignChildDto,
  Child,
  CreateGroupDto,
  Group,
  GroupHistoryEntry,
  Id,
  ListParams,
  Paginated,
  SetStaffDto,
  TransferChildDto,
  UpdateGroupDto,
} from "../types";

export interface GroupListParams extends ListParams {
  branchId?: string;
  status?: string;
}

export const groupsApi = {
  async list(params: GroupListParams = {}): Promise<Paginated<Group>> {
    const response = await api.get<Paginated<Group> | Group[]>("/groups", params as QueryParams);
    return toPage(response);
  },

  get: (id: Id) => api.get<Group>(`/groups/${id}`),
  create: (dto: CreateGroupDto) => api.post<Group>("/groups", dto),
  update: (id: Id, dto: UpdateGroupDto) => api.patch<Group>(`/groups/${id}`, dto),

  children: (id: Id) => api.get<Child[]>(`/groups/${id}/children`),
  /** `force` — sig'im to'lganda Director+ uchun majburiy biriktirish. */
  assignChild: (id: Id, dto: AssignChildDto, force = false) =>
    api.post<void>(`/groups/${id}/children`, dto, force ? { query: { force: true } } : undefined),
  transfer: (id: Id, dto: TransferChildDto, force = false) =>
    api.post<void>(`/groups/${id}/transfer`, dto, force ? { query: { force: true } } : undefined),

  staff: (id: Id) => api.get<SetStaffDto & { mainTeacherName?: string }>(`/groups/${id}/staff`),
  setStaff: (id: Id, dto: SetStaffDto) => api.put<void>(`/groups/${id}/staff`, dto),
  history: (id: Id) => api.get<GroupHistoryEntry[]>(`/groups/${id}/history`),
};
