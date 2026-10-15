import {
  ALL_OF_KEY,
  DEFINITIONS_KEY,
  ID_KEY,
  JSON_SCHEMA_DRAFT_2019_09,
  JSON_SCHEMA_DRAFT_2020_12,
  REF_KEY,
  SCHEMA_KEY,
} from '../../constants.ts';
import isObject, { isSchemaObject } from '../../isObject.ts';
import { isSubschemaKeyword, keywordShape, normalizeUri, resolveUri } from '../../schemaUri.ts';
import type { RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import { schemaFrom } from './mergePlan.ts';

/** A subschema's handle in a `SchemaGraph`. Plans, ref paths and provenance compare subschemas by it, so two spellings
 * of a `$ref` that reach the same subschema are one target.
 */
export type NodeId = number;

/** A boolean subschema. Booleans have no identity of their own, so each location holding one is a node of its own */
export interface BooleanNode {
  readonly kind: 'boolean';
  readonly id: NodeId;
  readonly pointer: string;
  readonly value: boolean;
}

/** Why a `$ref` resolves to no subschema */
export type InvalidReason = 'dangling' | 'circular-alias';

/** What a `$ref` that resolves to no subschema points at: `message` is the error whatever enters the reference
 * throws
 */
export interface InvalidNode {
  readonly kind: 'invalid';
  readonly id: NodeId;
  readonly pointer: string;
  readonly ref: string;
  readonly reason: InvalidReason;
  readonly message: string;
}

/** An object subschema. `raw` is the subschema itself, never a copy; the nodes its subschema-valued keywords parsed to
 * are looked up through `SchemaGraph.child()` and `SchemaGraph.subschemas()`.
 */
export interface ObjectNode<S extends StrictRJSFSchema = RJSFSchema> {
  readonly kind: 'schema';
  readonly id: NodeId;
  /** Where the subschema was first found: a JSON pointer into the graph's `rawRoot`, or one under `EXTERNAL_POINTER`
   * for a schema `adoptSchema()` parsed from outside the root
   */
  readonly pointer: string;
  /** The base URI `$ref`s inside the subschema resolve against */
  readonly baseUri: string;
  /** The `$id` exactly as written, which the `fields` registry is keyed on */
  readonly literalId?: string;
  readonly raw: S;
  /** Whether the subschema is a `$ref` and nothing that changes what it resolves to */
  readonly pureRef: boolean;
  /** The node the `$ref` resolves to, which is an `InvalidNode` when it resolves to nothing */
  readonly ref?: NodeId;
  /** Under draft 2019-09 or 2020-12, for a `$ref` with keywords beside it that resolves: the node it reads as where
   * another `$ref` reaches it, the `allOf` of those keywords and of the `$ref` alone, since those dialects apply a
   * `$ref` beside other keywords rather than replacing them
   */
  readonly conjunction?: NodeId;
}

export type SchemaNode<S extends StrictRJSFSchema = RJSFSchema> = BooleanNode | InvalidNode | ObjectNode<S>;

/** A `$ref` that resolves to no subschema, recorded once when the graph is parsed */
export interface Diagnostic {
  /** The node holding the `$ref` */
  readonly node: NodeId;
  readonly ref: string;
  readonly reason: InvalidReason;
  readonly message: string;
}

/** A root schema parsed once into nodes, one per subschema. Nothing in it changes after the parse. */
export interface SchemaGraph<S extends StrictRJSFSchema = RJSFSchema> {
  /** The root the graph was parsed from; every pointer is a pointer into it */
  readonly rawRoot: S;
  readonly root: NodeId;
  /** The graph this one extends with a schema from outside the root, for a graph `adoptSchema()` returned */
  readonly base?: SchemaGraph<S>;
  readonly diagnostics: readonly Diagnostic[];
  node(id: NodeId): SchemaNode<S>;
  /** The node first found at `pointer`, if one was */
  byPointer(pointer: string): NodeId | undefined;
  /** The node the subschema `keyword` holds in the object node `id` parsed to, or the one it holds under `key` for a
   * keyword holding a map or list of subschemas; undefined where it holds no subschema there
   */
  child(id: NodeId, keyword: string, key?: string): NodeId | undefined;
  /** The nodes of the subschemas the map or list `keyword` holds in the object node `id`, by key, in the order they
   * are written; a value that is not a subschema is left out
   */
  subschemas(id: NodeId, keyword: string): [string, NodeId][];
  /** The node parsed from the object subschema `raw`, if one was */
  byObject(raw: object): NodeId | undefined;
  /** The node `ref` resolves to from inside `from`, among those parsed, as a `ui:definitions` key is resolved */
  resolveRef(ref: string, from?: NodeId): NodeId | undefined;
  /** Returns the node `raw` parsed to, parsing a schema from outside the root into a graph that extends this one with
   * it, once per object. A call root such as the `{ allOf: [property, ...patterns] }` a caller builds, or an option
   * spread over its parent, is such a schema: its `$ref`s resolve against the root like any other.
   */
  adopt(raw: S): AdoptedSchema<S>;
  /** Returns the node `raw` parsed to, `raw` being a copy a caller made of the schema `of` stands for, such as a spread
   * of it with a keyword of its own made on every render: a copy whose keywords are those of the last copy adopted for
   * `of` is not parsed again, so the plans made for one are made for the other
   */
  adoptCopy(raw: S, of: object): AdoptedSchema<S>;
}

/** A schema's node and the graph holding it: the graph `adopt()` was called on when the schema was parsed with it, or
 * the one extending it with the schema
 */
export interface AdoptedSchema<S extends StrictRJSFSchema = RJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly node: NodeId;
}

