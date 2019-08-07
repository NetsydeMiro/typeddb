import { Direction, Range, toIDBDirection, EntityClass, Exclusions } from './common'
import { All, EqualTo, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Between } from './common'
import TypedDB from './TypedDB'
import TypedStore from './TypedStore'

/*
Iterator DSL
store.iterate().over('propName').forEach(iterator)
store.iterate(10).over('propName').forEach(iterator)
store.iterate(10, 20).over('propName', 'descending').forEach(iterator)
store.iterate(10, 20).over('propName', 'descending').greaterThanOrEqualTo(val).forEach(iterator)
*/

interface Iterator<TEntity> {
    (entity: TEntity, ix: number): void
}

class DslForEach<TEntity> {
    constructor(protected store: IterableStore<TEntity, any, any>, protected params: IterateParams<TEntity, any>) { }

    forEach(iterator: Iterator<TEntity>): Promise<number> {
        return this.store.doIterate(this.params, iterator)
    }
}

class DslBoundaryOrForEach<TEntity, TProperty> extends DslForEach<TEntity> {

    constructor(store: IterableStore<TEntity, any, any>, params: IterateParams<TEntity, any>) {
        super(store, params)
    }

    equaling(val: TProperty): DslForEach<TEntity> {
        let range = new EqualTo<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }

    greaterThan(val: TProperty): DslForEach<TEntity> {
        let range = new GreaterThan<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }

    greaterThanOrEqualTo(val: TProperty): DslForEach<TEntity> {
        let range = new GreaterThanOrEqual<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }

    lessThan(val: TProperty): DslForEach<TEntity> {
        let range = new LessThan<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }

    lessThanOrEqualTo(val: TProperty): DslForEach<TEntity> {
        let range = new LessThanOrEqual<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }

    between(min: TProperty, max: TProperty, exclusions?: Exclusions): DslForEach<TEntity> {
        let range = new Between<TProperty>(min, max, exclusions) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslForEach(this.store, builtParams)
    }
}

class DslOver<TEntity, TIndices extends keyof TEntity> {
    constructor(private store: IterableStore<TEntity, any, any>, private params: OptionalIterateParams<TEntity, any>) { }

    over(index: TIndices, direction: Direction = "ascending"): DslBoundaryOrForEach<TEntity, TEntity[TIndices]> {

        let builtParams: IterateParams<TEntity, TIndices> = {
            ...this.params, ...{ index, direction }
        }

        return new DslBoundaryOrForEach(this.store, builtParams)
    }
}

export interface IterateParams<TEntity, TIndices extends keyof TEntity> {
    index: TIndices
    range?: Range<TEntity[TIndices]>
    direction?: Direction,
    count?: number,
    skip?: number,
}

export type OptionalIterateParams<TEntity, TIndices extends keyof TEntity> = Partial<IterateParams<TEntity, TIndices>>

export class IterableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends TypedStore<TEntity, TIdProp>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, private indexedProps: Array<TIndices>) {
        super(db, entityClass, idProp)
    }

    private readonly DEFAULT_ITERATE_PARAMS: OptionalIterateParams<TEntity, TIndices> = {
        direction: "ascending",
        skip: 0,
        count: Number.MAX_SAFE_INTEGER,
        range: new All()
    }

    doIterate(
        params: IterateParams<TEntity, TIndices>,
        iterator: Iterator<TEntity>): Promise<number> {

        return new Promise<number>((resolve, reject) => {
            let filledParams = Object.assign({}, this.DEFAULT_ITERATE_PARAMS, params)

            let index = this.db.indexedDB.transaction(this.storeName)
                .objectStore(this.storeName)
                .index(filledParams.index.toString())

            let idbRange = filledParams.range && filledParams.range.toIDBRange()
            let idbDirection = toIDBDirection(filledParams.direction)

            let req = index.openCursor(idbRange, idbDirection)

            let ix = 0
            req.onsuccess = (event) => {
                let cursor = (event.target as any).result as IDBCursorWithValue

                if (cursor) {
                    let entity = Object.assign(new this.entityClass(), cursor.value)
                    if (ix >= filledParams.skip && ix < filledParams.count) {
                        iterator(entity, ix)
                        ix++
                    }
                    cursor.continue()
                }
                else {
                    iterator(null, -1)
                    resolve(ix)
                }
            }

            req.onerror = reject
        })
    }

    iterate(count?: number, skip?: number): DslOver<TEntity, TIndices> {
        let params: OptionalIterateParams<TEntity, TIndices> = {
            count,
            skip
        }
        return new DslOver(this, params)
    }
}

export default IterableStore
