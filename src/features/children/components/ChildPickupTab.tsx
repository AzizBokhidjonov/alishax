import { PickupPersonsPanel } from "@/features/pickup/components/PickupPersonsPanel";

/** Bola profilidagi «Olib ketish» bo'limi — umumiy panel qayta ishlatiladi. */
export function ChildPickupTab({ childId, canManage }: { childId: string; canManage: boolean }) {
  return <PickupPersonsPanel childId={childId} canManage={canManage} />;
}