/** Where the nodes `adoptSchema()` parses from outside the root are placed. It is not a JSON pointer, which starts
 * with a `/` or is empty, so it never names a location in the root.
 */
export const EXTERNAL_POINTER = '~external';

/** The keywords that can stand beside a `$ref` without changing what it resolves to */
const PURE_REF_KEYS = new Set([REF_KEY, DEFINITIONS_KEY, '$defs', SCHEMA_KEY, '$comment', 'title', 'description']);

/** The keywords that identify a schema or hold definitions for others and say nothing of the instance, so a `$ref`
 * beside nothing else has nothing to be the `allOf` of
 */
const NON_ANNOTATING_KEYS = new Set([REF_KEY, ID_KEY, '$anchor', DEFINITIONS_KEY, '$defs', SCHEMA_KEY, '$comment']);

function escapeToken(token: string): string {
  return token.replaceAll('~', '~0').replaceAll('/', '~1');
}

function childPointer(pointer: string, tokens: readonly string[]): string {
  return `${pointer}/${tokens.map(escapeToken).join('/')}`;
}

function unescapeToken(token: string): string {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

/** The key a resource is registered under: a normalized URI without a trailing `/`, so an `$id` and a `$ref` that
 * differ only in those still name the same resource
 */
function resourceKey(uri: string): string {
  return normalizeUri(uri).replace(/\/$/, '');
}

function decodeFragment(fragment: string): string | undefined {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return undefined;
  }
}

/** Returns the string a schema holds under `key`, or `undefined` where it holds none */
export function stringKeyword(raw: unknown, key: PropertyKey): string | undefined {
  // `Object()` boxes a boolean schema, which has no keywords to read
  const value: unknown = Reflect.get(Object(raw), key);
  return typeof value === 'string' ? value : undefined;
}

function isPureRef(raw: object): boolean {
  return stringKeyword(raw, REF_KEY) !== undefined && Object.keys(raw).every((key) => PURE_REF_KEYS.has(key));
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** The subschemas the keyword `key` holds as `value`, each with the pointer tokens leading to it from the schema
 * holding the keyword; a boolean is read as a subschema wherever the keyword holds one
 */
function subschemaEntries(key: string, value: unknown): [string[], unknown][] {
  const shape = keywordShape(key, value);
  if ((shape === 'map' || shape === 'array') && typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([name, sub]) => [[key, name], sub]);
  }
  return shape === 'single' || (typeof value === 'boolean' && isSubschemaKeyword(key)) ? [[[key], value]] : [];
}

interface WalkStart {
  readonly raw: unknown;
  readonly pointer: string;
  readonly base: string;
}

/** Where a pointer token lands: on a subschema, on a keyword's map or list of subschemas, or on data, such as the
 * value of a keyword holding no subschemas, where an `$id` names nothing
 */
type Position = 'schema' | 'container' | 'data';

