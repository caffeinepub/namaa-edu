import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Blob "mo:core/Blob";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";


import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

// Major pain point: Large File Handling (chunks and single upload), replacements

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ------------------------------------------------
  // Data Models and Core Types (with TimelineEvent)
  // ------------------------------------------------
  type Orphanage = {
    id : Text;
    name : Text;
    address : Text;
    region : Text;
    primaryContact : Text;
    secondaryContact : ?Text;
    capacity : Nat;
    currentOccupancy : Nat;
    demographicNotes : Text;
    constraints : Text;
    priorityNeeds : Text;
    internalNotes : Text;
    isActive : Bool;
  };

  type UserProfile = {
    name : Text;
    role : Text;
  };

  type Activity = {
    id : Text;
    owner : Principal;
    title : Text;
    status : Text;
    programId : Text;
    orphanageId : ?Text;
    isArchived : Bool;
  };

  type Program = {
    id : Text;
    name : Text;
    description : Text;
    objectives : Text;
    targetParticipants : Text;
    schedule : Text;
    resources : Text;
    evaluationCriteria : Text;
    budget : Text;
    sponsors : Text;
    regulations : Text;
    isArchived : Bool;
  };

  type Person = {
    id : Nat;
    idText : Text;
    name : Text;
    contact : Text;
    role : Text;
    isActive : Bool;
    isArchived : Bool;
  };

  type DocumentationEntry = {
    id : Nat;
    idText : Text;
    activityId : Text;
    content : Text;
    author : Text;
    timestamp : Nat;
    isActive : Bool;
    isArchived : Bool;
  };

  type MediaAttachment = {
    id : Text;
    filename : Text;
    contentType : Text;
    byteSize : Nat;
    uploadedAt : Nat;
    uploadedBy : Principal;
    isArchived : Bool;
    isImage : Bool;
  };

  type ActivityAttachment = {
    metadata : MediaAttachment;
    activityId : Text;
    programId : Text;
  };

  type DocumentationAttachment = {
    metadata : MediaAttachment;
    documentationId : Nat;
    programId : Text;
  };

  type StorageMediaAttachment = {
    attachmentMetadata : MediaAttachment;
    fileBytes : ?Blob;
  };

  type MediaAttachmentUpload = {
    id : Text;
    filename : Text;
    contentType : Text;
    byteSize : Nat;
    fileBytes : ?Blob;
    isImage : Bool;
  };

  type PartialChunkedUpload = {
    id : Text;
    filename : Text;
    contentType : Text;
    byteSize : Nat;
    isImage : Bool;
    currentSize : Nat;
    chunks : ?Blob;
    startTime : Nat;
  };

  type StoredActivityAttachment = {
    storageMeta : StorageMediaAttachment;
    activityId : Text;
    programId : Text;
  };

  type StoredDocumentationAttachment = {
    storageMeta : StorageMediaAttachment;
    documentationId : Nat;
    programId : Text;
  };

  type ScheduleEvent = {
    id : Text;
    programId : Text;
    title : Text;
    description : Text;
    startTimestamp : Nat;
    endTimestamp : Nat;
    location : ?Text;
    isArchived : Bool;
  };

  type KidProfile = {
    id : Text;
    caretakerId : Principal;
    firstName : Text;
    lastName : Text;
    age : Nat;
    programIds : [Text];
    isActive : Bool;
  };

  // Program Timeline & Upcoming Events
  type TimelineEvent = {
    id : Nat;
    programId : Text;
    eventType : Text;
    relatedId : ?Text;
    timestamp : Nat;
    details : ?Text;
    actorPrincipal : ?Principal;
  };

  // Persistent Storage Structures + Timeline Events
  let orphanages = Map.empty<Text, Orphanage>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let programs = Map.empty<Text, Program>();
  let activities = Map.empty<Text, Activity>();
  let people = Map.empty<Nat, Person>();
  let documentationEntries = Map.empty<Nat, DocumentationEntry>();
  let programMediaAttachments = Map.empty<Text, MediaAttachment>();
  let archivedMediaAttachments = Map.empty<Text, StorageMediaAttachment>();
  let activityAttachments = Map.empty<Text, StoredActivityAttachment>();
  let documentationAttachments = Map.empty<Text, StoredDocumentationAttachment>();
  let scheduleEvents = Map.empty<Text, ScheduleEvent>();
  let kidProfiles = Map.empty<Text, KidProfile>();
  let kidProfilesByCaretaker = Map.empty<Principal, [Text]>();
  let timelineEvents = Map.empty<Text, [TimelineEvent]>();
  let partialChunkedUploads = Map.empty<Text, PartialChunkedUpload>();

  // Active kid context per caller (session state)
  let activeKidContext = Map.empty<Principal, Text>();

  // ------------------------------------------------
  // ID Counters for Incrementing Unique IDs
  // ------------------------------------------------
  var peopleIdCounter = 1;
  var documentationEntryCounter = 1;
  var timelineEventCounter = 0;

  // ------------------------------------------------
  // Helper Functions for Kid Context Authorization
  // ------------------------------------------------
  func isKidContext(caller : Principal) : Bool {
    switch (activeKidContext.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func getActiveKidProfile(caller : Principal) : ?KidProfile {
    switch (activeKidContext.get(caller)) {
      case (null) { null };
      case (?kidId) { kidProfiles.get(kidId) };
    };
  };

  func verifyKidOwnership(caller : Principal, kidId : Text) : Bool {
    switch (kidProfiles.get(kidId)) {
      case (null) { false };
      case (?kid) { kid.caretakerId == caller };
    };
  };

  func kidHasAccessToProgram(kidProfile : KidProfile, programId : Text) : Bool {
    switch (kidProfile.programIds.find(func(id : Text) : Bool { id == programId })) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func blockIfKidContext(caller : Principal) {
    if (isKidContext(caller)) {
      Runtime.trap("Unauthorized: Internal operations not allowed in kid context");
    };
  };

  // ------------------------------------------------
  // User Profile Management
  // ------------------------------------------------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    blockIfKidContext(caller);
    userProfiles.add(caller, profile);
  };

  // ------------------------------------------------
  // Kid Context Management
  // ------------------------------------------------
  public shared ({ caller }) func createKidProfile(firstName : Text, lastName : Text, age : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create kid profiles");
    };
    blockIfKidContext(caller);

    let kidId = caller.toText() # "-kid-" # firstName # "-" # lastName # "-" # age.toText() # "-" # peopleIdCounter.toText();
    peopleIdCounter += 1;

    let newKidProfile : KidProfile = {
      id = kidId;
      caretakerId = caller;
      firstName;
      lastName;
      age;
      programIds = [];
      isActive = true;
    };

    kidProfiles.add(kidId, newKidProfile);

    let existingKids = switch (kidProfilesByCaretaker.get(caller)) {
      case (null) { [] };
      case (?kids) { kids };
    };
    let updatedKids = existingKids.concat([kidId]);
    kidProfilesByCaretaker.add(caller, updatedKids);

    kidId;
  };

  public query ({ caller }) func listMyKidProfiles() : async [KidProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list kid profiles");
    };

    switch (kidProfilesByCaretaker.get(caller)) {
      case (null) { [] };
      case (?kidIds) {
        kidIds.values().map(
          func(id : Text) : ?KidProfile {
            kidProfiles.get(id);
          }
        ).filter(
          func(profile : ?KidProfile) : Bool {
            switch (profile) {
              case (null) { false };
              case (?_) { true };
            };
          }
        ).map(
          func(existing : ?KidProfile) : KidProfile {
            switch (existing) {
              case (?p) { p };
              case (null) { Runtime.trap("Should never happen") };
            };
          }
        ).toArray();
      };
    };
  };

  public query ({ caller }) func getKidProfile(id : Text) : async ?KidProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view kid profiles");
    };

    switch (kidProfiles.get(id)) {
      case (null) { null };
      case (?kid) {
        if (kid.caretakerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own kid profiles");
        };
        ?kid;
      };
    };
  };

  public shared ({ caller }) func selectKidContext(kidId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can select kid context");
    };

    if (not verifyKidOwnership(caller, kidId)) {
      Runtime.trap("Unauthorized: Can only select your own kid profiles");
    };

    activeKidContext.add(caller, kidId);
  };

  public shared ({ caller }) func clearKidContext() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can clear kid context");
    };
    activeKidContext.remove(caller);
  };

  public query ({ caller }) func getActiveKidContext() : async ?KidProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view kid context");
    };
    getActiveKidProfile(caller);
  };

  public shared ({ caller }) func deleteKidProfile(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete kid profiles");
    };
    blockIfKidContext(caller);

    if (not verifyKidOwnership(caller, id)) {
      Runtime.trap("Unauthorized: Can only delete your own kid profiles");
    };

    kidProfiles.remove(id);

    switch (kidProfilesByCaretaker.get(caller)) {
      case (null) {};
      case (?kids) {
        let updatedKids = kids.filter(func(kidId : Text) : Bool { kidId != id });
        kidProfilesByCaretaker.add(caller, updatedKids);
      };
    };

    switch (activeKidContext.get(caller)) {
      case (?activeId) {
        if (activeId == id) {
          activeKidContext.remove(caller);
        };
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func assignProgramToKid(kidId : Text, programId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can assign programs");
    };
    blockIfKidContext(caller);

    if (not verifyKidOwnership(caller, kidId)) {
      Runtime.trap("Unauthorized: Can only assign programs to your own kid profiles");
    };

    switch (kidProfiles.get(kidId)) {
      case (null) { Runtime.trap("Kid profile not found") };
      case (?kidProfile) {
        switch (programs.get(programId)) {
          case (null) { Runtime.trap("Program not found") };
          case (?_) {
            switch (kidProfile.programIds.find<Text>(func(id : Text) : Bool { id == programId })) {
              case (?_) { Runtime.trap("Program already assigned") };
              case (null) {
                let updatedPrograms = kidProfile.programIds.concat([programId]);
                let updatedKidProfile = {
                  kidProfile with programIds = updatedPrograms
                };
                kidProfiles.add(kidId, updatedKidProfile);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeProgramFromKid(kidId : Text, programId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove programs");
    };
    blockIfKidContext(caller);

    if (not verifyKidOwnership(caller, kidId)) {
      Runtime.trap("Unauthorized: Can only modify your own kid profiles");
    };

    switch (kidProfiles.get(kidId)) {
      case (null) { Runtime.trap("Kid profile not found") };
      case (?kidProfile) {
        let updatedPrograms = kidProfile.programIds.filter(func(id : Text) : Bool { id != programId });
        let updatedKidProfile = {
          kidProfile with programIds = updatedPrograms
        };
        kidProfiles.add(kidId, updatedKidProfile);
      };
    };
  };

  // ------------------------------------------------
  // Program Management (with kid context restrictions)
  // ------------------------------------------------
  public query ({ caller }) func listPrograms() : async [Program] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list programs");
    };

    switch (getActiveKidProfile(caller)) {
      case (?kidProfile) {
        kidProfile.programIds.values().map(
          func(programId : Text) : ?Program {
            programs.get(programId);
          }
        ).filter(
          func(program : ?Program) : Bool {
            switch (program) {
              case (null) { false };
              case (?_) { true };
            };
          }
        ).map(
          func(existing : ?Program) : Program {
            switch (existing) {
              case (?p) { p };
              case (null) { Runtime.trap("Should never happen") };
            };
          }
        ).toArray();
      };
      case (null) {
        programs.entries().map<(Text, Program), Program>(
            func((_, program) : (Text, Program)) : Program { program }
          ).toArray();
      };
    };
  };

  public query ({ caller }) func getProgram(id : Text) : async ?Program {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view programs");
    };

    switch (programs.get(id)) {
      case (null) { null };
      case (?program) {
        switch (getActiveKidProfile(caller)) {
          case (?kidProfile) {
            if (not kidHasAccessToProgram(kidProfile, id)) {
              Runtime.trap("Unauthorized: Kid does not have access to this program");
            };
            ?program;
          };
          case (null) { ?program };
        };
      };
    };
  };

  public shared ({ caller }) func createProgram(program : Program) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create programs");
    };
    blockIfKidContext(caller);

    programs.add(program.id, program);
    recordTimelineEvent(program.id, "ProgramCreated", null, "Program created", caller);
    program.id;
  };

  public shared ({ caller }) func updateProgram(id : Text, program : Program) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update programs");
    };
    blockIfKidContext(caller);

    switch (programs.get(id)) {
      case (null) { Runtime.trap("Program not found") };
      case (?_) {
        programs.add(id, program);
        recordTimelineEvent(id, "ProgramUpdated", null, "Program updated", caller);
      };
    };
  };

  public shared ({ caller }) func deleteProgram(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete programs");
    };
    blockIfKidContext(caller);

    programs.remove(id);
    recordTimelineEvent(id, "ProgramDeleted", null, "Program deleted", caller);
  };

  // ------------------------------------------------
  // Program Media Attachments (with kid context)
  // ------------------------------------------------
  public query ({ caller }) func listProgramMediaAttachments(programId : Text) : async [MediaAttachment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list program media attachments");
    };

    switch (getActiveKidProfile(caller)) {
      case (?kidProfile) {
        if (not kidHasAccessToProgram(kidProfile, programId)) {
          Runtime.trap("Unauthorized: Kid does not have access to this program");
        };
      };
      case (null) {};
    };

    programMediaAttachments.entries().filter(
        func((_, attachment) : (Text, MediaAttachment)) : Bool {
          not attachment.isArchived
        }
      ).map<(Text, MediaAttachment), MediaAttachment>(
          func((_, attachment) : (Text, MediaAttachment)) : MediaAttachment { attachment }
        ).toArray();
  };

  // Upload+Persist File (Media Attachment)
  public shared ({ caller }) func uploadProgramMediaAttachment(upload : MediaAttachmentUpload) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload attachments");
    };
    blockIfKidContext(caller);

    let attachment : MediaAttachment = {
      id = upload.id;
      filename = upload.filename;
      contentType = upload.contentType;
      byteSize = upload.byteSize;
      uploadedAt = Int.abs(Time.now() / 1_000_000_000);
      uploadedBy = caller;
      isArchived = false;
      isImage = upload.isImage;
    };

    let archivedAttachment : StorageMediaAttachment = {
      attachmentMetadata = attachment;
      fileBytes = upload.fileBytes;
    };

    programMediaAttachments.add(upload.id, attachment);
    archivedMediaAttachments.add(upload.id, archivedAttachment);
    upload.id;
  };

  // Get File for Attachment (including kid context)
  public query ({ caller }) func getProgramMediaAttachmentFile(attachmentId : Text) : async ?Blob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access attachment files");
    };

    switch (programMediaAttachments.get(attachmentId)) {
      case (null) { null };
      case (?_) {
        switch (archivedMediaAttachments.get(attachmentId)) {
          case (null) { null };
          case (?archived) { archived.fileBytes };
        };
      };
    };
  };

  // Soft-Archive Attachment
  public shared ({ caller }) func deleteProgramMediaAttachment(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete attachments");
    };
    blockIfKidContext(caller);

    switch (programMediaAttachments.get(id)) {
      case (null) { Runtime.trap("Attachment not found") };
      case (?attachment) {
        let archivedAttachment = {
          attachment with isArchived = true
        };
        programMediaAttachments.add(id, archivedAttachment);
      };
    };
  };

  // Admin GC (Remove Real "Deleted" Attachments)
  public shared ({ caller }) func adminGarbageCollectAttachments(_ : ()) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin-only function");
    };

    let deletedAttachmentIds = programMediaAttachments.entries().filter(
        func((_, attachment) : (Text, MediaAttachment)) : Bool {
          attachment.isArchived;
        }
      ).map(
          func((id, _) : (Text, MediaAttachment)) : Text { id }
        ).toArray();

    for (id in deletedAttachmentIds.values()) {
      archivedMediaAttachments.remove(id);
      programMediaAttachments.remove(id);
    };
  };

  // ------------------------------------------------
  // New Activity Attachments (backend storage)
  // ------------------------------------------------
  public shared ({ caller }) func uploadActivityAttachment(activityId : Text, upload : MediaAttachmentUpload) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload attachments for activities");
    };
    blockIfKidContext(caller);

    switch (activities.get(activityId)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?activity) {
        let attachment : MediaAttachment = {
          id = upload.id;
          filename = upload.filename;
          contentType = upload.contentType;
          byteSize = upload.byteSize;
          uploadedAt = Int.abs(Time.now() / 1_000_000_000);
          uploadedBy = caller;
          isArchived = false;
          isImage = upload.isImage;
        };

        let storageMeta : StorageMediaAttachment = {
          attachmentMetadata = attachment;
          fileBytes = upload.fileBytes;
        };

        let storedAttachment : StoredActivityAttachment = {
          storageMeta;
          activityId;
          programId = activity.programId;
        };

        activityAttachments.add(upload.id, storedAttachment);

        recordTimelineEvent(activity.programId, "ActivityAttachmentUploaded", ?activityId, "Activity uploaded attachment", caller);

        upload.id;
      };
    };
  };

  public query ({ caller }) func getActivityAttachmentFile(attachmentId : Text) : async ?Blob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access attachment files");
    };

    switch (activityAttachments.get(attachmentId)) {
      case (null) { null };
      case (?attachment) {
        switch (getActiveKidProfile(caller)) {
          case (?kidProfile) {
            if (not kidHasAccessToProgram(kidProfile, attachment.programId)) {
              Runtime.trap("Unauthorized: Kid does not have access to this program");
            };
          };
          case (null) {};
        };
        attachment.storageMeta.fileBytes;
      };
    };
  };

  public shared ({ caller }) func deleteActivityAttachment(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete activity attachments");
    };
    blockIfKidContext(caller);

    switch (activityAttachments.get(id)) {
      case (null) { Runtime.trap("Attachment not found") };
      case (?attachment) {
        let archivedMetadata = {
          attachment.storageMeta.attachmentMetadata with isArchived = true
        };
        let archivedStorageMeta = {
          attachment.storageMeta with attachmentMetadata = archivedMetadata
        };
        let archivedAttachment = {
          attachment with storageMeta = archivedStorageMeta
        };
        activityAttachments.add(id, archivedAttachment);

        recordTimelineEvent(attachment.programId, "ActivityAttachmentDeleted", ?id, "Activity attachment deleted", caller);
      };
    };
  };

  public query ({ caller }) func listActivityAttachments(activityId : Text) : async [ActivityAttachment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list activity attachments");
    };

    let results : [ActivityAttachment] = activityAttachments.values().toArray().filter(
      func(attachment) {
        attachment.activityId == activityId and not attachment.storageMeta.attachmentMetadata.isArchived
      }
    ).map(
      func(attachment) {
        {
          metadata = attachment.storageMeta.attachmentMetadata;
          activityId = attachment.activityId;
          programId = attachment.programId;
        };
      }
    );
    results;
  };

  // ------------------------------------------------
  // New Documentation Attachments (backend storage)
  // ------------------------------------------------
  public shared ({ caller }) func uploadDocumentationAttachment(documentationId : Nat, programId : Text, upload : MediaAttachmentUpload) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload attachments for documentation entries");
    };
    blockIfKidContext(caller);

    let attachment : MediaAttachment = {
      id = upload.id;
      filename = upload.filename;
      contentType = upload.contentType;
      byteSize = upload.byteSize;
      uploadedAt = Int.abs(Time.now() / 1_000_000_000);
      uploadedBy = caller;
      isArchived = false;
      isImage = upload.isImage;
    };

    let storageMeta : StorageMediaAttachment = {
      attachmentMetadata = attachment;
      fileBytes = upload.fileBytes;
    };

    let storedAttachment : StoredDocumentationAttachment = {
      storageMeta;
      documentationId;
      programId;
    };

    documentationAttachments.add(upload.id, storedAttachment);

    recordTimelineEvent(programId, "DocumentationAttachmentUploaded", ?documentationId.toText(), "Documentation uploaded attachment", caller);

    upload.id;
  };

  public query ({ caller }) func getDocumentationAttachmentFile(attachmentId : Text) : async ?Blob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access attachment files");
    };

    switch (documentationAttachments.get(attachmentId)) {
      case (null) { null };
      case (?attachment) {
        switch (getActiveKidProfile(caller)) {
          case (?kidProfile) {
            if (not kidHasAccessToProgram(kidProfile, attachment.programId)) {
              Runtime.trap("Unauthorized: Kid does not have access to this program");
            };
          };
          case (null) {};
        };
        attachment.storageMeta.fileBytes;
      };
    };
  };

  public shared ({ caller }) func deleteDocumentationAttachment(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documentation attachments");
    };
    blockIfKidContext(caller);

    switch (documentationAttachments.get(id)) {
      case (null) { Runtime.trap("Attachment not found") };
      case (?attachment) {
        let archivedMetadata = {
          attachment.storageMeta.attachmentMetadata with isArchived = true
        };
        let archivedStorageMeta = {
          attachment.storageMeta with attachmentMetadata = archivedMetadata
        };
        let archivedAttachment = {
          attachment with storageMeta = archivedStorageMeta
        };
        documentationAttachments.add(id, archivedAttachment);

        recordTimelineEvent(attachment.programId, "DocumentationAttachmentDeleted", ?id, "Documentation attachment deleted", caller);
      };
    };
  };

  public query ({ caller }) func listDocumentationAttachments(documentationId : Nat) : async [DocumentationAttachment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list documentation attachments");
    };

    let results : [DocumentationAttachment] = documentationAttachments.values().toArray().filter(
      func(attachment) {
        attachment.documentationId == documentationId and not attachment.storageMeta.attachmentMetadata.isArchived
      }
    ).map(
      func(attachment) {
        {
          metadata = attachment.storageMeta.attachmentMetadata;
          documentationId = attachment.documentationId;
          programId = attachment.programId;
        };
      }
    );
    results;
  };

  // ------------------------------------------------
  // Schedule Events (with kid context restrictions)
  // ------------------------------------------------
  public query ({ caller }) func listScheduleEvents(programId : Text) : async [ScheduleEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list schedule events");
    };

    switch (getActiveKidProfile(caller)) {
      case (?kidProfile) {
        if (not kidHasAccessToProgram(kidProfile, programId)) {
          Runtime.trap("Unauthorized: Kid does not have access to this program");
        };
      };
      case (null) {};
    };

    scheduleEvents.entries().filter(
        func((_, event) : (Text, ScheduleEvent)) : Bool {
          event.programId == programId and not event.isArchived
        }
      ).map<(Text, ScheduleEvent), ScheduleEvent>(
          func((_, event) : (Text, ScheduleEvent)) : ScheduleEvent { event }
        ).toArray();
  };

  public shared ({ caller }) func createScheduleEvent(event : ScheduleEvent) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create schedule events");
    };
    blockIfKidContext(caller);

    scheduleEvents.add(event.id, event);
    recordTimelineEvent(event.programId, "ScheduleEventCreated", ?event.id, "Schedule event created", caller);
    event.id;
  };

  public shared ({ caller }) func updateScheduleEvent(id : Text, event : ScheduleEvent) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update schedule events");
    };
    blockIfKidContext(caller);

    scheduleEvents.add(id, event);
    recordTimelineEvent(event.programId, "ScheduleEventUpdated", ?id, "Schedule event updated", caller);
  };

  public shared ({ caller }) func deleteScheduleEvent(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete schedule events");
    };
    blockIfKidContext(caller);

    switch (scheduleEvents.get(id)) {
      case (null) { Runtime.trap("Schedule event not found") };
      case (?event) {
        scheduleEvents.remove(id);
        recordTimelineEvent(event.programId, "ScheduleEventDeleted", ?id, "Schedule event deleted", caller);
      };
    };
  };

  public query ({ caller }) func getUpcomingEventsInWindow(timeWindow : ?Nat) : async [ScheduleEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query upcoming events");
    };

    let now = Int.abs(Time.now() / 1_000_000_000);
    let window = switch (timeWindow) {
      case (null) { 604_800 };
      case (?w) { w };
    };

    switch (getActiveKidProfile(caller)) {
      case (?kidProfile) {
        scheduleEvents.entries().filter(
          func((_, event) : (Text, ScheduleEvent)) : Bool {
            not event.isArchived and
            event.startTimestamp >= now and 
            event.startTimestamp <= (now + window) and
            kidHasAccessToProgram(kidProfile, event.programId)
          }
        ).map<(Text, ScheduleEvent), ScheduleEvent>(
          func((_, event) : (Text, ScheduleEvent)) : ScheduleEvent { event }
        ).toArray();
      };
      case (null) {
        scheduleEvents.entries().filter(
          func((_, event) : (Text, ScheduleEvent)) : Bool {
            not event.isArchived and
            event.startTimestamp >= now and event.startTimestamp <= (now + window)
          }
        ).map<(Text, ScheduleEvent), ScheduleEvent>(
          func((_, event) : (Text, ScheduleEvent)) : ScheduleEvent { event }
        ).toArray();
      };
    };
  };

  // ------------------------------------------------
  // Activities (blocked in kid context)
  // ------------------------------------------------
  public query ({ caller }) func listActivities() : async [Activity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list activities");
    };
    blockIfKidContext(caller);
    activities.entries().map<(Text, Activity), Activity>(
        func((_, activity) : (Text, Activity)) : Activity { activity }
      ).toArray();
  };

  public query ({ caller }) func getActivity(id : Text) : async ?Activity {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activities");
    };
    blockIfKidContext(caller);
    activities.get(id);
  };

  public shared ({ caller }) func createActivity(activity : Activity) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create activities");
    };
    blockIfKidContext(caller);

    activities.add(activity.id, activity);
    recordTimelineEvent(activity.programId, "ActivityCreated", ?activity.id, "Activity created", caller);
    activity.id;
  };

  public shared ({ caller }) func updateActivity(id : Text, activity : Activity) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update activities");
    };
    blockIfKidContext(caller);

    activities.add(id, activity);
    recordTimelineEvent(activity.programId, "ActivityUpdated", ?id, "Activity updated", caller);
  };

  public shared ({ caller }) func deleteActivity(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete activities");
    };
    blockIfKidContext(caller);

    switch (activities.get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?activity) {
        activities.remove(id);
        recordTimelineEvent(activity.programId, "ActivityDeleted", ?id, "Activity deleted", caller);
      };
    };
  };

  // ------------------------------------------------
  // Orphanages (blocked in kid context)
  // ------------------------------------------------
  public query ({ caller }) func listOrphanages() : async [Orphanage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list orphanages");
    };
    blockIfKidContext(caller);
    orphanages.entries().map<(Text, Orphanage), Orphanage>(
        func((_, orphanage) : (Text, Orphanage)) : Orphanage { orphanage }
      ).toArray();
  };

  public query ({ caller }) func getOrphanage(id : Text) : async ?Orphanage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orphanages");
    };
    blockIfKidContext(caller);
    orphanages.get(id);
  };

  public shared ({ caller }) func createOrphanage(orphanage : Orphanage) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orphanages");
    };
    blockIfKidContext(caller);

    orphanages.add(orphanage.id, orphanage);
    orphanage.id;
  };

  public shared ({ caller }) func updateOrphanage(id : Text, orphanage : Orphanage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update orphanages");
    };
    blockIfKidContext(caller);

    orphanages.add(id, orphanage);
  };

  public shared ({ caller }) func deleteOrphanage(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete orphanages");
    };
    blockIfKidContext(caller);

    orphanages.remove(id);
  };

  // ------------------------------------------------
  // People (blocked in kid context)
  // ------------------------------------------------
  public query ({ caller }) func listPeople() : async [Person] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list people");
    };
    blockIfKidContext(caller);
    people.entries().map<(Nat, Person), Person>(
        func((_, person) : (Nat, Person)) : Person { person }
      ).toArray();
  };

  public shared ({ caller }) func createPerson(person : Person) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create people");
    };
    blockIfKidContext(caller);

    let id = peopleIdCounter;
    peopleIdCounter += 1;
    people.add(id, person);
    id;
  };

  public shared ({ caller }) func updatePerson(id : Nat, person : Person) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update people");
    };
    blockIfKidContext(caller);

    people.add(id, person);
  };

  public shared ({ caller }) func deletePerson(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete people");
    };
    blockIfKidContext(caller);

    people.remove(id);
  };

  // ------------------------------------------------
  // Documentation Entries (blocked in kid context)
  // ------------------------------------------------
  public query ({ caller }) func listDocumentationEntries() : async [DocumentationEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list documentation entries");
    };
    blockIfKidContext(caller);
    documentationEntries.entries().map<(Nat, DocumentationEntry), DocumentationEntry>(
        func((_, entry) : (Nat, DocumentationEntry)) : DocumentationEntry { entry }
      ).toArray();
  };

  public shared ({ caller }) func createDocumentationEntry(entry : DocumentationEntry) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create documentation entries");
    };
    blockIfKidContext(caller);

    let id = documentationEntryCounter;
    documentationEntryCounter += 1;
    documentationEntries.add(id, entry);

    switch (activities.get(entry.activityId)) {
      case (null) {
        recordTimelineEvent(entry.activityId, "DocumentationEntryCreated", ?entry.idText, "Documentation entry created", caller);
      };
      case (?activity) {
        recordTimelineEvent(activity.programId, "DocumentationEntryCreated", ?entry.idText, "Documentation entry created", caller);
      };
    };
    id;
  };

  public shared ({ caller }) func updateDocumentationEntry(id : Nat, entry : DocumentationEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update documentation entries");
    };
    blockIfKidContext(caller);

    documentationEntries.add(id, entry);

    switch (activities.get(entry.activityId)) {
      case (null) {
        recordTimelineEvent(entry.activityId, "DocumentationEntryUpdated", ?entry.idText, "Documentation entry updated", caller);
      };
      case (?activity) {
        recordTimelineEvent(activity.programId, "DocumentationEntryUpdated", ?entry.idText, "Documentation entry updated", caller);
      };
    };
  };

  public shared ({ caller }) func deleteDocumentationEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documentation entries");
    };
    blockIfKidContext(caller);

    switch (documentationEntries.get(id)) {
      case (null) { Runtime.trap("Documentation entry not found") };
      case (?entry) {
        documentationEntries.remove(id);
        switch (activities.get(entry.activityId)) {
          case (null) {
            recordTimelineEvent(entry.activityId, "DocumentationEntryDeleted", ?entry.idText, "Documentation entry deleted", caller);
          };
          case (?activity) {
            recordTimelineEvent(activity.programId, "DocumentationEntryDeleted", ?entry.idText, "Documentation entry deleted", caller);
          };
        };
      };
    };
  };

  // ------------------------------------------------
  // Program Timeline (Backend Audit/Timeline)
  // ------------------------------------------------
  func recordTimelineEvent(programId : Text, eventType : Text, relatedId : ?Text, details : Text, principal : Principal) {
    let event : TimelineEvent = {
      id = timelineEventCounter;
      programId;
      eventType;
      relatedId;
      timestamp = Int.abs(Time.now() / 1_000_000_000);
      details = ?details;
      actorPrincipal = ?principal;
    };
    timelineEventCounter += 1;

    let existingEvents = switch (timelineEvents.get(programId)) {
      case (null) { [] };
      case (?events) { events };
    };
    let updatedEvents = [event].concat(existingEvents);
    timelineEvents.add(programId, updatedEvents);
  };

  public query ({ caller }) func getProgramTimeline(programId : Text) : async [TimelineEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query program timeline");
    };

    switch (getActiveKidProfile(caller)) {
      case (?kidProfile) {
        if (not kidHasAccessToProgram(kidProfile, programId)) {
          Runtime.trap("Unauthorized: Kid does not have access to this program");
        };
      };
      case (null) {};
    };

    switch (timelineEvents.get(programId)) {
      case (null) { [] };
      case (?events) { events };
    };
  };
};
