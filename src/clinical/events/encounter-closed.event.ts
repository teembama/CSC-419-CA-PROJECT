
export class EncounterClosedEvent {
  constructor(
    public readonly encounterId: string,
    public readonly patientId: string,
    public readonly clinicianId: string,
    public readonly chartId: string,
    public readonly closedAt: Date,
  ) {}
}