function positionAfter(position: Position, token: string, value: unknown): Position {
  if (position !== 'schema') {
    return position === 'container' ? 'schema' : 'data';
  }
  const shape = keywordShape(token, value);
  if (shape === undefined) {
    return 'data';
  }
  return shape === 'single' ? 'schema' : 'container';
}

class Graph<S extends StrictRJSFSchema = RJSFSchema> implements SchemaGraph<S> {
  readonly rawRoot: S;
  readonly root: NodeId;
  readonly base?: Graph<S>;
  readonly diagnostics: Diagnostic[];
  /** Resolution follows `$id` only for a draft 2020-12 root; under any other a `$ref` is a JSON pointer into the
   * root
   */
  private readonly scoped: boolean;
  private readonly conjoinsChainedRefs: boolean;
  private readonly rootBase: string;
  private readonly offset: number;
  private readonly own: SchemaNode<S>[] = [];
  private readonly objects = new WeakMap<object, NodeId>();
  private readonly objectNodes = new Map<NodeId, ObjectNode<S>>();
  /** The nodes parsed from data, which a `$ref` reached through a keyword holding no subschemas */
  private readonly dataNodes = new Set<NodeId>();
  private readonly pointers = new Map<string, NodeId>();
  private readonly resources = new Map<string, ObjectNode<S>>();
  private readonly anchors = new Map<string, NodeId>();
  private readonly pendingRefs: Mutable<ObjectNode<S>>[] = [];
  private readonly overlays = new WeakMap<object, AdoptedSchema<S>>();
  private readonly copies = new WeakMap<object, { readonly raw: S; readonly adopted: AdoptedSchema<S> }>();

