import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MediaAttachmentUpload {
    id: string;
    contentType: string;
    byteSize: bigint;
    isImage: boolean;
    filename: string;
    fileBytes: Uint8Array;
    programId: string;
}
export interface Orphanage {
    id: string;
    region: string;
    constraints: string;
    secondaryContact?: string;
    currentOccupancy: bigint;
    name: string;
    isActive: boolean;
    address: string;
    capacity: bigint;
    internalNotes: string;
    demographicNotes: string;
    primaryContact: string;
    priorityNeeds: string;
}
export interface ScheduleEvent {
    id: string;
    title: string;
    description: string;
    isArchived: boolean;
    endTimestamp: bigint;
    startTimestamp: bigint;
    programId: string;
    location?: string;
}
export interface TimelineEvent {
    id: bigint;
    timestamp: bigint;
    details?: string;
    actorPrincipal?: Principal;
    programId: string;
    relatedId?: string;
    eventType: string;
}
export interface KidProfile {
    id: string;
    age: bigint;
    programIds: Array<string>;
    isActive: boolean;
    caretakerId: Principal;
    lastName: string;
    firstName: string;
}
export interface DocumentationEntry {
    id: bigint;
    content: string;
    activityId: string;
    isArchived: boolean;
    isActive: boolean;
    author: string;
    timestamp: bigint;
    idText: string;
}
export interface Activity {
    id: string;
    status: string;
    title: string;
    owner: Principal;
    isArchived: boolean;
    programId: string;
    orphanageId?: string;
}
export interface Program {
    id: string;
    resources: string;
    name: string;
    description: string;
    isArchived: boolean;
    evaluationCriteria: string;
    regulations: string;
    schedule: string;
    budget: string;
    targetParticipants: string;
    objectives: string;
    sponsors: string;
}
export interface Person {
    id: bigint;
    contact: string;
    name: string;
    role: string;
    isArchived: boolean;
    isActive: boolean;
    idText: string;
}
export interface ProgramMediaAttachment {
    id: string;
    contentType: string;
    byteSize: bigint;
    isImage: boolean;
    isArchived: boolean;
    filename: string;
    programId: string;
    uploadedAt: bigint;
    uploadedBy: Principal;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignProgramToKid(kidId: string, programId: string): Promise<void>;
    clearKidContext(): Promise<void>;
    createActivity(activity: Activity): Promise<string>;
    createDocumentationEntry(entry: DocumentationEntry): Promise<bigint>;
    createKidProfile(firstName: string, lastName: string, age: bigint): Promise<string>;
    createOrphanage(orphanage: Orphanage): Promise<string>;
    createPerson(person: Person): Promise<bigint>;
    createProgram(program: Program): Promise<string>;
    createScheduleEvent(event: ScheduleEvent): Promise<string>;
    deleteActivity(id: string): Promise<void>;
    deleteDocumentationEntry(id: bigint): Promise<void>;
    deleteKidProfile(id: string): Promise<void>;
    deleteOrphanage(id: string): Promise<void>;
    deletePerson(id: bigint): Promise<void>;
    deleteProgram(id: string): Promise<void>;
    deleteProgramMediaAttachment(id: string): Promise<void>;
    deleteScheduleEvent(id: string): Promise<void>;
    getActiveKidContext(): Promise<KidProfile | null>;
    getActivity(id: string): Promise<Activity | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getKidProfile(id: string): Promise<KidProfile | null>;
    getOrphanage(id: string): Promise<Orphanage | null>;
    getProgram(id: string): Promise<Program | null>;
    getProgramTimeline(programId: string): Promise<Array<TimelineEvent>>;
    getUpcomingEventsInWindow(timeWindow: bigint | null): Promise<Array<ScheduleEvent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listActivities(): Promise<Array<Activity>>;
    listDocumentationEntries(): Promise<Array<DocumentationEntry>>;
    listMyKidProfiles(): Promise<Array<KidProfile>>;
    listOrphanages(): Promise<Array<Orphanage>>;
    listPeople(): Promise<Array<Person>>;
    listProgramMediaAttachments(programId: string): Promise<Array<ProgramMediaAttachment>>;
    listPrograms(): Promise<Array<Program>>;
    listScheduleEvents(programId: string): Promise<Array<ScheduleEvent>>;
    removeProgramFromKid(kidId: string, programId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selectKidContext(kidId: string): Promise<void>;
    updateActivity(id: string, activity: Activity): Promise<void>;
    updateDocumentationEntry(id: bigint, entry: DocumentationEntry): Promise<void>;
    updateOrphanage(id: string, orphanage: Orphanage): Promise<void>;
    updatePerson(id: bigint, person: Person): Promise<void>;
    updateProgram(id: string, program: Program): Promise<void>;
    updateScheduleEvent(id: string, event: ScheduleEvent): Promise<void>;
    uploadProgramMediaAttachment(upload: MediaAttachmentUpload): Promise<string>;
}
