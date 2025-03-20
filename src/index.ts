/**
 * Welcome to the Roomy SDK!
 *
 * This is the core behind the [roomy.chat](https://roomy.chat) app, and allows you to interact with
 * Roomy spaces, channels, etc. in your own app, or lets you build your own customized chat
 * application.
 *
 * Roomy is built on the [Leaf SDK](https://github.com/muni-town/leaf), a toolkit for building
 * local-first apps with CRDTs.
 *
 * To get started you will need to create a Leaf {@linkcode Peer} and then you can start accessing
 * the Roomy API by initializing a {@linkcode Roomy} instance.
 *
 * > **Note:** Typedoc hides the types from external libraries like Leaf by default. You can show
 * > the Leaf types by checking the "External" checkbox in the right sidebar.
 *
 * @module
 */

import {
  ComponentDef,
  Entity,
  EntityIdStr,
  intoEntityId,
  IntoEntityId,
  LoroList,
  LoroMovableList,
  LoroText,
  Peer,
} from "@muni-town/leaf";
import {
  BasicMeta,
  ChannelAnnouncement,
  ChannelAnnouncementKind,
  Channels,
  Content,
  Messages,
  Reactions as ReactionsComponent,
  ReplyTo,
  SoftDeleted,
  Spaces,
  SpaceSidebarNavigation,
  Threads,
  ImageUri,
  Images,
  Reaction,
  AuthorUris,
  Uri,
  Admins,
} from "./components.ts";
export type { Uri } from "./components.ts";

export * from "@muni-town/leaf";

/**
 * Leaf component definitions for the underlying Roomy data.
 *
 * You will not usually have to interact with these directly.
 *
 * @category Advanced
 * */
export * as components from "./components.ts";

/** A constructor for an {@linkcode EntityWrapper}. */
export type EntityConstructor<T extends EntityWrapper> = new (
  peer: Peer,
  entity: Entity
) => T;

/**
 * Parent class for all types that hold a {@linkcode Peer} instance.
 *
 * Usually you will not need to use this directly.
 *
 * @category Advanced
 */
export class HasPeer {
  /**
   * The leaf peer instance.
   * @group Advanced
   */
  peer: Peer;

  /** @group Advanced */
  constructor(peer: Peer) {
    this.peer = peer;
  }

  /**
   * Create a new entity of the given type.
   *
   * This can be used to create a new {@linkcode Entity} for any type that implements
   * {@linkcode EntityWrapper}.
   *
   * ## Example
   *
   * ```ts
   * const roomy = await Roomy.init(peer, catalogId);
   * const space = roomy.create(Space);
   * ```
   *
   * > **Note:** This method is inherited from {@linkcode EntityWrapper} on all entity types, and it
   * > doesn't matter which type you call `create()` on, they are all equivalent.
   *
   * @group General
   */
  async create<T extends EntityWrapper>(
    constructor: EntityConstructor<T>
  ): Promise<T> {
    const ent = await this.peer.open();
    return new constructor(this.peer, ent);
  }

  /**
   * Open an existing {@linkcode Entity} using it's ID.
   *
   * You provide an {@linkcode EntityWrapper} type like {@linkcode Space} or {@linkcode Message}
   * that will be wrapped around the entity.
   *
   * @group General
   * */
  async open<T extends EntityWrapper>(
    constructor: EntityConstructor<T>,
    id: IntoEntityId
  ): Promise<T> {
    const ent = await this.peer.open(intoEntityId(id));
    return new constructor(this.peer, ent);
  }
}

/**
 * A convenient wrapper around an {@linkcode Entity}.
 *
 * {@linkcode EntityWrapper} is the parent of all of the more convenient entity types such as
 * {@linkcode Message} or {@linkcode Space}.
 *
 * Each subclass will usually add it's own accessors that allow for conveniently modifying the
 * underlying {@linkcode Entity}'s component data.
 *
 * You are welcome to extend this type yourself ot add custom convenient entity classes.
 */
export class EntityWrapper extends HasPeer {
  /**
   * The underlying Leaf {@linkcode Entity}.
   *
   * @group Advanced
   */
  entity: Entity;

  /**
   * Instantiate from from a {@linkcode Peer} and an {@linkcode Entity}.
   *
   * This an other {@linkcode EntityWrapper} types simply provide convenient accessors on top of the
   * underlying entity data.
   *
   * @group Advanced
   */
  constructor(peer: Peer, entity: Entity) {
    super(peer);
    this.entity = entity;
  }