  constructor(rawRoot: S, base?: Graph<S>) {
    this.rawRoot = rawRoot;
    this.base = base;
    this.scoped = rawRoot[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12;
    this.conjoinsChainedRefs = this.scoped || rawRoot[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2019_09;
    const rootId = stringKeyword(rawRoot, ID_KEY);
    this.rootBase = this.scoped && rootId !== undefined ? resolveUri('', rootId) : '';
    this.offset = base === undefined ? 0 : base.offset + base.own.length;
    this.diagnostics = base === undefined ? [] : [...base.diagnostics];
    this.root = base === undefined ? this.parse(rawRoot, '', '').id : base.root;
  }

  node(id: NodeId): SchemaNode<S> {
    if (id < this.offset && this.base !== undefined) {
      return this.base.node(id);
    }
    const found = this.own[id - this.offset];
    if (found === undefined) {
      throw new RangeError(`No node ${id} in this schema graph`);
    }
    return found;
  }

  byPointer(pointer: string): NodeId | undefined {
    return this.pointers.get(pointer) ?? this.base?.byPointer(pointer);
  }

  byObject(raw: object): NodeId | undefined {
    return this.objects.get(raw) ?? this.base?.byObject(raw);
  }

  child(id: NodeId, keyword: string, key?: string): NodeId | undefined {
    const node = this.node(id);
    if (node.kind !== 'schema') {
      return undefined;
    }
    const value: unknown = Reflect.get(node.raw, keyword);
    const entry = subschemaEntries(keyword, value).find(([tokens]) => tokens[1] === key);
    if (entry === undefined) {
      return undefined;
    }
    const [tokens, sub] = entry;
    // A boolean has no identity, so it is the node parsed where the keyword holds it
    if (typeof sub === 'boolean') {
      return this.byPointer(childPointer(node.pointer, tokens));
    }
    return isObject(sub) ? this.byObject(sub) : undefined;
  }

  subschemas(id: NodeId, keyword: string): [string, NodeId][] {
    const node = this.node(id);
    const value: unknown = node.kind === 'schema' ? Reflect.get(node.raw, keyword) : undefined;
    return subschemaEntries(keyword, value).flatMap(([[, key]]) => {
      const child = key === undefined ? undefined : this.child(id, keyword, key);
      return child === undefined ? [] : [[key, child]];
    });
  }

  resolveRef(ref: string, from: NodeId = this.root): NodeId | undefined {
    return this.resolve(ref, from, false);
  }

  adopt(raw: S): AdoptedSchema<S> {
    const known = this.byObject(raw);
    if (known !== undefined) {
      return { graph: this, node: known };
    }
    let adopted = this.overlays.get(raw);
    if (adopted === undefined) {
      const overlay = new Graph<S>(this.rawRoot, this);
      adopted = { graph: overlay, node: overlay.parse(raw, EXTERNAL_POINTER, this.rootBase).id };
      this.overlays.set(raw, adopted);
    }
    return adopted;
  }

  adoptCopy(raw: S, of: object): AdoptedSchema<S> {
    const last = this.copies.get(of);
    if (last !== undefined && sameKeywords(last.raw, raw)) {
      return last.adopted;
    }
    const adopted = this.adopt(raw);
    this.copies.set(of, { raw, adopted });
    return adopted;
  }

  private parse(raw: S, pointer: string, base: string): ObjectNode<S> {
    const node = this.visitObject(raw, pointer, base, false);
    this.resolvePendingRefs();
    return node;
  }

  private add(node: SchemaNode<S>): void {
    this.own.push(node);
    this.pointers.set(node.pointer, node.id);
  }

  private nextId(): NodeId {
    return this.offset + this.own.length;
  }

  private visit(value: unknown, pointer: string, base: string, data: boolean): NodeId | undefined {
    if (typeof value === 'boolean') {
      // A `$ref` to a boolean the walk already parsed reaches it by the same pointer. The value is compared too, since
      // a graph extending one that adopted a schema reuses the pointers that schema was parsed under
      const known = this.byPointer(pointer);
      const knownNode = known === undefined ? undefined : this.node(known);
      if (knownNode?.kind === 'boolean' && knownNode.value === value) {
        return knownNode.id;
      }
      const id = this.nextId();
      this.add({ kind: 'boolean', id, pointer, value });
      return id;
    }
    return isSchemaObject<S>(value) ? this.visitObject(value, pointer, base, data).id : undefined;
  }

  private knownObject(raw: object): ObjectNode<S> | undefined {
    const id = this.objects.get(raw);
    return id === undefined ? this.base?.knownObject(raw) : this.objectNodes.get(id);
  }

  private visitObject(value: S, pointer: string, base: string, data: boolean): ObjectNode<S> {
    const known = this.knownObject(value);
    if (known !== undefined) {
      if (!this.pointers.has(pointer)) {
        this.pointers.set(pointer, known.id);
      }
      return known;
    }
    const literalId = stringKeyword(value, ID_KEY);
    const node: Mutable<ObjectNode<S>> = {
      kind: 'schema',
      id: this.nextId(),
      pointer,
      baseUri: this.scoped && !data && literalId !== undefined ? resolveUri(base, literalId) : base,
      raw: value,
      pureRef: isPureRef(value),
    };
    if (literalId !== undefined) {
      node.literalId = literalId;
    }
    this.objects.set(value, node.id);
    this.objectNodes.set(node.id, node);
    this.add(node);
    if (data) {
      this.dataNodes.add(node.id);
    } else {
      this.register(node);
    }
    this.visitChildren(node);
    if (stringKeyword(value, REF_KEY) !== undefined) {
      this.pendingRefs.push(node);
    }
    return node;
  }

  private register(node: ObjectNode<S>): void {
    if (!this.scoped) {
      return;
    }
    const key = resourceKey(node.baseUri.split('#')[0]);
    if (node.literalId !== undefined && !this.resources.has(key)) {
      this.resources.set(key, node);
    }
    const anchor = stringKeyword(node.raw, '$anchor');
    if (anchor !== undefined) {
      this.anchors.set(`${key}#${anchor}`, node.id);
    }
  }

  /** Parses the subschemas `node` holds, in the order they are written, so every node gets the id and pointer of the
   * place it is first found at
   */
  private visitChildren(node: ObjectNode<S>): void {
    const data = this.dataNodes.has(node.id);
    for (const [key, value] of Object.entries(node.raw)) {
      for (const [tokens, sub] of subschemaEntries(key, value)) {
        this.visit(sub, childPointer(node.pointer, tokens), node.baseUri, data);
      }
    }
  }

  /** Resolves every `$ref` parsed so far, which parses the subschemas they reach outside the walk and the `$ref`s
   * inside those, then follows each chain of `$ref`s, so that a `$ref` whose chain loops or ends at nothing points at
   * an `InvalidNode` carrying the message entering it throws
   */
  private resolvePendingRefs(): void {
    const hops = new Map<NodeId, NodeId | undefined>();
    const resolved: Mutable<ObjectNode<S>>[] = [];
    for (let next = this.pendingRefs.shift(); next !== undefined; next = this.pendingRefs.shift()) {
      hops.set(next.id, this.resolve(refOf(next.raw), next.id, true));
      resolved.push(next);
    }
    for (const node of resolved) {
      const ref = refOf(node.raw);
      const failure = this.chainFailure(ref, node.id, hops);
      if (failure === undefined) {
        node.ref = hops.get(node.id);
        if (this.conjoinsChainedRefs && Object.keys(node.raw).some((key) => !NON_ANNOTATING_KEYS.has(key))) {
          node.conjunction = this.addConjunction(node);
        }
      } else {
        const invalid: InvalidNode = {
          kind: 'invalid',
          id: this.nextId(),
          pointer: `${node.pointer}/$ref`,
          ref,
          ...failure,
        };
        this.add(invalid);
        node.ref = invalid.id;
        this.diagnostics.push({ node: node.id, ref, ...failure });
      }
    }
  }

  /** Adds the nodes `conjunction` names for `node`: the `allOf` of `node` without its `$ref`, whose subschemas are its
   * own, and of a node holding only the `$ref`. They are placed under a pointer token no JSON pointer has, as
   * `EXTERNAL_POINTER` is.
   */
  private addConjunction(node: ObjectNode<S>): NodeId {
    const pointer = `${node.pointer}/~conjunction`;
    const siblings = this.addSynthetic({
      ...node,
      id: this.nextId(),
      pointer: `${pointer}/0`,
      raw: schemaFrom(node.raw, Object.fromEntries(Object.entries(node.raw).filter(([key]) => key !== REF_KEY))),
      ref: undefined,
      conjunction: undefined,
      pureRef: false,
    });
    // The booleans the copy holds are the ones `node` holds, found under its pointer
    for (const [key, value] of Object.entries(siblings.raw)) {
      for (const [tokens, sub] of subschemaEntries(key, value)) {
        const known = typeof sub === 'boolean' ? this.pointers.get(childPointer(node.pointer, tokens)) : undefined;
        if (known !== undefined) {
          this.pointers.set(childPointer(siblings.pointer, tokens), known);
        }
      }
    }
    const reference = this.addSynthetic({
      kind: 'schema',
      id: this.nextId(),
      pointer: `${pointer}/1`,
      baseUri: node.baseUri,
      raw: schemaFrom(node.raw, { [REF_KEY]: refOf(node.raw) }),
      pureRef: true,
      ref: node.ref,
    });
    return this.addSynthetic({
      kind: 'schema',
      id: this.nextId(),
      pointer,
      baseUri: node.baseUri,
      raw: schemaFrom(node.raw, { [ALL_OF_KEY]: [siblings.raw, reference.raw] }),
      pureRef: false,
    }).id;
  }

  private addSynthetic(node: ObjectNode<S>): ObjectNode<S> {
    this.add(node);
    this.objects.set(node.raw, node.id);
    this.objectNodes.set(node.id, node);
    return node;
  }

  /** Follows the chain of `$ref`s from `first`, comparing them as written, and returns the error entering it throws
   * when the chain loops back onto a `$ref` it already followed or ends at nothing
   */
  private chainFailure(
    first: string,
    from: NodeId,
    hops: ReadonlyMap<NodeId, NodeId | undefined>,
  ): { reason: InvalidReason; message: string } | undefined {
    const followed: string[] = [];
    let ref = first;
    let target = hops.get(from);
    for (;;) {
      if (target === undefined) {
        return { reason: 'dangling', message: `Could not find a definition for ${ref}.` };
      }
      const targetNode = this.node(target);
      // An empty `$ref` ends the chain there
      const nextRef = targetNode.kind === 'schema' ? refOf(targetNode.raw) : '';
      if (nextRef === '') {
        return undefined;
      }
      if (followed.includes(nextRef)) {
        if (followed.length === 1) {
          return { reason: 'circular-alias', message: `Definition for ${ref} is a circular reference` };
        }
        const [firstRef, ...restRefs] = followed;
        const circularPath = [...restRefs, ref, firstRef].join(' -> ');
        return {
          reason: 'circular-alias',
          message: `Definition for ${firstRef} contains a circular reference through ${circularPath}`,
        };
      }
      followed.push(ref);
      ref = nextRef;
      // A node parsed with the graph this one extends had its `$ref` resolved there
      target = hops.has(target) ? hops.get(target) : this.resolve(ref, target, false);
    }
  }

  private resolve(ref: string, from: NodeId, create: boolean): NodeId | undefined {
    if (!this.scoped) {
      const fragment = ref.startsWith('#') ? decodeFragment(ref.slice(1)) : undefined;
      return fragment === undefined
        ? undefined
        : this.walk({ raw: this.rawRoot, pointer: '', base: '' }, fragment, create);
    }
    const fromNode = this.node(from);
    const absolute = resolveUri(fromNode.kind === 'schema' ? fromNode.baseUri : this.rootBase, ref);
    const hashAt = absolute.indexOf('#');
    const uri = hashAt < 0 ? absolute : absolute.slice(0, hashAt);
    const fragment = decodeFragment(hashAt < 0 ? '' : absolute.slice(hashAt + 1));
    const resource = uri === '' ? this.knownObject(this.rawRoot) : this.resource(resourceKey(uri));
    if (resource === undefined || fragment === undefined) {
      return undefined;
    }
    if (fragment === '' || fragment === '/') {
      return resource.id;
    }
    if (fragment.startsWith('/')) {
      return this.walk({ raw: resource.raw, pointer: resource.pointer, base: resource.baseUri }, fragment, create);
    }
    return this.anchor(`${resourceKey(resource.baseUri.split('#')[0])}#${fragment}`);
  }

  private resource(key: string): ObjectNode<S> | undefined {
    return this.resources.get(key) ?? this.base?.resource(key);
  }

  private anchor(key: string): NodeId | undefined {
    return this.anchors.get(key) ?? this.base?.anchor(key);
  }

  /** Resolves the JSON pointer `fragment` from `start` through any container: a `$ref` may name a subschema under a
   * keyword no walk of the schema follows, such as `#/components/schemas/x`. The subschema it names is read as one, but
   * from where the pointer leaves the subschemas on, an `$id` is data and the base stays the one it left them under.
   */
  private walk(start: WalkStart, fragment: string, create: boolean): NodeId | undefined {
    let current: unknown = start.raw;
    let { pointer, base } = start;
    let position: Position = 'schema';
    const tokens = fragment === '' ? [] : fragment.split('/').map(unescapeToken);
    if (tokens.length > 0 && tokens.shift() !== '') {
      return undefined;
    }
    for (const token of tokens) {
      if (typeof current !== 'object' || current === null || !Object.hasOwn(current, token)) {
        return undefined;
      }
      const id =
        this.scoped && position === 'schema' && current !== start.raw ? stringKeyword(current, ID_KEY) : undefined;
      base = id === undefined ? base : resolveUri(base, id);
      current = Reflect.get(current, token);
      position = positionAfter(position, token, current);
      pointer = `${pointer}/${escapeToken(token)}`;
    }
    if (create) {
      return this.visit(current, pointer, base, position !== 'schema');
    }
    if (isObject(current)) {
      return this.byObject(current);
    }
    return typeof current === 'boolean' ? this.byPointer(pointer) : undefined;
  }
}

function sameKeywords(a: object, b: object): boolean {
  const keys = Reflect.ownKeys(a);
  return (
    keys.length === Reflect.ownKeys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && Object.is(Reflect.get(a, key), Reflect.get(b, key)))
  );
}

function refOf(raw: object): string {
  return stringKeyword(raw, REF_KEY) ?? '';
}

const graphs = new WeakMap<object, object>();

/** Parses `rawRoot` into a `SchemaGraph`, once per root object: the graph of a root already parsed is returned again.
 * A `$ref` that resolves to nothing parses to an `InvalidNode` and a diagnostic rather than throwing, since only
 * entering the reference throws.
 *
 * @param rawRoot - The root schema, as `schemaUtils.getRootSchema()` returns it
 * @returns - The graph parsed from `rawRoot`
 */
export default function parseSchemaGraph<S extends StrictRJSFSchema = RJSFSchema>(rawRoot: S): SchemaGraph<S> {
  const parsed = graphs.get(rawRoot);
  // Only `Graph<S>` is ever stored under a root of type `S`, which `instanceof` cannot see past the erased parameter
  if (parsed instanceof Graph) {
    return parsed;
  }
  const graph = new Graph<S>(rawRoot);
  graphs.set(rawRoot, graph);
  return graph;
}
