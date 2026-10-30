export const RELATIONSHIPS = [
  "mother",
  "father",
  "grandmother",
  "grandfather",
  "guardian",
] as const;

export function relationshipLabel(value: string, t: (key: string) => string) {
  return (RELATIONSHIPS as readonly string[]).includes(value)
    ? t(`flows.relationships.${value}`)
    : value;
}