  /**
   * Cast from one {@linkcode EntityWrapper} type to another.
   *
   * **Note:** Because the underlying {@linkcode Entity} is untyped and allows you to add any
   * components to it, this cast will _always_ succeed. The Entity-Component design model allows
   * entities to be understood by the components they have, instead of restricting them to represent
   * a specific type with only certain components.
   *
   * You will not usually need to cast entity types to other ones, but it can be useful in some
   * situations, where you would like to use another {@linkcode EntityWrapper} types's accessors.
   *
   * @group Advanced
   */
  cast<T extends EntityWrapper>(constructor: EntityConstructor<T>): T {
    return new constructor(this.peer, this.entity);
  }

  /**
   * Commit any changes made to the entity.
   *
   * **Important:** You must call commit after making changes in order for those changes to be
   * immediately applied, reacted to, and synced to network and/or storage.
   *
   * @group General
   */
  commit() {
    this.entity.commit();
  }

  /**
   * The string entity ID.
   *
   * @group General
   */
  get id(): EntityIdStr {
    return this.entity.id.toString();
  }

  /**
   * Register a callback that will be run when the entity is committed.
   * @returns A function that may be called to unregister the callback.
   */
  subscribe(listener: () => void): () => void {
    return this.entity.subscribe(listener);
  }
}

export class Deletable extends EntityWrapper {
  get softDeleted(): boolean {
    return this.entity.has(SoftDeleted);
  }

  set softDeleted(deleted: boolean) {
    if (deleted) {
      this.entity.init(SoftDeleted);
    } else {
      this.entity.delete(SoftDeleted);
    }
  }
}

export class Administered extends Deletable {
  /** The global list of channels in the space, separate from the i. */
  get admins(): LoroMovableList<Uri> {
    return this.entity.getOrInit(Admins);
  }

  /**
   * Add all of the admins from another {@linkcode Administered} entity to the admins list for this
   * entity.
   * */
  appendAdminsFrom(other: Administered) {
    const currentAdmins = this.admins.toArray();
    for (const admin of other.admins.toArray()) {
      if (!currentAdmins.includes(admin)) {
        this.admins.push(admin);
      }
    }
  }
}

export class NamedEntity extends Administered {
  get name(): string {
    return this.entity.getOrInit(BasicMeta).get("name");
  }
  set name(name: string) {
    this.entity.getOrInit(BasicMeta).set("name", name);
  }

  get description(): string | undefined {
    return this.entity.getOrInit(BasicMeta).get("description");
  }
  set description(description: string | undefined) {
    this.entity.getOrInit(BasicMeta).set("description", description);
  }
}

/** A Loro list type, either movable or not. */
export type LoroListType<T> = LoroList<T> | LoroMovableList<T>;

/**
 * An accessor for a list of other entities.
 *
 * This access will allow you to read and modify the entities in the list.
 * */
export class EntityList<
  T extends EntityWrapper,
  L extends LoroListType<EntityIdStr> = LoroMovableList<EntityIdStr>
