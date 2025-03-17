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
  Did,
  Messages,
  Reactions,
  ReplyTo,
  SoftDeleted,
  Spaces,
  SpaceSidebarNavigation,
  Threads,
  ImageUri,
  Images,
} from "./components.ts";

export * from "@muni-town/leaf";
export * from "./components.ts";

export class HasPeer {
  /** The leaf peer instance. */
  peer: Peer;
  constructor(peer: Peer) {
    this.peer = peer;
  }

  async createCategory(): Promise<Category> {
    const ent = await this.peer.open();
    ent.init(Channels);
    return new Category(this.peer, ent);
  }

  async createMessage(): Promise<Message> {
    const ent = await this.peer.open();
    return new Message(this.peer, ent);
  }

  async createChannel(): Promise<Channel> {
    const ent = await this.peer.open();
    return new Channel(this.peer, ent);
  }

  /** Alias for {@linkcode createChannel}. */
  createThread(): Promise<Thread> {
    return this.createChannel();
  }

  async createSpace(): Promise<Space> {
    return new Space(this.peer, await this.peer.open());
  }
}

export class EntityWrapper extends HasPeer {
  entity: Entity;
  constructor(peer: Peer, entity: Entity) {
    super(peer);
    this.entity = entity;
  }
}

export class BasicMetaEntityWrapper extends EntityWrapper {
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

/** Generic entity list type. */
export class EntityList<T extends EntityWrapper> extends EntityWrapper {
  #def: ComponentDef<LoroMovableList<EntityIdStr>>;
  #factory: new (peer: Peer, entity: Entity) => T;

  constructor(
    peer: Peer,
    entity: Entity,
    component: ComponentDef<LoroMovableList<EntityIdStr>>,
    constructor: new (peer: Peer, entity: Entity) => T
  ) {
    super(peer, entity);
    this.#def = component;
    this.#factory = constructor;
  }

  /** Get the list of items in the sidebar */
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

  /** Add a new item to the sidebar. */
  add(item: SidebarItem) {
    // Add it to the list of sidebar items
    this.entity.getOrInit(this.#def).push(item.entity.id.toString());

    throw new Error("Unreachable");
  }

  /**
   * > **Note:** This does not delete the category / channel entity, it only removes it from the
   * > sidebar list.
   * */
  remove(itemIdx: number) {
    this.entity.getOrInit(this.#def).delete(itemIdx, 1);
  }

  /** Re-order an item in the sidebar. */
  move(itemIdx: number, newIdx: number) {
    this.entity.getOrInit(this.#def).move(itemIdx, newIdx);
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

  spaces(): EntityList<Space> {
    return new EntityList(this.peer, this.entity, Spaces, Space);
  }
}

export class Space extends BasicMetaEntityWrapper {
  get sidebarItems(): EntityList<SidebarItem> {
    return new EntityList(
      this.peer,
      this.entity,
      SpaceSidebarNavigation,
      SidebarItem
    );
  }
}

export class SidebarItem extends BasicMetaEntityWrapper {
  get type(): "channel" | "category" {
    if (this.entity.has(Messages)) {
      return "category";
    } else if (this.entity.has(Channels)) {
      return "channel";
    } else {
      throw "Unknown sidebar item type";
    }
  }

  asChannel(): Channel | undefined {
    if (this.type == "channel") return new Channel(this.peer, this.entity);
  }

  asCategory(): Category | undefined {
    if (this.type == "category") return new Category(this.peer, this.entity);
  }
}

export class Category extends SidebarItem {
  get channels(): EntityList<Channel> {
    return new EntityList(this.peer, this.entity, Channels, Channel);
  }
}

export class Channel extends SidebarItem {
  get messages(): EntityList<Message> {
    return new EntityList(this.peer, this.entity, Messages, Message);
  }
}
export const Thread = Channel;
export type Thread = Channel;

export class Message extends BasicMetaEntityWrapper {
  get body(): LoroText {
    return this.entity.getOrInit(Content);
  }

  get images(): EntityList<Image> {
    return new EntityList(this.peer, this.entity, Images, Image);
  }

  get reactions(): LoroList<{ reaction: string; userDid: Did }> {
    return this.entity.getOrInit(Reactions);
  }

  get replyTo(): EntityIdStr | undefined {
    return this.entity.get(ReplyTo)?.get("entity");
  }

  set replyTo(id: IntoEntityId | undefined) {
    if (id) {
      this.entity.getOrInit(ReplyTo).set("entity", intoEntityId(id).toString());
    } else {
      this.entity.delete(ReplyTo);
    }
  }
}

export class Announcement extends Message {
  get kind(): ChannelAnnouncementKind {
    return this.entity.getOrInit(ChannelAnnouncement).get("kind");
  }

  get relatedThreads(): EntityList<Thread> {
    return new EntityList(this.peer, this.entity, Threads, Thread);
  }

  get relatedMessages(): EntityList<Message> {
    return new EntityList(this.peer, this.entity, Messages, Message);
  }
}

export class Image extends EntityWrapper {
  get uri(): string {
    return this.entity.getOrInit(ImageUri).get("uri");
  }
  set uri(uri: string) {
    this.entity.getOrInit(ImageUri).set("uri", uri);
  }
  get alt(): string | undefined {
    return this.entity.getOrInit(ImageUri).get("alt");
  }
  set alt(alt: string) {
    this.entity.getOrInit(ImageUri).set("alt", alt);
  }
  get width(): number | undefined {
    return this.entity.getOrInit(ImageUri).get("width");
  }
  set width(width: number | undefined) {
    this.entity.getOrInit(ImageUri).set("width", width);
  }
  get height(): number | undefined {
    return this.entity.getOrInit(ImageUri).get("height");
  }
  set height(height: number) {
    this.entity.getOrInit(ImageUri).set("height", height);
  }
}
