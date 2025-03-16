import {
  defComponent,
  EntityIdStr,
  LoroMap,
  LoroMovableList,
  LoroText,
  Marker,
} from "@muni-town/leaf";
import { LoroList } from "./index.ts";

/** A decentralized identifier ( DID ) */
export type Did = `did:${string}:${string}`;

/** The display name, slug, short description, and image / icon URI of an entity. */
export const BasicMeta = defComponent(
  "name:01JPE9PEBF47QJR6THNW4J4JXJ",
  LoroMap<{
    name: string;
    slug?: string;
    description?: string;
    /** The entity ID of an entity with an `ImageUri` component. */
    image?: EntityIdStr;
  }>,
  (map) => map.set("name", "Unnamed")
);

/** This entity is in reply to another entity. */
export const ReplyTo = defComponent(
  "replyTo:01JPFR9RXR4BECAMCEH0M8XPQY",
  LoroMap<{ entity: EntityIdStr }>
);

/** Entities with this marker component have been soft deleted and should be shown as deleted
 * usually in the UI, even though the data is preserved. */
export const SoftDelete = defComponent(
  "softDelete:01JPFQK63H9W2RA8Q5GQ19S1DY",
  Marker
);

/** An image from a URI. */
export const ImageUri = defComponent(
  "imageUri:01JPFRMSYWE2G0JHMS7RW478G3",
  LoroMap<{ uri: string; width?: number; height?: number; alt?: string }>,
  (map) => map.set("uri", "example:image")
);

/**
 * An ordered list of Entity IDs for images or image {@linkcode Collection}s. Each image should have
 * an {@linkcode ImageUri} component.
 *
 * This might represent images attached to a chat message, or an image gallery or something similar.
 * */
export const Images = defComponent(
  "spaces:01JPE97AYAJSDP0NRAH79S9792",
  LoroMovableList<EntityIdStr>
);

/** A list of Entity IDs for Roomy spaces. */
export const Spaces = defComponent(
  "spaces:01JPE97AYAJSDP0NRAH79S9792",
  LoroMovableList<EntityIdStr>
);

/**
 * This entity represents a generic collection of other entities.
 *
 * This component can be used to implement things like pagination by putting a list of collection
 * entities, the pages, inside, for example, a {@linkcode Messages} component.
 *
 * Any entity that has a {@linkcode Collection} component in the list could be treated as a page
 * where each link in the collection is the actual {@linkcode Message} in the list.
 * */
export const Collection = defComponent(
  "collection:01JPEB6RBRYDG7CJWX74RK324E",
  LoroMovableList<EntityIdStr>
);

/**
 * An ordered list of Entity IDs for Roomy channels or channel {@linkcode Collection}s.
 * */
export const Channels = defComponent(
  "channels:01JPFMTA2QAFY2D3CV1C0YBZQ9",
  LoroMovableList<EntityIdStr>
);

/**
 * An ordered list of Roomy threads or thread {@linkcode Collection}s. Usually threads are sorted by
 * creation order with the latest ones at the end of the list.
 * */
export const Threads = defComponent(
  "threads:01JPEB05824ZR836QMV6B3E69F",
  LoroMovableList<EntityIdStr>
);

/**
 * An ordered list of Entity IDs for Roomy messages or message {@linkcode Collection}s. The latest
 * messages are at the end of the list.
 * */
export const Messages = defComponent(
  "messages:01JPEAH76WBQ4XYZQZT7MQT19V",
  LoroMovableList<EntityIdStr>
);

/**
 * The DIDs ( Decentralized Identifiers ) for the authors of the given entity.
 */
export const AuthorDids = defComponent(
  "authorDids:01JPEBV8TJ8YCXXYD156NJSR5Y",
  LoroMovableList<Did>
);

/**
 * Rich text content for the entity.
 *
 * This could be the body of a chat message, blog post, wiki page, etc. It should represent the main
 * content body for an entity when added.
 */
export const Content = defComponent(
  "content:01JPEBQARGPD0BQV7DYGC9TR5Z",
  LoroText
);

/**
 * The items in a Roomy space's channel / category list sidebar.
 *
 * For now, each item should be a channel or a category entity, i.e. it should either have a
 * {@linkcode Channels} component ( for a category ) or a {@linkcode Messages} component ( for a
 * channel ).
 */
export const SpaceSidebarNavigation = defComponent(
  "spaceSidebarNavigation:01JPFMBD0XT7B922PSQ7KQ99EW",
  LoroMovableList<EntityIdStr>
);

/** Emoji-type reactions to an entity. */
export const Reactions = defComponent(
  "reactions:01JPFTQACDW0KM3857XWER87RR",
  LoroList<{
    /** The reaction that is being made. This should usually be a unicode emoji character, but we're
     * leaving open the possibility to other kinds of reactions. */
    reaction: string;
    /** The person that reacted with the `reaction`. */
    userDid: Did;
  }>
);

/**
 * Metadata for a channel announcement, which is a message that might get inserted into a channel
 * timeline for various reasons.
 * */
export const ChannelAnnouncement = defComponent(
  "channelAnnouncement:01JPFTN90MGBMBCMCNJ4V65YF2",
  LoroMap<{
    kind: "messageMoved" | "messageDeleted" | "threadCreated" | string;
  }>,
  (map) => map.set("kind", "unknown")
);
