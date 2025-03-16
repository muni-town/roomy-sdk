import {
  defComponent,
  EntityIdStr,
  LoroMap,
  LoroMovableList,
  LoroText,
} from "@muni-town/leaf";

/** The display name, short description, and image / icon URL of an entity. */
export const BasicMeta = defComponent(
  "name:01JPE9PEBF47QJR6THNW4J4JXJ",
  LoroMap<{ name: string; description?: string; image?: string }>,
  (map) => map.set("name", "")
);

/** A list of Entity IDs for Roomy spaces. */
export const Spaces = defComponent(
  "spaces:01JPE97AYAJSDP0NRAH79S9792",
  LoroMovableList<EntityIdStr>
);

/**
 * This entity represents a collection of links to other entities.
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
 * An ordered list of Roomy threads. Usually threads are sorted by creation order with the latest
 * ones at the end of the list.
 * */
export const Threads = defComponent(
  "threads:01JPEB05824ZR836QMV6B3E69F",
  LoroMovableList<EntityIdStr>
);

/**
 * An ordered list of Entity IDs for Roomy messages. The latest messages are at the end of the list.
 * */
export const Messages = defComponent(
  "messages:01JPEAH76WBQ4XYZQZT7MQT19V",
  LoroMovableList<EntityIdStr>
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
 * The DIDs ( Decentralized Identifiers ) for the authors of the given entity.
 */
export const AuthorDids = defComponent(
  "authorDids:01JPEBV8TJ8YCXXYD156NJSR5Y",
  LoroMovableList<string>
);