> extends EntityWrapper {
  #def: ComponentDef<L>;
  #factory: EntityConstructor<T>;

  /**
   * You will not usually need to create an {@linkcode EntityList} yourself unless you are
   * implementing your own subclass of {@linkcode EntityWrapper}.
   *
   * @param peer The Leaf peer.
   * @param entity The entity containing the list of other entities.
   * @param component The underlying leaf component containing the list of other entities.
   * @param constructor The {@linkcode EntityWrapper} type to wrap the entities in the list with.
   */
  constructor(
    peer: Peer,
    entity: Entity,
    component: ComponentDef<L>,
    constructor: EntityConstructor<T>
  ) {
    super(peer, entity);
    this.#def = component;
    this.#factory = constructor;
  }

  /** Get the list of entity IDs in the list. */
  ids(): EntityIdStr[] {
    return this.entity.getOrInit(this.#def).toArray();
  }

  /** Load the full list of entities as an array. */
  async items(): Promise<T[]> {
    return await Promise.all(
      this.entity
        .getOrInit(this.#def)
        .toArray()
        .map(
          async (ent) => new this.#factory(this.peer, await this.peer.open(ent))
        )
    );
  }

  /** Add an entity to the end of the list. */
  push(item: T) {
    this.entity.getOrInit(this.#def).push(item.entity.id.toString());
  }

  /** Add an entity to the specified index in the list. */
  insert(index: number, item: T) {
    this.entity.getOrInit(this.#def).insert(index, item.entity.id.toString());
  }

  /** Remove an entity from the list. */
  remove(itemIdx: number) {
    this.entity.getOrInit(this.#def).delete(itemIdx, 1);
  }

  /** Move an entity in the list from `itemIdx` to `newIdx`. */
  move(
    // This funky trick makes typechecking fail when trying to call this function if it is not a
    // movable list.
    itemIdx: L extends LoroMovableList ? number : never,
    newIdx: number
  ): L extends LoroMovableList ? void : never {
    const list = this.entity.getOrInit(this.#def);

    if (list instanceof LoroMovableList) {
      list.move(itemIdx, newIdx);
    } else {
      throw "Cannot use move function in an immovable list.";
    }

    // deno-lint-ignore no-explicit-any
    return undefined as any;
  }

  /** Get the raw {@linkcode LoroMovableList}. */
  rawList(): L {
    return this.entity.getOrInit(this.#def);
  }

  /** The number of items in the list. */
  get length(): number {
    return this.entity.getOrInit(this.#def).length;
  }

  /** Delete all of the items in the list and remove the component from the entity. */
  delete() {
    this.entity.delete(this.#def);
  }
}

/**
 * A roomy instance.
 *
 * Contains everything necessary to interact with Roomy data
 * */
export class Roomy extends EntityWrapper {
  /**
   * Create a Roomy instance.
   *
   * @param peer You must first construct a Leaf {@linkcode Peer} and configure it's storage backend
   * and syncer implementations before constructing the {@linkcode Roomy} instance.
   * @param catalogId The `catalogId` ID of the entity that will be used to store the user's list of
   * joined spaces, preferences, etc.
   * */
  static async init(peer: Peer, catalogId: IntoEntityId): Promise<Roomy> {
    const catalog = await peer.open(intoEntityId(catalogId));
    return new Roomy(peer, catalog);
  }

  /** The list of spaces in the Roomy instance. */
  get spaces(): EntityList<Space> {
    return new EntityList(this.peer, this.entity, Spaces, Space);
  }
}

/**
 * A Roomy space.
 */
export class Space extends NamedEntity {
  /** The items in the Roomy sidebar. */
  get sidebarItems(): EntityList<SidebarItem> {
    return new EntityList(
      this.peer,
      this.entity,
      SpaceSidebarNavigation,
      SidebarItem
    );
  }

  /** The global list of channels in the space, separate from the i. */
  get channels(): EntityList<Channel> {
    return new EntityList(this.peer, this.entity, Channels, Channel);
  }

  /** The global list of threads in the space. */
  get threads(): EntityList<Thread> {
    return new EntityList(this.peer, this.entity, Threads, Thread);
  }
}

/**
 * An item that can be placed in the Roomy sidebar.
 */
export class SidebarItem extends NamedEntity {
  get type(): "channel" | "category" {
    if (this.entity.has(Messages)) {
      return "category";
    } else if (this.entity.has(Channels)) {
      return "channel";
    } else {
      throw "Unknown sidebar item type";
    }
  }

  /**
   * Cast this sidebar item to a {@linkcode Channel}, returning `undefined` if it does not have a
   * {@linkcode Messages} component and so does not appear to be a channel.
   * */
  asChannel(): Channel | undefined {
    if (this.type == "channel") return this.cast(Channel);
  }

  /**
   * Cast this sidebar item to a {@linkcode Category}, returning `undefined` if it does not have a
   * {@linkcode Channels} component and so does not appear to be a category.
   * */
  asCategory(): Category | undefined {
    if (this.type == "category") return this.cast(Category);
  }
}

/**
 * A category is a container for channels that may be put in the Roomy sidebar.
 */
export class Category extends SidebarItem {
  get channels(): EntityList<Channel> {
    return new EntityList(this.peer, this.entity, Channels, Channel);
  }
}

/**
 * A category is a container for messages.
 *
 * This is quite generic and is the same type currently used for {@linkcode Thread}s.
 */
export class Channel extends SidebarItem {
  get messages(): EntityList<Message> {
    return new EntityList(this.peer, this.entity, Messages, Message);
  }
}
/** A thread, currently an alias for {@linkcode Channel}. */
export const Thread = Channel;
/** A thread, currently an alias for {@linkcode Channel}. */
export type Thread = Channel;

/**
 * An entry that may appear in a {@linkcode Channel} or {@linkcode Thread} timeline, such as a
 * {@linkcode Message} or {@linkcode Announcement}.
 */
export class TimelineItem extends Deletable {
  /** The emoji reactions to the message. */
  get reactions(): Reactions {
    return this.cast(Reactions);
  }

  /** The entity that this message was in reply to, if any. */
  get replyTo(): EntityIdStr | undefined {
    return this.entity.get(ReplyTo)?.get("entity");
  }

  /** Set the entity that this message was in reply to, if any. */
  set replyTo(id: IntoEntityId | undefined) {
    if (id) {
      this.entity.getOrInit(ReplyTo).set("entity", intoEntityId(id).toString());
    } else {
      this.entity.delete(ReplyTo);
    }
  }
}

/** Accessor reactions on an entity. */
export class Reactions extends EntityWrapper {
  /** Get all of the reactions, and the set of users that reacted with the given reaction. */
  all(): Record<string, Set<string>> {
    const list = this.entity.getOrInit(ReactionsComponent).toArray();
    const reactions: Record<string, Set<string>> = {};
    for (const raw of list) {
      const [reaction, user] = raw.split(" ");
      if (!reactions[reaction]) reactions[reaction] = new Set();
      reactions[reaction].add(user);
    }
    return reactions;
  }

  /** Add a reaction. */
  add(reaction: string, authorId: string) {
    if (reaction.includes(" ") || authorId.includes(" "))
      throw new Error("Reaction and Author ID must not contain spaces.");
    const raw: Reaction = `${reaction} ${authorId}`;
    const component = this.entity.getOrInit(ReactionsComponent);
    const list = component.toArray();
    if (!list.includes(raw)) {
      component.push(raw);
    }
  }

  /** Remove a reaction. */
  remove(reaction: string, authorId: string) {
    if (reaction.includes(" ") || authorId.includes(" "))
      throw new Error("Reaction and Author ID must not contain spaces.");
    const raw: `${string} ${string}` = `${reaction} ${authorId}`;
    const component = this.entity.getOrInit(ReactionsComponent);
    const list = component.toArray();
    const idx = list.indexOf(raw);
    if (idx !== -1) {
      component.delete(idx, 1);
    }
  }
}

/** A message usually sent in a channel or thread. */
export class Message extends TimelineItem {
  get authors(): LoroMovableList<Uri> {
    return this.entity.getOrInit(AuthorUris);
  }

  /** The main content body of the message. */
  get body(): LoroText {
    return this.entity.getOrInit(Content);
  }

  /** A list of images attached to the message. */
  get images(): EntityList<Image> {
    return new EntityList(this.peer, this.entity, Images, Image);
  }
}

/**
 * An announcement is some event usually announced by the system and put in a {@linkcode Channel}
 * or {@linkcode Thread}.
 * */
export class Announcement extends TimelineItem {
  /** The kind of announcement */
  get kind(): ChannelAnnouncementKind {
    return this.entity.getOrInit(ChannelAnnouncement).get("kind");
  }

  /** Set the kind of announcement */
  set kind(kind: ChannelAnnouncementKind) {
    this.entity.getOrInit(ChannelAnnouncement).set("kind", kind);
  }

  /** The threads related to this announcement. */
  get relatedThreads(): EntityList<Thread> {
    return new EntityList(this.peer, this.entity, Threads, Thread);
  }

  /** The messages related to this announcement. */
  get relatedMessages(): EntityList<Message> {
    return new EntityList(this.peer, this.entity, Messages, Message);
  }
}

/**
 * An image defined by a URI.
 * */
export class Image extends Deletable {
  /**
   * The URI of the image. This could be an HTTP(S) URL or a base64 encoded data URI, or any other
   * kind of URI.
   * */
  get uri(): string {
    return this.entity.getOrInit(ImageUri).get("uri");
  }
  /** Set the URI of the image. */
  set uri(uri: string) {
    this.entity.getOrInit(ImageUri).set("uri", uri);
  }
  /** The alt text of the image */
  get alt(): string | undefined {
    return this.entity.getOrInit(ImageUri).get("alt");
  }
  /** Set the alt text of the image */
  set alt(alt: string) {
    this.entity.getOrInit(ImageUri).set("alt", alt);
  }
  /** The width of the image. */
  get width(): number | undefined {
    return this.entity.getOrInit(ImageUri).get("width");
  }
  /** Set the width of the image. */
  set width(width: number | undefined) {
    this.entity.getOrInit(ImageUri).set("width", width);
  }
  /** The height of the image. */
  get height(): number | undefined {
    return this.entity.getOrInit(ImageUri).get("height");
  }
  /** Set the height of the image. */
  set height(height: number) {
    this.entity.getOrInit(ImageUri).set("height", height);
  }
}
